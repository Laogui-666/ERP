# 架构重构方案 — 模块化全栈 Web App

> **文档版本**: V1.0
> **创建日期**: 2026-03-31
> **目标**: 将项目从单一 ERP 系统升级为模块化大型综合全栈 Web App
> **原则**: 基于实际代码依赖分析，最小改动达到最大效果

---

## 目录

1. [现状分析](#1-现状分析)
2. [核心问题](#2-核心问题)
3. [架构设计](#3-架构设计)
4. [目标目录结构](#4-目标目录结构)
5. [依赖规则](#5-依赖规则)
6. [模块划分](#6-模块划分)
7. [迁移方案](#7-迁移方案)
8. [新增模块开发规范](#8-新增模块开发规范)
9. [与现有规范的兼容](#9-与现有规范的兼容)

---

## 1. 现状分析

### 1.1 当前规模

| 维度 | 数量 |
|---|---|
| 源文件 | 141 个 |
| 代码行数 | ~18,600 行 |
| API 路由 | 50 个 |
| 页面 | 18 个 |
| 组件 | 31 个 |
| Hooks | 5 个 |
| Stores | 4 个 |
| lib/ 工具 | 14 个文件 / 1761 行 |

### 1.2 依赖图谱（实际扫描结果）

```
                    ┌─────────────────────────────────────┐
                    │           pages (18个)              │
                    │   import hooks + stores + lib       │
                    └──────────┬──────────────────────────┘
                               │
                    ┌──────────▼──────────────────────────┐
                    │        components (31个)            │
                    │   import hooks + lib (utils为主)    │
                    └──────────┬──────────────────────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
     ┌────────────┐   ┌──────────────┐  ┌────────────┐
     │  hooks(5)  │   │ stores(4)    │  │ API Routes │
     │ → stores   │   │ → api-client │  │ (50个)     │
     │ → lib      │   │              │  │ → lib      │
     └────────────┘   └──────────────┘  └────────────┘
              │                │                │
              └────────────────┼────────────────┘
                               ▼
                    ┌──────────────────────────────────┐
                    │          lib/ (14个文件)          │
                    │     所有东西混在一起 ⚠️            │
                    └──────────────────────────────────┘
```

### 1.3 lib/ 内部依赖关系

```
prisma.ts         ← 无依赖，被 44 个 API 路由引用
auth.ts           ← 无依赖，被 42 个 API 路由 + rbac + socket 引用
rbac.ts           → auth.ts，被 28 个 API 路由引用
api-client.ts     ← 无依赖，被 4 个 store + 多个组件引用
logger.ts         ← 无依赖，被 4 个 API 路由 + events + socket 引用
oss.ts            ← 无依赖，被 5 个 API 路由引用
file-types.ts     ← 无依赖，被 3 个 API 路由引用
utils.ts          ← 无依赖，被 30+ 个组件/页面引用

transition.ts     → prisma + events，被 4 个 API 路由引用（ERP 专属）
desensitize.ts    ← 无依赖，被 2 个 API 路由引用（ERP 专属）
events.ts         → logger + socket + chat-system（ERP 专属，最大耦合点）
chat-system.ts    → prisma + socket + logger（ERP/聊天 专属）
notification-icons.ts ← 无依赖（通知 专属）
socket.ts         → auth + prisma + logger（实时通信，跨领域）
```

---

## 2. 核心问题

### 2.1 lib/ 是单体大泥球

14 个文件放在一起，无领域边界。`transition.ts`（ERP 状态机）和 `prisma.ts`（数据库）是邻居，但实际上属于完全不同的层次。

### 2.2 events.ts 是最大耦合点

```typescript
// events.ts 同时引用了 3 个不同领域
import { emitToUser } from '@/lib/socket'        // 实时通信
import { sendSystemMessage } from '@/lib/chat-system'  // 聊天
import { ORDER_STATUS_LABELS } from '@/types/order'    // ERP
```

一个文件引用了 ERP、聊天、实时通信三个领域。新增模块时这里会越来越膨胀。

### 2.3 缺少 Service 层

当前 API 路由直接操作 Prisma，业务逻辑散落在 50 个 route.ts 里。重构时如果改了数据模型，需要逐个改 API 路由。

### 2.4 没有模块边界

新增一个"行程规划"模块，应该放哪？当前结构没有答案。

---

## 3. 架构设计

### 3.1 设计原则

| 原则 | 说明 |
|---|---|
| **模块自治** | 每个模块有独立的 API 封装、类型、Store、Hook、组件 |
| **共享最小化** | 共享层只放真正跨模块的东西（auth、db、UI 基础组件） |
| **依赖单向** | 上层依赖下层，同层模块互不依赖 |
| **故障隔离** | 一个模块崩溃不影响其他模块 |
| **渐进迁移** | 不破坏现有功能，逐步重构 |

### 3.2 分层架构

```
┌─────────────────────────────────────────────────────────┐
│  Layer 4: Pages (src/app/)                              │
│  路由页面，只做"组装"，不写业务逻辑                        │
│  import: Layer 3 + Layer 2                              │
├─────────────────────────────────────────────────────────┤
│  Layer 3: Features (src/features/)                      │
│  领域模块：api + types + store + hook + components       │
│  import: Layer 1（可引用同层其他模块的 types）             │
├─────────────────────────────────────────────────────────┤
│  Layer 2: Shared UI (src/shared/ui/)                    │
│  通用 UI 组件：GlassCard、Button、Badge、Modal...        │
│  import: Layer 1 (仅 utils.ts 的 cn 函数)                │
├─────────────────────────────────────────────────────────┤
│  Layer 1: Core (src/core/)                              │
│  基础设施：db、auth、rbac、logger、oss、socket、utils     │
│  import: 无（底层不依赖上层）                             │
└─────────────────────────────────────────────────────────┘
```

**关键规则**：
- Layer 4 (Pages) ← 可引用 Layer 3 + Layer 2 + Layer 1
- Layer 3 (Features) ← 可引用 Layer 1，可引用其他模块的 types
- Layer 3 模块之间**禁止直接引用**（通过 Layer 1 的事件总线通信）
- Layer 2 (Shared UI) ← 只引用 Layer 1 的 utils.ts
- Layer 1 (Core) ← 不引用任何上层

---

## 4. 目标目录结构

```
src/
├── core/                           # Layer 1: 基础设施（1761行拆分后约822行）
│   ├── db.ts                       # Prisma 客户端单例
│   ├── auth.ts                     # JWT 认证 + Cookie
│   ├── rbac.ts                     # 权限矩阵
│   ├── api-client.ts               # 前端 fetch 封装（Token 刷新）
│   ├── logger.ts                   # 统一日志
│   ├── oss.ts                      # 阿里云 OSS
│   ├── file-types.ts               # 文件类型白名单
│   ├── utils.ts                    # cn()、日期格式化、通用工具
│   ├── event-bus.ts                # 🆕 通用事件总线（替代 events.ts）
│   └── __tests__/                  # 基础设施测试
│
├── features/                       # Layer 3: 领域模块
│   ├── erp/                        # ERP 管理模块
│   │   ├── types.ts                # Order、Applicant、Document... 类型
│   │   ├── api.ts                  # 前端 API 封装（fetch 订单、创建订单...）
│   │   ├── store.ts                # Zustand Store
│   │   ├── hooks.ts                # useOrders、useOrderDetail...
│   │   ├── transition.ts           # 状态机引擎
│   │   ├── desensitize.ts          # 数据脱敏
│   │   ├── analytics.ts            # 数据分析 API 封装
│   │   └── components/             # ERP 专属 UI
│   │       ├── order-card.tsx
│   │       ├── status-badge.tsx
│   │       ├── status-timeline.tsx
│   │       ├── applicant-card.tsx
│   │       ├── applicant-form-item.tsx
│   │       ├── document-panel.tsx
│   │       ├── customer-upload.tsx
│   │       ├── material-panel.tsx
│   │       ├── material-checklist.tsx
│   │       └── ...
│   │
│   ├── chat/                       # 聊天模块
│   │   ├── types.ts                # ChatRoom、ChatMessage...
│   │   ├── api.ts                  # 聊天 API 封装
│   │   ├── store.ts                # ChatStore
│   │   ├── hooks.ts                # useChat
│   │   ├── system.ts               # 系统消息（原 chat-system.ts）
│   │   └── components/
│   │       ├── chat-panel.tsx
│   │       ├── chat-message.tsx
│   │       ├── chat-message-list.tsx
│   │       ├── chat-input.tsx
│   │       └── chat-room-list.tsx
│   │
│   ├── notification/               # 通知模块
│   │   ├── types.ts                # NotificationType...
│   │   ├── api.ts                  # 通知 API 封装
│   │   ├── store.ts                # NotificationStore
│   │   ├── hooks.ts                # useNotifications
│   │   ├── icons.ts                # 通知图标映射（原 notification-icons.ts）
│   │   └── components/
│   │       └── notification-bell.tsx
│   │
│   ├── itinerary/                  # 🆕 行程规划模块（骨架）
│   │   ├── types.ts
│   │   ├── api.ts
│   │   ├── store.ts
│   │   ├── hooks.ts
│   │   └── components/
│   │
│   ├── visa-assessment/            # 🆕 签证评估模块（骨架）
│   │   └── ...
│   │
│   └── wallet/                     # 🆕 钱包模块（骨架）
│       └── ...
│
├── shared/                         # Layer 2: 共享 UI
│   └── ui/
│       ├── glass-card.tsx
│       ├── dynamic-bg.tsx
│       ├── button.tsx
│       ├── badge.tsx
│       ├── modal.tsx
│       ├── input.tsx
│       ├── select.tsx
│       ├── toast.tsx
│       ├── file-preview.tsx
│       ├── camera-capture.tsx
│       └── page-header.tsx
│
├── layouts/                        # 布局组件（跨模块共享）
│   ├── sidebar.tsx
│   └── topbar.tsx
│
├── app/                            # Layer 4: 页面 + API 路由（不变）
│   ├── api/
│   │   ├── auth/                   # 认证 API
│   │   ├── erp/                    # ERP API（从 orders/documents/... 迁移）
│   │   │   ├── orders/
│   │   │   ├── documents/
│   │   │   ├── applicants/
│   │   │   ├── templates/
│   │   │   ├── analytics/
│   │   │   └── ...
│   │   ├── chat/                   # 聊天 API
│   │   ├── notifications/          # 通知 API
│   │   ├── itinerary/              # 🆕 行程 API
│   │   ├── visa-assessment/        # 🆕 签证评估 API
│   │   └── wallet/                 # 🆕 钱包 API
│   ├── (auth)/                     # 登录/注册
│   ├── admin/
│   │   ├── dashboard/
│   │   ├── erp/                    # ERP 页面（当前 admin/orders 等迁移）
│   │   ├── chat/
│   │   ├── itinerary/              # 🆕
│   │   └── ...
│   └── customer/
│
├── types/                          # 全局共享类型
│   ├── api.ts                      # ApiResponse、ApiMeta
│   ├── user.ts                     # UserProfile、UserRole
│   └── events.ts                   # 🆕 全局事件类型
│
├── middleware.ts                    # 不变
├── server.ts                       # 不变
└── styles/                         # 不变
```

---

## 5. 依赖规则

### 5.1 依赖箭头（单向，禁止反向）

```
Pages (app/) ──→ Features ──→ Core
                  │              ▲
                  └──→ Shared UI ─┘
```

### 5.2 具体规则

| 规则 | 允许 | 禁止 |
|---|---|---|
| Pages → Features | ✅ import erp/hooks、chat/store 等 | ❌ 直接 import core/prisma |
| Pages → Core | ✅ import core/utils (cn 函数) | ❌ import core/db (应通过 feature 的 api.ts) |
| Features → Core | ✅ import core/* | ❌ 直接 import 其他 feature |
| Features → Features | ⚠️ 只允许 import types | ❌ import 其他 feature 的 store/hook/api |
| Features 之间通信 | 通过 core/event-bus.ts | ❌ 直接调用其他模块函数 |
| Shared UI → Core | ✅ 只允许 import core/utils | ❌ import core/auth、core/db |
| Core → 任何上层 | ❌ 永远禁止 | — |

### 5.3 模块间通信方式

```
模块 A 想通知模块 B "订单状态变了"

方式 1（推荐）：事件总线
  Module A: eventBus.emit('order:completed', { orderId })
  Module B: eventBus.on('order:completed', (data) => ...)

方式 2：共享类型 + 松耦合
  Module A: api.ts 导出 onOrderCompleted 回调
  Module B: import { onOrderCompleted } from '@/features/erp/api'

方式 3（数据库级）：监听 Prisma 中间件
  适合需要持久化通知的场景
```

---

## 6. 模块划分

### 6.1 当前代码 → 模块映射

| 当前位置 | 目标位置 | 说明 |
|---|---|---|
| `lib/prisma.ts` | `core/db.ts` | 重命名，语义更清晰 |
| `lib/auth.ts` | `core/auth.ts` | — |
| `lib/rbac.ts` | `core/rbac.ts` | — |
| `lib/api-client.ts` | `core/api-client.ts` | — |
| `lib/logger.ts` | `core/logger.ts` | — |
| `lib/oss.ts` | `core/oss.ts` | — |
| `lib/file-types.ts` | `core/file-types.ts` | — |
| `lib/utils.ts` | `core/utils.ts` | — |
| `lib/socket.ts` | `core/socket.ts` | — |
| `lib/events.ts` | `core/event-bus.ts` | 拆分为通用事件总线 + ERP 事件注册 |
| `lib/transition.ts` | `features/erp/transition.ts` | ERP 领域 |
| `lib/desensitize.ts` | `features/erp/desensitize.ts` | ERP 领域 |
| `lib/chat-system.ts` | `features/chat/system.ts` | 聊天领域 |
| `lib/notification-icons.ts` | `features/notification/icons.ts` | 通知领域 |
| `stores/order-store.ts` | `features/erp/store.ts` | — |
| `stores/chat-store.ts` | `features/chat/store.ts` | — |
| `stores/notification-store.ts` | `features/notification/store.ts` | — |
| `stores/auth-store.ts` | `features/auth/store.ts` | — |
| `hooks/use-orders.ts` | `features/erp/hooks.ts` | — |
| `hooks/use-chat.ts` | `features/chat/hooks.ts` | — |
| `hooks/use-notifications.ts` | `features/notification/hooks.ts` | — |
| `hooks/use-auth.ts` | `features/auth/hooks.ts` | — |
| `hooks/use-socket-client.ts` | `core/socket-client.ts` | 基础设施 |
| `types/order.ts` | `features/erp/types.ts` | — |
| `types/chat.ts` | `features/chat/types.ts` | — |
| `types/user.ts` | `types/user.ts` | 保留在全局 |
| `types/api.ts` | `types/api.ts` | 保留在全局 |
| `components/orders/*` | `features/erp/components/` | — |
| `components/documents/*` | `features/erp/components/` | — |
| `components/chat/*` | `features/chat/components/` | — |
| `components/notifications/*` | `features/notification/components/` | — |
| `components/analytics/*` | `features/erp/components/` | — |
| `components/ui/*` | `shared/ui/` | — |
| `components/layout/*` | `layouts/` | — |

### 6.2 events.ts 解耦方案

当前 `events.ts` 是最大耦合点，需要拆分为：

```typescript
// core/event-bus.ts — 通用事件总线（不引用任何领域）
type Handler = (data: unknown) => void
class EventBus {
  private handlers = new Map<string, Set<Handler>>()
  on(event: string, handler: Handler) { ... }
  emit(event: string, data: unknown) { ... }
}
export const eventBus = new EventBus()

// features/erp/events.ts — ERP 领域事件注册
import { eventBus } from '@/core/event-bus'
import { sendSystemMessage } from '@/features/chat/system'
import { createNotifications } from '@/features/notification/api'

eventBus.on('order:status-changed', async (data) => {
  // ERP 自己的逻辑
  createNotifications(...)
  // 跨模块：调用聊天模块的公共 API
  sendSystemMessage(...)
})
```

---

## 7. 迁移方案

### 7.1 三阶段执行

```
阶段 1：搭骨架（不改任何现有 import，纯新增）     约 3h
  ├── 创建 core/ 目录 + 从 lib/ 复制基础设施文件
  ├── 创建 features/ 目录 + 各模块骨架文件
  ├── 创建 shared/ui/ 目录 + 复制 UI 组件
  ├── 创建 tsconfig path 别名映射
  └── 验证：新旧路径并存，tsc 通过

阶段 2：逐步迁移 import（保持功能不变）            约 5h
  ├── 第 2a 批：API 路由 import 从 @/lib → @/core
  ├── 第 2b 批：组件 import 从 @/lib → @/core 或 @/features
  ├── 第 2c 批：hooks/stores 迁移到 features/
  ├── 第 2d 批：events.ts 解耦拆分
  └── 验证：tsc + build + test 全通过

阶段 3：清理旧目录 + 新模块骨架                    约 2h
  ├── 删除已迁移的 lib/ 旧文件
  ├── 删除已迁移的 stores/ hooks/ 旧目录
  ├── 新增 itinerary/visa-assessment/wallet 骨架
  ├── 更新中间件路由表
  └── 验证：tsc 0 错误 / build 通过 / test 通过
```

### 7.2 tsconfig 路径别名

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@core/*": ["./src/core/*"],
      "@erp/*": ["./src/features/erp/*"],
      "@chat/*": ["./src/features/chat/*"],
      "@notification/*": ["./src/features/notification/*"],
      "@itinerary/*": ["./src/features/itinerary/*"],
      "@shared/*": ["./src/shared/*"]
    }
  }
}
```

### 7.3 向后兼容策略

阶段 1-2 期间，旧路径通过 barrel export 兼容：

```typescript
// src/lib/prisma.ts — 旧路径保留，重定向到新位置
export { prisma } from '@/core/db'
```

阶段 3 确认所有 import 已迁移后，删除旧文件。

---

## 8. 新增模块开发规范

### 8.1 模块目录结构（标准模板）

```
src/features/{module-name}/
├── types.ts                # 该模块的 TypeScript 类型
├── api.ts                  # 前端 API 调用封装（fetch 后端端点）
├── store.ts                # Zustand Store（可选）
├── hooks.ts                # 自定义 Hooks
├── components/             # 该模块专属 UI 组件
│   └── ...
└── __tests__/              # 模块测试
```

### 8.2 新模块 Checklist

```markdown
# 新模块 {name} 开发 Checklist

## 前端
- [ ] 创建 features/{name}/ 目录结构
- [ ] 定义 types.ts（DTO、枚举、状态类型）
- [ ] 实现 api.ts（所有 API 调用封装）
- [ ] 实现 store.ts（如需要状态管理）
- [ ] 实现 hooks.ts（业务逻辑封装）
- [ ] 创建 components/（UI 组件）
- [ ] 创建 app/admin/{name}/ 页面
- [ ] 如有客户端：创建 app/customer/{name}/ 页面

## 后端
- [ ] 创建 app/api/{name}/ 路由
- [ ] API 路由只 import core/ 和本模块 types
- [ ] Zod 校验所有输入
- [ ] 通过 core/rbac.ts 注册权限
- [ ] 通过 core/event-bus.ts 注册事件

## 交叉引用
- [ ] 通知其他模块：import { eventBus } from '@/core/event-bus' → emit
- [ ] 响应其他模块：eventBus.on('other-module:event', handler)
- [ ] 禁止直接 import 其他模块的 store/hook/api

## 验收
- [ ] npx tsc --noEmit = 0 错误
- [ ] npm run build = 通过
- [ ] 本模块独立测试通过
```

### 8.3 rbac.ts 模块化扩展

当前 ROLE_PERMISSIONS 是一个大对象。新增模块时往里追加：

```typescript
// core/rbac.ts

// 模块权限注册表（各模块在初始化时注册）
const modulePermissions = new Map<string, Permission[]>()

export function registerModulePermissions(module: string, permissions: Permission[]) {
  modulePermissions.set(module, permissions)
}

// 各模块在 features/{name}/index.ts 中注册
// features/itinerary/index.ts
import { registerModulePermissions } from '@/core/rbac'
registerModulePermissions('itinerary', [
  { resource: 'itinerary', actions: ['read', 'create', 'update', 'delete'] },
])
```

### 8.4 中间件模块化扩展

```typescript
// middleware.ts

// 模块路由注册表
const MODULE_ROUTES: Record<string, UserRole[]> = {
  '/admin/erp':        ['SUPER_ADMIN', 'COMPANY_OWNER', 'CS_ADMIN', ...],
  '/admin/itinerary':  ['SUPER_ADMIN', 'COMPANY_OWNER', ...],
  '/admin/wallet':     ['SUPER_ADMIN', 'COMPANY_OWNER', ...],
}

// 各模块可自行注册路由权限
export function registerRoute(path: string, roles: UserRole[]) {
  MODULE_ROUTES[path] = roles
}
```

---

## 9. 与现有规范的兼容

### 9.1 不变的部分

| 规范 | 状态 |
|---|---|
| erp_ 表前缀 | ✅ 不变 |
| Prisma Schema 规范 | ✅ 不变 |
| Git Commit 规范 | ✅ 不变 |
| UI 设计规范（液态玻璃） | ✅ 不变 |
| 安全编码规范 | ✅ 不变 |
| API 响应格式 | ✅ 不变 |
| TypeScript 严格模式 | ✅ 不变 |
| 测试规范 | ✅ 不变 |

### 9.2 需要更新的部分

| 规范 | 变更 |
|---|---|
| 项目目录结构 | 更新为新的分层结构 |
| import 路径 | `@/lib/xxx` → `@/core/xxx` 或 `@/features/xxx` |
| 文件命名 | 新增模块遵循 `{module}/types.ts` 模式 |
| API 路由前缀 | ERP 专属路由迁移到 `/api/erp/`（保留旧路径兼容） |
| 组件分类 | 业务组件从 `components/` 移到 `features/xxx/components/` |

### 9.3 开发者体验

```typescript
// 旧写法（仍可用，通过兼容层）
import { prisma } from '@/lib/prisma'
import { transitionOrder } from '@/lib/transition'
import { useOrders } from '@/hooks/use-orders'

// 新写法（推荐）
import { prisma } from '@/core/db'
import { transitionOrder } from '@/features/erp/transition'
import { useOrders } from '@/features/erp/hooks'

// 新模块写法
import { searchItineraries } from '@/features/itinerary/api'
import { useItinerary } from '@/features/itinerary/hooks'
```

---

## 10. 最终目标结构鸟瞰

```
src/
├── core/              基础设施（auth/db/logger/oss/socket/utils）  ~800行
├── features/
│   ├── erp/           ERP 管理（当前项目的全部业务逻辑）          ~12000行
│   ├── chat/          站内聊天                                    ~1500行
│   ├── notification/  站内通知                                    ~400行
│   ├── itinerary/     🆕 行程规划                                 骨架
│   ├── visa-assessment/ 🆕 签证评估                               骨架
│   └── wallet/        🆕 钱包                                     骨架
├── shared/ui/         通用 UI 组件                                ~1500行
├── layouts/           布局组件                                    ~400行
├── types/             全局共享类型                                 ~300行
└── app/               Next.js 路由（页面 + API）                   ~4000行
```

**新增模块只需 3 步**：
1. 创建 `features/{name}/` + 骨架文件
2. 创建 `app/api/{name}/` + API 路由
3. 在 `core/rbac.ts` 注册权限 + `middleware.ts` 注册路由

模块间零耦合，故障完全隔离。

---

*文档结束 — 基于实际代码依赖图谱的最优架构方案*
