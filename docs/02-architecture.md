# 沐海旅行 - 签证行业ERP系统

# 架构实现方案

> **文档版本**: V2.0  
> **生成日期**: 2026-03-19  
> **最后更新**: 2026-03-21 01:29  
> **技术栈**: Next.js 14 + React 18 + Prisma ORM + 阿里云 MySQL RDS + Tailwind CSS + Zustand + Socket.io  
> **部署**: 阿里云 ECS (223.6.248.154:3002) + 阿里云 RDS + 阿里云 OSS

---

## 目录

1. [系统架构总览](#1-系统架构总览)
2. [技术选型详解](#2-技术选型详解)
3. [数据库设计（完整 Schema）](#3-数据库设计)
4. [API 接口设计](#4-api-接口设计)
5. [状态机引擎设计](#5-状态机引擎设计)
6. [权限与鉴权体系](#6-权限与鉴权体系)
7. [多租户隔离方案](#7-多租户隔离方案)
8. [文件存储方案](#8-文件存储方案)
9. [实时通信方案](#9-实时通信方案)
10. [SMS 短信预留方案](#10-sms-短信预留方案)
11. [前端架构设计](#11-前端架构设计)
12. [部署架构](#12-部署架构)
13. [性能优化策略](#13-性能优化策略)
14. [安全架构](#14-安全架构)

---

## 1. 系统架构总览

### 1.1 整体架构图

```
                         ┌──────────────────────────────────┐
                         │          阿里云 CDN               │
                         └──────────────┬───────────────────┘
                                        │
                         ┌──────────────▼───────────────────┐
                         │     阿里云 SLB (负载均衡)          │
                         └──────────────┬───────────────────┘
                                        │
                    ┌───────────────────▼───────────────────────┐
                    │         阿里云 ECS (Next.js 全栈)          │
                    │                                           │
                    │  ┌─────────────────────────────────────┐  │
                    │  │          Next.js App                 │  │
                    │  │                                      │  │
                    │  │  ┌──────────┐  ┌──────────────────┐ │  │
                    │  │  │ App Router│  │ API Routes       │ │  │
                    │  │  │ (SSR/RSC) │  │ /api/*           │ │  │
                    │  │  └──────────┘  └────────┬─────────┘ │  │
                    │  │                         │           │  │
                    │  │  ┌──────────────────────▼─────────┐ │  │
                    │  │  │        Service Layer            │ │  │
                    │  │  │  OrderService / WorkflowService  │ │  │
                    │  │  │  DocumentService / AuthService   │ │  │
                    │  │  └──────────────────────┬─────────┘ │  │
                    │  │                         │           │  │
                    │  │  ┌──────────────────────▼─────────┐ │  │
                    │  │  │        Prisma ORM               │ │  │
                    │  │  └──────────────────────┬─────────┘ │  │
                    │  └─────────────────────────┼───────────┘  │
                    │                            │              │
                    │  ┌─────────────────────────▼───────────┐  │
                    │  │       Socket.io Server              │  │
                    │  │    (实时通知推送)                     │  │
                    │  └─────────────────────────────────────┘  │
                    └───────────────────┬───────────────────────┘
                                        │
               ┌────────────────────────┼────────────────────────┐
               │                        │                        │
    ┌──────────▼──────────┐  ┌─────────▼──────────┐  ┌─────────▼──────────┐
    │  阿里云 RDS MySQL   │  │  阿里云 OSS         │  │  Redis (会话/缓存)  │
    │  (主数据库)          │  │  (文件存储)          │  │  (可选)             │
    └─────────────────────┘  └────────────────────┘  └────────────────────┘
```

### 1.2 核心设计原则

| 原则 | 实现方式 |
|---|---|
| **状态机驱动** | 统一 TransitionService，所有状态变更必须经过合法性校验 |
| **事务一致性** | 状态变更+操作日志+通知生成在同一 Prisma 事务中 |
| **事件驱动** | 状态变更后触发内部事件，异步处理通知/短信等非阻塞任务 |
| **数据隔离** | 所有查询强制 companyId 过滤，底层中间件保障 |
| **模块化** | Service 层按业务领域划分，低耦合高内聚 |
| **类型安全** | TypeScript 全栈 + Prisma 自动生成类型 |

### 1.3 项目目录结构

```
ERP/
├── prisma/
│   ├── schema.prisma              # 数据库 Schema
│   ├── migrations/                # 数据库迁移文件
│   └── seed.ts                    # 种子数据
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── (auth)/                # 认证页面组（路由组，不参与URL）
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── admin/                 # 管理端页面（实际路径 /admin/*）
│   │   │   ├── dashboard/
│   │   │   ├── orders/
│   │   │   │   └── [id]/          # 订单详情
│   │   │   ├── pool/              # 公共池
│   │   │   ├── workspace/         # 我的工作台
│   │   │   ├── templates/         # 签证模板
│   │   │   ├── team/              # 团队管理
│   │   │   ├── analytics/         # 数据统计
│   │   │   ├── settings/          # 系统设置
│   │   │   └── layout.tsx
│   │   ├── customer/              # 客户端页面（实际路径 /customer/*）
│   │   │   ├── orders/
│   │   │   └── layout.tsx
│   │   ├── api/                   # API 路由
│   │   │   ├── auth/
│   │   │   │   ├── login/route.ts
│   │   │   │   ├── register/route.ts
│   │   │   │   ├── refresh/route.ts
│   │   │   │   ├── logout/route.ts
│   │   │   │   ├── me/route.ts
│   │   │   │   └── reset-password/route.ts
│   │   │   ├── orders/
│   │   │   │   ├── route.ts
│   │   │   │   ├── [id]/route.ts
│   │   │   │   ├── [id]/status/route.ts
│   │   │   │   ├── [id]/claim/route.ts
│   │   │   │   ├── [id]/documents/route.ts   # 资料清单 API
│   │   │   │   ├── [id]/materials/route.ts    # 签证材料 API
│   │   │   │   └── pool/route.ts
│   │   │   ├── documents/
│   │   │   │   ├── [id]/route.ts              # 审核/删除资料需求
│   │   │   │   └── upload/route.ts            # 文件上传
│   │   │   ├── notifications/
│   │   │   │   ├── route.ts
│   │   │   │   ├── [id]/route.ts
│   │   │   │   └── mark-all-read/route.ts
│   │   │   ├── users/
│   │   │   ├── departments/
│   │   │   ├── companies/
│   │   │   ├── templates/
│   │   │   ├── analytics/
│   │   │   └── sms/               # SMS 预留端口
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/                    # 基础 UI 组件 (Shadcn)
│   │   ├── layout/                # 布局组件
│   │   │   ├── sidebar.tsx
│   │   │   ├── topbar.tsx
│   │   │   ├── glass-card.tsx
│   │   │   └── page-header.tsx
│   │   ├── orders/                # 订单相关组件
│   │   │   └── status-badge.tsx
│   │   ├── documents/             # 资料相关组件
│   │   │   ├── document-panel.tsx  # 资料面板（需求/上传/审核）
│   │   │   └── material-panel.tsx  # 签证材料面板（上传/版本/列表）
│   │   └── notifications/         # 通知组件
│   │       └── notification-bell.tsx
│   ├── lib/
│   │   ├── prisma.ts              # Prisma 客户端单例
│   │   ├── auth.ts                # JWT 认证工具
│   │   ├── rbac.ts                # RBAC 权限检查
│   │   ├── transition.ts          # 状态机 TransitionService
│   │   ├── events.ts              # 事件总线
│   │   ├── socket.ts              # Socket.io 服务端
│   │   ├── oss.ts                 # 阿里云 OSS 客户端
│   │   ├── desensitize.ts         # 数据脱敏工具
│   │   └── utils.ts               # 通用工具
│   ├── services/                  # 业务服务层
│   │   ├── order.service.ts
│   │   ├── notification.service.ts
│   │   ├── document.service.ts
│   │   └── user.service.ts
│   ├── hooks/                     # React Hooks
│   │   ├── use-auth.ts
│   │   ├── use-orders.ts
│   │   ├── use-socket.ts
│   │   └── use-notifications.ts
│   ├── stores/                    # Zustand 状态管理
│   │   ├── auth-store.ts
│   │   ├── order-store.ts
│   │   └── notification-store.ts
│   ├── types/                     # TypeScript 类型定义
│   │   ├── order.ts
│   │   ├── user.ts
│   │   └── api.ts
│   ├── middleware.ts              # Next.js 中间件 (认证+租户)
│   └── styles/
│       ├── globals.css            # 全局样式 + CSS变量
│       └── glassmorphism.css      # 玻璃拟态工具类
├── public/
│   └── ...
├── docs/                          # 项目文档
├── .env.example
├── .env.local
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 2. 技术选型详解

### 2.1 核心框架

| 层 | 技术 | 版本 | 选型理由 |
|---|---|---|---|
| 全栈框架 | Next.js (App Router) | 14.x | SSR/RSC/API Routes 一体化，Server Actions 简化表单 |
| 前端 UI | React | 18.x | 成熟生态，RSC 性能优势 |
| ORM | Prisma | 5.x | 类型安全，MySQL 完善支持，事务/迁移内置 |
| 数据库 | 阿里云 RDS MySQL | 8.0 | 托管服务，自动备份，高可用 |
| 样式 | Tailwind CSS | 3.x | 原子化 CSS，配合玻璃拟态自定义 |
| 组件库 | Shadcn UI | latest | 可定制，Radix UI 基础，不引入额外依赖 |
| 状态管理 | Zustand | 4.x | 轻量，TypeScript 友好 |
| 实时通信 | Socket.io | 4.x | 自动重连，房间管理，跨浏览器兼容 |
| 文件存储 | 阿里云 OSS | SDK 2.x | 海量存储，CDN 加速，预签名上传 |
| 认证 | JWT (jose) | latest | 无状态，适合分布式 |

### 2.2 开发工具

| 工具 | 用途 |
|---|---|
| TypeScript 5.x | 全栈类型安全 |
| ESLint + Prettier | 代码规范 |
| Husky + lint-staged | Git 提交检查 |
| Prisma Studio | 数据库可视化 |
| Postman/Thunder Client | API 测试 |

---

## 3. 数据库设计

### 3.1 ER 关系总览

```
Company ─1──N── User
Company ─1──N── Department
Company ─1──N── Order
Company ─1──N── VisaTemplate

User ─1──N── Order (as customer)
User ─1──N── Order (as collector)
User ─1──N── Order (as operator)
User ─1──N── OrderLog
User ─1──N── Notification

Order ─1──N── DocumentRequirement
Order ─1──N── VisaMaterial
Order ─1──N── OrderLog
Order ─1──N── Notification

DocumentRequirement ─1──N── DocumentFile
```

### 3.2 完整 Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

// ==================== 租户 ====================

model Company {
  id          String   @id @default(cuid())
  name        String   @db.VarChar(100)
  logo        String?  @db.Text
  phone       String?  @db.VarChar(20)
  email       String?  @db.VarChar(100)
  address     String?  @db.Text
  status      CompanyStatus @default(ACTIVE)
  settings    Json?    // 公司配置（短信模板等）
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  users       User[]
  departments Department[]
  orders      Order[]
  templates   VisaTemplate[]

  @@map("erp_companies")
}

enum CompanyStatus {
  ACTIVE
  SUSPENDED
  DELETED
}

// ==================== 部门 ====================

model Department {
  id          String   @id @default(cuid())
  companyId   String   @db.VarChar(30)
  name        String   @db.VarChar(50)
  code        String   @db.VarChar(30)  // CS / VISA / MANAGEMENT
  parentId    String?  @db.VarChar(30)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  company     Company  @relation(fields: [companyId], references: [id])
  users       User[]

  @@unique([companyId, code])
  @@map("erp_departments")
}

// ==================== 用户 ====================

model User {
  id              String     @id @default(cuid())
  companyId       String     @db.VarChar(30)
  departmentId    String?    @db.VarChar(30)
  username        String     @unique @db.VarChar(50)
  phone           String     @unique @db.VarChar(20)
  email           String?    @unique @db.VarChar(100)
  passwordHash    String     @db.Text
  realName        String     @db.VarChar(50)
  role            UserRole
  status          UserStatus @default(ACTIVE)
  avatar          String?    @db.Text
  lastLoginAt     DateTime?
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  company         Company    @relation(fields: [companyId], references: [id])
  department      Department? @relation(fields: [departmentId], references: [id])

  // 关联的订单（多角色）
  customerOrders    Order[] @relation("OrderCustomer")
  collectorOrders   Order[] @relation("OrderCollector")
  operatorOrders    Order[] @relation("OrderOperator")

  orderLogs       OrderLog[]
  notifications   Notification[]

  @@index([companyId])
  @@index([companyId, role])
  @@map("erp_users")
}

enum UserRole {
  SUPER_ADMIN        // Lv1 超级管理员
  COMPANY_OWNER      // Lv2 公司负责人
  CS_ADMIN           // Lv3 客服部管理员
  CUSTOMER_SERVICE   // Lv4 客服
  VISA_ADMIN         // Lv5 签证部管理员
  DOC_COLLECTOR      // Lv6 资料员
  OPERATOR           // Lv7 签证操作员
  OUTSOURCE          // Lv8 外包业务员
  CUSTOMER           // Lv9 普通用户
}

enum UserStatus {
  ACTIVE
  INACTIVE
  LOCKED
}

// ==================== 订单 ====================

model Order {
  id              String      @id @default(cuid())
  companyId       String      @db.VarChar(30)
  orderNo         String      @unique @db.VarChar(30) @map("order_no")  // HX20260320XXXX
  externalOrderNo String?     @unique @db.VarChar(50) @map("external_order_no")  // 外部订单号

  // 客户信息
  customerName    String      @db.VarChar(50)
  customerPhone   String      @db.VarChar(20)
  customerEmail   String?     @db.VarChar(100)
  passportNo      String?     @db.VarChar(20)
  passportIssue   DateTime?
  passportExpiry  DateTime?

  // 签证信息
  targetCountry   String      @db.VarChar(50)
  visaType        String      @db.VarChar(50)   // 旅游/商务/留学等
  visaCategory    String?     @db.VarChar(50)   // 贴纸/电子/落地签等
  travelDate      DateTime?

  // 订单信息
  amount          Decimal     @db.Decimal(10, 2)
  paymentMethod   String?     @db.VarChar(30)
  sourceChannel   String?     @db.VarChar(50)   // 来源渠道
  remark          String?     @db.Text

  // 状态
  status          OrderStatus @default(PENDING_CONNECTION)

  // 角色关联
  customerId      String?     @db.VarChar(30)
  collectorId     String?     @db.VarChar(30)
  operatorId      String?     @db.VarChar(30)
  createdBy       String      @db.VarChar(30)   // 创建者（客服ID）

  // 预约信息
  appointmentDate DateTime?
  fingerprintRequired Boolean @default(false)

  // 时间戳
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  deliveredAt     DateTime?
  completedAt     DateTime?

  // 关联
  company         Company     @relation(fields: [companyId], references: [id])
  customer        User?       @relation("OrderCustomer", fields: [customerId], references: [id])
  collector       User?       @relation("OrderCollector", fields: [collectorId], references: [id])
  operator        User?       @relation("OrderOperator", fields: [operatorId], references: [id])

  documentRequirements DocumentRequirement[]
  visaMaterials        VisaMaterial[]
  orderLogs            OrderLog[]
  notifications        Notification[]

  @@index([companyId])
  @@index([companyId, status])
  @@index([customerId])
  @@index([collectorId])
  @@index([operatorId])
  @@index([orderNo])
  @@map("erp_orders")
}

enum OrderStatus {
  PENDING_CONNECTION  // 待对接
  CONNECTED           // 已对接
  COLLECTING_DOCS     // 资料收集中
  PENDING_REVIEW      // 待审核
  UNDER_REVIEW        // 资料审核中
  MAKING_MATERIALS    // 材料制作中
  PENDING_DELIVERY    // 待交付
  DELIVERED           // 已交付
  APPROVED            // 出签
  REJECTED            // 拒签
}

// ==================== 资料需求 ====================

model DocumentRequirement {
  id              String       @id @default(cuid())
  orderId         String       @db.VarChar(30)
  companyId       String       @db.VarChar(30)
  name            String       @db.VarChar(100)   // 资料名称
  description     String?      @db.Text           // 说明/要求
  isRequired      Boolean      @default(true)
  status          DocReqStatus @default(PENDING)
  rejectReason    String?      @db.Text           // 驳回原因
  sortOrder       Int          @default(0)
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  order           Order        @relation(fields: [orderId], references: [id])
  files           DocumentFile[]

  @@index([orderId])
  @@index([companyId])
  @@map("erp_document_requirements")
}

enum DocReqStatus {
  PENDING     // 待上传
  UPLOADED    // 已上传
  REVIEWING   // 审核中
  APPROVED    // 已合格
  REJECTED    // 需修改
  SUPPLEMENT  // 需补充
}

// ==================== 资料文件 ====================

model DocumentFile {
  id              String   @id @default(cuid())
  requirementId   String   @db.VarChar(30)
  companyId       String   @db.VarChar(30)
  fileName        String   @db.VarChar(255)
  fileSize        Int      // bytes
  fileType        String   @db.VarChar(50)   // MIME type
  ossKey          String   @db.Text          // OSS 存储路径
  ossUrl          String   @db.Text          // 预签名URL
  uploadedBy      String   @db.VarChar(30)   // 上传者ID
  sortOrder       Int      @default(0)       // 排序序号（多文件场景）
  label           String?  @db.VarChar(100)  // 自定义标签 "房产证1"
  createdAt       DateTime @default(now())

  requirement     DocumentRequirement @relation(fields: [requirementId], references: [id])

  @@index([requirementId])
  @@index([companyId])
  @@map("erp_document_files")
}

// ==================== 签证材料 ====================

model VisaMaterial {
  id              String   @id @default(cuid())
  orderId         String   @db.VarChar(30)
  companyId       String   @db.VarChar(30)
  fileName        String   @db.VarChar(255)
  fileSize        Int
  fileType        String   @db.VarChar(50)
  ossKey          String   @db.Text
  ossUrl          String   @db.Text
  remark          String?  @db.Text
  uploadedBy      String   @db.VarChar(30)
  version         Int      @default(1)    // 版本号
  createdAt       DateTime @default(now())

  order           Order    @relation(fields: [orderId], references: [id])

  @@index([orderId])
  @@index([companyId])
  @@map("erp_visa_materials")
}

// ==================== 操作日志 ====================

model OrderLog {
  id          String   @id @default(cuid())
  orderId     String   @db.VarChar(30)
  companyId   String   @db.VarChar(30)
  userId      String   @db.VarChar(30)
  action      String   @db.VarChar(50)    // 状态变更/资料审核/备注等
  fromStatus  String?  @db.VarChar(30)
  toStatus    String?  @db.VarChar(30)
  detail      String?  @db.Text           // 详细描述
  metadata    Json?    // 额外数据
  createdAt   DateTime @default(now())

  order       Order    @relation(fields: [orderId], references: [id])
  user        User     @relation(fields: [userId], references: [id])

  @@index([orderId])
  @@index([companyId])
  @@index([createdAt])
  @@map("erp_order_logs")
}

// ==================== 通知 ====================

model Notification {
  id          String   @id @default(cuid())
  companyId   String   @db.VarChar(30)
  userId      String   @db.VarChar(30)    // 接收者
  orderId     String?  @db.VarChar(30)
  type        NotificationType // ORDER_NEW/STATUS_CHANGE/DOC_REVIEWED/MATERIAL_FEEDBACK/APPOINTMENT_REMIND/SYSTEM
  title       String   @db.VarChar(200)
  content     String   @db.Text
  isRead      Boolean  @default(false)
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id])
  order       Order?   @relation(fields: [orderId], references: [id])

  @@index([userId, isRead])
  @@index([companyId])
  @@map("erp_notifications")
}

// ==================== 签证模板 ====================

model VisaTemplate {
  id          String   @id @default(cuid())
  companyId   String   @db.VarChar(30)
  name        String   @db.VarChar(100)   // 如 "法国旅游签证材料清单"
  country     String   @db.VarChar(50)
  visaType    String   @db.VarChar(50)
  items       Json     // [{name, description, required}, ...]
  isSystem    Boolean  @default(false)    // 系统预置模板
  createdBy   String   @db.VarChar(30)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  company     Company  @relation(fields: [companyId], references: [id])

  @@index([companyId])
  @@index([companyId, country, visaType])
  @@map("erp_visa_templates")
}
```

### 3.3 关键索引策略

| 表 | 索引 | 用途 |
|---|---|---|
| orders | `[companyId, status]` | 按公司+状态筛选订单（最高频查询） |
| orders | `[collectorId]` | 资料员查看自己的订单 |
| orders | `[operatorId]` | 操作员查看自己的订单 |
| orders | `[customerId]` | 客户查看自己的订单 |
| document_requirements | `[orderId]` | 订单的资料清单 |
| document_files | `[requirementId]` | 资料需求下的文件 |
| notifications | `[userId, isRead]` | 用户未读通知数 |
| order_logs | `[orderId, createdAt]` | 订单操作日志按时间排序 |

---

## 4. API 接口设计

### 4.1 认证模块

| 方法 | 路径 | 说明 | 权限 |
|---|---|---|---|
| POST | `/api/auth/login` | 登录，返回 JWT | 公开 |
| POST | `/api/auth/register` | 公司入驻注册 | 公开 |
| POST | `/api/auth/refresh` | 刷新 Access Token | 已登录 |
| POST | `/api/auth/logout` | 登录，清除 Cookie | 已登录 |
| GET | `/api/auth/me` | 获取当前用户信息 | 已登录 |
| POST | `/api/auth/reset-password` | 客户首次登录重置密码（验证手机号+用户名后设置新密码并自动登录） | 公开 |

### 4.2 订单模块

| 方法 | 路径 | 说明 | 权限 |
|---|---|---|---|
| GET | `/api/orders` | 订单列表（按角色过滤） | Lv2-9 |
| POST | `/api/orders` | 创建订单 | Lv2-4 |
| GET | `/api/orders/[id]` | 订单详情 | 有权限的用户 |
| PATCH | `/api/orders/[id]` | 更新订单信息 | Lv3-7 |
| POST | `/api/orders/[id]/claim` | 接单（从公共池领取） | Lv5-8 |
| POST | `/api/orders/[id]/status` | 状态流转 | 有权限的用户 |
| GET | `/api/orders/[id]/logs` | 操作日志 | 有权限的用户 |
| GET | `/api/orders/pool` | 公共池订单 | Lv5-8 |
| POST | `/api/orders/[id]/reassign` | 转单 | Lv2,3,5 |

### 4.3 资料模块

| 方法 | 路径 | 说明 | 权限 |
|---|---|---|---|
| GET | `/api/orders/[id]/documents` | 资料清单（含文件列表） | 有权限的用户 |
| POST | `/api/orders/[id]/documents` | 批量添加资料需求项 | Lv5-7 |
| PATCH | `/api/documents/[id]` | 审核资料（APPROVED/REJECTED/SUPPLEMENT） | Lv5-7 |
| DELETE | `/api/documents/[id]` | 删除资料需求（级联删除文件） | Lv2,5-7 |
| POST | `/api/documents/upload` | 上传文件到 OSS | 有权限的用户 |

### 4.4 签证材料模块

| 方法 | 路径 | 说明 | 权限 |
|---|---|---|---|
| GET | `/api/orders/[id]/materials` | 签证材料列表（按版本降序） | Lv5-7, Lv9 |
| POST | `/api/orders/[id]/materials` | 上传签证材料（自动版本号+状态流转） | Lv5,7 |

### 4.5 通知模块

| 方法 | 路径 | 说明 | 权限 | 状态 |
|---|---|---|---|:---:|
| GET | `/api/notifications` | 通知列表（含 unreadCount） | 已登录 | ✅ |
| PATCH | `/api/notifications/[id]` | 标记单条已读 | 接收者 | ✅ |
| POST | `/api/notifications/mark-all-read` | 全部已读 | 已登录 | ✅ |

> 未读数通过 `GET /api/notifications?unreadOnly=true&pageSize=1` 返回的 `meta.unreadCount` 获取，无需单独端点。

### 4.6 用户与组织模块

| 方法 | 路径 | 说明 | 权限 |
|---|---|---|---|
| GET | `/api/users` | 员工列表 | Lv2-5 |
| POST | `/api/users` | 创建员工 | Lv2-5 |
| PATCH | `/api/users/[id]` | 更新员工 | Lv2-5 |
| DELETE | `/api/users/[id]` | 删除员工 | Lv2 |
| GET | `/api/departments` | 部门列表 | Lv2-5 |
| POST | `/api/departments` | 创建部门 | Lv2 |

### 4.7 订单管理扩展模块

| 方法 | 路径 | 说明 | 权限 |
|---|---|---|---|
| POST | `/api/orders/[id]/cancel` | 取消订单（需填写原因，标记为REJECTED终态） | Lv2-3,5 |
| POST | `/api/orders/[id]/reassign` | 转单（转交给同角色其他员工+通知目标用户） | Lv2-3,5 |

### 4.8 定时任务模块

| 方法 | 路径 | 说明 | 权限 |
|---|---|---|---|
| POST | `/api/cron/appointment-remind` | 预约提醒（检查24h内预约，创建站内通知） | Cron Secret |
| POST | `/api/cron/timeout-check` | 超时检测（5级超时规则，通知管理员） | Cron Secret |

> Cron 端点使用 `x-cron-secret` header 鉴权（值为 JWT_SECRET），已在 middleware 中加入公开路由。

### 4.9 数据分析模块

| 方法 | 路径 | 说明 | 权限 |
|---|---|---|---|
| GET | `/api/analytics/overview` | 核心指标概览 | Lv1-3,5 |
| GET | `/api/analytics/trend` | 趋势数据 | Lv1-3,5 |
| GET | `/api/analytics/workload` | 人员负荷 | Lv1-3,5 |
| GET | `/api/analytics/exceptions` | 异常订单 | Lv1-3,5 |

### 4.10 SMS 预留模块

| 方法 | 路径 | 说明 | 状态 |
|---|---|---|---|
| POST | `/api/sms/send` | 发送短信 | 返回 501，预留 |
| GET | `/api/sms/templates` | 短信模板列表 | 返回 501，预留 |

---

## 5. 状态机引擎设计

### 5.1 TransitionService 核心设计

```typescript
// src/lib/transition.ts

interface TransitionRule {
  from: OrderStatus
  to: OrderStatus
  allowedRoles: UserRole[]
  action: string           // 操作名称（用于日志）
  validate?: (order: Order, user: User) => Promise<boolean>
}

const TRANSITION_RULES: TransitionRule[] = [
  {
    from: 'PENDING_CONNECTION',
    to: 'CONNECTED',
    allowedRoles: ['DOC_COLLECTOR', 'VISA_ADMIN'],
    action: '接单',
  },
  {
    from: 'CONNECTED',
    to: 'COLLECTING_DOCS',
    allowedRoles: ['DOC_COLLECTOR', 'VISA_ADMIN'],
    action: '发送资料清单',
  },
  {
    from: 'COLLECTING_DOCS',
    to: 'PENDING_REVIEW',
    allowedRoles: ['DOC_COLLECTOR', 'VISA_ADMIN'],
    action: '提交审核',
  },
  {
    from: 'PENDING_REVIEW',
    to: 'UNDER_REVIEW',
    allowedRoles: ['OPERATOR', 'OUTSOURCE', 'VISA_ADMIN'],
    action: '操作员接单',
  },
  {
    from: 'UNDER_REVIEW',
    to: 'COLLECTING_DOCS',
    allowedRoles: ['OPERATOR', 'OUTSOURCE', 'VISA_ADMIN'],
    action: '打回补充资料',
  },
  {
    from: 'UNDER_REVIEW',
    to: 'MAKING_MATERIALS',
    allowedRoles: ['OPERATOR', 'OUTSOURCE', 'VISA_ADMIN'],
    action: '确认资料达标，开始制作',
  },
  {
    from: 'MAKING_MATERIALS',
    to: 'PENDING_DELIVERY',
    allowedRoles: ['OPERATOR', 'OUTSOURCE', 'VISA_ADMIN'],
    action: '上传签证材料',
  },
  {
    from: 'PENDING_DELIVERY',
    to: 'MAKING_MATERIALS',
    allowedRoles: ['DOC_COLLECTOR', 'VISA_ADMIN'],
    action: '打回修改材料',
  },
  {
    from: 'PENDING_DELIVERY',
    to: 'DELIVERED',
    allowedRoles: ['DOC_COLLECTOR', 'VISA_ADMIN'],
    action: '确认交付',
  },
  {
    from: 'DELIVERED',
    to: 'APPROVED',
    allowedRoles: ['OPERATOR', 'DOC_COLLECTOR', 'CUSTOMER', 'VISA_ADMIN'],
    action: '提交出签结果',
  },
  {
    from: 'DELIVERED',
    to: 'REJECTED',
    allowedRoles: ['OPERATOR', 'DOC_COLLECTOR', 'CUSTOMER', 'VISA_ADMIN'],
    action: '提交拒签结果',
  },
]

class TransitionService {
  async transition(
    orderId: string,
    toStatus: OrderStatus,
    userId: string,
    detail?: string
  ): Promise<Order> {
    return await prisma.$transaction(async (tx) => {
      // 1. 获取订单和用户
      const order = await tx.order.findUnique({ where: { id: orderId } })
      const user = await tx.user.findUnique({ where: { id: userId } })

      // 2. 查找匹配规则
      const rule = TRANSITION_RULES.find(
        r => r.from === order.status && r.to === toStatus
      )
      if (!rule) throw new Error(`不允许从 ${order.status} 流转到 ${toStatus}`)

      // 3. 权限校验
      if (!rule.allowedRoles.includes(user.role)) {
        throw new Error(`角色 ${user.role} 无权执行此操作`)
      }

      // 4. 业务校验
      if (rule.validate && !await rule.validate(order, user)) {
        throw new Error('业务校验不通过')
      }

      // 5. 更新状态
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: toStatus },
      })

      // 6. 写操作日志（同一事务）
      await tx.orderLog.create({
        data: {
          orderId,
          companyId: order.companyId,
          userId,
          action: rule.action,
          fromStatus: rule.from,
          toStatus: toStatus,
          detail,
        },
      })

      // 7. 返回更新后的订单（事件触发在外层异步处理）
      return updatedOrder
    })
  }
}
```

### 5.2 事件驱动通知

```typescript
// src/lib/events.ts

type EventType =
  | 'ORDER_STATUS_CHANGED'
  | 'DOCUMENT_UPLOADED'
  | 'DOCUMENT_REVIEWED'
  | 'MATERIAL_UPLOADED'
  | 'ORDER_ASSIGNED'

interface AppEvent {
  type: EventType
  orderId: string
  companyId: string
  actorId: string
  data: Record<string, any>
}

// 事件处理器注册
const handlers: Map<EventType, ((event: AppEvent) => Promise<void>)[]> = new Map()

function onEvent(type: EventType, handler: (event: AppEvent) => Promise<void>) {
  if (!handlers.has(type)) handlers.set(type, [])
  handlers.get(type)!.push(handler)
}

async function emitEvent(event: AppEvent) {
  const eventHandlers = handlers.get(event.type) || []
  // 异步并行执行，不阻塞主流程
  await Promise.allSettled(eventHandlers.map(h => h(event)))
}

// 事务成功后触发事件（异步，不阻塞主流程）
eventBus.emit(EVENTS.ORDER_STATUS_CHANGED, {
  orderId, companyId, actorId: userId,
  fromStatus: order.status, toStatus, action: rule.action,
})
```

### 5.2 事件驱动通知（已集成）

```typescript
// src/lib/events.ts - 已注册状态变更通知处理器

eventBus.on(EVENTS.ORDER_STATUS_CHANGED, async (data) => {
  // 查询订单 → 确定需要通知的用户（排除操作者本人）
  // → 批量创建 Notification 记录
  // 涉及角色：资料员、操作员、客户、创建者
})
```

---

## 6. 权限与鉴权体系

### 6.1 JWT 双 Token 方案

```
Access Token (15min)     Refresh Token (7d)
├── userId               ├── userId
├── companyId            ├── companyId
├── role                 └── tokenVersion
├── departmentId
└── exp

存储: HttpOnly Cookie (Secure, SameSite=Strict)
```

### 6.2 中间件鉴权流程

```typescript
// src/middleware.ts

export async function middleware(request: NextRequest) {
  // 1. 公开路由跳过
  if (isPublicRoute(request.nextUrl.pathname)) return NextResponse.next()

  // 2. 提取并验证 Access Token
  const token = request.cookies.get('access_token')?.value
  if (!token) return redirectToLogin(request)

  const payload = await verifyJWT(token)
  if (!payload) {
    // 尝试 Refresh Token
    const refreshed = await tryRefreshToken(request)
    if (!refreshed) return redirectToLogin(request)
  }

  // 3. 注入用户信息到请求头
  const response = NextResponse.next()
  response.headers.set('x-user-id', payload.userId)
  response.headers.set('x-company-id', payload.companyId)
  response.headers.set('x-role', payload.role)

  // 4. 路由级权限检查
  if (!hasRoutePermission(request.nextUrl.pathname, payload.role)) {
    return NextResponse.json({ error: '无权访问' }, { status: 403 })
  }

  return response
}
```

### 6.3 RBAC 权限矩阵（路由级）

```typescript
// src/lib/rbac.ts

const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
  // 管理端
  '/admin/dashboard':  ['SUPER_ADMIN', 'COMPANY_OWNER', 'CS_ADMIN', 'VISA_ADMIN'],
  '/admin/orders':     ['SUPER_ADMIN', 'COMPANY_OWNER', 'CS_ADMIN', 'CUSTOMER_SERVICE',
                        'VISA_ADMIN', 'DOC_COLLECTOR', 'OPERATOR', 'OUTSOURCE'],
  '/admin/pool':       ['VISA_ADMIN', 'DOC_COLLECTOR', 'OPERATOR', 'OUTSOURCE'],
  '/admin/workspace':  ['CUSTOMER_SERVICE', 'DOC_COLLECTOR', 'OPERATOR', 'OUTSOURCE'],
  '/admin/templates':  ['COMPANY_OWNER', 'VISA_ADMIN', 'DOC_COLLECTOR'],
  '/admin/team':       ['SUPER_ADMIN', 'COMPANY_OWNER', 'CS_ADMIN', 'VISA_ADMIN'],
  '/admin/analytics':  ['SUPER_ADMIN', 'COMPANY_OWNER', 'CS_ADMIN', 'VISA_ADMIN'],
  '/admin/settings':   ['SUPER_ADMIN', 'COMPANY_OWNER'],

  // 客户端
  '/customer/orders':  ['CUSTOMER'],
  '/customer/profile': ['CUSTOMER'],
}

// API 级权限（在各 API Route 内检查）
function checkPermission(userRole: UserRole, allowedRoles: UserRole[]) {
  if (!allowedRoles.includes(userRole)) {
    throw new ForbiddenError('无权执行此操作')
  }
}
```

---

## 7. 多租户隔离方案

### 7.1 隔离策略：Shared Database, Shared Schema

所有表包含 `companyId` 字段，所有查询强制过滤。

```typescript
// Prisma 中间件：自动注入 companyId
prisma.$use(async (params, next) => {
  // 对于读操作，自动添加 companyId 过滤
  if (['findMany', 'findFirst', 'count', 'aggregate'].includes(params.action)) {
    if (params.args.where && companyId) {
      params.args.where.companyId = companyId
    }
  }
  return next(params)
})
```

### 7.2 API 层租户隔离

```typescript
// 每个 API Route 统一获取 companyId
async function getCompanyId(request: NextRequest): Promise<string> {
  return request.headers.get('x-company-id')!
}

// 查询示例
export async function GET(request: NextRequest) {
  const companyId = await getCompanyId(request)
  const orders = await prisma.order.findMany({
    where: { companyId, /* 其他条件 */ },
  })
  return Response.json(orders)
}
```

---

## 8. 文件存储方案

### 8.1 阿里云 OSS 集成（已实现 ✅）

使用 `ali-oss` SDK（`src/lib/oss.ts`），提供完整文件操作能力：

| 函数 | 说明 |
|---|---|
| `uploadFile()` | 上传 Buffer/Stream 到 OSS，返回签名 URL |
| `generatePresignedPutUrl()` | 客户端直传预签名 URL（文件不经服务器） |
| `getSignedUrl()` | 带过期的签名下载 URL（内联展示） |
| `getDownloadUrl()` | 强制下载的签名 URL |
| `deleteFile()` / `deleteFiles()` | 单文件/批量删除 |
| `buildOssKey()` | 按规范路径构建存储 key |
| `fileExists()` / `getFileInfo()` | 文件检查和元信息 |

OSS Bucket 结构:

```
├── companies/
│   └── {companyId}/
│       ├── orders/
│       │   └── {orderId}/
│       │       ├── documents/     # 客户上传的资料
│       │       │   └── {requirementId}/
│       │       │       └── {timestamp}_{filename}
│       │       └── materials/     # 操作员制作的签证材料
│       │           └── {timestamp}_{filename}
│       └── templates/             # 公司模板附件
```

### 8.2 上传方案：预签名直传

```
客户端 ──[1.请求上传]──► Next.js API
              │
              ▼ 返回预签名URL
客户端 ──[2.直传文件]──► 阿里云 OSS
              │
              ▼ 上传完成回调
客户端 ──[3.确认上传]──► Next.js API ──► 写入数据库
```

**优势**：文件不经过服务器，减轻 ECS 带宽压力，支持大文件上传。

### 8.3 下载方案

- 管理端：生成带时效的预签名 URL（15分钟有效）
- 客户端：同上
- OUTSOURCE 角色：仅在线预览，不提供下载

### 8.4 文件类型限制

```typescript
const ALLOWED_FILE_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
  documents: ['application/pdf', 'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'text/plain'],
  spreadsheets: ['application/vnd.ms-excel',
                 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  archives: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'],
}

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
```

---

## 9. 实时通信方案

### 9.1 Socket.io 架构（已实现）

Custom Server (`server.ts`) 将 Next.js 和 Socket.io 绑定在同一 HTTP 服务器上：

```
server.ts (tsx 启动)
├── HTTP Server ─── Next.js App (SSR + API Routes)
└── Socket.io (共享端口) ─── 实时通知

房间设计:
├── company:{companyId}        # 公司级广播
├── user:{userId}              # 用户级推送
├── order:{orderId}            # 订单级协同
└── department:{departmentId}  # 部门级通知

启动命令:
  npm run dev     → tsx server.ts (启用 Socket.io)
  npm run dev:next → next dev (纯 Next.js，无 Socket.io)
```

### 9.2 通知事件定义

```typescript
// 服务端 emit
socket.to(`user:${collectorId}`).emit('notification', {
  type: 'ORDER_NEW',
  title: '又有新订单啦',
  orderId: order.id,
  orderNo: order.orderNo,
})

socket.to(`order:${orderId}`).emit('order:status', {
  orderId,
  status: newStatus,
  actor: user.realName,
  action: rule.action,
})
```

### 9.3 前端集成

```typescript
// src/hooks/use-socket.ts
const socket = io({
  auth: { token: accessToken },
})

socket.on('notification', (data) => {
  // 更新通知 store
  notificationStore.add(data)
  // 弹出 toast
  toast(data.title)
})

socket.on('order:status', (data) => {
  // 更新订单详情（如果正在查看）
  orderStore.refresh(data.orderId)
})
```

---

## 10. SMS 短信预留方案

### 10.1 预留接口定义

```typescript
// src/lib/sms.ts

interface SMSProvider {
  send(phone: string, templateCode: string, params: Record<string, string>): Promise<boolean>
}

// 预留：阿里云短信服务
class AliyunSMSProvider implements SMSProvider {
  async send(phone: string, templateCode: string, params: Record<string, string>) {
    // TODO: 接入阿里云短信 SDK
    console.log(`[SMS-RESERVED] ${phone} | ${templateCode} | ${JSON.stringify(params)}`)
    return true
  }
}

// 短信模板定义（预留）
const SMS_TEMPLATES = {
  ORDER_CREATED: 'SMS_001',      // 订单创建通知
  DOCS_SUBMITTED: 'SMS_002',     // 资料提交审核
  DELIVERED: 'SMS_003',          // 材料交付
  APPOINTMENT_REMIND: 'SMS_004', // 预约提醒
  RESULT_APPROVED: 'SMS_005',    // 出签通知
  RESULT_REJECTED: 'SMS_006',    // 拒签通知
}

// API 端点：返回 501 Not Implemented
export async function POST(request: NextRequest) {
  return Response.json(
    { error: 'SMS 服务暂未启用，接口已预留' },
    { status: 501 }
  )
}
```

---

## 11. 前端架构设计

### 11.1 状态管理分层

```
┌─────────────────────────────────────┐
│           React Components          │
├─────────────────────────────────────┤
│    Custom Hooks (数据获取+逻辑)      │
├─────────────────────────────────────┤
│    Zustand Stores (客户端状态)       │
│    - authStore (用户/Token)         │
│    - orderStore (订单列表/详情)      │
│    - notificationStore (通知)       │
├─────────────────────────────────────┤
│    API Routes (服务端数据)           │
├─────────────────────────────────────┤
│    Prisma → MySQL (持久化)          │
└─────────────────────────────────────┘
```

### 11.2 玻璃拟态全局样式

```css
/* src/styles/globals.css */

:root {
  /* 莫兰迪冷色系 */
  --color-bg-from: #1A1F2E;
  --color-bg-to: #252B3B;
  --color-primary: #7C8DA6;
  --color-primary-dark: #5A6B82;
  --color-primary-light: #A8B5C7;
  --color-secondary: #8FA3A6;
  --color-accent: #9B8EC4;
  --color-success: #7FA87A;
  --color-warning: #C4A97D;
  --color-error: #B87C7C;
  --color-info: #7CA8B8;

  /* 文字 */
  --color-text-primary: #E8ECF1;
  --color-text-secondary: #8E99A8;
  --color-text-placeholder: #5A6478;

  /* 玻璃效果 */
  --glass-bg: rgba(255, 255, 255, 0.06);
  --glass-bg-hover: rgba(255, 255, 255, 0.10);
  --glass-border: rgba(255, 255, 255, 0.08);
  --glass-blur: 20px;
  --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

body {
  background: linear-gradient(135deg, var(--color-bg-from), var(--color-bg-to));
  color: var(--color-text-primary);
  font-family: 'Inter', 'Noto Sans SC', system-ui, sans-serif;
  min-height: 100vh;
}

/* 玻璃卡片 */
.glass-card {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  box-shadow: var(--glass-shadow);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.glass-card:hover {
  background: var(--glass-bg-hover);
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);
}

/* 玻璃输入框 */
.glass-input {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  color: var(--color-text-primary);
  padding: 10px 14px;
  transition: all 0.3s ease;
}

.glass-input:focus {
  outline: none;
  border-color: rgba(124, 141, 166, 0.5);
  box-shadow: 0 0 0 3px rgba(124, 141, 166, 0.15);
}

.glass-input::placeholder {
  color: var(--color-text-placeholder);
}

/* 玻璃按钮 */
.glass-btn-primary {
  background: linear-gradient(135deg, rgba(124, 141, 166, 0.4), rgba(124, 141, 166, 0.2));
  backdrop-filter: blur(10px);
  border: 1px solid rgba(124, 141, 166, 0.3);
  border-radius: 12px;
  color: var(--color-text-primary);
  padding: 10px 20px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.glass-btn-primary:hover {
  background: linear-gradient(135deg, rgba(124, 141, 166, 0.55), rgba(124, 141, 166, 0.35));
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(124, 141, 166, 0.2);
}

.glass-btn-primary:active {
  transform: translateY(0);
}

/* 玻璃侧边栏 */
.glass-sidebar {
  background: rgba(26, 31, 46, 0.85);
  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);
  border-right: 1px solid rgba(255, 255, 255, 0.05);
}

/* 玻璃顶栏 */
.glass-topbar {
  background: rgba(26, 31, 46, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

/* 状态徽章 */
.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  backdrop-filter: blur(10px);
}

/* 动效 */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideInRight {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(124, 141, 166, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(124, 141, 166, 0); }
}

.animate-fade-in-up {
  animation: fadeInUp 0.4s cubic-bezier(0, 0, 0.2, 1) forwards;
}

.animate-slide-in-right {
  animation: slideInRight 0.35s cubic-bezier(0, 0, 0.2, 1) forwards;
}
```

### 11.3 背景装饰

全局背景使用渐变 + 微妙的几何装饰：

```css
/* 背景装饰层 */
.bg-decoration {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
}

.bg-decoration::before {
  content: '';
  position: absolute;
  top: -20%;
  right: -10%;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(124, 141, 166, 0.08) 0%, transparent 70%);
  border-radius: 50%;
}

.bg-decoration::after {
  content: '';
  position: absolute;
  bottom: -10%;
  left: -5%;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(155, 142, 196, 0.06) 0%, transparent 70%);
  border-radius: 50%;
}
```

---

## 12. 部署架构

### 12.1 阿里云资源配置

| 资源 | 规格 | 用途 |
|---|---|---|
| ECS | 2核4G (ecs.c7.large) | Next.js 应用 |
| RDS MySQL | 1核2G (rds.mysql.s2.large) | 主数据库 |
| OSS | 标准存储 | 文件存储 |
| SLB | 按量 | 负载均衡（后期扩展） |
| CDN | 按量 | 静态资源加速 |
| 域名 + SSL | — | HTTPS |

### 12.2 部署流程

```bash
# 1. 代码构建
npm run build

# 2. 数据库迁移
npx prisma migrate deploy

# 3. PM2 进程管理（Custom Server + Socket.io）
pm2 start tsx --name "erp" -- server.ts

# 或使用 npm script
# pm2 start npm --name "erp" -- start

# 4. Nginx 反向代理
server {
    listen 443 ssl;
    server_name erp.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';  # WebSocket 支持
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 12.3 环境变量

```env
# .env.local（实际部署配置，不提交到 Git）

# 应用
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://223.6.248.154:3002
PORT=3002

# 数据库 (阿里云 RDS MySQL)
DATABASE_URL="mysql://visa:密码@rm-bp159g3iw669447778o.mysql.rds.aliyuncs.com:3306/visa"

# JWT 认证
JWT_SECRET="<64位随机字符串>"
JWT_REFRESH_SECRET="<64位随机字符串>"

# 阿里云 OSS
OSS_REGION="oss-cn-beijing"
OSS_ENDPOINT="https://oss-cn-beijing.aliyuncs.com"
OSS_ACCESS_KEY_ID="<access_key>"
OSS_ACCESS_KEY_SECRET="<access_secret>"
OSS_BUCKET="hxvisa001"

# Socket.io
SOCKET_PORT=3002

# SMS (暂未启用)
SMS_ENABLED=false
```

> ⚠️ 密钥等敏感信息已脱敏，详见服务器 `.env.local` 文件

---

## 13. 性能优化策略

### 13.1 数据库层

- **索引优化**：所有高频查询字段已建立复合索引（见 3.3）
- **分页查询**：所有列表接口强制分页，默认 20 条/页
- **连接池**：Prisma 内置连接池，RDS 连接数限制合理配置
- **查询优化**：使用 `select` 只查询需要的字段，避免 `SELECT *`

### 13.2 应用层

- **Server Components**：数据获取在服务端完成，减少客户端 JS
- **流式渲染**：使用 React Suspense + Streaming SSR
- **API 缓存**：统计数据等低频变更接口使用短期缓存（60s）
- **文件直传**：客户端直传 OSS，不经过服务器

### 13.3 前端层

- **代码分割**：动态 import 各角色页面
- **图片优化**：Next.js Image 组件自动优化
- **骨架屏**：数据加载时显示骨架屏
- **虚拟列表**：订单列表超过 100 条时使用虚拟滚动
- **Service Worker**：静态资源缓存（PWA 预留）

---

## 14. 安全架构

### 14.1 安全措施清单

| 层 | 措施 |
|---|---|
| 传输 | 全站 HTTPS + HSTS |
| 认证 | JWT 双 Token + HttpOnly Cookie + 客户首次登录重置密码 |
| 授权 | 9 级 RBAC + 公司级数据隔离 |
| 密码 | bcrypt (cost=12) |
| 输入 | Zod 校验 + Prisma 参数化查询 |
| 输出 | React 默认转义 + CSP 头 |
| 文件 | 类型白名单 + 大小限制 |
| 脱敏 | OUTSOURCE 角色自动脱敏 |
| 审计 | 完整操作日志 |
| 限流 | API 路由级速率限制 |
| CORS | 严格限制来源域名 |

### 14.2 CSP 头配置

```typescript
const CSP = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https://*.aliyuncs.com;
  connect-src 'self' wss://erp.yourdomain.com;
  font-src 'self' data:;
`.replace(/\n/g, '')
```

---

*文档结束*
