# 华夏签证 ERP 系统 - 从0开始实现指南

> **文档版本**: V1.0
> **生成日期**: 2026-04-04
> **项目名称**: 华夏签证 ERP 系统
> **最后更新**: 2026-04-04
> **文档目的**: 指导如何从0开始构建一个与现有B端ERP系统功能和工作流100%一致的系统

---

## 目录

1. [系统概述](#1-系统概述)
2. [技术栈选择](#2-技术栈选择)
3. [项目初始化](#3-项目初始化)
4. [数据库设计](#4-数据库设计)
5. [核心架构搭建](#5-核心架构搭建)
6. [认证与权限系统](#6-认证与权限系统)
7. [订单管理系统](#7-订单管理系统)
8. [状态机引擎实现](#8-状态机引擎实现)
9. [文件管理系统](#9-文件管理系统)
10. [实时通信系统](#10-实时通信系统)
11. [API 接口设计](#11-api-接口设计)
12. [前端架构实现](#12-前端架构实现)
13. [工作流复刻](#13-工作流复刻)
14. [测试与验证](#14-测试与验证)
15. [部署与运维](#15-部署与运维)
16. [C端项目集成指南](#16-c端项目集成指南)

---

## 1. 系统概述

### 1.1 系统功能清单

**核心功能模块**：
- ✅ 认证与授权（JWT + RBAC 9级权限）
- ✅ 订单管理（完整的订单生命周期）
- ✅ 状态机引擎（订单状态流转）
- ✅ 资料管理（上传、审核、归档）
- ✅ 实时通信（Socket.io）
- ✅ 文件存储（阿里云 OSS）
- ✅ 多租户隔离
- ✅ 数据分析与报表
- ✅ 聊天系统
- ✅ 通知系统

### 1.2 工作流复刻目标

**100% 复刻现有 ERP 系统的工作流**：
- 订单状态流转逻辑
- 权限控制规则
- 业务操作流程
- 用户交互体验
- 数据结构设计

---

## 2. 技术栈选择

### 2.1 核心技术栈

| 类别 | 技术 | 版本 | 选型理由 |
|------|------|------|----------|
| 全栈框架 | Next.js (App Router) | 15.5.14 | SSR/RSC/API Routes 一体化 |
| 前端 UI | React | 19.2.4 | 成熟生态，RSC 性能优势 |
| ORM | Prisma | 5.22.0 | 类型安全，MySQL 完善支持 |
| 数据库 | MySQL | 8.0+ | 稳定可靠，适合企业级应用 |
| 样式 | Tailwind CSS | 3.4.16 | 原子化 CSS，开发效率高 |
| 状态管理 | Zustand | 5.0.2 | 轻量，TypeScript 友好 |
| 实时通信 | Socket.io | 4.8.1 | 自动重连，房间管理 |
| 文件存储 | 阿里云 OSS | 6.23.0 | 海量存储，CDN 加速 |
| 认证 | JWT (jose) | 5.9.6 | 无状态，适合分布式 |
| 验证 | Zod | 3.24.1 | 类型安全的参数验证 |

### 2.2 开发工具

| 工具 | 版本 | 用途 |
|------|------|------|
| TypeScript | 5.7.2 | 全栈类型安全 |
| ESLint | 8.57.1 | 代码质量检查 |
| Prettier | 3.x | 代码格式化 |
| Vitest | 4.1.0 | 单元测试 |
| tsx | 4.19.2 | TypeScript 运行时 |

---

## 3. 项目初始化

### 3.1 项目创建

```bash
# 1. 创建 Next.js 项目
npx create-next-app@latest c-project --typescript --tailwind --eslint

# 2. 进入项目目录
cd c-project

# 3. 安装核心依赖
npm install @prisma/client prisma ali-oss bcryptjs dotenv jose lru-cache socket.io socket.io-client zustand zod

# 4. 安装开发依赖
npm install -D @types/ali-oss @types/bcryptjs @types/node tsx vitest

# 5. 初始化 Prisma
npx prisma init
```

### 3.2 目录结构搭建

```bash
# 创建核心目录结构
mkdir -p src/modules/erp/components src/modules/erp/hooks src/modules/erp/lib src/modules/erp/stores src/modules/erp/types
mkdir -p src/shared/components/ui src/shared/hooks src/shared/lib src/shared/stores src/shared/styles src/shared/types
mkdir -p src/app/api/auth src/app/api/orders src/app/api/documents src/app/api/notifications
mkdir -p src/app/admin/dashboard src/app/admin/orders src/app/admin/pool src/app/admin/workspace
mkdir -p src/app/customer/orders src/app/customer/profile
```

---

## 4. 数据库设计

### 4.1 Prisma Schema 设计

**创建 `prisma/schema.prisma`**：

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

// ========== 枚举定义 ==========
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
  PARTIAL             // 部分出签
}

enum CompanyStatus {
  ACTIVE
  SUSPENDED
  DELETED
}

enum UserStatus {
  ACTIVE
  INACTIVE
  LOCKED
}

enum DocReqStatus {
  PENDING     // 待上传
  UPLOADED    // 已上传
  REVIEWING   // 审核中
  APPROVED    // 已合格
  REJECTED    // 需修改
  SUPPLEMENT  // 需补充
}

enum NotificationType {
  ORDER_NEW
  ORDER_CREATED
  STATUS_CHANGE
  DOC_REVIEWED
  DOCS_SUBMITTED
  MATERIAL_UPLOADED
  MATERIAL_FEEDBACK
  APPOINTMENT_REMIND
  SYSTEM
  CHAT_MESSAGE
}

// ========== 核心模型 ==========

// 公司/租户
model Company {
  id          String        @id @default(cuid())
  name        String        @db.VarChar(100)
  logo        String?       @db.Text
  phone       String?       @db.VarChar(20)
  email       String?       @db.VarChar(100)
  address     String?       @db.Text
  status      CompanyStatus @default(ACTIVE)
  settings    Json?         // 公司配置
  createdAt   DateTime      @default(now()) @map("created_at")
  updatedAt   DateTime      @updatedAt @map("updated_at")

  users       User[]
  departments Department[]
  orders      Order[]
  templates   VisaTemplate[]
  chatRooms   ChatRoom[]

  @@map("erp_companies")
}

// 部门
model Department {
  id          String      @id @default(cuid())
  companyId   String      @map("company_id")
  name        String      @db.VarChar(50)
  code        String      @db.VarChar(30) // CS / VISA / MANAGEMENT
  parentId    String?     @map("parent_id")
  sortOrder   Int         @default(0) @map("sort_order")
  createdAt   DateTime    @default(now()) @map("created_at")
  updatedAt   DateTime    @updatedAt @map("updated_at")

  company     Company     @relation(fields: [companyId], references: [id])
  parent      Department? @relation("DepartmentHierarchy", fields: [parentId], references: [id])
  children    Department[] @relation("DepartmentHierarchy")
  users       User[]

  @@unique([companyId, code])
  @@index([companyId])
  @@map("erp_departments")
}

// 用户
model User {
  id              String     @id @default(cuid())
  companyId       String     @map("company_id")
  departmentId    String?    @map("department_id")
  username        String     @unique @db.VarChar(50)
  phone           String     @db.VarChar(20)
  email           String?    @db.VarChar(100)
  passwordHash    String     @db.Text @map("password_hash")
  realName        String     @db.VarChar(50) @map("real_name")
  role            UserRole
  status          UserStatus @default(ACTIVE)
  avatar          String?    @db.Text
  lastLoginAt     DateTime?  @map("last_login_at")
  createdAt       DateTime   @default(now()) @map("created_at")
  updatedAt       DateTime   @updatedAt @map("updated_at")

  company         Company     @relation(fields: [companyId], references: [id])
  department      Department? @relation(fields: [departmentId], references: [id])

  customerOrders  Order[] @relation("OrderCustomer")
  collectorOrders Order[] @relation("OrderCollector")
  operatorOrders  Order[] @relation("OrderOperator")
  createdOrders   Order[] @relation("OrderCreator")

  orderLogs       OrderLog[]
  notifications   Notification[]
  chatMessages    ChatMessage[]
  chatReads       ChatRead[]

  @@index([companyId])
  @@index([companyId, role])
  @@index([departmentId])
  @@unique([companyId, phone])
  @@map("erp_users")
}

// 订单
model Order {
  id                String      @id @default(cuid())
  companyId         String      @map("company_id")
  orderNo           String      @unique @db.VarChar(30) @map("order_no")
  externalOrderNo   String?     @unique @db.VarChar(50) @map("external_order_no")

  // 客户信息
  customerName      String      @db.VarChar(50) @map("customer_name")
  customerPhone     String      @db.VarChar(20) @map("customer_phone")
  customerEmail     String?     @db.VarChar(100) @map("customer_email")
  passportNo        String?     @db.VarChar(20) @map("passport_no")
  passportIssue     DateTime?   @map("passport_issue")
  passportExpiry    DateTime?   @map("passport_expiry")

  // 签证信息
  targetCountry     String      @db.VarChar(50) @map("target_country")
  visaType          String      @db.VarChar(50) @map("visa_type")
  visaCategory      String?     @db.VarChar(50) @map("visa_category")
  travelDate        DateTime?   @map("travel_date")

  // 订单信息
  amount            Decimal     @db.Decimal(10, 2)
  paymentMethod     String?     @db.VarChar(30) @map("payment_method")
  sourceChannel     String?     @db.VarChar(50) @map("source_channel")
  remark            String?     @db.Text
  status            OrderStatus @default(PENDING_CONNECTION)

  // 关联用户
  customerId        String?     @map("customer_id")
  collectorId       String?     @map("collector_id")
  operatorId        String?     @map("operator_id")
  createdById       String      @map("created_by_id")

  createdAt         DateTime    @default(now()) @map("created_at")
  updatedAt         DateTime    @updatedAt @map("updated_at")

  // 关联关系
  company           Company     @relation(fields: [companyId], references: [id])
  customer          User?       @relation("OrderCustomer", fields: [customerId], references: [id])
  collector         User?       @relation("OrderCollector", fields: [collectorId], references: [id])
  operator          User?       @relation("OrderOperator", fields: [operatorId], references: [id])
  createdBy         User        @relation("OrderCreator", fields: [createdById], references: [id])

  applicants        Applicant[]
  documentRequirements DocumentRequirement[]
  visaMaterials     VisaMaterial[]
  orderLogs         OrderLog[]
  chatRooms         ChatRoom[]

  @@index([companyId])
  @@index([status])
  @@index([collectorId])
  @@index([operatorId])
  @@map("erp_orders")
}

// 申请人（多人订单）
model Applicant {
  id              String    @id @default(cuid())
  orderId         String    @map("order_id")
  name            String    @db.VarChar(50)
  gender          String    @db.VarChar(10)
  birthDate       DateTime  @map("birth_date")
  passportNo      String    @db.VarChar(20) @map("passport_no")
  passportIssue   DateTime  @map("passport_issue")
  passportExpiry  DateTime  @map("passport_expiry")
  nationalId      String?   @db.VarChar(20) @map("national_id")
  contactPhone    String    @db.VarChar(20) @map("contact_phone")
  relation        String    @db.VarChar(20) // 与主申请人关系
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  order           Order     @relation(fields: [orderId], references: [id])

  @@index([orderId])
  @@map("erp_applicants")
}

// 资料需求
model DocumentRequirement {
  id          String        @id @default(cuid())
  orderId     String        @map("order_id")
  name        String        @db.VarChar(100)
  description String?       @db.Text
  status      DocReqStatus  @default(PENDING)
  required    Boolean       @default(true)
  sortOrder   Int           @default(0) @map("sort_order")
  createdAt   DateTime      @default(now()) @map("created_at")
  updatedAt   DateTime      @updatedAt @map("updated_at")

  order       Order         @relation(fields: [orderId], references: [id])
  files       DocumentFile[]

  @@index([orderId])
  @@map("erp_document_requirements")
}

// 资料文件
model DocumentFile {
  id              String    @id @default(cuid())
  requirementId   String    @map("requirement_id")
  fileName        String    @db.VarChar(255) @map("file_name")
  fileUrl         String    @db.Text @map("file_url")
  fileSize        Int       @map("file_size")
  fileType        String    @db.VarChar(50) @map("file_type")
  uploadedById    String    @map("uploaded_by_id")
  createdAt       DateTime  @default(now()) @map("created_at")

  requirement     DocumentRequirement @relation(fields: [requirementId], references: [id])
  uploadedBy      User      @relation(fields: [uploadedById], references: [id])

  @@index([requirementId])
  @@map("erp_document_files")
}

// 签证材料
model VisaMaterial {
  id          String    @id @default(cuid())
  orderId     String    @map("order_id")
  name        String    @db.VarChar(100)
  description String?   @db.Text
  fileUrl     String    @db.Text @map("file_url")
  fileSize    Int       @map("file_size")
  fileType    String    @db.VarChar(50) @map("file_type")
  uploadedById String   @map("uploaded_by_id")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  order       Order     @relation(fields: [orderId], references: [id])
  uploadedBy  User      @relation(fields: [uploadedById], references: [id])

  @@index([orderId])
  @@map("erp_visa_materials")
}

// 操作日志
model OrderLog {
  id          String    @id @default(cuid())
  orderId     String    @map("order_id")
  companyId   String    @map("company_id")
  userId      String    @map("user_id")
  action      String    @db.VarChar(100)
  fromStatus  OrderStatus @map("from_status")
  toStatus    OrderStatus @map("to_status")
  detail      String?   @db.Text
  createdAt   DateTime  @default(now()) @map("created_at")

  order       Order     @relation(fields: [orderId], references: [id])
  company     Company   @relation(fields: [companyId], references: [id])
  user        User      @relation(fields: [userId], references: [id])

  @@index([orderId])
  @@index([companyId])
  @@index([userId])
  @@map("erp_order_logs")
}

// 通知
model Notification {
  id          String            @id @default(cuid())
  companyId   String            @map("company_id")
  userId      String            @map("user_id")
  type        NotificationType
  title       String            @db.VarChar(100)
  content     String            @db.Text
  read        Boolean           @default(false)
  relatedId   String?           @map("related_id") // 关联的订单ID等
  createdAt   DateTime          @default(now()) @map("created_at")

  company     Company           @relation(fields: [companyId], references: [id])
  user        User              @relation(fields: [userId], references: [id])

  @@index([companyId])
  @@index([userId])
  @@index([read])
  @@map("erp_notifications")
}

// 签证模板
model VisaTemplate {
  id          String    @id @default(cuid())
  companyId   String    @map("company_id")
  name        String    @db.VarChar(100)
  country     String    @db.VarChar(50)
  visaType    String    @db.VarChar(50)
  requirements Json      // 资料要求 JSON
  isPublic    Boolean   @default(false)
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  company     Company   @relation(fields: [companyId], references: [id])

  @@index([companyId])
  @@index([country, visaType])
  @@map("erp_visa_templates")
}

// 聊天房间
model ChatRoom {
  id          String        @id @default(cuid())
  companyId   String        @map("company_id")
  orderId     String        @map("order_id")
  status      ChatRoomStatus @default(ACTIVE)
  lastMessageAt DateTime?   @map("last_message_at")
  createdAt   DateTime      @default(now()) @map("created_at")
  updatedAt   DateTime      @updatedAt @map("updated_at")

  company     Company       @relation(fields: [companyId], references: [id])
  order       Order         @relation(fields: [orderId], references: [id])
  messages    ChatMessage[]
  chatReads   ChatRead[]

  @@index([companyId])
  @@index([orderId])
  @@map("erp_chat_rooms")
}

// 聊天消息
enum ChatMessageType {
  TEXT
  IMAGE
  FILE
  SYSTEM
}

model ChatMessage {
  id          String          @id @default(cuid())
  roomId      String          @map("room_id")
  userId      String          @map("user_id")
  type        ChatMessageType
  content     String          @db.Text
  fileUrl     String?         @db.Text @map("file_url")
  fileSize    Int?            @map("file_size")
  fileType    String?         @db.VarChar(50) @map("file_type")
  readCount   Int             @default(0) @map("read_count")
  createdAt   DateTime        @default(now()) @map("created_at")

  room        ChatRoom        @relation(fields: [roomId], references: [id])
  user        User            @relation(fields: [userId], references: [id])

  @@index([roomId])
  @@index([userId])
  @@map("erp_chat_messages")
}

// 已读回执
model ChatRead {
  id          String    @id @default(cuid())
  roomId      String    @map("room_id")
  userId      String    @map("user_id")
  lastReadAt  DateTime  @map("last_read_at")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  room        ChatRoom  @relation(fields: [roomId], references: [id])
  user        User      @relation(fields: [userId], references: [id])

  @@unique([roomId, userId])
  @@map("erp_chat_reads")
}

enum ChatRoomStatus {
  ACTIVE
  ARCHIVED
  MUTED
}
```

### 4.2 数据库初始化

```bash
# 生成 Prisma Client
npm run postinstall

# 同步数据库 Schema
npm run db:push

# 创建种子数据
cat > prisma/seed.ts << 'EOF'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 创建默认公司
  const company = await prisma.company.create({
    data: {
      name: "华夏签证",
      phone: "400-123-4567",
      email: "contact@hxvisa.com",
      address: "北京市朝阳区建国路88号",
    },
  })

  // 创建默认管理员
  await prisma.user.create({
    data: {
      companyId: company.id,
      username: "admin",
      phone: "13800138000",
      email: "admin@hxvisa.com",
      passwordHash: "$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW", // 密码: admin123
      realName: "系统管理员",
      role: "SUPER_ADMIN",
    },
  })

  console.log("Seed data created successfully!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
EOF

# 运行种子数据
npm run db:seed
```

---

## 5. 核心架构搭建

### 5.1 服务器配置

**创建 `server.ts`**：

```typescript
// 加载环境变量
import { config } from 'dotenv'
config({ path: '.env.local' })

// 修复 Next.js 15 + tsx 兼容性问题
if (typeof globalThis.AsyncLocalStorage === 'undefined') {
  const { AsyncLocalStorage } = require('async_hooks')
  ;(globalThis as any).AsyncLocalStorage = AsyncLocalStorage
}

import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { initSocketServer } from '@shared/lib/socket'

const dev = process.env.NODE_ENV !== 'production'
const hostname = '0.0.0.0'
const port = parseInt(process.env.PORT ?? '3002', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true)
    handle(req, res, parsedUrl)
  })

  // 初始化 Socket.io
  initSocketServer(server)

  server.listen(port, hostname, () => {
    process.stdout.write(`🚀 Server ready on http://${hostname}:${port}\n`)
    process.stdout.write(`🔌 Socket.io enabled\n`)
  })
})
```

### 5.2 环境变量配置

**创建 `.env.local`**：

```bash
# 应用
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3002
PORT=3002

# 数据库
DB_PASS_ENCODED="your-password-encoded"
DATABASE_URL="mysql://user:${DB_PASS_ENCODED}@host:3306/database"

# JWT
JWT_SECRET="change-me-to-a-random-64-char-string"
JWT_REFRESH_SECRET="change-me-to-another-random-64-char-string"

# 阿里云 OSS
OSS_REGION="oss-cn-beijing"
OSS_ENDPOINT="https://oss-cn-beijing.aliyuncs.com"
OSS_ACCESS_KEY_ID="your-access-key-id"
OSS_ACCESS_KEY_SECRET="your-access-key-secret"
OSS_BUCKET="your-bucket-name"

# SMS
SMS_ENABLED=false
```

---

## 6. 认证与权限系统

### 6.1 JWT 认证实现

**创建 `src/shared/lib/auth.ts`**：

```typescript
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { prisma } from './prisma'

export interface JWTUser {
  userId: string
  companyId: string
  role: string
  departmentId?: string
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET)
const JWT_REFRESH_SECRET = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET)

export async function generateTokens(user: JWTUser) {
  // Access Token (15分钟)
  const accessToken = await new SignJWT(user)
    .setExpirationTime('15m')
    .setIssuedAt()
    .sign(JWT_SECRET)

  // Refresh Token (7天)
  const refreshToken = await new SignJWT({ userId: user.userId, companyId: user.companyId })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(JWT_REFRESH_SECRET)

  return { accessToken, refreshToken }
}

export async function verifyJWT(token: string): Promise<JWTUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as JWTUser
  } catch {
    return null
  }
}

export async function verifyRefreshToken(token: string): Promise<{ userId: string; companyId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_REFRESH_SECRET)
    return { userId: payload.userId as string, companyId: payload.companyId as string }
  } catch {
    return null
  }
}

export async function getAuthUser(request: Request): Promise<JWTUser | null> {
  const token = request.headers.get('x-user-id') 
    ? {
        userId: request.headers.get('x-user-id')!,
        companyId: request.headers.get('x-company-id')!,
        role: request.headers.get('x-role')!,
        departmentId: request.headers.get('x-department-id') || undefined
      }
    : null

  if (token) return token

  const cookie = request.headers.get('cookie')
  if (!cookie) return null

  const accessToken = cookie.match(/access_token=([^;]+)/)?.[1]
  if (!accessToken) return null

  return await verifyJWT(accessToken)
}

export function setAuthCookies(accessToken: string, refreshToken: string) {
  const cookieStore = cookies()
  cookieStore.set('access_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60, // 15分钟
    path: '/'
  })
  cookieStore.set('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60, // 7天
    path: '/'
  })
}

export function clearAuthCookies() {
  const cookieStore = cookies()
  cookieStore.delete('access_token')
  cookieStore.delete('refresh_token')
}
```

### 6.2 RBAC 权限系统

**创建 `src/shared/lib/rbac.ts`**：

```typescript
export type UserRole = 
  | 'SUPER_ADMIN'
  | 'COMPANY_OWNER'
  | 'CS_ADMIN'
  | 'CUSTOMER_SERVICE'
  | 'VISA_ADMIN'
  | 'DOC_COLLECTOR'
  | 'OPERATOR'
  | 'OUTSOURCE'
  | 'CUSTOMER'

export const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
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

export function checkPermission(userRole: UserRole, allowedRoles: UserRole[]) {
  if (!allowedRoles.includes(userRole)) {
    throw new Error('无权执行此操作')
  }
}

export function hasRoutePermission(path: string, role: UserRole): boolean {
  for (const [route, roles] of Object.entries(ROUTE_PERMISSIONS)) {
    if (path.startsWith(route) && roles.includes(role)) {
      return true
    }
  }
  return false
}
```

### 6.3 中间件实现

**创建 `src/middleware.ts`**：

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT, verifyRefreshToken, setAuthCookies } from '@shared/lib/auth'
import { hasRoutePermission } from '@shared/lib/rbac'

const publicRoutes = [
  '/login',
  '/register',
  '/reset-password',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/reset-password',
  '/api/health',
]

function isPublicRoute(path: string): boolean {
  return publicRoutes.some(route => path.startsWith(route))
}

async function tryRefreshToken(request: NextRequest): Promise<boolean> {
  const refreshToken = request.cookies.get('refresh_token')?.value
  if (!refreshToken) return false

  const payload = await verifyRefreshToken(refreshToken)
  if (!payload) return false

  // 生成新的 Access Token
  const user = {
    userId: payload.userId,
    companyId: payload.companyId,
    role: 'USER' // 需要从数据库获取实际角色
  }

  // 这里应该从数据库获取用户信息
  // const dbUser = await prisma.user.findUnique({ where: { id: payload.userId } })
  // if (!dbUser) return false

  const { accessToken, refreshToken: newRefreshToken } = await generateTokens(user)
  setAuthCookies(accessToken, newRefreshToken)

  return true
}

export async function middleware(request: NextRequest) {
  // 公开路由跳过
  if (isPublicRoute(request.nextUrl.pathname)) {
    return NextResponse.next()
  }

  // 提取并验证 Access Token
  const token = request.cookies.get('access_token')?.value
  if (!token) {
    // 尝试 Refresh Token
    const refreshed = await tryRefreshToken(request)
    if (!refreshed) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next()
  }

  const payload = await verifyJWT(token)
  if (!payload) {
    // 尝试 Refresh Token
    const refreshed = await tryRefreshToken(request)
    if (!refreshed) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next()
  }

  // 注入用户信息到请求头
  const response = NextResponse.next()
  response.headers.set('x-user-id', payload.userId)
  response.headers.set('x-company-id', payload.companyId)
  response.headers.set('x-role', payload.role)
  if (payload.departmentId) {
    response.headers.set('x-department-id', payload.departmentId)
  }

  // 路由级权限检查
  if (!hasRoutePermission(request.nextUrl.pathname, payload.role as any)) {
    return NextResponse.json({ error: '无权访问' }, { status: 403 })
  }

  return response
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/customer/:path*',
    '/api/:path*',
  ],
}
```

---

## 7. 订单管理系统

### 7.1 订单 API 实现

**创建 `src/app/api/orders/route.ts`**：

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@shared/lib/prisma'
import { getAuthUser } from '@shared/lib/auth'
import { checkPermission } from '@shared/lib/rbac'

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) {
    return NextResponse.json({ success: false, message: '未认证' }, { status: 401 })
  }

  const where: any = {
    companyId: user.companyId
  }

  // 按角色过滤
  if (user.role === 'CUSTOMER_SERVICE') {
    where.createdBy = user.userId
  } else if (user.role === 'DOC_COLLECTOR') {
    where.collectorId = user.userId
  } else if (user.role === 'OPERATOR') {
    where.operatorId = user.userId
  } else if (user.role === 'CUSTOMER') {
    where.customerId = user.userId
  }

  const orders = await prisma.order.findMany({
    where,
    select: {
      id: true,
      orderNo: true,
      customerName: true,
      targetCountry: true,
      visaType: true,
      status: true,
      amount: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ success: true, data: orders })
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) {
    return NextResponse.json({ success: false, message: '未认证' }, { status: 401 })
  }

  // 检查权限
  checkPermission(user.role as any, ['COMPANY_OWNER', 'CS_ADMIN', 'CUSTOMER_SERVICE'])

  const data = await request.json()
  
  // 生成订单号
  const orderNo = `HX${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`

  const order = await prisma.order.create({
    data: {
      companyId: user.companyId,
      orderNo,
      ...data,
      createdById: user.userId,
    },
  })

  return NextResponse.json({ success: true, data: order }, { status: 201 })
}
```

### 7.2 订单详情 API

**创建 `src/app/api/orders/[id]/route.ts`**：

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@shared/lib/prisma'
import { getAuthUser } from '@shared/lib/auth'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(request)
  if (!user) {
    return NextResponse.json({ success: false, message: '未认证' }, { status: 401 })
  }

  const order = await prisma.order.findUnique({
    where: {
      id: params.id,
      companyId: user.companyId,
    },
    include: {
      applicants: true,
      documentRequirements: {
        include: {
          files: true,
        },
      },
      visaMaterials: true,
      collector: { select: { realName: true, phone: true } },
      operator: { select: { realName: true, phone: true } },
    },
  })

  if (!order) {
    return NextResponse.json({ success: false, message: '订单不存在' }, { status: 404 })
  }

  // 检查权限（确保用户只能查看有权限的订单）
  if (user.role === 'CUSTOMER' && order.customerId !== user.userId) {
    return NextResponse.json({ success: false, message: '无权访问' }, { status: 403 })
  }
  if (user.role === 'CUSTOMER_SERVICE' && order.createdById !== user.userId) {
    return NextResponse.json({ success: false, message: '无权访问' }, { status: 403 })
  }
  if (user.role === 'DOC_COLLECTOR' && order.collectorId !== user.userId) {
    return NextResponse.json({ success: false, message: '无权访问' }, { status: 403 })
  }
  if (user.role === 'OPERATOR' && order.operatorId !== user.userId) {
    return NextResponse.json({ success: false, message: '无权访问' }, { status: 403 })
  }

  return NextResponse.json({ success: true, data: order })
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(request)
  if (!user) {
    return NextResponse.json({ success: false, message: '未认证' }, { status: 401 })
  }

  const data = await request.json()
  
  const order = await prisma.order.update({
    where: {
      id: params.id,
      companyId: user.companyId,
    },
    data,
  })

  return NextResponse.json({ success: true, data: order })
}
```

---

## 8. 状态机引擎实现

### 8.1 状态流转服务

**创建 `src/modules/erp/lib/transition.ts`**：

```typescript
import { prisma } from '@shared/lib/prisma'

interface TransitionRule {
  from: string
  to: string
  allowedRoles: string[]
  action: string
  validate?: (order: any, user: any) => Promise<boolean>
}

export const TRANSITION_RULES: TransitionRule[] = [
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
    toStatus: string,
    userId: string,
    detail?: string
  ): Promise<any> {
    return await prisma.$transaction(async (tx) => {
      // 1. 获取订单和用户
      const order = await tx.order.findUnique({ where: { id: orderId } })
      const user = await tx.user.findUnique({ where: { id: userId } })

      if (!order || !user) {
        throw new Error('订单或用户不存在')
      }

      // 2. 查找匹配规则
      const rule = TRANSITION_RULES.find(
        r => r.from === order.status && r.to === toStatus
      )
      if (!rule) {
        throw new Error(`不允许从 ${order.status} 流转到 ${toStatus}`)
      }

      // 3. 权限校验
      if (!rule.allowedRoles.includes(user.role)) {
        throw new Error(`角色 ${user.role} 无权执行此操作`)
      }

      // 4. 业务校验
      if (rule.validate && !(await rule.validate(order, user))) {
        throw new Error('业务校验不通过')
      }

      // 5. 更新状态
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: toStatus },
      })

      // 6. 写操作日志
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

      return updatedOrder
    })
  }
}

export const transitionService = new TransitionService()
```

### 8.2 状态流转 API

**创建 `src/app/api/orders/[id]/status/route.ts`**：

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { transitionService } from '@erp/lib/transition'
import { getAuthUser } from '@shared/lib/auth'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(request)
  if (!user) {
    return NextResponse.json({ success: false, message: '未认证' }, { status: 401 })
  }

  const { status, detail } = await request.json()

  try {
    const order = await transitionService.transition(
      params.id,
      status,
      user.userId,
      detail
    )

    return NextResponse.json({ success: true, data: order })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 })
  }
}
```

---

## 9. 文件管理系统

### 9.1 阿里云 OSS 集成

**创建 `src/shared/lib/oss.ts`**：

```typescript
import OSS from 'ali-oss'

const ossClient = new OSS({
  region: process.env.OSS_REGION,
  accessKeyId: process.env.OSS_ACCESS_KEY_ID,
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
  bucket: process.env.OSS_BUCKET,
})

export const oss = {
  async uploadFile(key: string, file: Buffer | File) {
    const result = await ossClient.put(key, file)
    return result.url
  },

  async generatePresignedPutUrl(key: string, expires = 3600) {
    const url = await ossClient.signatureUrl(key, {
      expires,
      method: 'PUT',
    })
    return url
  },

  async getSignedUrl(key: string, expires = 900) {
    return await ossClient.signatureUrl(key, { expires })
  },

  async getDownloadUrl(key: string, expires = 900) {
    return await ossClient.signatureUrl(key, {
      expires,
      response: { 'content-disposition': 'attachment' },
    })
  },

  async deleteFile(key: string) {
    await ossClient.delete(key)
  },

  async deleteFiles(keys: string[]) {
    await ossClient.deleteMulti(keys)
  },

  buildOssKey(companyId: string, orderId: string, type: 'documents' | 'materials', filename: string) {
    return `companies/${companyId}/orders/${orderId}/${type}/${Date.now()}_${filename}`
  },
}
```

### 9.2 文件上传 API

**创建 `src/app/api/documents/upload/route.ts`**：

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@shared/lib/auth'
import { oss } from '@shared/lib/oss'
import { prisma } from '@shared/lib/prisma'

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) {
    return NextResponse.json({ success: false, message: '未认证' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File
  const orderId = formData.get('orderId') as string
  const requirementId = formData.get('requirementId') as string

  if (!file || !orderId || !requirementId) {
    return NextResponse.json({ success: false, message: '参数缺失' }, { status: 400 })
  }

  // 构建 OSS 路径
  const ossKey = oss.buildOssKey(user.companyId, orderId, 'documents', file.name)

  // 上传文件
  const fileBuffer = Buffer.from(await file.arrayBuffer())
  const fileUrl = await oss.uploadFile(ossKey, fileBuffer)

  // 保存到数据库
  const documentFile = await prisma.documentFile.create({
    data: {
      requirementId,
      fileName: file.name,
      fileUrl,
      fileSize: file.size,
      fileType: file.type,
      uploadedById: user.userId,
    },
  })

  // 更新资料状态
  await prisma.documentRequirement.update({
    where: { id: requirementId },
    data: { status: 'UPLOADED' },
  })

  return NextResponse.json({ success: true, data: documentFile })
}
```

---

## 10. 实时通信系统

### 10.1 Socket.io 服务端

**创建 `src/shared/lib/socket.ts`**：

```typescript
import { Server } from 'socket.io'
import type { Server as HttpServer } from 'http'
import { verifyJWT } from './auth'

let io: Server | null = null

export function initSocketServer(server: HttpServer) {
  io = new Server(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL,
      credentials: true,
    },
  })

  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token || 
      socket.handshake.headers.cookie?.match(/access_token=([^;]+)/)?.[1]
    if (!token) return next(new Error('未认证'))

    const user = await verifyJWT(token)
    if (!user) return next(new Error('Token无效'))

    socket.data.userId = user.userId
    socket.data.companyId = user.companyId
    socket.data.role = user.role
    next()
  })

  io.on('connection', (socket) => {
    const { userId, companyId } = socket.data

    // 加入房间
    socket.join(`company:${companyId}`)
    socket.join(`user:${userId}`)

    // 监听事件
    socket.on('chat:message', async (data) => {
      // 处理聊天消息
    })

    socket.on('disconnect', () => {
      // 处理断开连接
    })
  })

  return io
}

export function getIo(): Server {
  if (!io) {
    throw new Error('Socket.io not initialized')
  }
  return io
}

export function emitToUser(userId: string, event: string, data: any) {
  const ioInstance = getIo()
  ioInstance.to(`user:${userId}`).emit(event, data)
}

export function emitToCompany(companyId: string, event: string, data: any) {
  const ioInstance = getIo()
  ioInstance.to(`company:${companyId}`).emit(event, data)
}
```

### 10.2 Socket.io 客户端

**创建 `src/shared/hooks/use-socket-client.ts`**：

```typescript
'use client'

import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'

export function useSocketClient() {
  const [socket, setSocket] = useState<Socket | null>(null)

  useEffect(() => {
    const newSocket = io({
      transports: ['websocket', 'polling'],
      reconnection: true,
    })

    newSocket.on('connect', () => {
      console.log('Socket connected')
    })

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected')
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [])

  return socket
}
```

---

## 11. API 接口设计

### 11.1 统一响应格式

**创建 `src/shared/types/api.ts`**：

```typescript
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  code?: string
  meta?: {
    total?: number
    page?: number
    pageSize?: number
  }
}

export interface PaginationParams {
  page: number
  pageSize: number
}
```

### 11.2 核心 API 接口

| 模块 | 路径 | 方法 | 功能 |
|------|------|------|------|
| 认证 | `/api/auth/login` | POST | 登录 |
| 认证 | `/api/auth/register` | POST | 注册 |
| 认证 | `/api/auth/refresh` | POST | 刷新 Token |
| 认证 | `/api/auth/me` | GET | 获取当前用户 |
| 订单 | `/api/orders` | GET | 订单列表 |
| 订单 | `/api/orders` | POST | 创建订单 |
| 订单 | `/api/orders/[id]` | GET | 订单详情 |
| 订单 | `/api/orders/[id]` | PATCH | 更新订单 |
| 订单 | `/api/orders/[id]/status` | POST | 状态流转 |
| 订单 | `/api/orders/[id]/claim` | POST | 接单 |
| 资料 | `/api/documents/upload` | POST | 上传文件 |
| 资料 | `/api/documents/presign` | POST | 预签名上传 |
| 资料 | `/api/documents/[id]` | PATCH | 审核资料 |
| 通知 | `/api/notifications` | GET | 通知列表 |
| 通知 | `/api/notifications/[id]` | PATCH | 标记已读 |
| 聊天 | `/api/chat/rooms` | GET | 聊天房间列表 |
| 聊天 | `/api/chat/rooms/[orderId]/messages` | GET | 聊天消息 |
| 聊天 | `/api/chat/rooms/[orderId]/messages` | POST | 发送消息 |

---

## 12. 前端架构实现

### 12.1 目录结构

```
src/
├── app/
│   ├── (auth)/           # 认证页面
│   ├── admin/            # 管理端页面
│   ├── customer/         # 客户端页面
│   └── api/              # API 路由
├── modules/
│   └── erp/              # ERP 核心模块
│       ├── components/    # 业务组件
│       ├── hooks/         # 自定义钩子
│       ├── lib/           # 业务逻辑
│       ├── stores/        # 状态存储
│       └── types/         # 类型定义
├── shared/
│   ├── components/        # 共享组件
│   ├── hooks/             # 共享钩子
│   ├── lib/               # 共享逻辑
│   ├── stores/            # 共享存储
│   ├── styles/            # 共享样式
│   └── types/             # 共享类型
└── middleware.ts          # 中间件
```

### 12.2 核心组件实现

**创建 `src/modules/erp/components/orders/status-badge.tsx`**：

```typescript
'use client'

export function StatusBadge({ status }: { status: string }) {
  const statusConfig = {
    PENDING_CONNECTION: { label: '待对接', className: 'bg-yellow-500' },
    CONNECTED: { label: '已对接', className: 'bg-blue-500' },
    COLLECTING_DOCS: { label: '资料收集', className: 'bg-purple-500' },
    PENDING_REVIEW: { label: '待审核', className: 'bg-orange-500' },
    UNDER_REVIEW: { label: '审核中', className: 'bg-indigo-500' },
    MAKING_MATERIALS: { label: '制作中', className: 'bg-teal-500' },
    PENDING_DELIVERY: { label: '待交付', className: 'bg-pink-500' },
    DELIVERED: { label: '已交付', className: 'bg-green-500' },
    APPROVED: { label: '出签', className: 'bg-emerald-500' },
    REJECTED: { label: '拒签', className: 'bg-red-500' },
    PARTIAL: { label: '部分出签', className: 'bg-amber-500' },
  }

  const config = statusConfig[status as keyof typeof statusConfig] || { label: status, className: 'bg-gray-500' }

  return (
    <span className={`px-2 py-1 text-xs font-medium text-white rounded-full ${config.className}`}>
      {config.label}
    </span>
  )
}
```

### 12.3 状态管理

**创建 `src/modules/erp/stores/order-store.ts`**：

```typescript
import { create } from 'zustand'
import { prisma } from '@shared/lib/prisma'

export interface Order {
  id: string
  orderNo: string
  customerName: string
  targetCountry: string
  visaType: string
  status: string
  amount: number
  createdAt: Date
  updatedAt: Date
}

interface OrderStore {
  orders: Order[]
  loading: boolean
  error: string | null
  fetchOrders: () => Promise<void>
  fetchOrderById: (id: string) => Promise<Order | null>
  createOrder: (data: any) => Promise<Order>
  updateOrder: (id: string, data: any) => Promise<Order>
  updateStatus: (id: string, status: string) => Promise<Order>
}

export const useOrderStore = create<OrderStore>((set, get) => ({
  orders: [],
  loading: false,
  error: null,

  fetchOrders: async () => {
    set({ loading: true, error: null })
    try {
      // 这里应该调用 API
      // 暂时使用 Prisma 直接查询
      const orders = await prisma.order.findMany({
        select: {
          id: true,
          orderNo: true,
          customerName: true,
          targetCountry: true,
          visaType: true,
          status: true,
          amount: true,
          createdAt: true,
          updatedAt: true,
        },
      })
      set({ orders, loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  fetchOrderById: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const order = await prisma.order.findUnique({ where: { id } })
      set({ loading: false })
      return order
    } catch (error: any) {
      set({ error: error.message, loading: false })
      return null
    }
  },

  createOrder: async (data: any) => {
    set({ loading: true, error: null })
    try {
      const order = await prisma.order.create({ data })
      set((state) => ({ orders: [...state.orders, order], loading: false }))
      return order
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  updateOrder: async (id: string, data: any) => {
    set({ loading: true, error: null })
    try {
      const order = await prisma.order.update({ where: { id }, data })
      set((state) => ({
        orders: state.orders.map(o => o.id === id ? order : o),
        loading: false
      }))
      return order
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  updateStatus: async (id: string, status: string) => {
    set({ loading: true, error: null })
    try {
      const order = await prisma.order.update({ where: { id }, data: { status } })
      set((state) => ({
        orders: state.orders.map(o => o.id === id ? order : o),
        loading: false
      }))
      return order
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },
}))
```

---

## 13. 工作流复刻

### 13.1 订单工作流

**100% 复刻现有 ERP 系统的订单工作流**：

#### 13.1.1 状态流转流程

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│ 待对接          │────>│ 已对接          │────>│ 资料收集        │
│ PENDING_CONNECTION │     │ CONNECTED      │     │ COLLECTING_DOCS │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                      │
                                      ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│ 出签            │<────│ 已交付          │<────│ 待交付          │
│ APPROVED        │     │ DELIVERED       │     │ PENDING_DELIVERY │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
      ^                         ^                         │
      │                         │                         │
      │                         │                         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│ 拒签            │<────│ 制作中          │<────│ 审核中          │
│ REJECTED        │     │ MAKING_MATERIALS │     │ UNDER_REVIEW    │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                      ^
                                      │
                                      │
                            ┌─────────────────┐
                            │                 │
                            │ 待审核          │
                            │ PENDING_REVIEW  │
                            │                 │
                            └─────────────────┘
```

#### 13.1.2 工作流规则

**1. 待对接 → 已对接**
- **触发角色**: 资料员 (DOC_COLLECTOR)、签证部管理员 (VISA_ADMIN)
- **触发动作**: 接单
- **业务逻辑**: 分配资料员，开始处理订单

**2. 已对接 → 资料收集**
- **触发角色**: 资料员、签证部管理员
- **触发动作**: 发送资料清单
- **业务逻辑**: 生成资料需求列表，通知客户上传资料

**3. 资料收集 → 待审核**
- **触发角色**: 资料员、签证部管理员
- **触发动作**: 提交审核
- **业务逻辑**: 资料员确认资料收集完成，等待操作员审核

**4. 待审核 → 审核中**
- **触发角色**: 操作员 (OPERATOR)、外包业务员 (OUTSOURCE)、签证部管理员
- **触发动作**: 操作员接单
- **业务逻辑**: 分配操作员，开始审核资料

**5. 审核中 → 资料收集**
- **触发角色**: 操作员、外包业务员、签证部管理员
- **触发动作**: 打回补充资料
- **业务逻辑**: 资料不符合要求，需要客户补充

**6. 审核中 → 制作中**
- **触发角色**: 操作员、外包业务员、签证部管理员
- **触发动作**: 确认资料达标，开始制作
- **业务逻辑**: 资料审核通过，开始制作签证材料

**7. 制作中 → 待交付**
- **触发角色**: 操作员、外包业务员、签证部管理员
- **触发动作**: 上传签证材料
- **业务逻辑**: 签证材料制作完成，等待资料员确认

**8. 待交付 → 制作中**
- **触发角色**: 资料员、签证部管理员
- **触发动作**: 打回修改材料
- **业务逻辑**: 签证材料需要修改

**9. 待交付 → 已交付**
- **触发角色**: 资料员、签证部管理员
- **触发动作**: 确认交付
- **业务逻辑**: 签证材料交付给客户

**10. 已交付 → 出签/拒签**
- **触发角色**: 操作员、资料员、客户 (CUSTOMER)、签证部管理员
- **触发动作**: 提交出签/拒签结果
- **业务逻辑**: 更新订单最终状态

### 13.2 权限工作流

**100% 复刻现有 ERP 系统的权限工作流**：

#### 13.2.1 角色权限矩阵

| 角色 | 订单管理 | 资料管理 | 操作员管理 | 数据分析 | 系统设置 |
|------|---------|---------|-----------|---------|----------|
| SUPER_ADMIN | ✅ | ✅ | ✅ | ✅ | ✅ |
| COMPANY_OWNER | ✅ | ✅ | ✅ | ✅ | ✅ |
| CS_ADMIN | ✅ | ❌ | ✅ | ✅ | ❌ |
| CUSTOMER_SERVICE | ✅ (自有) | ❌ | ❌ | ❌ | ❌ |
| VISA_ADMIN | ✅ | ✅ | ✅ | ✅ | ❌ |
| DOC_COLLECTOR | ✅ (自有) | ✅ | ❌ | ❌ | ❌ |
| OPERATOR | ✅ (自有) | ✅ | ❌ | ❌ | ❌ |
| OUTSOURCE | ✅ (自有) | ✅ | ❌ | ❌ | ❌ |
| CUSTOMER | ✅ (自有) | ✅ (上传) | ❌ | ❌ | ❌ |

#### 13.2.2 数据权限规则

- **SUPER_ADMIN**: 所有公司数据
- **COMPANY_OWNER**: 本公司所有数据
- **部门管理员**: 本部门所有数据
- **普通员工**: 自有订单数据
- **CUSTOMER**: 自有订单数据

### 13.3 业务操作工作流

**100% 复刻现有 ERP 系统的业务操作**：

#### 13.3.1 订单创建流程
1. 客服/管理员创建订单
2. 系统生成订单号
3. 订单进入「待对接」状态
4. 资料员从公共池接单
5. 订单进入「已对接」状态

#### 13.3.2 资料收集流程
1. 资料员发送资料清单
2. 客户上传资料
3. 资料员审核资料
4. 资料达标后提交审核
5. 订单进入「待审核」状态

#### 13.3.3 签证处理流程
1. 操作员接单
2. 审核资料
3. 资料不达标：打回补充
4. 资料达标：开始制作材料
5. 上传签证材料
6. 资料员确认交付
7. 客户反馈出签结果

---

## 14. 测试与验证

### 14.1 功能测试清单

**核心功能测试**：
- [ ] 用户认证：登录、注册、权限检查
- [ ] 订单管理：创建、查看、更新、删除
- [ ] 状态流转：所有状态间的合法流转
- [ ] 资料管理：上传、预览、审核、删除
- [ ] 实时通信：消息推送、状态变更通知
- [ ] 文件存储：OSS 上传、下载、删除
- [ ] 权限控制：不同角色的权限验证
- [ ] 数据隔离：多租户数据隔离

### 14.2 集成测试

**API 集成测试**：
```bash
# 运行测试
npm run test

# 测试覆盖率
npm run test:coverage
```

**端到端测试**：
1. **认证流程**：从登录到登出
2. **订单流程**：完整的订单生命周期
3. **资料流程**：资料上传到审核
4. **通信流程**：实时消息和通知

### 14.3 性能测试

**负载测试**：
- 模拟 100 并发用户
- 测试订单创建和查询性能
- 测试文件上传速度

**响应时间**：
- API 响应时间 < 500ms
- 页面加载时间 < 2s
- WebSocket 连接建立 < 1s

---

## 15. 部署与运维

### 15.1 部署架构

**生产环境架构**：
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│ 阿里云 ECS       │────>│ 阿里云 RDS MySQL │     │ 阿里云 OSS      │
│ (Next.js + Node.js) │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │
        │
        ▼
┌─────────────────┐
│                 │
│ 阿里云 SLB       │
│ (负载均衡)        │
└─────────────────┘
        │
        │
        ▼
┌─────────────────┐
│                 │
│ 阿里云 CDN       │
│                 │
└─────────────────┘
```

### 15.2 部署步骤

**步骤 1: 环境准备**
```bash
# 安装依赖
npm install

# 构建项目
npm run build
```

**步骤 2: 配置环境变量**
```bash
# .env.production
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://erp.hxvisa.com
PORT=3000
DATABASE_URL=mysql://user:password@rds-host:3306/database
# 其他配置...
```

**步骤 3: 启动服务**
```bash
# 使用 PM2 管理进程
npm install -g pm2
npm run start

# 或使用系统服务
# systemctl start erp.service
```

### 15.3 运维监控

**监控指标**：
- CPU 使用率
- 内存使用率
- 网络流量
- API 响应时间
- 错误率

**日志管理**：
- 应用日志：`logs/app.log`
- 错误日志：`logs/error.log`
- 访问日志：`logs/access.log`

**备份策略**：
- 数据库备份：每日自动备份
- 代码备份：Git 版本控制
- 文件备份：OSS 自动冗余

---

## 16. C端项目集成指南

### 16.1 集成目标与原则

**核心目标**：
- ✅ ERP系统作为C端项目的子功能模块
- ✅ 统一的账号体系和权限管理
- ✅ 无缝的用户体验转换
- ✅ 最小的代码侵入性
- ✅ 可独立维护和扩展

**设计原则**：
- **模块化**：ERP系统作为独立模块，不与C端核心逻辑耦合
- **共享认证**：统一的JWT认证，C端和B端共享用户身份
- **权限继承**：C端用户在ERP系统中拥有相应角色权限
- **数据隔离**：ERP数据与C端数据逻辑隔离但架构兼容

### 16.2 集成架构设计

```
┌─────────────────────────────────────────────────────────┐
│                     C端项目                               │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │   C端核心功能   │  │   ERP子功能模块             │  │
│  │   (原有业务)    │  │   (新集成)                 │  │
│  │                 │  │                             │  │
│  │ - 首页          │  │ - /admin/dashboard        │  │
│  │ - 产品页        │  │ - /admin/orders           │  │
│  │ - 用户中心      │  │ - /admin/pool             │  │
│  └─────────────────┘  └─────────────────────────────┘  │
├─────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────┐  │
│  │          共享服务层 (Shared Services)             │  │
│  ├───────────────────────────────────────────────────┤  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │  统一认证系统 (Unified Auth)                │  │  │
│  │  │  - JWT Token 管理                          │  │  │
│  │  │  - 用户身份映射                            │  │  │
│  │  │  - 角色权限转换                            │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │  共享数据库 (Shared DB)                     │  │  │
│  │  │  - C端用户表扩展 ERP用户信息               │  │  │
│  │  │  - 统一的Company关联                        │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │  共享工具库 (Shared Utils)                  │  │  │
│  │  │  - OSS 上传下载                            │  │  │
│  │  │  - Socket.io 通信                          │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 16.3 账号体系统一集成

#### 16.3.1 用户表扩展设计

**方案一：用户表合并（推荐）**

修改Prisma Schema，在原有C端用户表基础上扩展ERP所需字段：

```prisma
// 在原有 C端 User 模型基础上添加 ERP 字段
model User {
  // ========== C端原有字段 ==========
  id              String     @id @default(cuid())
  username        String     @unique @db.VarChar(50)
  email           String?    @db.VarChar(100)
  passwordHash    String     @db.Text @map("password_hash")
  avatar          String?    @db.Text
  
  // ========== ERP 新增字段 ==========
  companyId       String?    @map("company_id")
  departmentId    String?    @map("department_id")
  phone           String?    @db.VarChar(20)
  realName        String?    @db.VarChar(50) @map("real_name")
  role            UserRole?  // ERP角色，为空时表示仅C端用户
  erpStatus       UserStatus @default(INACTIVE) @map("erp_status")
  lastLoginAt     DateTime?  @map("last_login_at")
  
  // ========== ERP 关联关系 ==========
  company         Company?   @relation(fields: [companyId], references: [id])
  department      Department? @relation(fields: [departmentId], references: [id])
  erpOrders       Order[]    @relation("OrderCustomer")
  collectorOrders Order[]    @relation("OrderCollector")
  operatorOrders  Order[]    @relation("OrderOperator")
  createdOrders   Order[]    @relation("OrderCreator")
  
  // ========== 原有时间字段 ==========
  createdAt       DateTime   @default(now()) @map("created_at")
  updatedAt       DateTime   @updatedAt @map("updated_at")
  
  @@index([companyId])
  @@index([companyId, role])
  @@index([departmentId])
  @@map("users")
}
```

**方案二：独立ERP用户表（数据关联）**

如果C端用户表不方便修改，采用独立ERP用户表与C端用户关联：

```prisma
// C端用户表（保持不变）
model CUser {
  id       String  @id @default(cuid())
  username String  @unique
  // ... 其他C端字段
}

// ERP用户表（与C端用户关联）
model ErpUser {
  id              String     @id @default(cuid())
  cUserId         String     @unique @map("c_user_id")
  companyId       String     @map("company_id")
  departmentId    String?    @map("department_id")
  phone           String     @db.VarChar(20)
  realName        String     @db.VarChar(50) @map("real_name")
  role            UserRole
  status          UserStatus @default(ACTIVE)
  lastLoginAt     DateTime?  @map("last_login_at")
  createdAt       DateTime   @default(now()) @map("created_at")
  updatedAt       DateTime   @updatedAt @map("updated_at")
  
  // 关联
  cUser           CUser      @relation(fields: [cUserId], references: [id])
  company         Company    @relation(fields: [companyId], references: [id])
  department      Department? @relation(fields: [departmentId], references: [id])
  
  @@map("erp_users")
}
```

#### 16.3.2 统一认证中间件

创建统一的认证中间件，同时支持C端和ERP用户：

```typescript
// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { getUnifiedUser } from '@shared/lib/unified-auth'

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  
  // ERP路由检查
  const isErpRoute = path.startsWith('/admin') || path.startsWith('/api/orders') || path.startsWith('/api/documents')
  
  // C端公开路由
  const cPublicRoutes = ['/', '/login', '/register', '/products']
  const isCPublicRoute = cPublicRoutes.some(r => path.startsWith(r))
  
  if (isErpRoute) {
    // ERP路由认证
    const user = await getUnifiedUser(request)
    if (!user) {
      return NextResponse.redirect(new URL('/erp-login', request.url))
    }
    
    // 检查ERP用户状态和权限
    if (!user.erpRole || user.erpStatus !== 'ACTIVE') {
      return NextResponse.json({ error: '无权访问ERP系统' }, { status: 403 })
    }
    
    // 注入ERP用户信息
    const response = NextResponse.next()
    response.headers.set('x-erp-user-id', user.id)
    response.headers.set('x-erp-company-id', user.companyId)
    response.headers.set('x-erp-role', user.erpRole)
    return response
  }
  
  // C端路由处理（保持原有逻辑）
  if (!isCPublicRoute) {
    // C端原有认证逻辑...
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/orders/:path*',
    '/api/documents/:path*',
    // 其他需要保护的路由...
  ],
}
```

#### 16.3.3 统一认证服务

创建统一认证服务，处理C端和ERP用户的身份转换：

```typescript
// src/shared/lib/unified-auth.ts
import { cookies } from 'next/headers'
import { prisma } from './prisma'
import { generateTokens, verifyJWT } from './auth'

export interface UnifiedUser {
  id: string
  username: string
  email?: string
  // C端用户信息
  cUserId: string
  // ERP用户信息
  companyId?: string
  departmentId?: string
  erpRole?: string
  erpStatus?: string
  realName?: string
}

export async function getUnifiedUser(request: Request): Promise<UnifiedUser | null> {
  const token = request.headers.get('cookie')?.match(/access_token=([^;]+)/)?.[1]
  if (!token) return null

  const payload = await verifyJWT(token)
  if (!payload) return null

  // 查询统一用户信息
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: {
      company: true,
      department: true,
    },
  })

  if (!user) return null

  return {
    id: user.id,
    username: user.username,
    email: user.email || undefined,
    cUserId: user.id,
    companyId: user.companyId || undefined,
    departmentId: user.departmentId || undefined,
    erpRole: user.role || undefined,
    erpStatus: user.erpStatus || undefined,
    realName: user.realName || undefined,
  }
}

export async function upgradeToErpUser(
  userId: string,
  companyId: string,
  role: string,
  realName: string
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      companyId,
      role,
      realName,
      erpStatus: 'ACTIVE',
    },
  })
}

export async function loginWithUnifiedUser(user: UnifiedUser) {
  const tokens = await generateTokens({
    userId: user.id,
    companyId: user.companyId || '',
    role: user.erpRole || 'CUSTOMER',
    departmentId: user.departmentId,
  })

  // 设置Cookie
  const cookieStore = cookies()
  cookieStore.set('access_token', tokens.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60,
    path: '/',
  })
  cookieStore.set('refresh_token', tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  })

  return tokens
}
```

### 16.4 权限体系统一集成

#### 16.4.1 角色映射规则

定义C端用户到ERP角色的映射规则：

```typescript
// src/shared/lib/role-mapping.ts
export interface RoleMapping {
  cRole: string      // C端角色
  erpRole: string    // ERP角色
  autoUpgrade: boolean  // 是否自动升级为ERP用户
}

export const ROLE_MAPPINGS: RoleMapping[] = [
  {
    cRole: 'CUSTOMER',
    erpRole: 'CUSTOMER',
    autoUpgrade: true,
  },
  {
    cRole: 'STAFF',
    erpRole: 'CUSTOMER_SERVICE',
    autoUpgrade: false,
  },
  {
    cRole: 'MANAGER',
    erpRole: 'CS_ADMIN',
    autoUpgrade: false,
  },
  {
    cRole: 'ADMIN',
    erpRole: 'COMPANY_OWNER',
    autoUpgrade: false,
  },
]

export function getErpRoleForCRole(cRole: string): string | null {
  const mapping = ROLE_MAPPINGS.find(m => m.cRole === cRole)
  return mapping?.erpRole || null
}

export function shouldAutoUpgrade(cRole: string): boolean {
  const mapping = ROLE_MAPPINGS.find(m => m.cRole === cRole)
  return mapping?.autoUpgrade || false
}
```

#### 16.4.2 统一权限检查

创建统一的权限检查服务：

```typescript
// src/shared/lib/unified-rbac.ts
import { checkPermission } from './rbac'
import { UnifiedUser } from './unified-auth'

export function checkUnifiedPermission(
  user: UnifiedUser,
  erpRoles: string[],
  cRoles?: string[]
): boolean {
  // 先检查ERP权限
  if (user.erpRole && erpRoles.includes(user.erpRole)) {
    return true
  }
  
  // 再检查C端权限
  if (cRoles) {
    // C端权限检查逻辑...
  }
  
  return false
}

export function hasErpAccess(user: UnifiedUser): boolean {
  return !!(user.erpRole && user.erpStatus === 'ACTIVE' && user.companyId)
}

export function canAccessErpRoute(
  user: UnifiedUser | null,
  route: string
): boolean {
  if (!user || !hasErpAccess(user)) {
    return false
  }
  
  const rolePermissions: Record<string, string[]> = {
    '/admin/dashboard': ['SUPER_ADMIN', 'COMPANY_OWNER', 'CS_ADMIN', 'VISA_ADMIN'],
    '/admin/orders': ['SUPER_ADMIN', 'COMPANY_OWNER', 'CS_ADMIN', 'CUSTOMER_SERVICE', 
                     'VISA_ADMIN', 'DOC_COLLECTOR', 'OPERATOR', 'OUTSOURCE'],
    '/admin/pool': ['VISA_ADMIN', 'DOC_COLLECTOR', 'OPERATOR', 'OUTSOURCE'],
    '/admin/workspace': ['CUSTOMER_SERVICE', 'DOC_COLLECTOR', 'OPERATOR', 'OUTSOURCE'],
    '/admin/templates': ['COMPANY_OWNER', 'VISA_ADMIN', 'DOC_COLLECTOR'],
    '/admin/team': ['SUPER_ADMIN', 'COMPANY_OWNER', 'CS_ADMIN', 'VISA_ADMIN'],
    '/admin/analytics': ['SUPER_ADMIN', 'COMPANY_OWNER', 'CS_ADMIN', 'VISA_ADMIN'],
    '/admin/settings': ['SUPER_ADMIN', 'COMPANY_OWNER'],
  }
  
  for (const [path, roles] of Object.entries(rolePermissions)) {
    if (route.startsWith(path) && roles.includes(user.erpRole!)) {
      return true
    }
  }
  
  return false
}
```

### 16.5 代码目录结构集成

#### 16.5.1 推荐的集成目录结构

```
c-project/
├── src/
│   ├── app/
│   │   ├── (c-public)/         # C端公开页面（原有）
│   │   │   ├── page.tsx
│   │   │   ├── products/
│   │   │   └── layout.tsx
│   │   ├── (c-private)/        # C端私有页面（原有）
│   │   │   ├── dashboard/
│   │   │   ├── profile/
│   │   │   └── layout.tsx
│   │   ├── admin/              # ERP管理端（新增）
│   │   │   ├── dashboard/
│   │   │   ├── orders/
│   │   │   ├── pool/
│   │   │   ├── workspace/
│   │   │   ├── templates/
│   │   │   ├── team/
│   │   │   ├── analytics/
│   │   │   ├── settings/
│   │   │   ├── error.tsx
│   │   │   ├── loading.tsx
│   │   │   └── layout.tsx
│   │   ├── api/
│   │   │   ├── c/               # C端API（原有）
│   │   │   │   ├── products/
│   │   │   │   └── users/
│   │   │   └── erp/             # ERP API（新增，保持与原ERP相同结构）
│   │   │       ├── auth/
│   │   │       ├── orders/
│   │   │       ├── documents/
│   │   │       ├── notifications/
│   │   │       └── ...
│   │   └── layout.tsx           # 根布局
│   ├── modules/
│   │   ├── c/                   # C端业务模块（原有）
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── lib/
│   │   └── erp/                 # ERP业务模块（新增，完整复制）
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── lib/
│   │       ├── stores/
│   │       └── types/
│   ├── shared/
│   │   ├── components/
│   │   │   ├── c/               # C端共享组件（原有）
│   │   │   └── erp/             # ERP共享组件（新增）
│   │   ├── hooks/
│   │   │   ├── c/
│   │   │   └── erp/
│   │   ├── lib/
│   │   │   ├── c/               # C端共享库（原有）
│   │   │   ├── erp/             # ERP共享库（新增）
│   │   │   ├── unified-auth.ts  # 统一认证（新增）
│   │   │   └── unified-rbac.ts  # 统一权限（新增）
│   │   ├── stores/
│   │   │   ├── c/
│   │   │   └── erp/
│   │   ├── styles/
│   │   │   ├── c/
│   │   │   └── erp/
│   │   └── types/
│   │       ├── c/
│   │       └── erp/
│   └── middleware.ts            # 统一中间件（修改）
├── prisma/
│   └── schema.prisma            # 统一Schema（修改）
└── package.json                 # 合并依赖
```

### 16.6 导航与用户体验集成

#### 16.6.1 统一导航组件

创建支持C端和ERP切换的导航组件：

```tsx
// src/shared/components/unified-navbar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUnifiedUser } from '@shared/hooks/use-unified-user'

export function UnifiedNavbar() {
  const pathname = usePathname()
  const { user, hasErpAccess } = useUnifiedUser()
  
  const isErpRoute = pathname.startsWith('/admin')
  
  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="flex items-center justify-between">
        {/* 品牌Logo */}
        <Link href={isErpRoute ? '/admin/dashboard' : '/'} className="text-xl font-bold">
          {isErpRoute ? '华夏签证 ERP' : '华夏签证'}
        </Link>
        
        {/* 导航链接 */}
        <div className="flex space-x-4">
          {isErpRoute ? (
            <>
              <Link href="/admin/dashboard">仪表盘</Link>
              <Link href="/admin/orders">订单</Link>
              <Link href="/">返回C端</Link>
            </>
          ) : (
            <>
              <Link href="/products">产品</Link>
              <Link href="/about">关于</Link>
              {hasErpAccess && <Link href="/admin/dashboard">ERP系统</Link>}
            </>
          )}
        </div>
        
        {/* 用户信息 */}
        <div className="flex items-center space-x-4">
          <span>{user?.username}</span>
          <Link href="/logout">退出</Link>
        </div>
      </div>
    </nav>
  )
}
```

#### 16.6.2 角色切换入口

为有权限的用户提供进入ERP系统的入口：

```tsx
// src/shared/components/erp-entry-point.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUnifiedUser, upgradeToErpUser } from '@shared/hooks/use-unified-user'

export function ErpEntryPoint() {
  const { user, hasErpAccess } = useUnifiedUser()
  const router = useRouter()
  const [isUpgrading, setIsUpgrading] = useState(false)

  if (!user) return null

  const handleEnterErp = async () => {
    if (hasErpAccess) {
      router.push('/admin/dashboard')
      return
    }

    // 自动升级（如果允许）
    try {
      setIsUpgrading(true)
      await upgradeToErpUser({
        userId: user.id,
        companyId: 'default-company-id', // 根据业务逻辑确定
        role: 'CUSTOMER_SERVICE',
        realName: user.realName || user.username,
      })
      router.push('/admin/dashboard')
    } catch (error) {
      console.error('升级失败:', error)
    } finally {
      setIsUpgrading(false)
    }
  }

  return (
    <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg">
      <h3 className="text-lg font-bold mb-2">ERP管理系统</h3>
      <p className="text-sm mb-4">
        {hasErpAccess 
          ? '您已拥有ERP系统访问权限' 
          : '您可以升级为ERP用户，使用管理功能'}
      </p>
      <button
        onClick={handleEnterErp}
        disabled={isUpgrading}
        className="px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-gray-100 disabled:opacity-50"
      >
        {isUpgrading ? '正在升级...' : hasErpAccess ? '进入ERP系统' : '立即升级'}
      </button>
    </div>
  )
}
```

### 16.7 数据兼容性处理

#### 16.7.1 数据库迁移策略

创建安全的数据库迁移，确保C端数据不受影响：

```typescript
// prisma/migrations/xxxxxx_add_erp_fields/migration.sql
-- 添加 ERP 相关字段到现有 users 表
ALTER TABLE users 
ADD COLUMN company_id VARCHAR(191),
ADD COLUMN department_id VARCHAR(191),
ADD COLUMN phone VARCHAR(20),
ADD COLUMN real_name VARCHAR(50),
ADD COLUMN role ENUM('SUPER_ADMIN', 'COMPANY_OWNER', 'CS_ADMIN', 'CUSTOMER_SERVICE', 'VISA_ADMIN', 'DOC_COLLECTOR', 'OPERATOR', 'OUTSOURCE', 'CUSTOMER'),
ADD COLUMN erp_status ENUM('ACTIVE', 'INACTIVE', 'LOCKED') DEFAULT 'INACTIVE',
ADD COLUMN last_login_at DATETIME(3),
ADD INDEX idx_company_id (company_id),
ADD INDEX idx_role (role);

-- 创建 ERP 相关表
-- Company 表
CREATE TABLE erp_companies (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  logo TEXT,
  phone VARCHAR(20),
  email VARCHAR(100),
  address TEXT,
  status ENUM('ACTIVE', 'SUSPENDED', 'DELETED') DEFAULT 'ACTIVE',
  settings JSON,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL
);

-- Department 表
CREATE TABLE erp_departments (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  company_id VARCHAR(191) NOT NULL,
  name VARCHAR(50) NOT NULL,
  code VARCHAR(30) NOT NULL,
  parent_id VARCHAR(191),
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL,
  FOREIGN KEY (company_id) REFERENCES erp_companies(id),
  FOREIGN KEY (parent_id) REFERENCES erp_departments(id),
  UNIQUE KEY (company_id, code)
);

-- 其他 ERP 表...
```

### 16.8 集成验证清单

**集成前检查**：
- [ ] C端项目依赖已备份
- [ ] 数据库已备份
- [ ] 测试环境已准备
- [ ] 回滚方案已制定

**集成中验证**：
- [ ] 用户表扩展成功
- [ ] 统一认证正常工作
- [ ] ERP API 路由可访问
- [ ] 权限检查正常执行
- [ ] C端原有功能不受影响

**集成后测试**：
- [ ] C端用户可以正常登录
- [ ] ERP用户可以正常进入管理系统
- [ ] 角色切换流畅
- [ ] 数据隔离有效
- [ ] 性能指标达标

### 16.9 常见集成问题与解决方案

**问题1：用户表已有数据，字段冲突**
**解决方案**：使用增量迁移，新字段设为可空，逐步迁移数据

**问题2：C端和ERP样式冲突**
**解决方案**：ERP样式使用独立的CSS类前缀，或采用CSS Modules

**问题3：Cookie作用域问题**
**解决方案**：确保两个系统使用相同的domain和path设置

**问题4：路由冲突**
**解决方案**：ERP路由使用独立前缀如/admin，避免与C端路由冲突

---

## 附录

### A. 技术文档速查表

| 文档 | 路径 | 用途 |
|------|------|------|
| 数据库设计 | `prisma/schema.prisma` | 数据模型定义 |
| 认证系统 | `src/shared/lib/auth.ts` | JWT 认证实现 |
| 权限系统 | `src/shared/lib/rbac.ts` | RBAC 权限控制 |
| 状态机 | `src/modules/erp/lib/transition.ts` | 订单状态流转 |
| 文件存储 | `src/shared/lib/oss.ts` | 阿里云 OSS 集成 |
| 实时通信 | `src/shared/lib/socket.ts` | Socket.io 实现 |

### B. 开发命令速查表

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 生产构建 |
| `npm start` | 启动生产服务器 |
| `npm run db:push` | 同步数据库 Schema |
| `npm run db:migrate` | 创建数据库迁移 |
| `npm run db:seed` | 运行种子数据 |
| `npm run db:studio` | 打开数据库可视化 |
| `npm run lint` | 代码检查 |
| `npm run type-check` | TypeScript 类型检查 |
| `npm run test` | 运行单元测试 |

### C. 项目成功标志

- ✅ 所有核心功能实现
- ✅ 工作流 100% 复刻
- ✅ 性能指标达标
- ✅ 安全漏洞修复
- ✅ 代码质量合格
- ✅ 文档完整

---

**文档结束**

> **记住**：按照此指南从0开始构建，您可以100%复刻现有B端ERP系统的所有功能和工作流！
