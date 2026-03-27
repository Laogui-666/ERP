# 沐海旅行 - 签证行业ERP系统

# 开发规范

> **文档版本**: V13.0
> **生成日期**: 2026-03-19
> **最后更新**: 2026-03-28 03:30
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

> ⚠️ **路由结构约定**：管理端使用实际路径段 `admin/`（非路由组 `(admin)/`），客户端同理使用 `customer/`。
> 路由组 `()` 不参与 URL 路径，仅用于 `auth` 等不需要路径前缀的场景。新增页面必须放在 `admin/` 或 `customer/` 实际目录下。

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

### 7.1 Tailwind 使用规范

```tsx
// ✅ 正确：使用 Tailwind 原子类
<div className="flex items-center gap-3 rounded-lg bg-white/5 p-4 backdrop-blur-xl">

// ✅ 正确：玻璃拟态使用自定义 CSS 类
<div className="glass-card p-5">

// ❌ 错误：内联 style（除非动态值）
<div style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>

// ❌ 错过：过长的 className（拆分为组件）
<div className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-3 backdrop-blur-xl border border-white/8 shadow-lg hover:bg-white/10 transition-all duration-300 ease-out">
```

### 7.2 响应式设计

```
断点 (Tailwind 默认):
- sm:  640px   (大屏手机)
- md:  768px   (平板)
- lg:  1024px  (小桌面)
- xl:  1280px  (桌面)
- 2xl: 1536px  (大桌面)

策略:
- 客户端 (Customer): mobile-first，sm 起步
- 管理端 (Admin): desktop-first，md 以下折叠侧边栏
```

### 7.3 状态颜色使用

```tsx
// 使用统一的状态颜色映射，不要硬编码颜色
import { STATUS_COLORS } from '@/lib/constants'

<span className={cn(
  'status-badge',
  STATUS_COLORS[order.status]?.bg,
  STATUS_COLORS[order.status]?.text,
)}>
  {STATUS_LABELS[order.status]}
</span>
```

### 7.4 动效使用

```tsx
// 使用统一的动效类名
<div className="animate-fade-in-up">          // 淡入上移
<div className="animate-slide-in-right">      // 滑入
<button className="glass-btn-primary">        // 按钮悬停自动动效

// Stagger 动效（列表项依次出现）
{orders.map((order, i) => (
  <div
    key={order.id}
    className="animate-fade-in-up"
    style={{ animationDelay: `${i * 50}ms` }}
  >
    <OrderCard order={order} />
  </div>
))}
```

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

*文档结束*
