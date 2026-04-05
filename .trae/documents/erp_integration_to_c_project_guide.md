# 华夏签证 ERP 系统 - C端项目集成指南

> **文档版本**: V1.0
> **生成日期**: 2026-04-04
> **项目名称**: 华夏签证 ERP 系统
> **最后更新**: 2026-04-04
> **文档目的**: 指导如何将 B 端 ERP 系统完整集成到其他 C 端项目中

---

## 目录

1. [集成概述](#1-集成概述)
2. [集成前准备](#2-集成前准备)
3. [核心模块迁移](#3-核心模块迁移)
4. [配置文件集成](#4-配置文件集成)
5. [数据库集成](#5-数据库集成)
6. [API 接口集成](#6-api-接口集成)
7. [前端路由集成](#7-前端路由集成)
8. [认证与权限集成](#8-认证与权限集成)
9. [实时通信集成](#9-实时通信集成)
10. [文件存储集成](#10-文件存储集成)
11. [状态管理集成](#11-状态管理集成)
12. [样式系统集成](#12-样式系统集成)
13. [测试与验证](#13-测试与验证)
14. [常见问题与解决方案](#14-常见问题与解决方案)

---

## 1. 集成概述

### 1.1 集成目标
将现有 B 端 ERP 系统无缝集成到 C 端项目中，实现：
- 共享认证体系
- 统一的 API 接口
- 一致的用户体验
- 模块化的功能扩展

### 1.2 集成架构

```
┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │
│   C端项目        │────>│   ERP 系统       │
│ (现有前端应用)    │     │ (模块化集成)     │
│                 │     │                 │
└─────────────────┘     └─────────────────┘
        │                       │
        └───────────────────────┘
                │
        ┌─────────────────┐
        │                 │
        │   共享服务层    │
        │ (数据库、认证、存储) │
        │                 │
        └─────────────────┘
```

---

## 2. 集成前准备

### 2.1 环境要求

| 依赖 | 版本 | 用途 |
|------|------|------|
| Node.js | 18.0+ | 运行环境 |
| npm | 9.0+ | 包管理 |
| MySQL | 8.0+ | 数据库 |
| Next.js | 15.0+ | 框架（如C端项目使用） |
| TypeScript | 5.0+ | 类型安全 |

### 2.2 目录结构准备

**建议的 C 端项目目录结构**：

```
c-project/
├── src/
│   ├── app/            # C端原有页面
│   ├── modules/        # 模块目录
│   │   └── erp/        # ERP 集成模块
│   ├── shared/         # 共享代码
│   └── middleware.ts   # 中间件
├── prisma/             # 数据库配置
├── public/
├── .env.local          # 环境变量
├── package.json
└── tsconfig.json
```

---

## 3. 核心模块迁移

### 3.1 复制 ERP 核心模块

**步骤 1: 复制 `modules/erp` 目录**
```bash
# 从 ERP 项目复制到 C 端项目
cp -r /workspace/ERP/src/modules/erp/ /path/to/c-project/src/modules/
```

**步骤 2: 复制 `shared` 目录**
```bash
cp -r /workspace/ERP/src/shared/ /path/to/c-project/src/
```

**步骤 3: 复制 `middleware.ts`**
```bash
cp /workspace/ERP/src/middleware.ts /path/to/c-project/src/
```

---

## 4. 配置文件集成

### 4.1 package.json 集成

**步骤 1: 合并依赖**

将 ERP 项目的依赖添加到 C 端项目的 `package.json`：

```json
"dependencies": {
  // C端原有依赖...
  "@prisma/client": "^5.22.0",
  "ali-oss": "^6.23.0",
  "bcryptjs": "^2.4.3",
  "dotenv": "^17.3.1",
  "jose": "^5.9.6",
  "lru-cache": "^11.0.1",
  "socket.io": "^4.8.1",
  "socket.io-client": "^4.8.1",
  "zod": "^3.24.1",
  "zustand": "^5.0.2"
}
```

**步骤 2: 添加脚本**

```json
"scripts": {
  // C端原有脚本...
  "db:push": "prisma db push",
  "db:migrate": "prisma migrate dev",
  "db:seed": "tsx prisma/seed.ts",
  "db:studio": "prisma studio",
  "postinstall": "prisma generate"
}
```

### 4.2 tsconfig.json 集成

**添加路径别名**：

```json
"compilerOptions": {
  // 原有配置...
  "paths": {
    "@/*": ["./src/*"],
    "@shared/*": ["./src/shared/*"],
    "@erp/*": ["./src/modules/erp/*"]
  }
}
```

### 4.3 next.config.js 集成

**添加 OSS 图片支持**：

```javascript
const nextConfig = {
  // 原有配置...
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
  serverExternalPackages: ['@prisma/client'],
}
```

---

## 5. 数据库集成

### 5.1 复制 Prisma Schema

**步骤 1: 复制 schema.prisma**
```bash
mkdir -p /path/to/c-project/prisma
cp /workspace/ERP/prisma/schema.prisma /path/to/c-project/prisma/
```

**步骤 2: 复制 seed.ts（可选）**
```bash
cp /workspace/ERP/prisma/seed.ts /path/to/c-project/prisma/
```

### 5.2 数据库配置

**步骤 1: 配置数据库连接**

在 `.env.local` 中添加：

```bash
# 数据库配置
DB_PASS_ENCODED="your-password-encoded"
DATABASE_URL="mysql://user:${DB_PASS_ENCODED}@host:3306/database"
```

**步骤 2: 初始化数据库**

```bash
# 生成 Prisma Client
npm run postinstall

# 同步数据库 Schema
npm run db:push

# 可选：填充测试数据
npm run db:seed
```

---

## 6. API 接口集成

### 6.1 复制 API 路由

**步骤 1: 创建 API 目录**
```bash
mkdir -p /path/to/c-project/src/app/api
```

**步骤 2: 复制 ERP API 路由**
```bash
cp -r /workspace/ERP/src/app/api/* /path/to/c-project/src/app/api/
```

### 6.2 API 路由集成策略

**选项 1: 保持独立路径**
- ERP API 保持在 `/api/` 路径下
- C 端 API 可以使用不同前缀

**选项 2: 前缀隔离**
- ERP API 使用 `/api/erp/` 前缀
- C 端 API 使用 `/api/c/` 前缀

---

## 7. 前端路由集成

### 7.1 复制管理端页面

**步骤 1: 创建 admin 目录**
```bash
mkdir -p /path/to/c-project/src/app/admin
```

**步骤 2: 复制 ERP 管理端页面**
```bash
cp -r /workspace/ERP/src/app/admin/* /path/to/c-project/src/app/admin/
```

### 7.2 路由保护

**修改 middleware.ts** 确保 ERP 路由受到保护：

```typescript
// src/middleware.ts

// ERP 管理端路由保护
const adminRoutes = [
  '/admin',
  '/api/auth',
  '/api/orders',
  '/api/documents',
  // 其他 ERP API 路径...
]

// 对 ERP 路由进行认证检查
if (adminRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
  // 认证逻辑...
}
```

---

## 8. 认证与权限集成

### 8.1 JWT 认证集成

**步骤 1: 配置 JWT 密钥**

在 `.env.local` 中添加：

```bash
# JWT 认证
JWT_SECRET="change-me-to-a-random-64-char-string"
JWT_REFRESH_SECRET="change-me-to-another-random-64-char-string"
```

**步骤 2: 集成认证钩子**

在 C 端项目中使用 ERP 的认证钩子：

```typescript
// C端组件中使用
import { useAuth } from '@shared/hooks/use-auth'

function C端页面() {
  const { user, login, logout } = useAuth()
  
  // 使用认证状态...
}
```

### 8.2 RBAC 权限集成

**使用 ERP 的权限检查**：

```typescript
import { checkPermission } from '@shared/lib/rbac'

// 检查用户权限
function protectRoute(role: UserRole) {
  checkPermission(role, ['SUPER_ADMIN', 'COMPANY_OWNER'])
}
```

---

## 9. 实时通信集成

### 9.1 Socket.io 服务端集成

**步骤 1: 复制 server.ts**

如果 C 端项目使用自定义服务器：

```bash
cp /workspace/ERP/server.ts /path/to/c-project/
```

**步骤 2: 集成 Socket.io**

在 C 端服务器中初始化 Socket.io：

```typescript
import { initSocketServer } from '@shared/lib/socket'

// 初始化 Socket.io
initSocketServer(server)
```

### 9.2 Socket.io 客户端集成

**在 C 端组件中使用**：

```typescript
import { useSocketClient } from '@shared/hooks/use-socket-client'

function C端组件() {
  const socket = useSocketClient()
  
  // 使用 socket...
}
```

---

## 10. 文件存储集成

### 10.1 阿里云 OSS 配置

**在 `.env.local` 中添加**：

```bash
# 阿里云 OSS
OSS_REGION="oss-cn-beijing"
OSS_ENDPOINT="https://oss-cn-beijing.aliyuncs.com"
OSS_ACCESS_KEY_ID="your-access-key-id"
OSS_ACCESS_KEY_SECRET="your-access-key-secret"
OSS_BUCKET="your-bucket-name"
```

### 10.2 使用 OSS 工具

**在 C 端项目中使用**：

```typescript
import { oss } from '@shared/lib/oss'

// 上传文件
const url = await oss.uploadFile('path/to/file', file)

// 生成下载链接
const downloadUrl = await oss.getDownloadUrl('path/to/file')
```

---

## 11. 状态管理集成

### 11.1 使用 Zustand 存储

**在 C 端组件中使用 ERP 状态存储**：

```typescript
import { useOrderStore } from '@erp/stores/order-store'
import { useAuthStore } from '@shared/stores/auth-store'

function C端组件() {
  const { orders, fetchOrders } = useOrderStore()
  const { user } = useAuthStore()
  
  // 使用状态...
}
```

---

## 12. 样式系统集成

### 12.1 复制样式文件

**步骤 1: 复制样式文件**
```bash
cp -r /workspace/ERP/src/shared/styles/ /path/to/c-project/src/shared/
```

**步骤 2: 集成 Tailwind 配置**

在 `tailwind.config.ts` 中添加：

```typescript
// 继承 ERP 的 Tailwind 配置
import erpTailwindConfig from './path/to/erp/tailwind.config'

export default {
  ...erpTailwindConfig,
  // C端项目的额外配置...
}
```

**步骤 3: 导入全局样式**

在 `app/layout.tsx` 中：

```typescript
import '@shared/styles/globals.css'
import '@shared/styles/glassmorphism.css'
```

---

## 13. 测试与验证

### 13.1 集成测试清单

- [ ] 依赖安装：`npm install` 无错误
- [ ] 类型检查：`npm run type-check` 通过
- [ ] 数据库连接：`npm run db:push` 成功
- [ ] 服务器启动：`npm run dev` 正常
- [ ] API 接口：`/api/health` 响应正常
- [ ] 认证系统：登录/注册功能正常
- [ ] 管理端：`/admin/dashboard` 可访问
- [ ] 文件上传：OSS 集成正常
- [ ] 实时通信：Socket.io 连接正常

### 13.2 功能验证

**测试场景**：
1. **用户认证**：登录、注册、权限检查
2. **订单管理**：创建、查看、状态更新
3. **资料管理**：上传、预览、审核
4. **实时通知**：消息推送、状态变更通知
5. **文件操作**：上传、下载、删除

---

## 14. 常见问题与解决方案

### 14.1 路径别名问题

**错误**：`Cannot find module '@shared/...'`

**解决方案**：
1. 确认 `tsconfig.json` 中的 `paths` 配置正确
2. 重启开发服务器
3. 运行 `npm run type-check` 检查

### 14.2 数据库连接问题

**错误**：`Can't connect to MySQL server`

**解决方案**：
1. 检查 `.env.local` 中的 `DATABASE_URL`
2. 确认 MySQL 服务运行正常
3. 验证数据库用户权限

### 14.3 认证失败问题

**错误**：`Token invalid` 或 `Unauthorized`

**解决方案**：
1. 检查 `JWT_SECRET` 配置
2. 确认 Cookie 设置正确
3. 验证用户角色权限

### 14.4 OSS 上传失败

**错误**：`AccessDenied` 或 `SignatureDoesNotMatch`

**解决方案**：
1. 检查 OSS 配置参数
2. 确认 AccessKey 权限
3. 验证 Bucket 区域设置

### 14.5 Socket.io 连接问题

**错误**：`WebSocket connection failed`

**解决方案**：
1. 确认使用自定义服务器启动
2. 检查 `NEXT_PUBLIC_APP_URL` 配置
3. 验证 CORS 设置

---

## 附录

### A. 核心文件映射表

| ERP 项目文件 | C 端项目位置 |
|-------------|-------------|
| `src/modules/erp/` | `src/modules/erp/` |
| `src/shared/` | `src/shared/` |
| `src/middleware.ts` | `src/middleware.ts` |
| `prisma/schema.prisma` | `prisma/schema.prisma` |
| `server.ts` | `server.ts` (如果使用) |
| `src/app/api/` | `src/app/api/` |
| `src/app/admin/` | `src/app/admin/` |

### B. 集成命令速查表

| 命令 | 说明 |
|------|------|
| `npm install` | 安装依赖 |
| `npm run postinstall` | 生成 Prisma Client |
| `npm run db:push` | 同步数据库 Schema |
| `npm run dev` | 启动开发服务器 |
| `npm run type-check` | TypeScript 类型检查 |
| `npm run lint` | 代码检查 |

### C. 集成成功标志

- ✅ ERP 管理端页面可访问
- ✅ API 接口响应正常
- ✅ 数据库连接成功
- ✅ 认证系统工作正常
- ✅ 文件上传功能正常
- ✅ 实时通信功能正常
- ✅ C 端原有功能不受影响

---

**文档结束**

> **记住**：按照此指南步骤操作，您可以将完整的 B 端 ERP 系统集成到任何 C 端项目中，实现功能的无缝扩展！
