# 华夏签证 ERP 系统 - 集成功能与设置完整指南

> **文档版本**: V1.0
> **生成日期**: 2026-04-04
> **项目名称**: 华夏签证 ERP 系统
> **最后更新**: 2026-04-04
> **文档目的**: 即使记忆全部丢失，也能准确复刻 ERP 系统的集成功能和设置

---

## 目录

1. [集成概述](#1-集成概述)
2. [核心配置文件清单](#2-核心配置文件清单)
3. [环境变量配置](#3-环境变量配置)
4. [数据库集成配置](#4-数据库集成配置)
5. [服务器启动配置](#5-服务器启动配置)
6. [Next.js 配置](#6-nextjs-配置)
7. [TypeScript 路径别名配置](#7-typescript-路径别名配置)
8. [项目依赖与脚本](#8-项目依赖与脚本)
9. [核心集成功能清单](#9-核心集成功能清单)
10. [快速启动指南](#10-快速启动指南)
11. [常见集成问题与解决方案](#11-常见集成问题与解决方案)

---

## 1. 集成概述

### 1.1 系统简介
华夏签证 ERP 是一个基于 Next.js 15 的全栈签证服务管理系统，包含以下核心集成：
- 数据库：MySQL + Prisma ORM
- 文件存储：阿里云 OSS
- 实时通信：Socket.io
- 认证：JWT 双 Token 机制
- 权限：9级 RBAC 权限体系
- 状态机：订单工作流引擎

### 1.2 技术栈集成概览

| 集成组件 | 技术方案 | 版本 | 用途 |
|---------|---------|------|------|
| 全栈框架 | Next.js (App Router) | 15.5.14 | SSR/RSC/API Routes 一体化 |
| ORM | Prisma | 5.22.0 | 数据库操作 |
| 数据库 | MySQL | 8.0+ | 数据持久化 |
| 文件存储 | 阿里云 OSS | 6.23.0 | 文件上传下载 |
| 实时通信 | Socket.io | 4.8.1 | WebSocket 通信 |
| 状态管理 | Zustand | 5.0.2 | 前端状态管理 |
| 样式 | Tailwind CSS | 3.4.16 | 原子化 CSS |

---

## 2. 核心配置文件清单

### 2.1 必须配置的文件

| 文件路径 | 说明 | 优先级 |
|---------|------|--------|
| `.env.local` | 环境变量配置 | P0 |
| `prisma/schema.prisma` | 数据库 Schema | P0 |
| `server.ts` | 自定义服务器（含 Socket.io） | P0 |
| `package.json` | 依赖和脚本 | P0 |
| `tsconfig.json` | TypeScript 配置 | P1 |
| `next.config.js` | Next.js 配置 | P1 |
| `tailwind.config.ts` | Tailwind CSS 配置 | P1 |

### 2.2 关键配置文件位置

```
/workspace/ERP/
├── .env.local                    # ← 环境变量（必须创建）
├── .env.example                  # ← 环境变量模板
├── server.ts                     # ← 自定义服务器启动
├── package.json                  # ← 项目依赖
├── tsconfig.json                 # ← TypeScript 配置
├── next.config.js                # ← Next.js 配置
├── tailwind.config.ts            # ← Tailwind 配置
├── prisma/
│   └── schema.prisma             # ← 数据库 Schema
└── src/
    └── shared/
        └── lib/
            ├── prisma.ts         # ← Prisma Client 单例
            ├── socket.ts         # ← Socket.io 服务端
            ├── oss.ts            # ← 阿里云 OSS 集成
            └── auth.ts           # ← JWT 认证
```

---

## 3. 环境变量配置

### 3.1 完整环境变量清单

复制 `.env.example` 为 `.env.local` 并填入以下配置：

```bash
# .env.local

# ========== 应用基础配置 ==========
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3002
PORT=3002

# ========== 数据库配置（阿里云 RDS MySQL） ==========
# 注意：密码中的 @ 符号需要 URL 编码
DB_PASS_ENCODED="your-password-encoded"
DATABASE_URL="mysql://user:${DB_PASS_ENCODED}@host:3306/database"

# ========== JWT 认证配置 ==========
# 生成 64 位随机字符串：openssl rand -hex 32
JWT_SECRET="change-me-to-a-random-64-char-string"
JWT_REFRESH_SECRET="change-me-to-another-random-64-char-string"

# ========== 阿里云 OSS 配置 ==========
OSS_REGION="oss-cn-beijing"
OSS_ENDPOINT="https://oss-cn-beijing.aliyuncs.com"
OSS_ACCESS_KEY_ID="your-access-key-id"
OSS_ACCESS_KEY_SECRET="your-access-key-secret"
OSS_BUCKET="your-bucket-name"

# ========== SMS 配置（暂未启用） ==========
SMS_ENABLED=false
```

### 3.2 环境变量详细说明

#### 3.2.1 数据库配置
- **`DATABASE_URL`**: MySQL 连接字符串
- 密码中的 `@` 必须 URL 编码为 `%40`
- 示例：`mysql://root:myp%40ssword@localhost:3306/visa_erp`

#### 3.2.2 JWT 密钥生成
```bash
# 生成 64 位随机密钥
openssl rand -hex 32
```

#### 3.2.3 阿里云 OSS 配置
- **`OSS_REGION`**: 区域，如 `oss-cn-beijing`、`oss-cn-hangzhou`
- **`OSS_ENDPOINT`**: 完整端点 URL
- **`OSS_ACCESS_KEY_ID`**: 阿里云 Access Key ID
- **`OSS_ACCESS_KEY_SECRET`**: 阿里云 Access Key Secret
- **`OSS_BUCKET`**: Bucket 名称

---

## 4. 数据库集成配置

### 4.1 Prisma Schema 配置

**文件位置**: `/workspace/ERP/prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

// 核心枚举定义
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

// 数据库表命名规范：erp_ 前缀 + 复数蛇形
model Company {
  id        String   @id @default(cuid())
  name      String   @db.VarChar(100)
  status    CompanyStatus @default(ACTIVE)
  settings  Json?
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  
  @@map("erp_companies")
}

// ... 其他模型定义见完整 schema.prisma
```

### 4.2 Prisma Client 单例配置

**文件位置**: `/workspace/ERP/src/shared/lib/prisma.ts`

```typescript
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

### 4.3 数据库初始化命令

```bash
# 同步 Schema 到数据库（不创建迁移）
npm run db:push

# 创建并应用迁移
npm run db:migrate

# 生成 Prisma Client
npm run postinstall

# 打开数据库可视化工具
npm run db:studio

# 运行种子数据
npm run db:seed
```

---

## 5. 服务器启动配置

### 5.1 自定义服务器（含 Socket.io）

**文件位置**: `/workspace/ERP/server.ts`

```typescript
// ========== 第一步：加载环境变量（必须在最前面） ==========
import { config } from 'dotenv'
config({ path: '.env.local' })

// ========== 第二步：修复 Next.js 15 + tsx 兼容性问题 ==========
if (typeof globalThis.AsyncLocalStorage === 'undefined') {
  const { AsyncLocalStorage } = require('async_hooks')
  ;(globalThis as any).AsyncLocalStorage = AsyncLocalStorage
}

// ========== 第三步：导入核心模块 ==========
import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { initSocketServer } from '@shared/lib/socket'

// ========== 第四步：配置服务器 ==========
const dev = process.env.NODE_ENV !== 'production'
const hostname = '0.0.0.0'
const port = parseInt(process.env.PORT ?? '3002', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// ========== 第五步：启动服务器 ==========
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

### 5.2 Socket.io 集成配置

**文件位置**: `/workspace/ERP/src/shared/lib/socket.ts`

```typescript
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

    socket.on('disconnect', () => {
      // 处理断开连接
    })
  })

  return io
}
```

---

## 6. Next.js 配置

### 6.1 next.config.js 配置

**文件位置**: `/workspace/ERP/next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // 远程图片配置（阿里云 OSS）
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'hxvisa001.oss-cn-beijing.aliyuncs.com',
      },
      {
        protocol: 'https',
        hostname: '**.aliyuncs.com',
      },
    ],
  },
  
  // 外部包配置
  serverExternalPackages: ['@prisma/client'],
}

module.exports = nextConfig
```

---

## 7. TypeScript 路径别名配置

### 7.1 tsconfig.json 配置

**文件位置**: `/workspace/ERP/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    
    // ========== 路径别名配置（关键） ==========
    "paths": {
      "@/*": ["./src/*"],
      "@shared/*": ["./src/shared/*"],
      "@erp/*": ["./src/modules/erp/*"]
    },
    
    // 严格模式配置
    "forceConsistentCasingInFileNames": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 7.2 路径别名使用示例

```typescript
// 使用别名前
import { prisma } from '../../../shared/lib/prisma'
import { Button } from '../../../shared/components/ui/button'

// 使用别名后
import { prisma } from '@shared/lib/prisma'
import { Button } from '@shared/components/ui/button'
import { OrderCard } from '@erp/components/orders/order-card'
```

---

## 8. 项目依赖与脚本

### 8.1 package.json 核心配置

**文件位置**: `/workspace/ERP/package.json`

```json
{
  "name": "visa-erp",
  "version": "0.1.0",
  "private": true,
  
  "scripts": {
    "dev": "tsx server.ts",              // ← 启动 Custom Server (含 Socket.io)
    "dev:next": "next dev",              // ← 启动纯 Next.js (无 Socket.io)
    "build": "next build",               // ← 生产构建
    "start": "NODE_ENV=production tsx server.ts",  // ← 生产启动
    "lint": "next lint",                 // ← ESLint 检查
    "type-check": "tsc --noEmit",       // ← TypeScript 类型检查
    "test": "vitest run",                 // ← 运行单元测试
    "postinstall": "prisma generate",    // ← 生成 Prisma Client
    "db:push": "prisma db push",         // ← 数据库 schema 同步
    "db:migrate": "prisma migrate dev",   // ← 创建并应用迁移
    "db:seed": "tsx prisma/seed.ts",      // ← 运行种子数据
    "db:studio": "prisma studio"          // ← 打开数据库可视化
  },
  
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

### 8.2 关键依赖说明

| 依赖包 | 版本 | 用途 |
|--------|------|------|
| `next` | 15.5.14 | Next.js 框架 |
| `react` | 19.2.4 | React UI 库 |
| `@prisma/client` | 5.22.0 | Prisma ORM 客户端 |
| `ali-oss` | 6.23.0 | 阿里云 OSS SDK |
| `socket.io` | 4.8.1 | Socket.io 服务端 |
| `socket.io-client` | 4.8.1 | Socket.io 客户端 |
| `jose` | 5.9.6 | JWT 认证 |
| `zustand` | 5.0.2 | 状态管理 |
| `zod` | 3.24.1 | 参数校验 |

---

## 9. 核心集成功能清单

### 9.1 数据库集成（Prisma + MySQL）

**关键文件**:
- `prisma/schema.prisma` - 数据模型定义
- `src/shared/lib/prisma.ts` - Prisma Client 单例

**核心功能**:
- 19 个数据表模型
- 多租户数据隔离（companyId）
- 类型安全的数据库操作

### 9.2 文件存储集成（阿里云 OSS）

**关键文件**: `src/shared/lib/oss.ts`

**核心功能**:
- 文件上传/下载
- 预签名直传
- 签名 URL 访问
- 批量删除

**OSS 路径结构**:
```
companies/{companyId}/
├── orders/{orderId}/
│   ├── documents/     # 客户上传的资料
│   └── materials/     # 操作员制作的签证材料
└── templates/         # 公司模板附件
```

### 9.3 实时通信集成（Socket.io）

**关键文件**: `src/shared/lib/socket.ts`

**核心功能**:
- 房间管理（公司级、用户级、订单级）
- 实时消息推送
- 认证中间件

**房间命名**:
- `company:{companyId}` - 公司级广播
- `user:{userId}` - 用户级推送
- `order:{orderId}` - 订单级协同

### 9.4 认证集成（JWT 双 Token）

**关键文件**: `src/shared/lib/auth.ts`

**核心功能**:
- Access Token（15分钟）
- Refresh Token（7天）
- HttpOnly Cookie 存储
- 自动刷新机制

### 9.5 权限集成（9级 RBAC）

**关键文件**: `src/shared/lib/rbac.ts`

**角色体系**:
1. SUPER_ADMIN - 超级管理员
2. COMPANY_OWNER - 公司负责人
3. CS_ADMIN - 客服部管理员
4. CUSTOMER_SERVICE - 客服
5. VISA_ADMIN - 签证部管理员
6. DOC_COLLECTOR - 资料员
7. OPERATOR - 签证操作员
8. OUTSOURCE - 外包业务员
9. CUSTOMER - 普通用户

---

## 10. 快速启动指南

### 10.1 从零启动完整步骤

```bash
# ========== 第一步：克隆项目 ==========
git clone https://github.com/Laogui-666/ERP.git
cd ERP

# ========== 第二步：安装依赖 ==========
npm install

# ========== 第三步：配置环境变量 ==========
cp .env.example .env.local
# 编辑 .env.local，填入：
# - 数据库连接信息
# - JWT 密钥（openssl rand -hex 32）
# - 阿里云 OSS 配置

# ========== 第四步：数据库初始化 ==========
npm run db:push      # 同步 Schema
npm run db:seed      # 可选：填充测试数据

# ========== 第五步：启动开发服务器 ==========
npm run dev

# ========== 第六步：访问应用 ==========
# 打开浏览器访问：http://localhost:3002
```

### 10.2 启动验证清单

- [ ] 依赖安装完成：`npm install` 无错误
- [ ] 环境变量配置：`.env.local` 文件存在且配置正确
- [ ] 数据库连接：`npm run db:push` 成功执行
- [ ] 服务器启动：`npm run dev` 显示 "Server ready"
- [ ] Socket.io 启用：启动日志显示 "Socket.io enabled"
- [ ] 页面访问：http://localhost:3002 可以正常打开

---

## 11. 常见集成问题与解决方案

### 11.1 数据库相关问题

#### 问题 1：MySQL 连接失败
**错误信息**: `Can't connect to MySQL server`

**解决方案**:
1. 检查 `.env.local` 中的 `DATABASE_URL` 是否正确
2. 确认密码中的 `@` 已 URL 编码为 `%40`
3. 检查 MySQL 服务是否启动
4. 确认网络连接和防火墙设置

#### 问题 2：Prisma Client 未生成
**错误信息**: `Cannot find module '@prisma/client'`

**解决方案**:
```bash
npm run postinstall
# 或
npx prisma generate
```

### 11.2 服务器启动问题

#### 问题 3：AsyncLocalStorage 未定义
**错误信息**: `AsyncLocalStorage is not defined`

**解决方案**: 确保 `server.ts` 顶部有兼容性修复代码：
```typescript
if (typeof globalThis.AsyncLocalStorage === 'undefined') {
  const { AsyncLocalStorage } = require('async_hooks')
  ;(globalThis as any).AsyncLocalStorage = AsyncLocalStorage
}
```

#### 问题 4：端口被占用
**错误信息**: `EADDRINUSE: address already in use :::3002`

**解决方案**:
1. 修改 `.env.local` 中的 `PORT` 为其他端口
2. 或杀死占用 3002 端口的进程：
```bash
# Linux/Mac
lsof -ti:3002 | xargs kill -9
```

### 11.3 OSS 相关问题

#### 问题 5：OSS 上传失败
**错误信息**: `AccessDenied` 或 `SignatureDoesNotMatch`

**解决方案**:
1. 检查 `.env.local` 中的 OSS 配置是否正确
2. 确认 AccessKey 有 Bucket 读写权限
3. 检查 Bucket 区域配置是否匹配

### 11.4 TypeScript 路径别名问题

#### 问题 6：路径别名不生效
**错误信息**: `Cannot find module '@shared/...'`

**解决方案**:
1. 确认 `tsconfig.json` 中的 `paths` 配置正确
2. 重启开发服务器
3. 运行 `npm run type-check` 检查类型错误

### 11.5 Socket.io 连接问题

#### 问题 7：Socket.io 连接失败
**错误信息**: `WebSocket connection failed`

**解决方案**:
1. 确认使用 `npm run dev` 而非 `npm run dev:next`
2. 检查 `.env.local` 中的 `NEXT_PUBLIC_APP_URL` 是否正确
3. 检查浏览器控制台的网络请求

---

## 附录

### A. 关键文件速查表

| 功能模块 | 文件路径 |
|---------|---------|
| 环境变量 | `.env.local` |
| 数据库 Schema | `prisma/schema.prisma` |
| 服务器启动 | `server.ts` |
| Prisma Client | `src/shared/lib/prisma.ts` |
| Socket.io | `src/shared/lib/socket.ts` |
| OSS 集成 | `src/shared/lib/oss.ts` |
| JWT 认证 | `src/shared/lib/auth.ts` |
| RBAC 权限 | `src/shared/lib/rbac.ts` |
| Next.js 配置 | `next.config.js` |
| TypeScript 配置 | `tsconfig.json` |

### B. 命令速查表

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器（含 Socket.io） |
| `npm run build` | 生产构建 |
| `npm start` | 启动生产服务器 |
| `npm run db:push` | 同步数据库 Schema |
| `npm run db:migrate` | 创建并应用迁移 |
| `npm run db:studio` | 打开数据库可视化工具 |
| `npm run lint` | 代码检查 |
| `npm run type-check` | TypeScript 类型检查 |

---

**文档结束**

> **记住**：如果记忆丢失，只需按此文档一步步操作，就能完整复刻 ERP 系统的所有集成功能和设置！
