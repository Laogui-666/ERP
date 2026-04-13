# 华夏签证 - 签证行业ERP系统

# 开发规范

> **文档版本**: V19.0
> **生成日期**: 2026-03-19
> **最后更新**: 2026-04-03
> **适用范围**: 全团队所有开发人员

---

## 目录

1. [代码规范](#1-代码规范)
2. [Git 工作流规范](#2-git-工作流规范)
3. [命名规范](#3-命名规范)
4. [组件开发规范](#4-组件开发规范)
5. [API 开发规范](#5-api-开发规范)
6. [数据库规范](#6-数据库规范)
7. [UI/样式开发规范](#7-ui样式开发规范)
8. [安全编码规范](#8-安全编码规范)
9. [测试规范](#9-测试规范)
10. [Code Review 规范](#10-code-review-规范)
11. [文档规范](#11-文档规范)
12. [部署规范](#12-部署规范)
13. [TypeScript 与 Prisma 类型防错指南](#13-typescript-与-prisma-类型防错指南)
14. [已知技术债务与待办](#14-已知技术债务与待办)
15. [C 端平台开发规范（M8 起生效）](#15-c-端平台开发规范m8-起生效)
16. [手机端 UI 开发规范（M8 起全局强制执行）](#16-手机端-ui-开发规范m8-起全局强制执行)
17. [WebMCP 集成开发规范（M9 起生效）](#17-webmcp-集成开发规范m9-起生效)

---

## 1. 代码规范

### 1.1 语言与工具链

| 工具 | 版本 | 说明 |
|---|---|---|
| Node.js | >= 20.x LTS | 运行时 |
| TypeScript | 5.x 严格模式 | 全栈类型安全 |
| ESLint | 8.x | 代码质量检查 |
| Prettier | 3.x | 代码格式化 |

### 1.2 TypeScript 严格配置

> ⚠️ **路由结构约定**：管理端使用实际路径段 `admin/`（非路由组 `(admin)/`），客户端同理使用 `customer/`，门户使用 `portal/`。
> 路由组 `()` 不参与 URL 路径，仅用于 `auth` 等不需要路径前缀的场景。新增页面必须放在 `admin/`、`customer/` 或 `portal/` 实际目录下。
> **ERP 代码零改动原则**（M7 起生效）：`admin/*`、`customer/*`、`api/*`、`lib/*`、`hooks/*`、`stores/*` 下的现有文件禁止修改。新模块代码统一放 `portal/` 和 `components/portal/`。

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "forceConsistentCasingInImports": true
  }
}
```

### 1.3 代码风格

```typescript
// ✅ 正确
const order = await prisma.order.findUnique({
  where: { id: orderId },
  select: { id: true, status: true, customerName: true },
})

if (!order) {
  throw new NotFoundError('订单不存在')
}

// ❌ 错误
var order = await prisma.order.findUnique({where: {id: orderId}})
if(order == null) throw new Error("not found")
```

**核心规则**：

| 规则 | 说明 |
|---|---|
| 使用 `const`/`let` | 禁止 `var` |
| 使用可选链 `?.` | 替代手动 null 检查 |
| 使用空值合并 `??` | 替代 `\|\|` 处理 nullish |
| 解构赋值 | 优先解构而非逐个取值 |
| 显式返回类型 | 公共函数必须声明返回类型 |
| 禁止 `any` | 使用 `unknown` + 类型守卫 |
| 最大行宽 | 100 字符 |
| 缩进 | 2 空格 |
| 引号 | 单引号 (TypeScript) |
| 分号 | 不使用分号（Prettier 配置） |

### 1.4 错误处理

```typescript
// 定义业务错误类
class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400
  ) {
    super(message)
    this.name = 'AppError'
  }
}

class NotFoundError extends AppError {
  constructor(resource: string) {
    super('NOT_FOUND', `${resource}不存在`, 404)
  }
}

class ForbiddenError extends AppError {
  constructor(message = '无权执行此操作') {
    super('FORBIDDEN', message, 403)
  }
}

class TransitionError extends AppError {
  constructor(from: string, to: string) {
    super('INVALID_TRANSITION', `不允许从 ${from} 流转到 ${to}`, 400)
  }
}

// API Route 中统一处理
export async function POST(request: NextRequest) {
  try {
    // 业务逻辑
    return Response.json(result)
  } catch (error) {
    if (error instanceof AppError) {
      return Response.json(
        { code: error.code, message: error.message },
        { status: error.statusCode }
      )
    }
    console.error('[UNEXPECTED]', error)
    return Response.json(
      { code: 'INTERNAL_ERROR', message: '服务器内部错误' },
      { status: 500 }
    )
  }
}
```

---

## 2. Git 工作流规范

### 2.1 分支策略

```
main (生产)
  ├── develop (开发)
  │     ├── feature/xxx (功能分支)
  │     ├── fix/xxx (修复分支)
  │     └── refactor/xxx (重构分支)
  └── hotfix/xxx (紧急修复，直接从 main 切出)
```

| 分支 | 说明 | 合并目标 | 保护 |
|---|---|---|---|
| `main` | 生产环境，只接受 hotfix 和 develop 合并 | — | ✅ 禁止直推 |
| `develop` | 开发主分支，功能完成后合并到此 | `main` (release) | ✅ 需 PR |
| `feature/*` | 功能开发 | `develop` | — |
| `fix/*` | Bug 修复 | `develop` | — |
| `hotfix/*` | 生产紧急修复 | `main` + `develop` | — |
| `refactor/*` | 代码重构 | `develop` | — |

### 2.2 分支命名

```
feature/order-kanban-view          # 功能：订单看板视图
feature/document-upload-panel      # 功能：资料上传面板
fix/order-status-transition        # 修复：订单状态流转bug
fix/notification-duplicate         # 修复：通知重复发送
refactor/auth-middleware            # 重构：认证中间件
hotfix/login-crash                 # 紧急：登录崩溃修复
```

### 2.3 Commit 规范 (Conventional Commits)

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type 类型**：

| Type | 说明 | 示例 |
|---|---|---|
| `feat` | 新功能 | `feat(order): 添加订单看板视图` |
| `fix` | Bug 修复 | `fix(auth): 修复 Token 刷新失败问题` |
| `docs` | 文档变更 | `docs(readme): 更新部署说明` |
| `style` | 代码格式（不影响逻辑） | `style: 格式化订单模块代码` |
| `refactor` | 重构（不新增功能/不修bug） | `refactor(db): 优化 Prisma 查询性能` |
| `perf` | 性能优化 | `perf(list): 添加订单列表虚拟滚动` |
| `test` | 添加/修改测试 | `test(auth): 添加登录接口测试` |
| `chore` | 构建/工具变更 | `chore: 升级 Prisma 到 5.10` |
| `ci` | CI/CD 变更 | `ci: 添加自动部署脚本` |

**Scope 范围**：`order` / `auth` / `document` / `notification` / `user` / `dashboard` / `template` / `sms` / `db` / `ui` / `socket`

### 2.4 PR 规范

**PR 标题**：与 commit 格式一致  
**PR 描述模板**：

```markdown
## 变更内容
- 简述做了什么

## 变更类型
- [ ] 新功能 (feat)
- [ ] Bug修复 (fix)
- [ ] 重构 (refactor)
- [ ] 文档 (docs)

## 测试
- [ ] 本地测试通过
- [ ] 添加了单元测试
- [ ] 手动测试场景

## 截图/录屏
（如有 UI 变更）

## 关联 Issue
#xxx
```

---

## 3. 命名规范

### 3.1 文件命名

| 类型 | 格式 | 示例 |
|---|---|---|
| React 组件 | `kebab-case.tsx` | `order-card.tsx`, `status-badge.tsx` |
| 工具函数 | `kebab-case.ts` | `desensitize.ts`, `format-date.ts` |
| API Route | `route.ts` | `src/app/api/orders/route.ts` |
| 页面 | `page.tsx` | `src/app/(admin)/orders/page.tsx` |
| Hook | `use-xxx.ts` | `use-auth.ts`, `use-orders.ts` |
| Store | `xxx-store.ts` | `auth-store.ts`, `order-store.ts` |
| Service | `xxx.service.ts` | `order.service.ts` |
| 类型定义 | `xxx.ts` | `order.ts`, `user.ts` |
| 样式 | `xxx.css` | `globals.css`, `glassmorphism.css` |

### 3.2 变量/函数命名

| 类型 | 格式 | 示例 |
|---|---|---|
| 变量 | camelCase | `orderId`, `customerName` |
| 常量 | SCREAMING_SNAKE | `MAX_FILE_SIZE`, `ORDER_STATUS` |
| 函数 | camelCase | `getOrders`, `createNotification` |
| 类/类型 | PascalCase | `OrderService`, `TransitionError` |
| 接口 | PascalCase (不加 I 前缀) | `Order`, `User`, `TransitionRule` |
| 枚举值 | SCREAMING_SNAKE | `PENDING_CONNECTION` |
| 布尔变量 | is/has/can/should 前缀 | `isRead`, `hasPermission`, `canTransition` |
| 数据库字段 | camelCase (Prisma) | `companyId`, `passportNo`, `createdAt` |
| API 路径 | kebab-case | `/api/orders`, `/api/order-logs` |

### 3.3 组件 Props 命名

```typescript
// ✅ 正确
interface OrderCardProps {
  order: Order
  onStatusChange: (orderId: string, status: OrderStatus) => void
  isLoading?: boolean
}

// ❌ 错误：Props 加 I 前缀
interface IOrderCardProps { ... }

// ❌ 错误：布尔不加 is/has 前缀
interface Props { loading: boolean }
```

---

## 4. 组件开发规范

### 4.1 组件结构

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

### 4.2 组件拆分原则

| 原则 | 说明 |
|---|---|
| 单一职责 | 一个组件只做一件事 |
| 最大 300 行 | 超过则考虑拆分 |
| Props 最多 7 个 | 超过则用对象合并 |
| 复杂逻辑抽 Hook | 状态逻辑抽到 `useXxx` |
| 业务组件 vs UI 组件 | UI 组件不依赖业务数据 |

### 4.3 Server Components vs Client Components

| 场景 | 选择 | 理由 |
|---|---|---|
| 数据获取 + 展示 | Server Component | 减少客户端 JS |
| 需要交互（点击/输入） | Client Component (`'use client'`) | 需要事件处理 |
| 需要浏览器 API | Client Component | 服务端无 DOM |
| 需要实时数据 | Client Component | Socket.io |

**规则**：默认使用 Server Component，只有在需要交互时才添加 `'use client'`。

### 4.4 组件铁律

| 规则 | 说明 |
|---|---|
| `'use client'` 必须在首行 | import 语句必须在 `'use client'` 之后，否则 Next.js 将其视为 Server Component |
| 内部导航用 `<Link>` | 所有站内路由必须使用 `next/link` 的 `<Link>`，禁止 `<a href="/...">`（会导致全页面刷新） |
| `'use client'` 有 import 顺序 | 先写 `'use client'`，再写所有 import |

---

## 5. API 开发规范

### 5.1 统一响应格式

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

### 5.2 API Route 模板

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
  // ... 其他角色

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

### 5.3 HTTP 状态码使用

| 状态码 | 场景 |
|---|---|
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

### 5.4 客户端 API 调用规范

> **所有前端认证 API 调用必须使用 `apiFetch`（`src/lib/api-client.ts`），禁止直接使用原生 `fetch`。**

```typescript
import { apiFetch } from '@/lib/api-client'

// ✅ 正确：自动处理 401 → 刷新 Token → 重试
const res = await apiFetch('/api/orders', { method: 'POST', ... })

// ❌ 错误：Token 过期后直接 401，用户被迫重新登录
const res = await fetch('/api/orders', { method: 'POST', ... })
```

**例外**：认证页面（login/register/reset-password）可直接使用 `fetch`，因为此时用户尚未认证。

---

## 6. 数据库规范

### 6.1 迁移规范

```bash
# 创建迁移
npx prisma migrate dev --name add_visa_template_table

# 生产部署
npx prisma migrate deploy

# 禁止直接修改数据库！所有变更必须通过 Prisma Migration
```

### 6.2 数据库命名规范（强制）

#### 表名规范

| 规则 | 说明 | 示例 |
|---|---|---|
| **统一 `erp_` 前缀** | **所有表必须以 `erp_` 开头**，防止与其他项目表名冲突 | `erp_users`, `erp_orders` |
| 复数形式 | 表名用复数 | `erp_companies` 而非 `erp_company` |
| 小写蛇形 | 全小写 + 下划线分隔 | `erp_document_requirements` |
| Prisma 中用 `@@map` | Model 用单数 PascalCase，`@@map` 映射到带前缀的表名 | 见下方示例 |

**Prisma 写法示例：**
```prisma
model User {
  // ... 字段定义 ...

  @@map("erp_users")      // ← 实际表名必须带 erp_ 前缀
}

model DocumentRequirement {
  // ... 字段定义 ...

  @@map("erp_document_requirements")
}

model OrderLog {
  // ... 字段定义 ...

  @@map("erp_order_logs")
}
```

> ⚠️ **每新建一个 Model，必须立即添加 `@@map("erp_xxx")`，否则表名无前缀，与旧项目冲突！**

#### 字段名规范

| 规则 | 说明 | 示例 |
|---|---|---|
| 小写蛇形 | 数据库字段名用 snake_case | `customer_name`, `order_no` |
| Prisma 中用 `@map` | 字段用 camelCase，`@map` 映射到 snake_case | `customerName String @map("customer_name")` |
| 外键加 `_id` 后缀 | 外键字段以 `_id` 结尾 | `company_id`, `collector_id` |
| 时间字段 | 统一 `created_at` / `updated_at` | 必须有 `@map("created_at")` |

**字段写法示例：**
```prisma
model Order {
  id              String    @id @default(cuid())
  companyId       String    @map("company_id")           // ← 外键带 _id
  orderNo         String    @unique @map("order_no")     // ← snake_case，系统编号 HX2026...
  externalOrderNo String?   @unique @map("external_order_no")  // 外部订单号
  customerName    String    @map("customer_name")        // ← camelCase → snake_case
  status          OrderStatus @default(PENDING_CONNECTION)
  createdBy       String    @map("created_by")           // 创建者（客服ID）
  createdAt       DateTime  @default(now()) @map("created_at")  // ← 必须有
  updatedAt       DateTime  @updatedAt @map("updated_at")       // ← 必须有

  @@map("erp_orders")
}
```

### 6.3 Schema 变更规则

| 规则 | 说明 |
|---|---|
| **新增表必须带 `erp_` 前缀** | 每个 Model 末尾加 `@@map("erp_xxx")` |
| **新增字段必须带 `@map`** | camelCase 字段用 `@map("snake_case")` 映射 |
| 字段只增不删 | 需要废弃的字段标记 `@deprecated`，不物理删除 |
| 主键使用 `cuid()` | `@id @default(cuid())` |
| 所有表包含 `companyId` | 多租户隔离必需 |
| 时间字段使用 `DateTime` | `createdAt`, `updatedAt` 必须有 |
| 外键使用 String 类型 | `@db.VarChar(30)` |
| 大文本使用 `@db.Text` | 备注、URL 等长文本 |
| 金额使用 `Decimal` | `@db.Decimal(10, 2)` |

### 6.4 当前表清单

| Prisma Model | 实际表名 | 说明 |
|---|---|---|
| `Company` | `erp_companies` | 租户/公司 |
| `Department` | `erp_departments` | 部门 |
| `User` | `erp_users` | 用户（9级角色） |
| `Order` | `erp_orders` | 签证订单 |
| `Applicant` | `erp_applicants` | 申请人（M5新增） |
| `DocumentRequirement` | `erp_document_requirements` | 资料需求清单 |
| `DocumentFile` | `erp_document_files` | 资料文件 |
| `VisaMaterial` | `erp_visa_materials` | 签证材料（操作员产出） |
| `OrderLog` | `erp_order_logs` | 操作日志 |
| `Notification` | `erp_notifications` | 站内通知 |
| `VisaTemplate` | `erp_visa_templates` | 签证模板库 |

### 6.3 种子数据

```typescript
// prisma/seed.ts

async function main() {
  // 创建系统级超级管理员
  await prisma.user.create({
    data: {
      companyId: 'system',
      username: 'superadmin',
      phone: '10000000000',
      passwordHash: await hashPassword('Admin@123456'),
      realName: '系统管理员',
      role: 'SUPER_ADMIN',
    },
  })

  // 创建预置签证模板
  const templates = [
    {
      name: '申根旅游签证材料清单',
      country: '申根国家',
      visaType: '旅游',
      items: [
        { name: '护照', description: '有效期6个月以上', required: true },
        { name: '照片', description: '2寸白底近照', required: true },
        // ...
      ],
      isSystem: true,
    },
    // 更多模板...
  ]
}
```

---

## 7. UI/样式开发规范

> **设计系统**：现代简约设计系统（移动优先）
> **样式文件**：`globals.css`（变量/动效/背景） + `tailwind.config.ts`（色板/动画）

### 7.1 移动优先设计原则

**核心原则**：Mobile-First，桌面端渐进增强。手机端优化不得破坏桌面端体验。

**设计参考**：Airbnb App / Apple.com / Linear / Notion / Stripe / 微信

**适用范围**：所有 `portal/`、`components/portal/`、根路径页面下的新增代码，以及 ERP 系统的 UI 改造。

#### 7.1.1 视口与安全区

```tsx
// 每个页面必须在 layout.tsx 中包含 viewport meta（已有则不重复）
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1" />
```

**安全区适配**（刘海屏/底部横条）：

| 位置 | CSS | 说明 |
|---|---|---|
| 顶栏 | `padding-top: env(safe-area-inset-top)` | 刘海区域 |
| 底部Tab | `padding-bottom: env(safe-area-inset-bottom)` | 底部横条 |
| 左右 | 自动适配 | 一般不需要额外处理 |

**Tailwind 实现**：
```tsx
// 底部Tab
<nav className="fixed bottom-0 pb-[env(safe-area-inset-bottom)] ...">

// 内容区底部留白（避开Tab）
<main className="pb-[calc(68px+env(safe-area-inset-bottom))] ...">
```

#### 7.1.2 触控区域标准

**Apple HIG 标准：所有可点击元素最小 44×44px。**

| 元素 | 最小尺寸 | Tailwind |
|---|---|---|
| 按钮 | 44×44px | `min-h-[44px]` |
| 图标按钮 | 44×44px | `min-h-[44px] min-w-[44px]` |
| 列表项 | 高度≥56px | `min-h-[56px]` |
| 输入框 | 高度≥48px | `py-3.5` |
| Tab项 | 高度≥48px | `py-2` (56px total) |
| 卡片间距 | 12px | `gap-3` |

**点击反馈**（手机无 hover，必须有 `:active`）：
```tsx
// ✅ 正确：active 反馈
className="active:scale-[0.97] active:bg-gray-100 transition-transform duration-100"

// ❌ 错误：只有 hover 无 active
className="hover:bg-gray-100"  // 手机上永远不触发
```

#### 7.1.3 布局规范

| 规则 | 值 | 说明 |
|---|---|---|
| 内容最大宽度 | `max-w-lg`（448px） | 超宽居中留白 |
| 左右边距 | `px-4`（16px） | 基础间距 |
| 底部留白 | `pb-[68px]` | 避开底部Tab |
| 顶部留白 | `pt-14`（56px） | 避开固定顶栏 |
| Section间距 | `py-12` ~ `py-16` | 区域间呼吸感 |

#### 7.1.4 横向滚动规范

所有横向滚动容器（目的地卡片、Tab筛选栏等）**必须遵守**：

```tsx
<div
  className="
    flex gap-3 overflow-x-auto
    snap-x snap-mandatory          /* scroll-snap */
    -webkit-overflow-scrolling:touch /* iOS 惯性滚动 */
    scrollbar-none                  /* 隐藏滚动条 */
    pb-2                            /* 底部留白 */
  "
>
  {items.map(item => (
    <div key={item.id} className="flex-shrink-0 snap-start ...">
      {/* 卡片内容 */}
    </div>
  ))}
</div>
```

```css
/* tailwind.config.ts 中添加 scrollbar-none */
scrollbar: {
  none: { '&::-webkit-scrollbar': { display: 'none' }, '-ms-overflow-style': 'none', 'scrollbar-width': 'none' }
}
```

#### 7.1.5 动画性能（手机端专项）

| 规则 | 说明 |
|---|---|
| **只动画 GPU 属性** | `transform` 和 `opacity` 以外的属性禁止动画 |
| **will-change** | 滚动容器 `will-change: scroll-position`，动画元素 `will-change: transform` |
| **帧率** | 所有动画 60fps，复杂计算用 `requestAnimationFrame` |
| **禁用桌面特效** | 移动端自动禁用：鼠标光晕、hover浮起、液态光泽层 |
| **降低模糊** | 移动端 `backdrop-blur` 降至 `blur(12px)`（桌面 20px） |
| **减少粒子** | 动态背景光球从4个减至2个，尺寸缩小 |
| **懒加载** | 非首屏图片 `loading="lazy"` + `srcSet` 响应式图片 |
| **骨架屏** | 数据加载必须有骨架屏，禁止白屏 |

**`prefers-reduced-motion` 尊重**：
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

#### 7.1.6 桌面端 vs 移动端差异化

**通过 `@media (hover: hover)` 区分，CSS 层面处理，JS 无需判断。**

| 特性 | 桌面端 | 移动端 |
|---|---|---|
| 卡片hover | 浮起+阴影+光泽层 | 无，仅 `:active` 缩放 |
| 按钮hover | 光泽扫过+背景提亮 | 无，仅 `:active` 变暗 |
| 鼠标光晕 | 400px径向渐变追踪 | `display:none` |
| 浮动光球 | 2个 orb + blur(60px) | 2个静态渐变圆 |
| 顶栏初始态 | 透明→滚动变毛玻璃 | 初始半透明(0.85) |
| 搜索栏 | 始终展开 | 收起为🔍图标 |
| 滚动条 | 自定义细滚动条 | 隐藏 |

```tsx
// DynamicBackground 组件中的实现示例
<div className="hidden md:block">  {/* 2个浮动光球 - 仅桌面 */}</div>
<div className="md:hidden">        {/* 2个静态渐变 - 仅移动 */}</div>

// CSS 实现
@media (hover: hover) {
  .card:hover { transform: translateY(-2px); }
  .card:hover::before { opacity: 1; }  /* 光泽层 */
}
@media (hover: none) {
  .card:active { transform: scale(0.97); }
  .card::before { display: none; }     /* 禁用光泽层 */
}
```

#### 7.1.7 手机端专属 UI 模式

| 模式 | 场景 | CSS/组件 | 参考 |
|---|---|---|---|
| **底部弹出面板** | 筛选/排序/操作菜单 | `fixed bottom-0 rounded-t-2xl` + slideUp动画 | Airbnb/美团 |
| **全屏模态** | 创建订单/表单 | `fixed inset-0` + slideUp | Linear/Notion |
| **Toast底部居中** | 操作反馈 | `fixed bottom-20 left-1/2 -translate-x-1/2` | iOS风格 |
| **横向滚动Tab** | 状态筛选 | `overflow-x-auto snap-x` + 底部指示条 | 微信/淘宝 |
| **骨架屏列表** | 加载态 | `skeleton` CSS 类 | 所有主流App |
| **空状态插画** | 无数据 | 图标+标题+描述+CTA按钮 | Notion/Slack |
| **下拉刷新** | 列表刷新 | Touch事件检测（M9+可选） | 微信 |

**底部弹出面板（Bottom Sheet）CSS**：
```css
.bottom-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 85vh;
  background: var(--color-bg-primary);
  border-radius: 20px 20px 0 0;
  border-top: 1px solid var(--color-border);
  animation: slideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  /* 顶部拖拽条 */
}
.bottom-sheet::before {
  content: '';
  display: block;
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: var(--color-border-dark);
  margin: 12px auto;
}
```

#### 7.1.8 文字排版（手机端）

| 层级 | 手机端 | 桌面端 | 用途 |
|---|---|---|---|
| Hero标题 | 28px / 700 | 32-40px / 700 | 首屏大标题 |
| 页面标题 | 20px / 700 | 24px / 700 | Section标题 |
| 卡片标题 | 16px / 600 | 18px / 600 | 工具/服务卡片 |
| 正文 | 14px / 400 | 14px / 400 | 描述文字 |
| 辅助文字 | 12px / 400 | 12-13px / 400 | 标签/时间 |
| 极小文字 | 11px / 500 | 11px / 500 | 角标/版权 |

**行高**：`leading-relaxed`（1.625）用于正文，`leading-tight`（1.25）用于标题

#### 7.1.9 图片响应式

```tsx
// ✅ 正确：响应式图片
<Image
  src="/destinations/japan.jpg"
  alt="日本签证"
  width={360}
  height={480}
  sizes="(max-width: 768px) 50vw, 25vw"
  loading="lazy"           // 非首屏图片
  className="object-cover rounded-2xl"
/>

// ✅ 首屏图片优先加载
<Image
  src="/hero-bg.jpg"
  alt=""
  priority                  // 首屏
  fill
  className="object-cover"
/>
```

#### 7.1.10 手机端验证清单

**每次提交前，Chrome DevTools 手机模式逐项验证**：

```
视口与布局
□ 375px（iPhone SE）无水平滚动条
□ 390px（iPhone 14）布局正常
□ 414px（iPhone 14 Pro Max）布局正常
□ 底部Tab不遮挡内容
□ 顶栏不遮挡内容
□ 刘海屏 safe-area 正常

触控
□ 所有按钮 ≥44px 可点击
□ 列表项 ≥56px 高度
□ 输入框 ≥48px 高度
□ 无误触（间距≥12px）

交互
□ 横向滚动流畅+scroll-snap
□ 无桌面端hover特效（光泽/浮起/光晕）
□ active 反馈正常
□ 骨架屏加载正常

性能
□ 首屏加载 < 3s（3G模拟）
□ 动画 60fps（Performance面板）
□ 图片懒加载生效
□ 无 layout shift（CLS < 0.1）

桌面端不受影响
□ 桌面端 hover 特效正常
□ 桌面端搜索栏展开显示
□ 桌面端2个光球动画正常
```

### 7.2 Tailwind 使用规范

```tsx
// ✅ 正确：使用 Tailwind 原子类
<div className="flex items-center gap-3 rounded-lg bg-white/5 p-4 backdrop-blur-xl">

// ✅ 正确：液态玻璃使用自定义 CSS 类
<div className="glass-card p-5">

// ✅ 正确：使用 CSS 变量（与 glassmorphism.css 共享 Token）
<div className="bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20">

// ✅ 正确：使用 morandi 色板
<div className="text-morandi-blue bg-morandi-purple/10">

// ❌ 错误：硬编码颜色值（应使用 CSS 变量或 morandi 色板）
<div style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
<div className="text-[#7C8DA6]">  // 应写 text-[var(--color-primary)]

// ❌ 错误：过长 className（拆分为组件或 CSS 类）
<div className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-3 backdrop-blur-xl border border-white/8 shadow-lg hover:bg-white/10 transition-all duration-300 ease-out">
```

### 7.2 液态玻璃组件使用规范

| 场景 | 使用 | 说明 |
|---|---|---|
| 内容卡片 | `glass-card` | 默认 medium 强度 |
| 静态容器（弹窗背景） | `glass-card-static` | 无悬停动效 |
| 轻量容器（用户信息条） | `glass-card-light` | 最低透明度 |
| 高亮/选中卡片 | `glass-card-accent` | 渐变 + 光晕 |
| 主按钮 | `glass-btn-primary` | 或 `<Button variant="primary">` |
| 次要按钮 | `glass-btn-secondary` | 或 `<Button variant="secondary">` |
| 危险操作 | `glass-btn-danger` | 或 `<Button variant="danger">` |
| 确认操作 | `glass-btn-success` | 或 `<Button variant="success">` |
| 输入框 | `glass-input` | focus 时自动光晕 |
| 弹窗 | `<Modal>` 组件 | 内部使用 `glass-modal` |
| 状态标签 | `<Badge>` 组件 | 6 种 variant |
| Toast | `toast(type, message)` | 4 种类型，右下角 3.5s |

**GlassCard 组件 Props**：
```tsx
<GlassCard intensity="medium" hover glow animated delay={100}>
  // intensity: 'light' | 'medium' | 'heavy' | 'accent'
  // hover: 桌面端悬停增强
  // glow: 鼠标跟随光效（仅桌面端）
  // animated: 入场动画 (fadeInUp)
  // delay: 动画延迟 ms
</GlassCard>
```

### 7.3 响应式设计

```
断点:
- sm:  640px   (大屏手机)
- md:  768px   (管理端侧边栏折叠切换点)
- lg:  1024px  (小桌面)
- xl:  1280px  (桌面)

策略:
- 客户端 (Customer): mobile-first，max-w-lg (448px) 限宽
- 管理端 (Admin): desktop-first，md 以下侧边栏变抽屉

关键布局尺寸:
- 管理端侧边栏: w-64 (256px) fixed
- 管理端顶栏: h-[60px] 桌面 / h-[56px] 移动
- 客户端底部 Tab: fixed + safe-area-bottom
- 客户端内容区: pb-[68px] 避开 Tab
```

### 7.4 动效使用规范

**优先使用预定义 CSS 类**，不要手写 animation：

```tsx
// 入场动效
<div className="animate-fade-in-up">           // 淡入上移（最常用）
<div className="animate-fade-in-left">         // 侧边栏导航项
<div className="animate-fade-in-right">        // Toast 通知
<div className="animate-spring-in">            // 弹性缩放（登录页 Logo）
<div className="animate-scale-in">             // 弹窗内容
<div className="animate-shake">                // 表单校验错误

// 循环动效
<div className="animate-pulse-glow">           // 侧边栏 active 圆点
<div className="skeleton">                     // 骨架屏加载

// Stagger 列表入场（使用 delay 辅助类）
{orders.map((order, i) => (
  <div
    key={order.id}
    className="animate-fade-in-up anim-initial"
    style={{ animationDelay: `${30 + i * 50}ms` }}
  >
    <OrderCard order={order} />
  </div>
))}
```

**4 种缓动曲线**（CSS 变量，globals.css 定义）：

| 变量 | 值 | 用途 |
|---|---|---|
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | 缩放/弹性位移 |
| `--ease-damping` | `cubic-bezier(0.25, 0.46, 0.45, 0.94)` | 淡入/平滑过渡 |
| `--ease-smooth` | `cubic-bezier(0.4, 0, 0.2, 1)` | 通用标准缓动 |
| `--ease-bounce` | `cubic-bezier(0.68, -0.55, 0.265, 1.55)` | 强弹性效果 |

**桌面端 vs 移动端差异**：
- 桌面端（`@media (hover: hover)`）：卡片悬停浮起、按钮光泽扫过、鼠标跟随光效
- 移动端：纯触控反馈（`:active` scale），无悬停效果

### 7.5 状态颜色使用

```tsx
// Badge 组件（6 种 variant）
<Badge variant="success" size="sm">出签</Badge>
<Badge variant="danger" size="sm">拒签</Badge>
<Badge variant="warning" size="sm">待审核</Badge>
<Badge variant="info" size="sm">已对接</Badge>
<Badge variant="purple" size="sm">审核中</Badge>
<Badge variant="default" size="sm">待对接</Badge>

// StatusBadge 组件（自动映射 11 种状态到 variant）
<StatusBadge status={order.status} />

// CSS 变量直接使用
<div className="text-[var(--color-success)]">     // 绿色文字
<div className="bg-[var(--color-error)]/10">      // 红色背景 10% 透明
<div className="border-[var(--color-warning)]/20"> // 黄色边框
```

### 7.6 动态背景

- 桌面端自动渲染 `DynamicBackground`（全局 layout.tsx 已引入）
- 组件内不需要手动处理，CSS media query 自动切换桌面/移动端
- 管理端 `glass-sidebar` 的 z-index 为 40，内容层 `z-10`，不冲突

---

## 8. 安全编码规范

### 8.1 输入校验

所有 API 输入必须使用 Zod 校验：

```typescript
import { z } from 'zod'

const createOrderSchema = z.object({
  customerName: z.string().min(1).max(50),
  customerPhone: z.string().regex(/^1[3-9]\d{9}$/),
  customerEmail: z.string().email().optional(),
  passportNo: z.string().max(20).optional(),
  targetCountry: z.string().min(1).max(50),
  visaType: z.string().min(1).max(50),
  amount: z.number().positive().max(999999.99),
})

// 使用
const body = createOrderSchema.parse(await request.json())
```

### 8.2 数据脱敏

```typescript
// src/lib/desensitize.ts

export function desensitizePhone(phone: string): string {
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

export function desensitizePassport(passport: string): string {
  if (passport.length <= 5) return '***'
  return passport.slice(0, 2) + '***' + passport.slice(-3)
}

// 根据角色决定是否脱敏
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

### 8.3 禁止事项

| 禁止 | 理由 |
|---|---|
| 在前端存储敏感数据 | XSS 风险 |
| 在日志中打印密码/Token | 信息泄露 |
| 使用 `eval()` | 代码注入 |
| 拼接 SQL | SQL 注入（Prisma 已防） |
| 在 URL 中传递 Token | 会被浏览器历史/日志记录 |
| 使用 `dangerouslySetInnerHTML` | XSS（除非经过 DOMPurify） |

---

## 9. 测试规范

### 9.1 测试层级

| 层级 | 工具 | 覆盖目标 | 要求 | 当前状态 |
|---|---|---|---|:---:|
| 单元测试 | Vitest | 工具函数、Service 层 | 核心逻辑 100% | ✅ 74 用例 |
| 集成测试 | Vitest + Prisma | API Routes | 关键流程 100% | ⬜ 待补充 |
| E2E 测试 | Playwright | 用户操作流程 | 核心工作流 | ⬜ 待补充 |

### 9.2 测试文件命名

```
src/lib/__tests__/transition.test.ts
src/services/__tests__/order.service.test.ts
src/app/api/orders/__tests__/route.test.ts
e2e/order-workflow.spec.ts
```

### 9.3 状态机测试（必测）

```typescript
// src/lib/__tests__/transition.test.ts

describe('TransitionService', () => {
  it('应该允许资料员从 PENDING_CONNECTION 接单到 CONNECTED', async () => {
    const order = await createTestOrder({ status: 'PENDING_CONNECTION' })
    const collector = await createTestUser({ role: 'DOC_COLLECTOR' })

    const result = await transitionService.transition(
      order.id, 'CONNECTED', collector.id
    )

    expect(result.status).toBe('CONNECTED')
  })

  it('应该拒绝客服从 PENDING_CONNECTION 接单', async () => {
    const order = await createTestOrder({ status: 'PENDING_CONNECTION' })
    const cs = await createTestUser({ role: 'CUSTOMER_SERVICE' })

    await expect(
      transitionService.transition(order.id, 'CONNECTED', cs.id)
    ).rejects.toThrow('无权执行此操作')
  })

  // 测试所有合法流转...
  // 测试所有非法流转...
})
```

---

## 10. Code Review 规范

### 10.1 Review 检查清单

**必查项**：
- [ ] 代码符合 TypeScript 严格模式
- [ ] 无 `any` 类型
- [ ] API 输入有 Zod 校验
- [ ] 数据查询有 `companyId` 过滤
- [ ] 状态流转经过 TransitionService
- [ ] 错误处理完整
- [ ] 无敏感信息泄露（日志/前端）
- [ ] 组件不超过 300 行
- [ ] 有对应测试用例

**加分项**：
- [ ] 性能优化（select 只取需要的字段）
- [ ] 良好的命名和注释
- [ ] 响应式设计
- [ ] 动效流畅

### 10.2 Review 流程

1. 开发者提交 PR，填写 PR 模板
2. 至少 1 人 Review（核心模块需 2 人）
3. CI 通过（Lint + Test + Build）
4. Reviewer 按清单逐项检查
5. 通过后 Squash Merge 到目标分支
6. 删除已合并的功能分支

---

## 11. 文档规范

### 11.1 代码注释

```typescript
/**
 * 状态机流转核心方法
 * @param orderId - 订单ID
 * @param toStatus - 目标状态
 * @param userId - 操作人ID
 * @param detail - 操作详情（可选）
 * @returns 更新后的订单
 * @throws TransitionError - 不合法的状态流转
 * @throws ForbiddenError - 无权限
 */
async transition(
  orderId: string,
  toStatus: OrderStatus,
  userId: string,
  detail?: string
): Promise<Order> {
  // ...
}
```

### 11.2 README 维护

项目根目录 `README.md` 必须包含：
- 项目简介
- 技术栈
- 快速启动步骤
- 环境变量说明
- 目录结构简述
- 部署说明

---

## 12. 部署规范

### 12.1 环境管理

| 环境 | 分支 | URL | 数据库 |
|---|---|---|---|
| 开发 | `develop` | dev.erp.xxx.com | RDS 开发实例 |
| 预发布 | `release/*` | staging.erp.xxx.com | RDS 预发实例 |
| 生产 | `main` | erp.xxx.com | RDS 生产实例 |

### 12.2 部署流程

```bash
# 1. 合并到目标分支
git checkout main
git merge develop --no-ff

# 2. 打 tag
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin main --tags

# 3. 服务器拉取并构建
ssh deploy@server
cd /app/ERP
git pull origin main
npm ci
npx prisma migrate deploy
npm run build
pm2 restart erp

# 4. 验证
curl https://erp.xxx.com/api/health
```

### 12.3 回滚方案

```bash
# 回滚到上一个版本
git checkout v0.9.0
npm ci
npx prisma migrate deploy
npm run build
pm2 restart erp

# 数据库回滚（谨慎）
npx prisma migrate resolve --rolled-back <migration_name>
```

---

## 附录 A：常用命令速查

```bash
# 开发
npm run dev              # 启动 Custom Server (tsx server.ts，含 Socket.io)
npm run dev:next         # 启动纯 Next.js (无 Socket.io)
npx prisma studio        # 打开数据库可视化
npx prisma migrate dev   # 创建并应用迁移
npx prisma db seed       # 运行种子数据

# 构建
npm run build            # 生产构建
npm run start            # 启动生产服务器
npm run lint             # ESLint 检查
npm run type-check       # TypeScript 类型检查

# 测试
npm run test             # 运行单元测试
npm run test:e2e         # 运行 E2E 测试
npm run test:coverage    # 测试覆盖率

# 部署
npx prisma migrate deploy  # 生产数据库迁移
pm2 restart erp            # 重启应用
pm2 logs erp               # 查看日志
```

---

## 13. TypeScript 与 Prisma 类型防错指南

> **背景**：本项目启用了 `exactOptionalPropertyTypes: true`，结合 Prisma ORM 的 `null` vs `undefined` 语义差异，容易产生大量类型错误。以下规则**必须严格遵守**。

### 13.1 核心问题：`undefined` ≠ `null`

Prisma 可选字段（`String?`）在数据库中是 `null`，但 TypeScript 的 `.optional()` 返回 `string | undefined`。

**tsconfig.json 中 `exactOptionalPropertyTypes: true` 的影响**：
- `{ key?: string }` 表示 `key` 可以**不传**或传 `string`，但**不能传 `undefined`**
- 而 zod 的 `.optional()` 返回 `string | undefined`，直接传给 Prisma 会报错

### 13.2 黄金规则

#### 规则 1：Prisma 创建/更新数据时，可选字段必须用 `?? null`

```typescript
// ❌ 错误：undefined 不能赋值给 Prisma 的可选字段
await prisma.user.create({
  data: {
    email: data.email,        // string | undefined → 报错！
    departmentId: data.dept,  // string | undefined → 报错！
  },
})

// ✅ 正确：将 undefined 转为 null
await prisma.user.create({
  data: {
    email: data.email ?? null,
    departmentId: data.dept ?? null,
  },
})
```

#### 规则 2：构建 update 对象时逐字段赋值

```typescript
// ❌ 错误：直接 spread body，可能包含非法字段
await prisma.order.update({
  where: { id },
  data: { ...body },
})

// ✅ 正确：逐字段白名单赋值
const updateData: Record<string, unknown> = {}
if (data.name !== undefined) updateData.name = data.name
if (data.email !== undefined) updateData.email = data.email ?? null
await prisma.order.update({
  where: { id },
  data: updateData,
})
```

#### 规则 3：函数参数中的可选字段用 `string | undefined` 而非 `string?`

```typescript
// ❌ 错误：调用时传 undefined 会触发 exactOptionalPropertyTypes 报错
async function transition(input: {
  orderId: string
  detail?: string       // ← 调用者传 detail: string | undefined 会报错
})

// ✅ 正确：明确接受 undefined
async function transition(input: {
  orderId: string
  detail: string | undefined   // ← 允许传入 undefined
})
```

#### 规则 4：API Route 中 zod 的 `.optional()` 结果必须转 null

```typescript
const schema = z.object({
  email: z.string().email().optional(),   // string | undefined
})

const data = schema.parse(body)

// ✅ 在 Prisma 调用处转换
await prisma.user.create({
  data: {
    email: data.email ?? null,   // undefined → null
  },
})
```

#### 规则 5：Prisma include/select 必须匹配 schema 中的关系名

```typescript
// ❌ 错误：旧字段名
include: {
  documentFiles: true,   // ← 不存在，应为 files
  assignee: true,        // ← 不存在，应为 collector
}

// ✅ 正确：匹配 Prisma schema 的关系名
include: {
  files: true,
  collector: { select: { id: true, realName: true } },
}
```

#### 规则 6：Prisma select 字段必须匹配 schema 字段名

```typescript
// ❌ 错误：旧字段名
select: {
  isActive: true,    // ← schema 中是 status: UserStatus
}

// ✅ 正确
select: {
  status: true,
}
```

### 13.3 常见错误速查表

| 错误信息 | 原因 | 修复 |
|---|---|---|
| `undefined is not assignable to type 'string \| null'` | 传了 `undefined` 给 Prisma 可选字段 | 加 `?? null` |
| `does not exist in type '...Include'` | include 的关系名不匹配 | 对照 schema 修正 |
| `does not exist in type '...Select'` | select 的字段名不匹配 | 对照 schema 修正 |
| `not assignable to type 'string'` (exactOptionalPropertyTypes) | 传了 `undefined` 给 `{ key?: string }` | 改为 `string \| undefined` 或条件赋值 |
| `Cannot find name 'UserRole'` | 缺少 import | 添加 `import type { UserRole } from '@/types/user'` |
| `has no exported member 'xxx'` | 导出名不匹配 | 检查实际导出名 |

### 13.4 开发 Checklist

每次写 Prisma 相关代码时，对照以下清单：

- [ ] Prisma `create` 中所有可选字段都加了 `?? null`
- [ ] Prisma `update` 使用白名单字段赋值，不直接 spread body
- [ ] Prisma `include` 关系名与 schema 定义一致
- [ ] Prisma `select` 字段名与 schema 定义一致
- [ ] API Route 的 zod schema `.optional()` 结果在 Prisma 调用处转 `null`
- [ ] 函数参数中需要接受 `undefined` 时使用 `T | undefined` 而非 `T?`
- [ ] 所有 import 的类型与实际导出名一致
- [ ] 运行 `npx tsc --noEmit` 确认零错误后再提交

### 13.5 快速验证命令

```bash
# 提交前必跑
npx tsc --noEmit      # TypeScript 类型检查
npm run build          # 完整构建验证
```

---

## 14. 已知技术债务与待办

| 项目 | 说明 | 优先级 | 状态 |
|---|---|---|:---:|
| ~~Next.js 安全漏洞~~ | ~~当前 14.2.18 有多个已知漏洞，建议升级到最新稳定版~~ | ~~P1~~ | ✅ 已升级至 15.5.14 |

### 已解决

| 项目 | 说明 | 解决日期 |
|---|---|---|
| OSS 集成 | `src/lib/oss.ts` 已接入阿里云 ali-oss SDK | 2026-03-20 |
| Socket.io 集成 | `server.ts` Custom Server + Socket.io 共享端口 | 2026-03-20 |
| 密码重置 | `/api/auth/reset-password` 端点 + 页面已实现 | 2026-03-20 |
| Notification API | 创建 GET/PATCH/POST 三个路由，前端 store 全链路就绪 | 2026-03-20 |
| DATABASE_URL 编码 | 密码含@特殊字符，URL编码为%40 | 2026-03-20 |

---

## 15. C 端平台开发规范（M8 起生效）

### 15.1 核心原则

**ERP 零改动**：`admin/*`、`customer/*`、`api/*`、`modules/erp/*`、`shared/lib/*`、`shared/ui/*`、`shared/stores/*`、`shared/hooks/*`、`shared/types/*` 下的现有文件 **禁止修改**。C 端页面和组件是纯增量或替换现有门户层文件。

### 15.2 目录规范

| 内容 | 放置位置 |
|---|---|
| 门户页面 | `src/app/portal/*` |
| 门户通用组件 | `src/components/portal/*` |
| 工具模块页面 | `src/app/portal/tools/{module}/page.tsx` (保留) |
| 工具模块 API | `src/app/api/{module}/route.ts` |
| 工具模块组件 | `src/components/portal/{module}/*.tsx`（或页面内联） |

### 15.3 import 规范

```typescript
// ✅ 正确：直接复用现有基础设施
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { apiFetch } from '@/lib/api-client'
import { useAuth } from '@/hooks/use-auth'
import { GlassCard } from '@/components/layout/glass-card'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/types/user'

// ❌ 禁止：修改现有文件的 import 路径
// ❌ 禁止：从 portal/ 向 admin/ 或 customer/ 添加 import
```

### 15.4 新增 Prisma Model 规范

继承第 6 节数据库规范，额外要求：
- 所有新表必须带 `erp_` 前缀
- 新表必须包含 `companyId String?` 字段（如需多租户隔离）
- 新表必须包含 `createdAt DateTime @default(now())`

### 15.5 C 端布局规范

- C 端使用独立 `layout.tsx`（含底部 5 Tab），不复用 admin/customer 布局
- 底部 5 Tab：首页/服务/工具/订单/我的
- 首页不限宽（全屏 Hero），工具页/服务页 `max-w-lg mx-auto`（移动端优先）
- 首页 `/` 是 Server Component 壳（SEO），交互部分用 Client Component

### 15.6 验证清单

每次提交门户代码前，必须确认：

```bash
# 1. ERP 功能零影响
npx tsc --noEmit          # 0 errors
npm run build              # 通过
npx vitest run             # 91 tests pass

# 2. ERP 路由正常
# 浏览器访问 /admin/dashboard → 正常
# 浏览器访问 /customer/orders → 正常
# 浏览器访问 /api/health → 正常

# 3. 无违规修改
git diff --name-only | grep -v "^src/app/portal/|^src/components/portal/|^src/app/page.tsx|^src/app/services/|^src/app/tools/|^src/app/(auth)/|^src/middleware.ts"\|^src/components/portal/\|^src/app/page.tsx\|^src/app/(auth)/login/\|^src/middleware.ts"
# 期望: 空（只改了允许的文件）
```

---

## 16. 手机端 UI 开发规范（M8 起全局强制执行）

> **核心原则**：Mobile-First，桌面端渐进增强。手机端优化不得破坏桌面端体验。
> **设计参考**：Airbnb App / Apple.com / Linear / Notion / Stripe / 微信
> **适用范围**：所有 `portal/`、`components/portal/`、根路径页面下的新增代码。

### 16.1 视口与安全区

```tsx
// 每个页面必须在 layout.tsx 中包含 viewport meta（已有则不重复）
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1" />
```

**安全区适配**（刘海屏/底部横条）：

| 位置 | CSS | 说明 |
|---|---|---|
| 顶栏 | `padding-top: env(safe-area-inset-top)` | 刘海区域 |
| 底部Tab | `padding-bottom: env(safe-area-inset-bottom)` | 底部横条 |
| 左右 | 自动适配 | 一般不需要额外处理 |

**Tailwind 实现**：
```tsx
// 底部Tab
<nav className="fixed bottom-0 pb-[env(safe-area-inset-bottom)] ...">

// 内容区底部留白（避开Tab）
<main className="pb-[calc(68px+env(safe-area-inset-bottom))] ...">
```

### 16.2 触控区域标准

**Apple HIG 标准：所有可点击元素最小 44×44px。**

| 元素 | 最小尺寸 | Tailwind |
|---|---|---|
| 按钮 | 44×44px | `min-h-[44px]` |
| 图标按钮 | 44×44px | `min-h-[44px] min-w-[44px]` |
| 列表项 | 高度≥56px | `min-h-[56px]` |
| 输入框 | 高度≥48px | `py-3.5` |
| Tab项 | 高度≥48px | `py-2` (56px total) |
| 卡片间距 | 12px | `gap-3` |

**点击反馈**（手机无 hover，必须有 `:active`）：
```tsx
// ✅ 正确：active 反馈
className="active:scale-[0.97] active:bg-white/[0.08] transition-transform duration-100"

// ❌ 错误：只有 hover 无 active
className="hover:bg-white/[0.08]"  // 手机上永远不触发
```

### 16.3 布局规范

| 规则 | 值 | 说明 |
|---|---|---|
| 内容最大宽度 | `max-w-lg`（448px） | 超宽居中留白 |
| 左右边距 | `px-4`（16px） | 基础间距 |
| 底部留白 | `pb-[68px]` | 避开底部Tab |
| 顶部留白 | `pt-14`（56px） | 避开固定顶栏 |
| Section间距 | `py-12` ~ `py-16` | 区域间呼吸感 |

### 16.4 横向滚动规范

所有横向滚动容器（目的地卡片、Tab筛选栏等）**必须遵守**：

```tsx
<div
  className="
    flex gap-3 overflow-x-auto
    snap-x snap-mandatory          /* scroll-snap */
    -webkit-overflow-scrolling:touch /* iOS 惯性滚动 */
    scrollbar-none                  /* 隐藏滚动条 */
    pb-2                            /* 底部留白 */
  "
>
  {items.map(item => (
    <div key={item.id} className="flex-shrink-0 snap-start ...">
      {/* 卡片内容 */}
    </div>
  ))}
</div>
```

```css
/* tailwind.config.ts 中添加 scrollbar-none */
scrollbar: {
  none: { '&::-webkit-scrollbar': { display: 'none' }, '-ms-overflow-style': 'none', 'scrollbar-width': 'none' }
}
```

### 16.5 动画性能（手机端专项）

| 规则 | 说明 |
|---|---|
| **只动画 GPU 属性** | `transform` 和 `opacity` 以外的属性禁止动画 |
| **will-change** | 滚动容器 `will-change: scroll-position`，动画元素 `will-change: transform` |
| **帧率** | 所有动画 60fps，复杂计算用 `requestAnimationFrame` |
| **禁用桌面特效** | 移动端自动禁用：鼠标光晕、hover浮起、液态光泽层 |
| **降低模糊** | 移动端 `backdrop-blur` 降至 `blur(12px)`（桌面 20px） |
| **减少粒子** | 动态背景光球从4个减至2个，尺寸缩小 |
| **懒加载** | 非首屏图片 `loading="lazy"` + `srcSet` 响应式图片 |
| **骨架屏** | 数据加载必须有骨架屏，禁止白屏 |

**`prefers-reduced-motion` 尊重**：
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 16.6 桌面端 vs 移动端差异化

**通过 `@media (hover: hover)` 区分，CSS 层面处理，JS 无需判断。**

| 特性 | 桌面端 | 移动端 |
|---|---|---|
| 卡片hover | 浮起+阴影+光泽层 | 无，仅 `:active` 缩放 |
| 按钮hover | 光泽扫过+背景提亮 | 无，仅 `:active` 变暗 |
| 鼠标光晕 | 400px径向渐变追踪 | `display:none` |
| 浮动光球 | 4个 orb + blur(80px) | 2个静态渐变圆 |
| 顶栏初始态 | 透明→滚动变毛玻璃 | 初始半透明(0.85) |
| 搜索栏 | 始终展开 | 收起为🔍图标 |
| 滚动条 | 自定义细滚动条 | 隐藏 |

```tsx
// DynamicBackground 组件中的实现示例
<div className="hidden md:block">  {/* 4个浮动光球 - 仅桌面 */}</div>
<div className="md:hidden">        {/* 2个静态渐变 - 仅移动 */}</div>

// CSS 实现
@media (hover: hover) {
  .glass-card:hover { transform: translateY(-2px); }
  .glass-card:hover::before { opacity: 1; }  /* 光泽层 */
}
@media (hover: none) {
  .glass-card:active { transform: scale(0.97); }
  .glass-card::before { display: none; }     /* 禁用光泽层 */
}
```

### 16.7 手机端专属 UI 模式

| 模式 | 场景 | CSS/组件 | 参考 |
|---|---|---|---|
| **底部弹出面板** | 筛选/排序/操作菜单 | `fixed bottom-0 rounded-t-2xl` + slideUp动画 | Airbnb/美团 |
| **全屏模态** | 创建订单/表单 | `fixed inset-0` + slideUp | Linear/Notion |
| **Toast底部居中** | 操作反馈 | `fixed bottom-20 left-1/2 -translate-x-1/2` | iOS风格 |
| **横向滚动Tab** | 状态筛选 | `overflow-x-auto snap-x` + 底部指示条 | 微信/淘宝 |
| **骨架屏列表** | 加载态 | `skeleton` CSS 类 | 所有主流App |
| **空状态插画** | 无数据 | 图标+标题+描述+CTA按钮 | Notion/Slack |
| **下拉刷新** | 列表刷新 | Touch事件检测（M9+可选） | 微信 |

**底部弹出面板（Bottom Sheet）CSS**：
```css
.bottom-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 85vh;
  background: rgba(32, 38, 54, 0.96);
  backdrop-filter: blur(40px);
  border-radius: 20px 20px 0 0;
  border-top: 1px solid rgba(255,255,255,0.08);
  animation: slideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  /* 顶部拖拽条 */
}
.bottom-sheet::before {
  content: '';
  display: block;
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: rgba(255,255,255,0.2);
  margin: 12px auto;
}
```

### 16.8 文字排版（手机端）

| 层级 | 手机端 | 桌面端 | 用途 |
|---|---|---|---|
| Hero标题 | 28px / 700 | 32-40px / 700 | 首屏大标题 |
| 页面标题 | 20px / 700 | 24px / 700 | Section标题 |
| 卡片标题 | 16px / 600 | 18px / 600 | 工具/服务卡片 |
| 正文 | 14px / 400 | 14px / 400 | 描述文字 |
| 辅助文字 | 12px / 400 | 12-13px / 400 | 标签/时间 |
| 极小文字 | 11px / 500 | 11px / 500 | 角标/版权 |

**行高**：`leading-relaxed`（1.625）用于正文，`leading-tight`（1.25）用于标题

### 16.9 图片响应式

```tsx
// ✅ 正确：响应式图片
<Image
  src="/destinations/japan.jpg"
  alt="日本签证"
  width={360}
  height={480}
  sizes="(max-width: 768px) 50vw, 25vw"
  loading="lazy"           // 非首屏图片
  className="object-cover rounded-2xl"
/>

// ✅ 首屏图片优先加载
<Image
  src="/hero-bg.jpg"
  alt=""
  priority                  // 首屏
  fill
  className="object-cover"
/>
```

### 16.10 手机端验证清单

**每次提交前，Chrome DevTools 手机模式逐项验证**：

```
视口与布局
□ 375px（iPhone SE）无水平滚动条
□ 390px（iPhone 14）布局正常
□ 414px（iPhone 14 Pro Max）布局正常
□ 底部Tab不遮挡内容
□ 顶栏不遮挡内容
□ 刘海屏 safe-area 正常

触控
□ 所有按钮 ≥44px 可点击
□ 列表项 ≥56px 高度
□ 输入框 ≥48px 高度
□ 无误触（间距≥12px）

交互
□ 横向滚动流畅+scroll-snap
□ 无桌面端hover特效（光泽/浮起/光晕）
□ active 反馈正常
□ 骨架屏加载正常

性能
□ 首屏加载 < 3s（3G模拟）
□ 动画 60fps（Performance面板）
□ 图片懒加载生效
□ 无 layout shift（CLS < 0.1）

桌面端不受影响
□ 桌面端 hover 特效正常
□ 桌面端搜索栏展开显示
□ 桌面端4个光球动画正常
□ 桌面端鼠标跟随光晕正常
```

---

## 17. WebMCP 集成开发规范（M9 起生效）

> **文档版本**: V1.0
> **生成日期**: 2026-04-13
> **最后更新**: 2026-04-13
> **适用范围**: 全团队所有开发人员

### 17.1 目录

1. [WebMCP 集成概述](#171-webmcp-集成概述)
2. [架构特点与影响分析](#172-架构特点与影响分析)
3. [项目调整时的同步策略](#173-项目调整时的同步策略)
4. [实际开发建议](#174-实际开发建议)
5. [WebMCP 工具开发规范](#175-webmcp-工具开发规范)

---

### 17.1 WebMCP 集成概述

本项目已成功集成 OpenTiny NEXT-SDKs 的 WebMCP 功能，使签证 ERP 系统可以被各类 AI 应用（如 VSCode Copilot、Cursor、Trae 等）通过 MCP 协议进行操作。

**核心目标**：
- 提供标准化的 MCP 接口，让 AI 助手能够与 ERP 系统交互
- 保持现有代码库的独立性和可维护性
- 确保 WebMCP 集成不会影响核心业务逻辑的开发

---

### 17.2 架构特点与影响分析

#### 17.2.1 核心架构特点

| 特点 | 说明 |
|------|------|
| **独立目录结构** | 所有 WebMCP 相关代码集中在 [src/webmcp/](file:///workspace/ERP/src/webmcp/) 目录下 |
| **封装性设计** | MCP 工具只是对现有功能的封装，不修改核心业务逻辑 |
| **可选集成** | WebMCP 可以独立启用或禁用，不影响系统核心功能运行 |
| **单向引用** | WebMCP 工具仅引用现有代码，不会被现有代码引用 |

**代码引用关系图**：
```
现有代码 → 业务逻辑 ← WebMCP 工具（仅调用，不修改）
```

#### 17.2.2 对项目增删改的影响

**答案：不会影响！**

WebMCP 集成采用了完全松耦合的插件化架构，具有以下优势：

1. **零侵入性**：WebMCP 代码完全独立，不修改任何现有核心文件
2. **可插拔性**：可以随时移除或禁用 WebMCP，不影响系统功能
3. **向后兼容**：所有现有 API 接口保持完全兼容
4. **风险隔离**：WebMCP 相关的任何问题都不会影响核心业务流程

**示例说明**：
- [order-tools.ts](file:///workspace/ERP/src/webmcp/tools/order-tools.ts) 只是调用了：
  - [auth-store](file:///workspace/ERP/src/shared/stores/auth-store.ts) - 权限检查
  - [rbac.ts](file:///workspace/ERP/src/shared/lib/rbac.ts) - 权限验证
  - 现有的业务 API（目前是模拟实现）

---

### 17.3 项目调整时的同步策略

#### 17.3.1 场景分析表

| 项目调整类型 | 是否需要同步调整 MCP | 说明 | 优先级 |
|-------------|---------------------|------|--------|
| **新增功能** | 可选 | 如果想让 AI 助手使用新功能，需要添加对应的 MCP 工具 | P2 |
| **修改现有 API 接口** | 建议 | 如果 API 参数或返回格式有重大变化，建议更新 MCP 工具 | P2 |
| **修改数据库 schema** | 可选 | 如果不影响 API 接口，可以不同步 | P3 |
| **重构业务逻辑** | 可选 | 只要 API 接口保持兼容，可以不同步 | P3 |
| **修复 bug** | 不需要 | 修复核心代码的 bug 不影响 MCP 工具 | P3 |
| **性能优化** | 不需要 | 性能优化不影响 MCP 工具的功能 | P3 |
| **UI/UX 优化** | 不需要 | UI 优化不影响 MCP 工具的功能 | P3 |

#### 17.3.2 同步调整的最佳实践

当您进行项目调整时，可以遵循以下原则：

**原则 1：API 接口保持向后兼容**
- 尽量保持 API 接口的稳定性，这样 MCP 工具不需要频繁更新
- 如果必须修改 API，考虑同时保留旧接口一段时间（过渡期）

**原则 2：渐进式更新**
```
步骤 1：开发核心业务逻辑（API、组件、状态管理等）
步骤 2：测试核心功能，确保正常运行
步骤 3：（可选）创建对应的 MCP 工具，让 AI 助手可以使用新功能
```

**原则 3：版本控制**
- MCP 工具可以独立版本化，不与核心代码强绑定
- 在 WebMCP 工具代码中添加版本注释，便于追踪变更

#### 17.3.3 API 变更时的处理策略

| API 变更类型 | 处理方式 |
|------------|---------|
| **新增字段** | MCP 工具可以保持不变，自动忽略新字段 |
| **删除字段** | 需要更新 MCP 工具，移除对已删除字段的引用 |
| **修改字段类型** | 需要更新 MCP 工具，确保类型兼容性 |
| **修改参数** | 需要更新 MCP 工具的输入 schema |
| **新增接口** | 可选：添加对应的 MCP 工具 |
| **删除接口** | 需要：移除对应的 MCP 工具或改为模拟实现 |

---

### 17.4 实际开发建议

#### 17.4.1 开发新功能时

```typescript
// ✅ 推荐流程
// 1. 先开发核心业务逻辑
// 2. 测试核心功能，确保正常运行
// 3. （可选）创建对应的 MCP 工具，让 AI 助手可以使用新功能

// 示例：新增订单批量导出功能
// 步骤 1：开发 API
// src/app/api/orders/batch-export/route.ts
export async function POST(request: NextRequest) {
  // 实现批量导出逻辑
}

// 步骤 2：测试 API
// 确保 API 正常工作

// 步骤 3：（可选）添加 MCP 工具
// src/webmcp/tools/order-tools.ts
server.registerTool(
  'batch_export_orders',
  {
    title: '批量导出订单',
    description: '批量导出订单数据',
    inputSchema: { /* ... */ }
  },
  async (params: any) => {
    // 调用新开发的 API
  }
)
```

#### 17.4.2 修改现有功能时

```typescript
// ✅ 推荐流程
// 步骤 1：修改核心业务逻辑，保持 API 向后兼容
// 步骤 2：测试核心功能，确保正常运行
// 步骤 3：（可选）如果 API 有重大变化，更新对应的 MCP 工具

// 示例：修改订单查询 API
// 步骤 1：修改 API，保持向后兼容
// src/app/api/orders/route.ts
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const page = searchParams.get('page') || '1'
  const pageSize = searchParams.get('pageSize') || '20'
  // 新增支持的参数
  const sortBy = searchParams.get('sortBy') || 'createdAt'
  
  // 保持原有逻辑不变，新增功能作为可选
  // ...
}

// 步骤 2：测试 API
// 确保旧参数仍然正常工作

// 步骤 3：（可选）更新 MCP 工具
// src/webmcp/tools/order-tools.ts
// 如果新功能对 AI 助手有用，可以更新工具的 inputSchema
```

#### 17.4.3 开发检查清单

每次提交代码前，对照以下清单：

- [ ] 核心业务逻辑测试通过
- [ ] TypeScript 类型检查通过（`npx tsc --noEmit`）
- [ ] 构建通过（`npm run build`）
- [ ] WebMCP 功能正常（可选验证）
- [ ] 如有 API 重大变更，考虑是否需要更新 MCP 工具

---

### 17.5 WebMCP 工具开发规范

#### 17.5.1 目录结构

```
src/webmcp/
├── index.ts              # 导出模块
├── mcp-server.ts         # MCP Server 创建和管理
├── webmcp-client.ts      # WebMCP Client 连接管理
├── WebMcpInitializer.tsx # React 客户端初始化组件
└── tools/
    ├── visa-tools.ts     # 签证相关 MCP 工具
    ├── permission-tools.ts # 权限管理 MCP 工具
    ├── order-tools.ts    # 订单管理 MCP 工具
    ├── user-tools.ts     # 用户管理 MCP 工具
    ├── document-tools.ts # 文档管理 MCP 工具
    ├── chat-tools.ts     # 聊天管理 MCP 工具
    ├── notification-tools.ts # 通知管理 MCP 工具
    ├── document-requirement-tools.ts # 资料需求管理工具
    └── ai-tools.ts       # AI 工具
```

#### 17.5.2 工具开发模板

```typescript
// src/webmcp/tools/my-tools.ts
import { getMcpServer } from '../mcp-server'
import { useAuthStore } from '@shared/stores/auth-store'

export const registerMyTools = async () => {
  if (typeof window === 'undefined') return

  const server = getMcpServer()
  if (!server) return

  const { z } = await import('@opentiny/next-sdk')

  server.registerTool(
    'my_tool_name',
    {
      title: '工具标题',
      description: '工具描述',
      inputSchema: {
        param1: z.string().describe('参数1描述'),
        param2: z.number().describe('参数2描述')
      }
    },
    async (params: any) => {
      try {
        // 1. 获取用户信息
        const authStore = useAuthStore.getState()
        const role = authStore.user?.role

        if (!role) {
          return {
            content: [{ type: 'text', text: '用户未登录' }]
          }
        }

        // 2. 权限检查
        const { hasPermission } = await import('@shared/lib/rbac')
        if (!hasPermission(role, 'my_resource', 'my_action')) {
          return {
            content: [{ type: 'text', text: '权限不足' }]
          }
        }

        // 3. 工具实现逻辑
        // 调用现有的 API 或业务逻辑
        return {
          content: [{ type: 'text', text: '结果' }]
        }
      } catch (error) {
        console.error('工具执行失败:', error)
        return {
          content: [{ type: 'text', text: '执行失败' }]
        }
      }
    }
  )
}
```

#### 17.5.3 工具注册流程

1. 在 `src/webmcp/tools/` 目录下创建新的工具文件
2. 在工具文件中使用 `server.registerTool()` 注册工具
3. 在 `src/webmcp/tools/` 目录下的对应文件中导出注册函数
4. 在 `src/webmcp/index.ts` 中导出注册函数
5. 在 `src/webmcp/WebMcpInitializer.tsx` 中调用注册函数

#### 17.5.4 权限检查规范

所有 MCP 工具必须包含权限检查：

```typescript
// ✅ 正确：包含权限检查
async (params: any) => {
  const authStore = useAuthStore.getState()
  const role = authStore.user?.role

  if (!role) {
    return { content: [{ type: 'text', text: '用户未登录' }] }
  }

  const { hasPermission } = await import('@shared/lib/rbac')
  if (!hasPermission(role, 'resource', 'action')) {
    return { content: [{ type: 'text', text: '权限不足' }] }
  }

  // 工具逻辑
}

// ❌ 错误：缺少权限检查
async (params: any) => {
  // 直接执行，没有权限检查
}
```

#### 17.5.5 错误处理规范

所有 MCP 工具必须包含完整的错误处理：

```typescript
// ✅ 正确：包含错误处理
async (params: any) => {
  try {
    // 工具逻辑
    return { content: [{ type: 'text', text: '成功' }] }
  } catch (error) {
    console.error('工具执行失败:', error)
    return {
      content: [{ type: 'text', text: '执行失败：' + (error as Error).message }]
    }
  }
}

// ❌ 错误：缺少错误处理
async (params: any) => {
  // 没有 try-catch，错误会直接抛出
}
```

---

### 17.6 总结

| 问题 | 答案 |
|------|------|
| **WebMCP 集成是否影响后期项目及代码的增删改？** | ❌ 不会，WebMCP 是独立模块，松耦合集成 |
| **项目调整时是否需要同步调整 MCP？** | ⚠️ 建议同步，但不是必须的，取决于具体调整 |
| **MCP 工具可以独立开发吗？** | ✅ 可以，完全独立开发、测试、部署 |
| **可以禁用 WebMCP 吗？** | ✅ 可以，不影响核心功能运行 |

WebMCP 集成采用了**插件化架构**，是对现有系统的**增强而非替代**。您可以完全按照原有的开发流程进行项目开发，MCP 工具只是让 AI 助手能够更好地与您的系统交互。

---

*文档结束*
