# 华夏签证 ERP 系统 - 全知全能开发指南

> **文档版本**: V1.0
> **生成日期**: 2026-04-04
> **项目名称**: 华夏签证 ERP 系统
> **最后更新**: 2026-04-04

---

## 目录

1. [项目概述](#1-项目概述)
2. [技术栈详解](#2-技术栈详解)
3. [项目结构与组织](#3-项目结构与组织)
4. [数据库设计与 Prisma 配置](#4-数据库设计与-prisma-配置)
5. [环境配置与启动指南](#5-环境配置与启动指南)
6. [API 接口设计](#6-api-接口设计)
7. [前端架构与组件](#7-前端架构与组件)
8. [状态机引擎设计](#8-状态机引擎设计)
9. [权限与鉴权体系](#9-权限与鉴权体系)
10. [文件存储方案](#10-文件存储方案)
11. [实时通信方案](#11-实时通信方案)
12. [UI/UX 设计规范](#12-uiux-设计规范)
13. [开发规范与最佳实践](#13-开发规范与最佳实践)
14. [部署与运维](#14-部署与运维)
15. [常见问题与解决方案](#15-常见问题与解决方案)

---

## 1. 项目概述

### 1.1 产品定位

**华夏签证**是一个面向 C 端用户的综合签证服务平台，包含 ERP 后台管理子系统。

- **品牌**: 华夏签证
- **Slogan**: 专业签证，一站搞定
- **部署**: 阿里云 ECS + 阿里云 RDS MySQL + 阿里云 OSS
- **技术栈**: Next.js 15.5.14 (App Router) + React 19.2.4 + Prisma ORM + MySQL + Tailwind CSS + Zustand + Socket.io

### 1.2 核心价值

| 价值 | 说明 |
|------|------|
| 一站式服务 | 签证办理 + 行程规划 + 翻译 + 文档生成 |
| 智能工具 | AI 签证评估、智能表格填写、自动化流程 |
| 价格透明 | 费用公开，无隐藏收费 |
| 进度可视 | 用户随时查看订单状态和审核意见 |
| 安全保障 | 资料加密、隐私保护、完整操作日志 |

### 1.3 核心功能模块

| 模块 | 说明 | 优先级 | 状态 |
|------|------|:-----:|:----:|
| IAM | 登录注册、JWT 鉴权、RBAC 9级权限 | P0 | ✅ |
| Tenant | 公司入驻、配置、数据隔离 | P0 | ✅ |
| Order | 订单 CRUD、状态机流转 | P0 | ✅ |
| Workflow | 状态机引擎、流转校验、事件触发 | P0 | ✅ |
| Document | 文件上传/预览/下载/审核/归档 | P0 | ✅ |
| Notification | 站内信（WebSocket）、系统通知 | P0 | ✅ |
| Dashboard | 统计图表、绩效排名、异常监控 | P1 | ✅ |
| Org | 部门管理、员工管理、角色管理 | P1 | ✅ |
| Customer Portal | 客户移动端界面 | P0 | ✅ |
| Visa Templates | 签证资料清单模板库 | P2 | ✅ |

### 1.4 用户角色体系（9级）

| 级别 | 角色代码 | 角色名称 | 数据范围 | 所属部门 |
|:---:|---------|---------|---------|---------|
| 1 | `SUPER_ADMIN` | 超级管理员 | 全网站数据 | 系统 |
| 2 | `COMPANY_OWNER` | 公司负责人 | 公司全部数据 | 公司负责人 |
| 3 | `CS_ADMIN` | 客服部管理员 | 客服部门数据 | 客服部 |
| 4 | `CUSTOMER_SERVICE` | 客服 | 自有订单 | 客服部 |
| 5 | `VISA_ADMIN` | 签证部管理员 | 签证部门数据 | 签证部 |
| 6 | `DOC_COLLECTOR` | 资料员 | 自有订单 | 签证部 |
| 7 | `OPERATOR` | 签证操作员 | 自有订单 | 签证部 |
| 8 | `OUTSOURCE` | 外包业务员 | 自有订单 | 公司负责人 |
| 9 | `CUSTOMER` | 普通用户 | 自有订单 | 客户 |

### 1.5 订单状态机

```typescript
enum OrderStatus {
  PENDING_CONNECTION  = 'PENDING_CONNECTION',   // 待对接
  CONNECTED           = 'CONNECTED',             // 已对接
  COLLECTING_DOCS     = 'COLLECTING_DOCS',       // 资料收集中
  PENDING_REVIEW      = 'PENDING_REVIEW',        // 待审核
  UNDER_REVIEW        = 'UNDER_REVIEW',          // 资料审核中
  MAKING_MATERIALS    = 'MAKING_MATERIALS',      // 材料制作中
  PENDING_DELIVERY    = 'PENDING_DELIVERY',      // 待交付
  DELIVERED           = 'DELIVERED',             // 已交付
  APPROVED            = 'APPROVED',              // 出签
  REJECTED            = 'REJECTED',              // 拒签
  PARTIAL             = 'PARTIAL',               // 部分出签（多人订单特有）
}
```

---

## 2. 技术栈详解

### 2.1 核心技术栈

| 层 | 技术 | 版本 | 选型理由 |
|----|------|------|----------|
| 全栈框架 | Next.js (App Router) | 15.5.14 | SSR/RSC/API Routes 一体化 |
| 前端 UI | React | 19.2.4 | 成熟生态，RSC 性能优势 |
| ORM | Prisma | 5.22.0 | 类型安全，MySQL 完善支持 |
| 数据库 | MySQL | 8.0+ | 托管服务，自动备份，高可用 |
| 样式 | Tailwind CSS | 3.4.16 | 原子化 CSS + 液态玻璃组件系统 |
| 状态管理 | Zustand | 5.0.2 | 轻量，TypeScript 友好 |
| 实时通信 | Socket.io | 4.8.1 | 自动重连，房间管理 |
| 文件存储 | 阿里云 OSS | 6.23.0 | 海量存储，CDN 加速 |
| 认证 | JWT (jose) | 5.9.6 | 无状态，适合分布式 |

### 2.2 开发工具

| 工具 | 版本 | 用途 |
|------|------|------|
| TypeScript | 5.7.2 | 全栈类型安全 |
| ESLint | 8.57.1 | 代码质量检查 |
| Prettier | 3.x | 代码格式化 |
| Vitest | 4.1.0 | 单元测试 |
| tsx | 4.19.2 | TypeScript 运行时 |

### 2.3 package.json 关键依赖

```json
{
  "dependencies": {
    "@prisma/client": "^5.22.0",
    "ali-oss": "^6.23.0",
    "bcryptjs": "^2.4.3",
    "dotenv": "^17.3.1",
    "jose": "^5.9.6",
    "lru-cache": "^11.0.1",
    "next": "^15.5.14",
    "react": "^19.2.4",
    "react-dom": "^19.2.4",
    "recharts": "^3.8.0",
    "socket.io": "^4.8.1",
    "socket.io-client": "^4.8.1",
    "xlsx": "^0.18.5",
    "zod": "^3.24.1",
    "zustand": "^5.0.2"
  }
}
```

### 2.4 npm scripts

```json
{
  "scripts": {
    "dev": "tsx server.ts",              // 启动 Custom Server (含 Socket.io)
    "dev:next": "next dev",              // 启动纯 Next.js (无 Socket.io)
    "build": "next build",               // 生产构建
    "start": "NODE_ENV=production tsx server.ts",  // 生产启动
    "lint": "next lint",                 // ESLint 检查
    "type-check": "tsc --noEmit",       // TypeScript 类型检查
    "test": "vitest run",                 // 运行单元测试
    "postinstall": "prisma generate",    // 生成 Prisma Client
    "db:push": "prisma db push",         // 数据库 schema 同步
    "db:migrate": "prisma migrate dev",   // 创建并应用迁移
    "db:seed": "tsx prisma/seed.ts",      // 运行种子数据
    "db:studio": "prisma studio"          // 打开数据库可视化
  }
}
```

---

## 3. 项目结构与组织

### 3.1 完整目录结构

```
ERP/
├── prisma/
│   ├── schema.prisma              # 数据库 Schema
│   ├── migrations/                # 数据库迁移文件
│   │   ├── 0000_init_full_schema/
│   │   ├── 20260320_m1_schema_fixes/
│   │   ├── 20260321_add_m5_applicant_and_financials/
│   │   ├── 20260329_add_m4_chat_tables/
│   │   └── 20260402_add_m7_tool_modules/
│   └── seed.ts                    # 种子数据
├── src/
│   ├── app/
│   │   ├── (auth)/                 # 认证页面组（路由组）
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── reset-password/page.tsx
│   │   ├── admin/                  # 管理端页面
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── orders/page.tsx
│   │   │   ├── orders/[id]/page.tsx
│   │   │   ├── pool/page.tsx
│   │   │   ├── workspace/page.tsx
│   │   │   ├── templates/page.tsx
│   │   │   ├── team/page.tsx
│   │   │   ├── analytics/page.tsx
│   │   │   ├── settings/page.tsx
│   │   │   └── layout.tsx
│   │   ├── customer/               # 客户端页面
│   │   │   ├── orders/page.tsx
│   │   │   ├── orders/[id]/page.tsx
│   │   │   ├── notifications/page.tsx
│   │   │   ├── profile/page.tsx
│   │   │   └── layout.tsx
│   │   ├── portal/                 # 门户页面（M7新增）
│   │   │   ├── page.tsx
│   │   │   ├── layout.tsx
│   │   │   ├── orders/page.tsx
│   │   │   ├── notifications/page.tsx
│   │   │   ├── profile/page.tsx
│   │   │   └── tools/
│   │   │       ├── news/page.tsx
│   │   │       ├── itinerary/page.tsx
│   │   │       ├── form-helper/page.tsx
│   │   │       ├── assessment/page.tsx
│   │   │       ├── translator/page.tsx
│   │   │       └── documents/page.tsx
│   │   ├── api/                   # API 路由
│   │   │   ├── auth/
│   │   │   │   ├── login/route.ts
│   │   │   │   ├── register/route.ts
│   │   │   │   ├── refresh/route.ts
│   │   │   │   ├── logout/route.ts
│   │   │   │   ├── me/route.ts
│   │   │   │   ├── reset-password/route.ts
│   │   │   │   └── change-password/route.ts
│   │   │   ├── orders/
│   │   │   │   ├── route.ts
│   │   │   │   ├── [id]/route.ts
│   │   │   │   ├── [id]/status/route.ts
│   │   │   │   ├── [id]/claim/route.ts
│   │   │   │   ├── [id]/cancel/route.ts
│   │   │   │   ├── [id]/reassign/route.ts
│   │   │   │   ├── [id]/submit/route.ts
│   │   │   │   ├── [id]/check/route.ts
│   │   │   │   ├── [id]/documents/route.ts
│   │   │   │   ├── [id]/materials/route.ts
│   │   │   │   ├── pool/route.ts
│   │   │   │   └── batch/route.ts
│   │   │   ├── applicants/
│   │   │   │   └── [id]/route.ts
│   │   │   ├── documents/
│   │   │   │   ├── [id]/route.ts
│   │   │   │   ├── files/[id]/route.ts
│   │   │   │   ├── upload/route.ts
│   │   │   │   ├── presign/route.ts
│   │   │   │   └── confirm/route.ts
│   │   │   ├── notifications/
│   │   │   │   ├── route.ts
│   │   │   │   ├── [id]/route.ts
│   │   │   │   └── mark-all-read/route.ts
│   │   │   ├── chat/
│   │   │   │   ├── rooms/route.ts
│   │   │   │   └── rooms/[orderId]/
│   │   │   │       ├── route.ts
│   │   │   │       ├── messages/route.ts
│   │   │   │       └── read/route.ts
│   │   │   ├── analytics/
│   │   │   │   ├── overview/route.ts
│   │   │   │   ├── trend/route.ts
│   │   │   │   ├── workload/route.ts
│   │   │   │   └── export/route.ts
│   │   │   ├── users/route.ts
│   │   │   ├── departments/route.ts
│   │   │   ├── companies/me/route.ts
│   │   │   ├── templates/
│   │   │   │   ├── route.ts
│   │   │   │   ├── [id]/route.ts
│   │   │   │   └── apply/route.ts
│   │   │   ├── order-templates/route.ts
│   │   │   ├── form-templates/route.ts
│   │   │   ├── form-records/route.ts
│   │   │   ├── news/route.ts
│   │   │   ├── itineraries/route.ts
│   │   │   ├── visa-assessments/route.ts
│   │   │   ├── translations/route.ts
│   │   │   ├── doc-helper/route.ts
│   │   │   ├── sms/
│   │   │   │   ├── send/route.ts
│   │   │   │   └── templates/route.ts
│   │   │   ├── shop/
│   │   │   │   ├── sync/route.ts
│   │   │   │   └── webhook/route.ts
│   │   │   ├── cron/
│   │   │   │   ├── appointment-remind/route.ts
│   │   │   │   └── timeout-check/route.ts
│   │   │   └── health/route.ts
│   │   ├── page.tsx                 # 首页（C 端入口）
│   │   ├── layout.tsx
│   │   ├── not-found.tsx
│   │   ├── global-error.tsx
│   │   └── 403/page.tsx
│   ├── components/
│   │   ├── portal/                # 门户组件（M7新增）
│   │   │   ├── app-navbar.tsx
│   │   │   ├── app-footer.tsx
│   │   │   ├── app-bottom-tab.tsx
│   │   │   ├── hero-section.tsx
│   │   │   ├── destination-cards.tsx
│   │   │   ├── tool-showcase.tsx
│   │   │   ├── value-props.tsx
│   │   │   ├── testimonials.tsx
│   │   │   ├── cta-section.tsx
│   │   │   ├── stats-section.tsx
│   │   │   ├── tool-page-header.tsx
│   │   │   ├── tool-empty-state.tsx
│   │   │   ├── how-it-works.tsx
│   │   │   └── tool-skeleton.tsx
│   ├── modules/
│   │   └── erp/                  # ERP 业务模块
│   │       ├── components/
│   │       │   ├── analytics/
│   │       │   │   ├── stat-card.tsx
│   │       │   │   ├── trend-chart.tsx
│   │       │   │   └── ranking-table.tsx
│   │       │   ├── chat/
│   │       │   │   ├── chat-panel.tsx
│   │       │   │   ├── chat-message-list.tsx
│   │       │   │   ├── chat-message.tsx
│   │       │   │   ├── chat-input.tsx
│   │       │   │   └── chat-room-list.tsx
│   │       │   ├── documents/
│   │       │   │   ├── document-panel.tsx
│   │       │   │   ├── material-panel.tsx
│   │       │   │   └── customer-upload.tsx
│   │       │   ├── layout/
│   │       │   │   ├── sidebar.tsx
│   │       │   │   └── topbar.tsx
│   │       │   └── orders/
│   │       │       ├── status-badge.tsx
│   │       │       ├── status-timeline.tsx
│   │       │       ├── applicant-card.tsx
│   │       │       ├── applicant-form-item.tsx
│   │       │       └── material-checklist.tsx
│   │       ├── hooks/
│   │       │   ├── use-chat.ts
│   │       │   └── use-orders.ts
│   │       ├── lib/
│   │       │   ├── __tests__/
│   │       │   │   ├── chat-system.test.ts
│   │       │   │   ├── desensitize.test.ts
│   │       │   │   └── transition.test.ts
│   │       │   ├── transition.ts
│   │       │   ├── events.ts
│   │       │   ├── chat-system.ts
│   │       │   └── desensitize.ts
│   │       ├── stores/
│   │       │   ├── chat-store.ts
│   │       │   └── order-store.ts
│   │       └── types/
│   │           ├── order.ts
│   │           └── chat.ts
│   ├── shared/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   │   ├── button.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── select.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── badge.tsx
│   │   │   │   ├── modal.tsx
│   │   │   │   ├── toast.tsx
│   │   │   │   ├── file-preview.tsx
│   │   │   │   ├── glass-card.tsx
│   │   │   │   ├── camera-capture.tsx
│   │   │   │   └── dynamic-bg.tsx
│   │   │   └── layout/
│   │   │       ├── notification-bell.tsx
│   │   │       └── page-header.tsx
│   │   ├── hooks/
│   │   │   ├── use-auth.ts
│   │   │   ├── use-notifications.ts
│   │   │   └── use-socket-client.ts
│   │   ├── lib/
│   │   │   ├── __tests__/
│   │   │   │   ├── rbac.test.ts
│   │   │   │   └── utils.test.ts
│   │   │   ├── prisma.ts
│   │   │   ├── auth.ts
│   │   │   ├── api-client.ts
│   │   │   ├── rbac.ts
│   │   │   ├── rbac-enhanced.ts
│   │   │   ├── socket.ts
│   │   │   ├── oss.ts
│   │   │   ├── cache.ts
│   │   │   ├── logger.ts
│   │   │   ├── rate-limit.ts
│   │   │   ├── notification-icons.ts
│   │   │   ├── file-types.ts
│   │   │   └── utils.ts
│   │   ├── stores/
│   │   │   ├── auth-store.ts
│   │   │   └── notification-store.ts
│   │   ├── styles/
│   │   │   ├── globals.css
│   │   │   └── glassmorphism.css
│   │   ├── types/
│   │   │   ├── user.ts
│   │   │   ├── api.ts
│   │   │   └── socket-events.ts
│   └── middleware.ts
├── public/
├── scripts/
│   ├── db-backup.sh
│   ├── deploy.sh
│   └── import-excel.ts
├── deploy/
│   └── nginx-erp.conf
├── docs/
│   ├── 01-PRD.md
│   ├── 02-architecture.md
│   ├── 03-project-status.md
│   ├── 04-dev-standards.md
│   ├── 05-M5-dev-plan.md
│   ├── 06-M3-dev-plan.md
│   ├── 07-M4-dev-plan.md
│   ├── 08-architecture-redesign.md
│   ├── 09-c-end-transformation-plan.md
│   ├── m1-fix-plan.md
│   ├── workflow.md
│   └── README.md
├── .trae/
│   ├── documents/
│   └── specs/
├── .env.example
├── .env.production
├── .eslintrc.json
├── .prettierrc
├── .gitignore
├── DEPLOY-SPEC.md
├── DEPLOY_GUIDE.md
├── DEPLOY.sh
├── ecosystem.config.json
├── deploy-bt.py
├── deploy-ssh.py
├── next.config.js
├── package.json
├── package-lock.json
├── postcss.config.js
├── server.ts
├── tailwind.config.ts
├── tsconfig.json
└── vitest.config.ts
```

### 3.2 路径别名配置

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@shared/*": ["./src/shared/*"],
      "@erp/*": ["./src/modules/erp/*"]
    }
  }
}
```

---

## 4. 数据库设计与 Prisma 配置

### 4.1 Prisma Schema 结构

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

### 4.2 数据库表清单

| Prisma Model | 实际表名 | 说明 |
|-------------|----------|------|
| `Company` | `erp_companies` | 租户/公司 |
| `Department` | `erp_departments` | 部门 |
| `User` | `erp_users` | 用户（9级角色） |
| `Order` | `erp_orders` | 签证订单 |
| `Applicant` | `erp_applicants` | 申请人（多人订单） |
| `DocumentRequirement` | `erp_document_requirements` | 资料需求清单 |
| `DocumentFile` | `erp_document_files` | 资料文件 |
| `VisaMaterial` | `erp_visa_materials` | 签证材料 |
| `OrderLog` | `erp_order_logs` | 操作日志 |
| `Notification` | `erp_notifications` | 站内通知 |
| `VisaTemplate` | `erp_visa_templates` | 签证模板库 |
| `ChatRoom` | `erp_chat_rooms` | 聊天房间 |
| `ChatMessage` | `erp_chat_messages` | 聊天消息 |
| `ChatRead` | `erp_chat_reads` | 已读回执 |
| `NewsArticle` | `erp_news_articles` | 签证资讯 |
| `Itinerary` | `erp_itineraries` | 行程 |
| `FormTemplate` | `erp_form_templates` | 申请表模板 |
| `FormRecord` | `erp_form_records` | 申请表记录 |
| `VisaAssessment` | `erp_visa_assessments` | 签证评估 |
| `TranslationRequest` | `erp_translation_requests` | 翻译请求 |
| `DocHelperTemplate` | `erp_doc_helper_templates` | 证明文件模板 |
| `GeneratedDocument` | `erp_generated_documents` | 生成的文档 |

### 4.3 数据库命名规范（强制）

**表名规范：**
- 统一 `erp_` 前缀
- 复数形式
- 小写蛇形

```prisma
model User {
  // ... 字段定义 ...
  
  @@map("erp_users")      // ← 实际表名必须带 erp_ 前缀
}
```

**字段名规范：**
- 数据库字段名用 snake_case
- Prisma 中用 `@map` 映射
- 外键加 `_id` 后缀
- 时间字段统一 `created_at` / `updated_at`

```prisma
model Order {
  id              String    @id @default(cuid())
  companyId       String    @map("company_id")           // ← 外键带 _id
  orderNo         String    @unique @map("order_no")     // ← snake_case
  customerName    String    @map("customer_name")        // ← camelCase → snake_case
  createdAt       DateTime  @default(now()) @map("created_at")  // ← 必须有
  updatedAt       DateTime  @updatedAt @map("updated_at")       // ← 必须有
  
  @@map("erp_orders")
}
```

### 4.4 Prisma Client 单例

```typescript
// src/shared/lib/prisma.ts

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

---

## 5. 环境配置与启动指南

### 5.1 环境变量配置

```bash
# .env.local

# 应用
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3002
PORT=3002

# 数据库 (阿里云 RDS MySQL)
DB_PASS_ENCODED="your-password-encoded"
DATABASE_URL="mysql://user:${DB_PASS_ENCODED}@host:3306/database"

# JWT 认证（64位随机字符串）
JWT_SECRET="change-me-to-a-random-64-char-string"
JWT_REFRESH_SECRET="change-me-to-another-random-64-char-string"

# 阿里云 OSS
OSS_REGION="oss-cn-beijing"
OSS_ENDPOINT="https://oss-cn-beijing.aliyuncs.com"
OSS_ACCESS_KEY_ID="your-access-key-id"
OSS_ACCESS_KEY_SECRET="your-access-key-secret"
OSS_BUCKET="your-bucket-name"

# SMS (暂未启用)
SMS_ENABLED=false
```

### 5.2 快速启动步骤

```bash
# 1. 克隆项目
git clone https://github.com/Laogui-666/ERP.git
cd ERP

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入实际值

# 4. 数据库初始化
npm run db:push  # 或 npm run db:migrate
npm run db:seed  # 可选，填充测试数据

# 5. 启动开发服务器
npm run dev

# 访问应用
# http://localhost:3002
```

### 5.3 服务器启动配置

```typescript
// server.ts

// 加载环境变量（必须在其他 import 之前）
import { config } from 'dotenv'
config({ path: '.env.local' })

// 修复 Next.js 15 + tsx 的 AsyncLocalStorage 兼容性问题
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

  // 初始化 Socket.io（复用同一 HTTP 服务器）
  initSocketServer(server)

  server.listen(port, hostname, () => {
    process.stdout.write(`🚀 Server ready on http://${hostname}:${port}\n`)
    process.stdout.write(`🔌 Socket.io enabled\n`)
  })
})
```

---

## 6. API 接口设计

### 6.1 统一响应格式

```typescript
// 成功
{
  "success": true,
  "data": { ... },
  "meta": {                    // 可选
    "total": 100,
    "page": 1,
    "pageSize": 20
  }
}

// 失败
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "订单不存在"
}
```

### 6.2 HTTP 状态码使用

| 状态码 | 场景 |
|--------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 参数校验失败 / 业务错误 |
| 401 | 未认证（Token 无效/过期） |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 409 | 冲突（如重复创建） |
| 422 | 参数格式正确但业务不允许 |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |
| 501 | 功能未实现（SMS 预留） |

### 6.3 核心 API 接口清单

#### 认证模块
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/auth/login` | 登录，返回 JWT | 公开 |
| POST | `/api/auth/register` | 公司入驻注册 | 公开 |
| POST | `/api/auth/refresh` | 刷新 Access Token | 已登录 |
| POST | `/api/auth/logout` | 登录，清除 Cookie | 已登录 |
| GET | `/api/auth/me` | 获取当前用户信息 | 已登录 |
| POST | `/api/auth/reset-password` | 客户首次登录重置密码 | 公开 |
| POST | `/api/auth/change-password` | 修改密码 | 已登录 |

#### 订单模块
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/orders` | 订单列表（按角色过滤） | Lv2-9 |
| POST | `/api/orders` | 创建订单 | Lv2-4 |
| GET | `/api/orders/[id]` | 订单详情 | 有权限的用户 |
| PATCH | `/api/orders/[id]` | 更新订单信息 | Lv3-7 |
| POST | `/api/orders/[id]/claim` | 接单（从公共池领取） | Lv5-8 |
| POST | `/api/orders/[id]/status` | 状态流转 | 有权限的用户 |
| POST | `/api/orders/[id]/cancel` | 取消订单 | Lv2-3,5 |
| POST | `/api/orders/[id]/reassign` | 转单 | Lv2,3,5 |
| POST | `/api/orders/[id]/submit` | 客户确认提交 | Lv9 |
| GET | `/api/orders/pool` | 公共池订单 | Lv5-8 |
| POST | `/api/orders/batch` | 批量操作 | Lv2-5 |

#### 资料模块
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/orders/[id]/documents` | 资料清单（含文件列表） | 有权限的用户 |
| POST | `/api/orders/[id]/documents` | 批量添加资料需求项 | Lv5-7 |
| PATCH | `/api/documents/[id]` | 审核资料 | Lv5-7 |
| DELETE | `/api/documents/[id]` | 删除资料需求 | Lv2,5-7 |
| POST | `/api/documents/upload` | 上传文件到 OSS | 有权限的用户 |
| POST | `/api/documents/presign` | 获取预签名上传 URL | Lv9 |
| POST | `/api/documents/confirm` | 确认文件已上传 | Lv9 |
| DELETE | `/api/documents/files/[id]` | 删除单个文件 | Lv2,5-7,9 |

#### 签证材料模块
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/orders/[id]/materials` | 签证材料列表 | Lv5-7, Lv9 |
| POST | `/api/orders/[id]/materials` | 上传签证材料 | Lv5,7 |

#### 通知模块
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/notifications` | 通知列表（含 unreadCount） | 已登录 |
| PATCH | `/api/notifications/[id]` | 标记单条已读 | 接收者 |
| POST | `/api/notifications/mark-all-read` | 全部已读 | 已登录 |

#### 聊天模块
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/chat/rooms` | 聊天房间列表 | 有权限 |
| GET | `/api/chat/rooms/[orderId]` | 聊天房间详情 | 有权限 |
| GET | `/api/chat/rooms/[orderId]/messages` | 聊天消息列表 | 有权限 |
| POST | `/api/chat/rooms/[orderId]/messages` | 发送消息 | 有权限 |
| POST | `/api/chat/rooms/[orderId]/read` | 标记已读 | 有权限 |

#### 数据分析模块
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/analytics/overview` | 核心指标概览 | Lv1-3,5 |
| GET | `/api/analytics/trend` | 月度趋势数据 | Lv1-3,5 |
| GET | `/api/analytics/workload` | 人员负荷/绩效排行 | Lv1-3,5 |
| GET | `/api/analytics/export` | Excel 导出 | Lv1-3,5 |

### 6.4 API Route 模板

```typescript
// src/app/api/orders/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { checkPermission } from '@/lib/rbac'
import { z } from 'zod'

// 查询参数校验
const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.nativeEnum(OrderStatus).optional(),
  search: z.string().max(100).optional(),
})

export async function GET(request: NextRequest) {
  // 1. 认证
  const user = await getAuthUser(request)

  // 2. 参数校验
  const params = querySchema.parse(
    Object.fromEntries(request.nextUrl.searchParams)
  )

  // 3. 构建查询（自动注入 companyId）
  const where: Prisma.OrderWhereInput = {
    companyId: user.companyId,
    ...(params.status && { status: params.status }),
    ...(params.search && {
      OR: [
        { orderNo: { contains: params.search } },
        { customerName: { contains: params.search } },
      ],
    }),
  }

  // 4. 按角色过滤
  if (user.role === 'CUSTOMER_SERVICE') {
    where.createdBy = user.id
  } else if (user.role === 'DOC_COLLECTOR') {
    where.collectorId = user.id
  }

  // 5. 查询
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
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
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    }),
    prisma.order.count({ where }),
  ])

  // 6. 脱敏（如需要）
  const data = user.role === 'OUTSOURCE'
    ? orders.map(desensitizeOrder)
    : orders

  return NextResponse.json({
    success: true,
    data,
    meta: {
      total,
      page: params.page,
      pageSize: params.pageSize,
    },
  })
}
```

---

## 7. 前端架构与组件

### 7.1 Server Components vs Client Components

| 场景 | 选择 | 理由 |
|------|------|------|
| 数据获取 + 展示 | Server Component | 减少客户端 JS |
| 需要交互（点击/输入） | Client Component (`'use client'`) | 需要事件处理 |
| 需要浏览器 API | Client Component | 服务端无 DOM |
| 需要实时数据 | Client Component | Socket.io |

**规则**：默认使用 Server Component，只有在需要交互时才添加 `'use client'`。

### 7.2 组件开发规范

```typescript
// src/components/orders/order-card.tsx

'use client' // 仅在需要客户端交互时添加

// 1. 第三方 imports
import { useState } from 'react'
import { format } from 'date-fns'

// 2. 内部 imports
import { StatusBadge } from '@/components/orders/status-badge'
import { GlassCard } from '@/components/layout/glass-card'

// 3. 类型定义
interface OrderCardProps {
  order: Order
  onClaim?: (orderId: string) => void
}

// 4. 组件
export function OrderCard({ order, onClaim }: OrderCardProps) {
  // hooks
  const [isExpanded, setIsExpanded] = useState(false)

  // handlers
  const handleClaim = () => {
    onClaim?.(order.id)
  }

  // render
  return (
    <GlassCard className="p-5 animate-fade-in-up">
      {/* 内容 */}
    </GlassCard>
  )
}
```

### 7.3 核心组件列表

#### UI 组件
- [GlassCard](file:///workspace/ERP/src/shared/ui/glass-card.tsx) - 液态玻璃卡片（4级强度）
- [Button](file:///workspace/ERP/src/shared/ui/button.tsx) - 按钮（5种变体）
- [Input](file:///workspace/ERP/src/shared/ui/input.tsx) - 输入框
- [Badge](file:///workspace/ERP/src/shared/ui/badge.tsx) - 状态标签（6种变体）
- [Modal](file:///workspace/ERP/src/shared/ui/modal.tsx) - 弹窗
- [Toast](file:///workspace/ERP/src/shared/ui/toast.tsx) - 通知提示
- [FilePreview](file:///workspace/ERP/src/shared/ui/file-preview.tsx) - 文件预览
- [DynamicBackground](file:///workspace/ERP/src/shared/ui/dynamic-bg.tsx) - 动态背景

#### 布局组件
- [Sidebar](file:///workspace/ERP/src/modules/erp/components/layout/sidebar.tsx) - 管理端侧边栏
- [Topbar](file:///workspace/ERP/src/modules/erp/components/layout/topbar.tsx) - 管理端顶栏
- [PageHeader](file:///workspace/ERP/src/shared/components/layout/page-header.tsx) - 页面头部
- [NotificationBell](file:///workspace/ERP/src/shared/components/layout/notification-bell.tsx) - 通知铃铛

#### 业务组件
- [StatusBadge](file:///workspace/ERP/src/modules/erp/components/orders/status-badge.tsx) - 订单状态标签
- [StatusTimeline](file:///workspace/ERP/src/modules/erp/components/orders/status-timeline.tsx) - 状态时间线
- [DocumentPanel](file:///workspace/ERP/src/modules/erp/components/documents/document-panel.tsx) - 资料面板
- [MaterialPanel](file:///workspace/ERP/src/modules/erp/components/documents/material-panel.tsx) - 签证材料面板
- [ChatPanel](file:///workspace/ERP/src/modules/erp/components/chat/chat-panel.tsx) - 聊天面板

---

## 8. 状态机引擎设计

### 8.1 TransitionService 核心设计

```typescript
// src/modules/erp/lib/transition.ts

interface TransitionRule {
  from: OrderStatus
  to: OrderStatus
  allowedRoles: UserRole[]
  action: string
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

export const transitionService = new TransitionService()
```

### 8.2 状态流转规则

| 当前状态 | 目标状态 | 触发角色 | 触发动作 |
|----------|----------|----------|----------|
| `PENDING_CONNECTION` | `CONNECTED` | DOC_COLLECTOR / VISA_ADMIN | 资料员接单 |
| `CONNECTED` | `COLLECTING_DOCS` | DOC_COLLECTOR / VISA_ADMIN | 发送资料清单给客户 |
| `COLLECTING_DOCS` | `PENDING_REVIEW` | DOC_COLLECTOR / VISA_ADMIN | 资料员提交审核 |
| `PENDING_REVIEW` | `UNDER_REVIEW` | OPERATOR / OUTSOURCE / VISA_ADMIN | 操作员接单 |
| `UNDER_REVIEW` | `COLLECTING_DOCS` | OPERATOR / OUTSOURCE / VISA_ADMIN | 操作员打回（需补充） |
| `UNDER_REVIEW` | `MAKING_MATERIALS` | OPERATOR / OUTSOURCE / VISA_ADMIN | 操作员确认资料达标 |
| `MAKING_MATERIALS` | `PENDING_DELIVERY` | OPERATOR / OUTSOURCE / VISA_ADMIN | 操作员上传成品 |
| `PENDING_DELIVERY` | `MAKING_MATERIALS` | DOC_COLLECTOR / VISA_ADMIN | 资料员打回修改 |
| `PENDING_DELIVERY` | `DELIVERED` | DOC_COLLECTOR / VISA_ADMIN | 资料员确认交付 |
| `DELIVERED` | `APPROVED` | OPERATOR / DOC_COLLECTOR / CUSTOMER / VISA_ADMIN | 提交出签结果 |
| `DELIVERED` | `REJECTED` | OPERATOR / DOC_COLLECTOR / CUSTOMER / VISA_ADMIN | 提交拒签结果 |

### 8.3 事件驱动通知

```typescript
// src/modules/erp/lib/events.ts

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

---

## 9. 权限与鉴权体系

### 9.1 JWT 双 Token 方案

```
Access Token (15min)     Refresh Token (7d)
├── userId               ├── userId
├── companyId            ├── companyId
├── role                 └── tokenVersion
├── departmentId
└── exp

存储: HttpOnly Cookie (Secure, SameSite=Strict)
```

### 9.2 中间件鉴权流程

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

### 9.3 RBAC 权限矩阵

```typescript
// src/shared/lib/rbac.ts

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

### 9.4 数据脱敏规则（OUTSOURCE 角色）

| 字段 | 脱敏规则 | 示例 |
|------|----------|------|
| 手机号 | 保留前3后4 | `138****5678` |
| 护照号 | 保留前2后3 | `EA***567` |
| 身份证号 | 保留前3后4 | `110***1234` |
| 邮箱 | 保留首字母+@域名 | `z***@gmail.com` |
| 银行卡 | 完全隐藏 | `****` |

```typescript
// src/modules/erp/lib/desensitize.ts

export function desensitizePhone(phone: string): string {
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

export function desensitizePassport(passport: string): string {
  if (passport.length <= 5) return '***'
  return passport.slice(0, 2) + '***' + passport.slice(-3)
}

export function desensitizeOrder(order: Order, role: UserRole): Order {
  if (role !== 'OUTSOURCE') return order
  return {
    ...order,
    customerPhone: desensitizePhone(order.customerPhone),
    passportNo: order.passportNo ? desensitizePassport(order.passportNo) : null,
    customerEmail: order.customerEmail
      ? order.customerEmail.replace(/^(.)[^@]/, '$1***@')
      : null,
  }
}
```

---

## 10. 文件存储方案

### 10.1 阿里云 OSS 集成

```typescript
// src/shared/lib/oss.ts

import OSS from 'ali-oss'

const ossClient = new OSS({
  region: process.env.OSS_REGION,
  accessKeyId: process.env.OSS_ACCESS_KEY_ID,
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
  bucket: process.env.OSS_BUCKET,
})

export const oss = {
  // 上传 Buffer/Stream 到 OSS
  async uploadFile(key: string, file: Buffer | File) {
    const result = await ossClient.put(key, file)
    return result.url
  },

  // 客户端直传预签名 URL
  async generatePresignedPutUrl(key: string, expires = 3600) {
    const url = await ossClient.signatureUrl(key, {
      expires,
      method: 'PUT',
    })
    return url
  },

  // 带过期的签名下载 URL
  async getSignedUrl(key: string, expires = 900) {
    return await ossClient.signatureUrl(key, { expires })
  },

  // 强制下载的签名 URL
  async getDownloadUrl(key: string, expires = 900) {
    return await ossClient.signatureUrl(key, {
      expires,
      response: { 'content-disposition': 'attachment' },
    })
  },

  // 删除文件
  async deleteFile(key: string) {
    await ossClient.delete(key)
  },

  // 批量删除
  async deleteFiles(keys: string[]) {
    await ossClient.deleteMulti(keys)
  },

  // 按规范路径构建存储 key
  buildOssKey(companyId: string, orderId: string, type: 'documents' | 'materials', filename: string) {
    return `companies/${companyId}/orders/${orderId}/${type}/${Date.now()}_${filename}`
  },
}
```

### 10.2 OSS Bucket 结构

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

### 10.3 上传方案：预签名直传

```
客户端 ──[1.请求上传]──► Next.js API
              │
              ▼ 返回预签名URL
客户端 ──[2.直传文件]──► 阿里云 OSS
              │
              ▼ 上传完成回调
客户端 ──[3.确认上传]──► Next.js API ──► 写入数据库
```

### 10.4 文件类型限制

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

## 11. 实时通信方案

### 11.1 Socket.io 架构

```typescript
// src/shared/lib/socket.ts

import { Server } from 'socket.io'
import type { Server as HttpServer } from 'http'

export function initSocketServer(server: HttpServer) {
  const io = new Server(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL,
      credentials: true,
    },
  })

  // 认证中间件
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.cookie?.match(/access_token=([^;]+)/)?.[1]
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

// 发送通知给用户
export function emitToUser(userId: string, event: string, data: any) {
  const io = getIo()
  io.to(`user:${userId}`).emit(event, data)
}

// 发送通知给公司
export function emitToCompany(companyId: string, event: string, data: any) {
  const io = getIo()
  io.to(`company:${companyId}`).emit(event, data)
}
```

### 11.2 Socket 房间设计

| 房间名 | 说明 |
|--------|------|
| `company:{companyId}` | 公司级广播 |
| `user:{userId}` | 用户级推送 |
| `order:{orderId}` | 订单级协同 |
| `department:{departmentId}` | 部门级通知 |

### 11.3 前端 Socket 客户端

```typescript
// src/shared/hooks/use-socket-client.ts

'use client'

import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from './use-auth'

export function useSocketClient() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return

    const newSocket = io({
      transports: ['websocket', 'polling'],
      reconnection: true,
    })

    newSocket.on('connect', () => {
      console.log('Socket connected')
    })

    newSocket.on('notification', (data) => {
      // 处理通知
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [user])

  return socket
}
```

---

## 12. UI/UX 设计规范

### 12.1 设计风格：液态玻璃 + 莫兰迪冷色系

**核心设计语言**：
- **液态玻璃 (Liquid Glass)**：半透明毛玻璃组件系统，含 4 级强度（light / medium / heavy / accent）
- **莫兰迪冷色系**：低饱和度、柔和的冷色调
- **动态背景**：桌面端 4 个浮动渐变光球 + 微光网格线 + 鼠标跟随光晕
- **弹簧阻尼动效**：所有交互使用物理弹簧缓动
- **响应式双模式**：桌面端管理端布局，移动端客户端布局

### 12.2 CSS 变量体系

```css
/* globals.css :root */
:root {
  /* 莫兰迪冷色系 */
  --color-primary: #7C8DA6;          /* 主色 - 灰蓝 */
  --color-primary-dark: #5A6B82;     /* 深沉蓝灰 */
  --color-primary-light: #A8B5C7;    /* 浅灰蓝 */
  --color-secondary: #8FA3A6;        /* 青灰 */
  --color-accent: #9B8EC4;           /* 紫灰 */

  /* 状态色 */
  --color-success: #7FA87A;          /* 莫兰迪绿灰 */
  --color-warning: #C4A97D;          /* 莫兰迪暖黄 */
  --color-error: #B87C7C;            /* 莫兰迪红灰 */
  --color-info: #7CA8B8;             /* 莫兰迪蓝 */

  /* 背景 */
  --color-bg-from: #1A1F2E;          /* 深蓝黑 */
  --color-bg-to: #252B3B;            /* 深蓝灰 */

  /* 文字层级 */
  --color-text-primary: #E8ECF1;     /* 冷白 */
  --color-text-secondary: #8E99A8;   /* 灰蓝 */
  --color-text-placeholder: #5A6478; /* 深灰蓝 */

  /* 液态玻璃核心变量 */
  --glass-bg: rgba(255, 255, 255, 0.06);
  --glass-bg-hover: rgba(255, 255, 255, 0.10);
  --glass-border: rgba(255, 255, 255, 0.08);
  --glass-blur: 20px;

  /* 缓动曲线 */
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-damping: cubic-bezier(0.25, 0.46, 0.45, 0.94);
  --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);

  /* 圆角系统 */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16