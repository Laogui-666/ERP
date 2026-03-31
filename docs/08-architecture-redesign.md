# 架构重构方案 — 模块化全栈 Web App（优化版）

> **文档版本**: V2.0
> **创建日期**: 2026-03-31
> **基于**: 实际代码依赖分析（141文件 / 18,649行 / 50 API路由 / 31组件 / 5测试93用例）
> **目标**: 将项目从单一 ERP 系统升级为模块化大型综合全栈 Web App
> **原则**: 基于实际代码依赖分析，最小改动达到最大效果，零功能回归

---

## 目录

1. [现状分析](#1-现状分析)
2. [核心问题](#2-核心问题)
3. [架构设计](#3-架构设计)
4. [目标目录结构](#4-目标目录结构)
5. [依赖规则](#5-依赖规则)
6. [模块划分（完整映射表）](#6-模块划分)
7. [迁移方案](#7-迁移方案)
8. [新增模块开发规范](#8-新增模块开发规范)
9. [与现有规范的兼容](#9-与现有规范的兼容)
10. [风险与应对](#10-风险与应对)

---

## 1. 现状分析

### 1.1 当前规模

| 维度 | 数量 |
|---|---|
| 源文件 | 141 个 |
| 代码行数 | ~18,649 行 |
| API 路由 | 50 个 / 5,304 行 |
| 页面 | 18 个 |
| 组件 | 31 个 / 4,158 行 |
| Hooks | 5 个 / 507 行 |
| Stores | 4 个 / 392 行 |
| lib/ 工具 | 14 个 / 1,761 行 |
| 测试 | 5 个 / 660 行（93 用例） |
| 类型定义 | 4 个 / 453 行 |

### 1.2 依赖图谱（实际扫描结果）

```
                    ┌─────────────────────────────────────┐
                    │       pages / API Routes            │
                    │   import: hooks + stores + lib +    │
                    │           components + types        │
                    └──────────┬──────────────────────────┘
                               │
                    ┌──────────▼──────────────────────────┐
                    │     components (31个 / 4,158行)     │
                    │   import: hooks + lib + types       │
                    │   ├── layout/  (5个, sidebar/topbar │
                    │   │             引用 hooks)          │
                    │   ├── ui/      (10个, 纯UI无依赖)    │
                    │   ├── orders/  (5个, 引用 types)     │
                    │   ├── documents/(3个, 引用 lib/oss)  │
                    │   ├── chat/    (5个, 引用 stores)    │
                    │   ├── analytics/(3个, 引用 lib/utils)│
                    │   └── notifications/(1个, 无依赖)    │
                    └──────────┬──────────────────────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
     ┌────────────┐   ┌──────────────┐  ┌────────────┐
     │  hooks(5)  │   │ stores(4)    │  │ API Routes │
     │ → stores   │   │ → api-client │  │ (50个)     │
     │ → lib      │   │ → types      │  │ → lib      │
     │ → hooks    │   │              │  │ → types    │
     └────────────┘   └──────────────┘  └────────────┘
              │                │                │
              └────────────────┼────────────────┘
                               ▼
                    ┌──────────────────────────────────┐
                    │      lib/ (14个 / 1,761行)       │
                    │     所有东西混在一起 ⚠️            │
                    └──────────────────────────────────┘
```

### 1.3 lib/ 内部依赖关系（精确扫描）

```
prisma.ts (11行)        ← 无依赖，被 42 API + transition + socket + chat-system 引用
auth.ts (110行)         ← 无依赖，被 43 API + rbac + socket + middleware + server 引用
rbac.ts (184行)         → auth.ts (type only)，被 28 API 引用
api-client.ts (56行)    ← 无依赖，被 4 store + 16 page + 2 hook 引用
logger.ts (108行)       ← 无依赖，被 4 API + events + socket + chat-system 引用
oss.ts (214行)          ← 无依赖，被 5 API 引用
file-types.ts (23行)    ← 无依赖，被 3 API 引用
utils.ts (108行)        ← 无依赖，被 30+ 组件/页面引用

transition.ts (365行)   → prisma + events + types/order + types/user（ERP 专属）
desensitize.ts (80行)   ← 无依赖（ERP 专属）
events.ts (157行)       → logger + socket + chat-system + types/order（⚠️ 最大耦合点）
chat-system.ts (76行)   → prisma + socket + logger（聊天/ERP 专属）
notification-icons.ts (25行) ← 无依赖（通知 专属）
socket.ts (244行)       → auth + prisma + logger（实时通信，跨领域基础设施）

依赖计数：
  被 API 引用:    auth(43) > prisma(42) > rbac(28) > socket(9) > oss(5) > transition(4) > logger(4)
  被页面引用:     api-client(16) > utils(8+) > notification-icons(1)
  被组件引用:     utils(15+) > hooks(10+) > stores(5+) > oss(2)
  lib 内部引用:   events→{logger,socket,chat-system} | socket→{auth,prisma,logger} | chat-system→{prisma,socket,logger}
```

### 1.4 组件分类（实际依赖分析）

| 分类 | 文件 | import 依赖 | 性质 |
|---|---|---|---|
| **纯 UI** | ui/ (10个) | 仅 `cn` 或无依赖 | → `shared/ui/` |
| **业务-ERP** | orders/ (5个) + documents/ (3个) + analytics/ (3个) | types/*, lib/oss | → `features/erp/components/` |
| **业务-聊天** | chat/ (5个) | stores/chat-store | → `features/chat/components/` |
| **业务-通知** | notifications/ (1个) | lib/notification-icons | → `features/notification/components/` |
| **布局-业务** | layout/sidebar.tsx | hooks/use-auth, lib/utils | ⚠️ 引用 hooks，不是纯 UI |
| **布局-业务** | layout/topbar.tsx | hooks/use-auth, 通知Bell, 聊天列表 | ⚠️ 深度耦合 features |
| **布局-纯 UI** | layout/glass-card.tsx | 仅 `cn` | → `shared/ui/` |
| **布局-纯 UI** | layout/dynamic-bg.tsx | 无依赖 | → `shared/ui/` |
| **布局-纯 UI** | layout/page-header.tsx | 无依赖 | → `shared/ui/` |

---

## 2. 核心问题

### 2.1 lib/ 是单体大泥球

14 个文件放在一起，无领域边界。`transition.ts`（ERP 状态机 365 行）和 `prisma.ts`（数据库 11 行）是邻居，但实际上属于完全不同的层次。`events.ts` 同时引用了 ERP、聊天、实时通信三个领域。

### 2.2 events.ts 是最大耦合点

```typescript
// events.ts 同时引用了 3 个不同领域
import { emitToUser } from '@/lib/socket'              // 实时通信
import { sendSystemMessage, archiveChatRoom } from '@/lib/chat-system'  // 聊天
import { ORDER_STATUS_LABELS } from '@/types/order'    // ERP
// + 动态 import { prisma } from '@/lib/prisma'       // 数据库
```

新增模块（如行程规划）需要修改 events.ts 来注册通知逻辑，导致这个文件持续膨胀。

### 2.3 components/layout/ 混合了两种性质

- glass-card、dynamic-bg、page-header → 纯 UI，无业务依赖
- sidebar、topbar → 引用 hooks（useAuth）和业务组件（NotificationBell、ChatRoomList）

当前都放在 `components/layout/` 下，但 sidebar/topbar 本质上是 admin 布局的一部分。

### 2.4 没有模块边界

新增一个"行程规划"模块，应该放哪？当前结构没有答案。所有业务组件混在 `components/` 下，新增模块时无法复用现有组织模式。

### 2.5 hooks/use-socket-client.ts 的定位模糊

它是一个 React Hook（useRef、useEffect、useCallback），但同时又是实时通信的基础设施。当前被 use-chat.ts 和 customer/layout.tsx 引用。放 `core/` 不合适（不是纯 TS），放 `hooks/` 又是全局基础设施。

---

## 3. 架构设计

### 3.1 设计原则

| 原则 | 说明 |
|---|---|
| **模块自治** | 每个 feature 有独立的 types + api + store + hook + components |
| **共享最小化** | core/ 只放真正跨模块的基础设施（auth、db、logger、oss、utils） |
| **依赖单向** | 上层依赖下层，同层模块互不依赖 |
| **故障隔离** | 一个 feature 崩溃不影响其他 feature |
| **渐进迁移** | 3 阶段执行，阶段 1-2 不破坏任何现有功能 |
| **兼容层过渡** | 旧路径通过 barrel export 重定向到新位置，阶段 3 才删除 |

### 3.2 分层架构

```
┌─────────────────────────────────────────────────────────┐
│  Layer 4: Pages + API Routes (src/app/)                │
│  路由页面，只做"组装"，不写业务逻辑                        │
│  可引用: Layer 3 + Layer 2 + Layer 1 的 utils/api-client │
├─────────────────────────────────────────────────────────┤
│  Layer 3: Features (src/features/)                      │
│  领域模块：types + api + store + hook + components       │
│  可引用: Layer 1 + 同层其他模块的 types                    │
│  禁止: 直接 import 其他 feature 的 store/hook/api         │
├─────────────────────────────────────────────────────────┤
│  Layer 2: Shared UI (src/shared/ui/)                    │
│  纯 UI 组件：glass-card、button、badge、modal、input...  │
│  可引用: 仅 core/utils (cn 函数)                          │
├─────────────────────────────────────────────────────────┤
│  Layer 1: Core (src/core/)                              │
│  基础设施：db、auth、rbac、logger、oss、utils、socket     │
│  禁止: import 任何上层模块                                │
└─────────────────────────────────────────────────────────┘
```

**特殊层 — 布局 (`src/layouts/`)**：

sidebar.tsx 和 topbar.tsx 引用 hooks 和业务组件，不能放入 shared/ui/。方案：
- `layouts/admin-layout.tsx` — admin 侧边栏 + 顶栏（引用 features 的 hooks 和组件）
- `layouts/customer-layout.tsx` — 客户端布局（引用 features 的 hooks）

布局层的定位：Page 级组装，本质上属于 Layer 4 的一部分，但独立为 `layouts/` 目录以提高可维护性。

**特殊层 — 布局 (`src/layouts/`)**：

sidebar.tsx 和 topbar.tsx 引用 hooks 和业务组件，不能放入 shared/ui/。方案：
- `layouts/admin-layout.tsx` — admin 侧边栏 + 顶栏（引用 features 的 hooks 和组件）
- `layouts/customer-layout.tsx` — 客户端布局（引用 features 的 hooks）

布局层的定位：Page 级组装，本质上属于 Layer 4 的一部分，但独立为 `layouts/` 目录以提高可维护性。

**依赖规则汇总**：

| 层 | 可引用 | 禁止引用 |
|---|---|---|
| Layer 4 (Pages) | Layer 3 + Layer 2 + Layer 1 的 utils/api-client | — |
| Layer 3 (Features) | Layer 1 + 其他 feature 的 types | 其他 feature 的 store/hook/api |
| Layer 2 (Shared UI) | 仅 core/utils | core/auth、core/db、任何 feature |
| Layer 1 (Core) | 无（底层） | 任何上层 |
| layouts/ | Layer 3 + Layer 2 + Layer 1 | — |

---

## 4. 目标目录结构

```
src/
├── core/                           # Layer 1: 基础设施
│   ├── db.ts                       # Prisma 客户端单例 (原 lib/prisma.ts)
│   ├── auth.ts                     # JWT 认证 + Cookie (原 lib/auth.ts)
│   ├── rbac.ts                     # 权限矩阵 (原 lib/rbac.ts)
│   ├── api-client.ts               # 前端 fetch 封装 (原 lib/api-client.ts)
│   ├── logger.ts                   # 统一日志 (原 lib/logger.ts)
│   ├── oss.ts                      # 阿里云 OSS (原 lib/oss.ts)
│   ├── file-types.ts               # 文件类型白名单 (原 lib/file-types.ts)
│   ├── utils.ts                    # cn()、日期格式化、通用工具 (原 lib/utils.ts)
│   ├── socket.ts                   # Socket.io 服务端 (原 lib/socket.ts)
│   ├── event-bus.ts                # 🆕 通用事件总线（纯事件分发，不引用任何领域）
│   └── __tests__/                  # 基础设施测试
│       ├── utils.test.ts           # (原 lib/__tests__/utils.test.ts)
│       ├── rbac.test.ts            # (原 lib/__tests__/rbac.test.ts)
│       └── desensitize.test.ts     # 暂放此，迁移后移到 features/erp/__tests__/
│
├── features/                       # Layer 3: 领域模块
│   ├── erp/                        # ERP 管理模块
│   │   ├── types.ts                # Order、Applicant、Document、VisaMaterial... 类型
│   │   ├── api.ts                  # 🆕 前端 API 调用封装（从页面中抽取）
│   │   ├── store.ts                # Zustand Store (原 stores/order-store.ts)
│   │   ├── hooks.ts                # useOrders (原 hooks/use-orders.ts)
│   │   ├── transition.ts           # 状态机引擎 (原 lib/transition.ts)
│   │   ├── desensitize.ts          # 数据脱敏 (原 lib/desensitize.ts)
│   │   ├── analytics.ts            # 🆕 数据分析 API 封装（从 analytics 页面抽取）
│   │   ├── events.ts               # 🆕 ERP 事件注册（从 lib/events.ts 拆出）
│   │   ├── components/             # ERP 专属 UI
│   │   │   ├── status-badge.tsx
│   │   │   ├── status-timeline.tsx
│   │   │   ├── applicant-card.tsx
│   │   │   ├── applicant-form-item.tsx
│   │   │   ├── document-panel.tsx
│   │   │   ├── customer-upload.tsx
│   │   │   ├── material-panel.tsx
│   │   │   └── material-checklist.tsx
│   │   └── __tests__/
│   │       ├── transition.test.ts  # (原 lib/__tests__/transition.test.ts)
│   │       └── desensitize.test.ts # (原 lib/__tests__/desensitize.test.ts)
│   │
│   ├── chat/                       # 聊天模块
│   │   ├── types.ts                # ChatRoom、ChatMessage... (原 types/chat.ts)
│   │   ├── api.ts                  # 🆕 聊天 API 封装
│   │   ├── store.ts                # ChatStore (原 stores/chat-store.ts)
│   │   ├── hooks.ts                # useChat (原 hooks/use-chat.ts)
│   │   ├── system.ts               # 系统消息 (原 lib/chat-system.ts)
│   │   ├── events.ts               # 🆕 聊天事件注册（从 lib/events.ts 拆出）
│   │   └── components/
│   │       ├── chat-panel.tsx
│   │       ├── chat-message.tsx
│   │       ├── chat-message-list.tsx
│   │       ├── chat-input.tsx
│   │       └── chat-room-list.tsx
│   │
│   ├── notification/               # 通知模块
│   │   ├── types.ts                # NotificationType... (从 types/order.ts 提取)
│   │   ├── api.ts                  # 🆕 通知 API 封装
│   │   ├── store.ts                # NotificationStore (原 stores/notification-store.ts)
│   │   ├── hooks.ts                # useNotifications (原 hooks/use-notifications.ts)
│   │   ├── icons.ts                # 通知图标映射 (原 lib/notification-icons.ts)
│   │   └── components/
│   │       └── notification-bell.tsx
│   │
│   ├── auth/                       # 认证模块
│   │   ├── api.ts                  # 🆕 认证 API 封装（login/register/refresh/logout/me）
│   │   ├── store.ts                # AuthStore (原 stores/auth-store.ts)
│   │   └── hooks.ts                # useAuth (原 hooks/use-auth.ts)
│   │
│   ├── itinerary/                  # 🆕 行程规划模块（骨架）
│   │   ├── types.ts
│   │   ├── api.ts
│   │   └── components/
│   │
│   ├── visa-assessment/            # 🆕 签证评估模块（骨架）
│   │   ├── types.ts
│   │   ├── api.ts
│   │   └── components/
│   │
│   └── wallet/                     # 🆕 钱包模块（骨架）
│       ├── types.ts
│       ├── api.ts
│       └── components/
│
├── shared/                         # Layer 2: 共享 UI（纯 UI，无业务依赖）
│   └── ui/
│       ├── glass-card.tsx          # (原 components/layout/glass-card.tsx)
│       ├── dynamic-bg.tsx          # (原 components/layout/dynamic-bg.tsx)
│       ├── page-header.tsx         # (原 components/layout/page-header.tsx)
│       ├── button.tsx              # (原 components/ui/button.tsx)
│       ├── badge.tsx               # (原 components/ui/badge.tsx)
│       ├── modal.tsx               # (原 components/ui/modal.tsx)
│       ├── input.tsx               # (原 components/ui/input.tsx)
│       ├── select.tsx              # (原 components/ui/select.tsx)
│       ├── toast.tsx               # (原 components/ui/toast.tsx)
│       ├── card.tsx                # (原 components/ui/card.tsx)
│       ├── file-preview.tsx        # (原 components/ui/file-preview.tsx)
│       └── camera-capture.tsx      # (原 components/ui/camera-capture.tsx)
│
├── layouts/                        # 布局组件（引用 features，属于 Page 层）
│   ├── sidebar.tsx                 # (原 components/layout/sidebar.tsx)
│   └── topbar.tsx                  # (原 components/layout/topbar.tsx)
│
├── types/                          # 全局共享类型
│   ├── api.ts                      # ApiResponse、ApiMeta、AppError (不变)
│   └── user.ts                     # UserProfile、UserRole (不变)
│
├── app/                            # Layer 4: 页面 + API 路由
│   ├── api/
│   │   ├── auth/                   # 认证 API (不变，路径不改)
│   │   ├── orders/                 # 订单 API (路径不变，import 改为 @/core + @/features/erp)
│   │   ├── documents/              # 资料 API (同上)
│   │   ├── applicants/             # 申请人 API (同上)
│   │   ├── templates/              # 模板 API (同上)
│   │   ├── analytics/              # 分析 API (同上)
│   │   ├── chat/                   # 聊天 API (不变)
│   │   ├── notifications/          # 通知 API (不变)
│   │   ├── companies/              # 公司 API (不变)
│   │   ├── users/                  # 用户 API (不变)
│   │   ├── departments/            # 部门 API (不变)
│   │   ├── cron/                   # 定时任务 (不变)
│   │   ├── shop/                   # 店铺 API (不变)
│   │   └── sms/                    # SMS API (不变)
│   ├── (auth)/                     # 登录/注册 (不变)
│   ├── admin/
│   │   ├── dashboard/
│   │   ├── orders/
│   │   ├── pool/
│   │   ├── workspace/
│   │   ├── templates/
│   │   ├── team/
│   │   ├── analytics/
│   │   ├── settings/
│   │   └── layout.tsx              # admin 布局（引用 layouts/）
│   ├── customer/
│   │   ├── orders/
│   │   ├── notifications/
│   │   ├── profile/
│   │   └── layout.tsx              # customer 布局（引用 layouts/）
│   ├── layout.tsx                  # 全局布局
│   └── page.tsx
│
├── middleware.ts                    # 不变
├── server.ts                       # 不变
└── styles/                         # 不变
    ├── globals.css
    └── glassmorphism.css
```

### 4.1 API 路由路径决策

**✅ 保持现有路径不变** (`/api/orders/`、`/api/documents/` 等)

理由：
- 50 个已有 API 路由，路径变更是破坏性变更
- 前端 16 个页面直接调用这些路径，改路径 = 全量回归测试
- 模块化在 import 层面实现（API 路由 import `@/core/` + `@/features/erp/types`），不在 URL 路径层面
- 新模块使用 `/api/{module}/` 前缀即可，与旧路由共存
- 中间件和 RBAC 的 `canAccessRoute()` 不受影响

---

## 5. 依赖规则

### 5.1 依赖箭头（单向，禁止反向）

```
Pages + API Routes (app/) ──→ Features ──→ Core
                               │              ▲
                               └──→ Shared UI ─┘

layouts/ ──→ Features + Shared UI + Core (utils/api-client)
```

### 5.2 具体规则

| 规则 | 允许 | 禁止 |
|---|---|---|
| Pages → Features | ✅ import erp/hooks、chat/store 等 | ❌ 直接 import core/db（应通过 feature 的 api.ts） |
| Pages → Core | ✅ import core/utils (cn)、core/api-client | ❌ import core/prisma、core/auth |
| API Routes → Core | ✅ import core/*（API 路由是后端，需要直接访问 db/auth） | — |
| API Routes → Features | ✅ import features/*/types | ❌ import features/*/store |
| Features → Core | ✅ import core/* | ❌ — |
| Features → Features | ⚠️ 只允许 import types | ❌ import 其他 feature 的 store/hook/api |
| Features 间通信 | 通过 core/event-bus.ts | ❌ 直接调用其他模块函数 |
| Shared UI → Core | ✅ 只允许 import core/utils | ❌ import core/auth、core/db |
| Core → 任何上层 | ❌ 永远禁止 | — |

### 5.3 模块间通信方式

```
方式 1（推荐 — 事件总线）：
  // features/erp/events.ts
  import { eventBus } from '@/core/event-bus'
  eventBus.on('order:status-changed', async (data) => {
    // 通知模块
    createNotifications(...)
    // 聊天模块（系统消息）
    sendSystemMessage(...)
  })

方式 2（直接导出 — 适合同进程同步调用）：
  // features/erp/api.ts 导出 onOrderCompleted
  // 其他模块 import { onOrderCompleted } from '@/features/erp/api'

方式 3（数据库级 — 适合持久化通知）：
  // 通过 Prisma 中间件或 cron 任务监听变更
```

### 5.4 events.ts 解耦 — 具体方案

当前 `events.ts` (157行) 做了 3 件事，需要拆成 3 个文件：

```
当前 events.ts:
  ├── 定义 EVENTS 常量 (事件名)
  ├── 定义 ORDER_STATUS_LABELS (重复定义，types/order.ts 已有)
  ├── eventBus 类 (事件总线)
  ├── 11 个状态变更事件处理器 (通知 + 系统消息 + Socket 推送)
  └── 动态 import prisma (查询用户信息)

拆分后:
  core/event-bus.ts (~30行)
  ├── EVENTS 常量
  ├── EventBus 类 (on/emit/off)
  └── export const eventBus = new EventBus()

  features/erp/events.ts (~120行)
  ├── import { eventBus } from '@/core/event-bus'
  ├── import { emitToUser } from '@/core/socket'
  ├── import { sendSystemMessage } from '@/features/chat/system'
  ├── 11 个 eventBus.on() 处理器
  └── 动态 import prisma (查询用户信息)
  ├── import { createNotifications } from '@/features/notification/api'

  (ORDER_STATUS_LABELS 删除重复定义，统一从 @/features/erp/types 导入)
```

### 5.5 use-socket-client.ts 处理方案

**方案：保留在 core/，改名为 `core/socket-client.ts`，抽取非 React 部分**

当前 210 行，使用 useRef/useEffect/useCallback，是 React Hook。但它是跨模块基础设施（被 use-chat.ts 和 customer/layout.tsx 引用）。

```
方案:
  core/socket-client.ts (~120行)  — 纯 TS，无 React 依赖
  ├── SocketClient 类 (connect/disconnect/joinRoom/leaveRoom/on/off/emit)
  ├── 单例模式
  ├── Cookie 认证
  └── 自动重连逻辑

  hooks/use-socket-client.ts (~60行)  — React Hook 包装
  ├── import { socketClient } from '@/core/socket-client'
  ├── useEffect (connect/disconnect 生命周期)
  ├── useState (isConnected)
  └── useCallback (暴露 joinRoom/leaveRoom 等)
```

这样 use-chat.ts 和 customer/layout.tsx 继续 import `@/hooks/use-socket-client`，无破坏。

---

## 6. 模块划分（完整映射表）

### 6.1 lib/ → core/ 迁移

| 当前位置 | 目标位置 | 行数 | 说明 |
|---|---|---:|---|
| `lib/prisma.ts` | `core/db.ts` | 11 | 重命名，语义更清晰 |
| `lib/auth.ts` | `core/auth.ts` | 110 | — |
| `lib/rbac.ts` | `core/rbac.ts` | 184 | — |
| `lib/api-client.ts` | `core/api-client.ts` | 56 | — |
| `lib/logger.ts` | `core/logger.ts` | 108 | — |
| `lib/oss.ts` | `core/oss.ts` | 214 | — |
| `lib/file-types.ts` | `core/file-types.ts` | 23 | — |
| `lib/utils.ts` | `core/utils.ts` | 108 | — |
| `lib/socket.ts` | `core/socket.ts` | 244 | — |
| `lib/events.ts` | 拆分 | 157 | → `core/event-bus.ts` (~30行) + `features/erp/events.ts` (~120行) + 删除 ORDER_STATUS_LABELS 重复 |
| `hooks/use-socket-client.ts` | 拆分 | 210 | → `core/socket-client.ts` (~120行) + `hooks/use-socket-client.ts` (~60行) |

### 6.2 lib/ → features/ 迁移

| 当前位置 | 目标位置 | 行数 | 说明 |
|---|---|---:|---|
| `lib/transition.ts` | `features/erp/transition.ts` | 365 | ERP 领域 |
| `lib/desensitize.ts` | `features/erp/desensitize.ts` | 80 | ERP 领域 |
| `lib/chat-system.ts` | `features/chat/system.ts` | 76 | 聊天领域 |
| `lib/notification-icons.ts` | `features/notification/icons.ts` | 25 | 通知领域 |

### 6.3 stores/ → features/ 迁移

| 当前位置 | 目标位置 | 行数 | 说明 |
|---|---|---:|---|
| `stores/auth-store.ts` | `features/auth/store.ts` | 61 | 认证领域 |
| `stores/order-store.ts` | `features/erp/store.ts` | 68 | ERP 领域 |
| `stores/chat-store.ts` | `features/chat/store.ts` | 166 | 聊天领域 |
| `stores/notification-store.ts` | `features/notification/store.ts` | 97 | 通知领域 |

### 6.4 hooks/ → features/ 迁移

| 当前位置 | 目标位置 | 行数 | 说明 |
|---|---|---:|---|
| `hooks/use-auth.ts` | `features/auth/hooks.ts` | 21 | 认证领域 |
| `hooks/use-orders.ts` | `features/erp/hooks.ts` | 88 | ERP 领域 |
| `hooks/use-chat.ts` | `features/chat/hooks.ts` | 151 | 聊天领域 |
| `hooks/use-notifications.ts` | `features/notification/hooks.ts` | 37 | 通知领域 |
| `hooks/use-socket-client.ts` | 拆分（见 6.1） | 210 | 基础设施 + Hook 包装 |

### 6.5 types/ → features/ 迁移

| 当前位置 | 目标位置 | 行数 | 说明 |
|---|---|---:|---|
| `types/api.ts` | `types/api.ts` (不变) | 71 | 全局共享 |
| `types/user.ts` | `types/user.ts` (不变) | 72 | 全局共享 |
| `types/order.ts` | `features/erp/types.ts` | 237 | ERP 领域 |
| `types/chat.ts` | `features/chat/types.ts` | 73 | 聊天领域 |

### 6.6 components/ → shared/ + features/ 迁移

| 当前位置 | 目标位置 | 行数 | 说明 |
|---|---|---:|---|
| `components/ui/*` (10个) | `shared/ui/` | 956 | 纯 UI，无业务依赖 |
| `components/layout/glass-card.tsx` | `shared/ui/glass-card.tsx` | 64 | 纯 UI (仅 import cn) |
| `components/layout/dynamic-bg.tsx` | `shared/ui/dynamic-bg.tsx` | 44 | 纯 UI (无 import) |
| `components/layout/page-header.tsx` | `shared/ui/page-header.tsx` | 37 | 纯 UI (无 import) |
| `components/layout/sidebar.tsx` | `layouts/sidebar.tsx` | 160 | 引用 useAuth |
| `components/layout/topbar.tsx` | `layouts/topbar.tsx` | 81 | 引用 useAuth + 业务组件 |
| `components/orders/*` (5个) | `features/erp/components/` | 538 | ERP 业务 |
| `components/documents/*` (3个) | `features/erp/components/` | 1077 | ERP 业务 |
| `components/analytics/*` (3个) | `features/erp/components/` | 225 | ERP 业务 |
| `components/chat/*` (5个) | `features/chat/components/` | 882 | 聊天业务 |
| `components/notifications/*` (1个) | `features/notification/components/` | 107 | 通知业务 |

### 6.7 测试文件迁移

| 当前位置 | 目标位置 | 行数 | 说明 |
|---|---|---:|---|
| `lib/__tests__/utils.test.ts` | `core/__tests__/utils.test.ts` | 145 | 测试 core/utils |
| `lib/__tests__/rbac.test.ts` | `core/__tests__/rbac.test.ts` | 142 | 测试 core/rbac |
| `lib/__tests__/desensitize.test.ts` | `features/erp/__tests__/desensitize.test.ts` | 132 | 测试 features/erp/desensitize |
| `lib/__tests__/transition.test.ts` | `features/erp/__tests__/transition.test.ts` | 135 | 测试 features/erp/transition |
| `lib/__tests__/chat-system.test.ts` | `features/chat/__tests__/system.test.ts` | 106 | 测试 features/chat/system |

### 6.8 迁移后删除的旧文件

| 文件 | 删除时机 |
|---|---|
| `src/lib/*.ts`（全部 14 个） | 阶段 3 — 确认所有 import 已迁移后 |
| `src/stores/*.ts`（全部 4 个） | 阶段 3 |
| `src/hooks/*.ts`（全部 5 个） | 阶段 3（use-socket-client.ts 保留重写版） |
| `src/types/order.ts` | 阶段 3 |
| `src/types/chat.ts` | 阶段 3 |
| `src/components/orders/*` | 阶段 3 |
| `src/components/documents/*` | 阶段 3 |
| `src/components/chat/*` | 阶段 3 |
| `src/components/notifications/*` | 阶段 3 |
| `src/components/analytics/*` | 阶段 3 |
| `src/components/layout/` | 阶段 3（5个文件全部迁移） |

---

## 7. 迁移方案

### 7.1 三阶段执行

#### 阶段 1：搭骨架（纯新增，不改任何现有 import） ~3h

```
├── 1.1 创建 src/core/ 目录
│   ├── 从 lib/ 复制基础设施文件到 core/ (db/auth/rbac/api-client/logger/oss/file-types/utils/socket)
│   ├── 创建 core/event-bus.ts（从 events.ts 提取 EventBus 类 + EVENTS 常量）
│   └── 不删除原 lib/ 文件（两套并存）
│
├── 1.2 创建 src/features/ 目录 + 各模块骨架
│   ├── features/erp/   (types.ts + transition.ts + desensitize.ts + store.ts + hooks.ts + events.ts + components/)
│   ├── features/chat/  (types.ts + system.ts + store.ts + hooks.ts + events.ts + components/)
│   ├── features/notification/ (icons.ts + store.ts + hooks.ts + components/)
│   ├── features/auth/  (store.ts + hooks.ts)
│   ├── features/itinerary/ (空骨架)
│   ├── features/visa-assessment/ (空骨架)
│   └── features/wallet/ (空骨架)
│
├── 1.3 创建 src/shared/ui/ 目录
│   ├── 从 components/ui/ 复制全部 10 个文件
│   ├── 从 components/layout/ 复制 glass-card/dynamic-bg/page-header
│   └── 不删除原 components/ 文件
│
├── 1.4 创建 src/layouts/ 目录
│   ├── 从 components/layout/ 复制 sidebar.tsx + topbar.tsx
│   └── 不删除原文件
│
├── 1.5 更新 tsconfig.json — 添加 path 别名
│
└── 验证: npx tsc --noEmit = 0 错误（新旧路径并存）
```

#### 阶段 2：逐步迁移 import（保持功能不变） ~5h

```
├── 2a 批：API 路由 import 迁移 (~1.5h, 50个文件)
│   ├── `@/lib/prisma`     → `@/core/db`
│   ├── `@/lib/auth`       → `@/core/auth`
│   ├── `@/lib/rbac`       → `@/core/rbac`
│   ├── `@/lib/oss`        → `@/core/oss`
│   ├── `@/lib/logger`     → `@/core/logger`
│   ├── `@/lib/utils`      → `@/core/utils`
│   ├── `@/lib/socket`     → `@/core/socket`
│   ├── `@/lib/file-types` → `@/core/file-types`
│   ├── `@/lib/transition` → `@/features/erp/transition`
│   ├── `@/lib/desensitize`→ `@/features/erp/desensitize`
│   ├── `@/types/order`    → `@/features/erp/types`
│   └── 验证: npx tsc --noEmit = 0 错误
│
├── 2b 批：hooks/stores import 迁移 (~1h, 13个文件)
│   ├── stores/ 全部引用 `@/lib/api-client` → `@/core/api-client`
│   ├── hooks/ 全部引用 `@/stores/*` → `@/features/*/store`
│   ├── hooks/ 全部引用 `@/hooks/*` → `@/features/*/hooks`
│   └── 验证: npx tsc --noEmit = 0 错误
│
├── 2c 批：组件 import 迁移 (~1h, 31个文件)
│   ├── components/ui/ + layout/glass-card 等 → import `@/core/utils`
│   ├── components/orders/ + documents/ + analytics/ → import `@/features/erp/types` 等
│   ├── components/chat/ → import `@/features/chat/store` 等
│   └── 验证: npx tsc --noEmit = 0 错误
│
├── 2d 批：页面 import 迁移 (~1h, 18个文件)
│   ├── pages → import `@/features/*/hooks`、`@/features/*/store`
│   ├── pages → import `@/shared/ui/*` 替代 `@/components/ui/*`
│   ├── pages → import `@/layouts/*` 替代 `@/components/layout/*`
│   ├── admin/layout.tsx + customer/layout.tsx 更新 sidebar/topbar 引用
│   └── 验证: npx tsc --noEmit = 0 错误
│
├── 2e 批：events.ts 解耦 + use-socket-client 拆分 (~0.5h)
│   ├── 移除 events.ts 中 ORDER_STATUS_LABELS 重复定义，改为从 types 导入
│   ├── events.ts 中事件处理器移到 features/erp/events.ts + features/chat/events.ts
│   ├── lib/events.ts 变为 barrel export: `export { eventBus, EVENTS } from '@/core/event-bus'`
│   ├── use-socket-client.ts 抽取非 React 部分到 core/socket-client.ts
│   └── 验证: npx tsc --noEmit = 0 错误
│
└── 全量验证: npx tsc --noEmit = 0 + npm run build = 通过 + npm test = 93 通过
```

#### 阶段 3：清理旧目录 + 新模块骨架 ~2h

```
├── 3.1 删除旧文件
│   ├── rm src/lib/*.ts (14个文件)
│   ├── rm src/stores/*.ts (4个文件)
│   ├── rm src/hooks/*.ts (5个文件, use-socket-client.ts 保留重写版)
│   ├── rm src/types/order.ts + src/types/chat.ts (2个文件)
│   ├── rm src/components/orders/* (5个)
│   ├── rm src/components/documents/* (3个)
│   ├── rm src/components/chat/* (5个)
│   ├── rm src/components/notifications/* (1个)
│   ├── rm src/components/analytics/* (3个)
│   ├── rm src/components/layout/* (5个)
│   ├── rm src/components/ui/* (10个)
│   └── rmdir src/lib src/stores src/hooks src/components
│
├── 3.2 创建旧路径 barrel export 兼容层（可选，按需决定）
│   ├── src/lib/prisma.ts → `export { prisma } from '@/core/db'` (如仍有外部引用)
│   └── （如果阶段 2 已全部迁移，可跳过此步）
│
├── 3.3 新模块骨架
│   ├── features/itinerary/    (types.ts + api.ts 空导出)
│   ├── features/visa-assessment/ (types.ts + api.ts 空导出)
│   └── features/wallet/       (types.ts + api.ts 空导出)
│
├── 3.4 更新中间件路由表
│   └── middleware.ts — 新模块路由注册预留
│
└── 全量验证: npx tsc --noEmit = 0 + npm run build = 通过 + npm test = 93 通过
```

### 7.2 tsconfig 路径别名

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@core/*": ["./src/core/*"],
      "@erp/*": ["./src/features/erp/*"],
      "@chat/*": ["./src/features/chat/*"],
      "@notification/*": ["./src/features/notification/*"],
      "@auth/*": ["./src/features/auth/*"],
      "@shared/*": ["./src/shared/*"]
    }
  }
}
```

### 7.3 验证清单（每批迁移后执行）

```bash
# 1. TypeScript 编译检查
npx tsc --noEmit
# 期望: 0 errors

# 2. 构建验证
npm run build
# 期望: 成功，0 warnings

# 3. 单元测试
npm test
# 期望: 93 passed

# 4. 搜索确认无残留旧路径
grep -rn "from '@/lib/" src/ | grep -v node_modules  # 期望: 0
grep -rn "from '@/stores/" src/ | grep -v node_modules  # 期望: 0
grep -rn "from '@/hooks/" src/ | grep -v node_modules  # 期望: 0 (use-socket-client 除外)

# 5. 确认无 as any / console.log / TODO
grep -rn "as any" src/ | wc -l  # 期望: 0
grep -rn "console.log" src/ | wc -l  # 期望: 0
grep -rn "TODO" src/ | wc -l  # 期望: 0
```

---

## 8. 新增模块开发规范

### 8.1 模块目录结构（标准模板）

```
src/features/{module-name}/
├── types.ts                # 该模块的 TypeScript 类型
├── api.ts                  # 前端 API 调用封装（fetch 后端端点）
├── store.ts                # Zustand Store（可选，如不需要可不创建）
├── hooks.ts                # 自定义 Hooks（可选）
├── events.ts               # 事件注册（可选，如需跨模块通信）
├── components/             # 该模块专属 UI 组件
│   └── ...
└── __tests__/              # 模块测试（可选）
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
- [ ] 通过 core/rbac.ts 注册权限（追加 ROLE_PERMISSIONS）
- [ ] 通过 core/event-bus.ts 注册事件（如需跨模块通信）

## 中间件
- [ ] middleware.ts 添加新模块路由权限检查

## 交叉引用
- [ ] 通知其他模块：import { eventBus } from '@/core/event-bus' → emit
- [ ] 响应其他模块：eventBus.on('other-module:event', handler)
- [ ] 禁止直接 import 其他模块的 store/hook/api（只能 import types）

## 验收
- [ ] npx tsc --noEmit = 0 错误
- [ ] npm run build = 通过
- [ ] npm test = 全部通过
- [ ] 无 as any / console.log / TODO
```

### 8.3 rbac.ts 模块化扩展

新增模块权限时，直接在 `core/rbac.ts` 的 `ROLE_PERMISSIONS` 中追加：

```typescript
// core/rbac.ts
// 在 ROLE_PERMISSIONS 中追加新模块权限
// 示例：添加行程规划模块
'itinerary': {
  SUPER_ADMIN: ['read', 'create', 'update', 'delete'],
  COMPANY_OWNER: ['read', 'create', 'update', 'delete'],
  // ... 其他角色
},
```

### 8.4 中间件模块化扩展

```typescript
// middleware.ts — 新模块路由注册
const MODULE_ROUTES: Record<string, UserRole[]> = {
  '/admin/itinerary': ['SUPER_ADMIN', 'COMPANY_OWNER'],
  '/admin/wallet': ['SUPER_ADMIN', 'COMPANY_OWNER'],
  // ... 其他新模块
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
| UI 设计规范（液态玻璃 + 莫兰迪冷色系） | ✅ 不变 |
| 安全编码规范 | ✅ 不变 |
| API 响应格式 (ApiResponse/ApiError) | ✅ 不变 |
| API 路由 URL 路径 | ✅ 不变 |
| TypeScript 严格模式 | ✅ 不变 |
| 测试规范 | ✅ 不变 |
| middleware.ts 认证 + 权限逻辑 | ✅ 不变 |

### 9.2 需要更新的部分

| 规范 | 变更 |
|---|---|
| 项目目录结构 | 更新为新的 4 层分层结构 |
| import 路径 | `@/lib/xxx` → `@/core/xxx` 或 `@/features/xxx` |
| 文件命名 | 新增模块遵循 `{module}/types.ts` 模式 |
| 组件分类 | 业务组件从 `components/` 移到 `features/xxx/components/` |
| tsconfig paths | 添加 `@core/*`、`@erp/*`、`@chat/*` 等别名 |

### 9.3 开发者体验对比

```typescript
// ===== 旧写法（迁移完成后删除） =====
import { prisma } from '@/lib/prisma'
import { transitionOrder } from '@/lib/transition'
import { useOrders } from '@/hooks/use-orders'
import { useChatStore } from '@/stores/chat-store'
import { StatusBadge } from '@/components/orders/status-badge'
import { GlassCard } from '@/components/layout/glass-card'

// ===== 新写法（推荐） =====
import { prisma } from '@/core/db'
import { transitionOrder } from '@/features/erp/transition'
import { useOrders } from '@/features/erp/hooks'
import { useChatStore } from '@/features/chat/store'
import { StatusBadge } from '@/features/erp/components/status-badge'
import { GlassCard } from '@/shared/ui/glass-card'

// ===== 新模块写法 =====
import { searchItineraries } from '@/features/itinerary/api'
import { useItinerary } from '@/features/itinerary/hooks'
import { ItineraryCard } from '@/features/itinerary/components/itinerary-card'
```

---

## 10. 风险与应对

### 10.1 迁移风险

| 风险 | 等级 | 应对方案 |
|---|:---:|---|
| 迁移过程中引入回归 bug | 中 | 阶段 2 每批验证 tsc + build + test；阶段 1 不改现有代码 |
| import 路径遗漏导致运行时报错 | 中 | tsc --noEmit 编译时即可捕获；grep 扫描确认零残留 |
| events.ts 解耦后事件丢失 | 中 | 逐事件核对：旧 events.ts 的 11 个处理器完全复制到 features/erp/events.ts |
| use-socket-client 拆分后断连 | 低 | 保持 hook 接口不变，底层实现替换为 SocketClient 类 |
| 构建时间增加（路径别名） | 低 | tsconfig paths 不影响构建速度 |
| 团队不熟悉新目录结构 | 低 | 本文档 + 新模块开发模板 + checklist |

### 10.2 不迁移的风险

| 风险 | 说明 |
|---|---|
| 新模块无处安放 | 行程规划/签证评估/钱包等新模块无法清晰归类 |
| events.ts 持续膨胀 | 每新增一个模块都要修改 events.ts，耦合度递增 |
| 组件命名冲突 | 多模块都有 Card 组件时，components/ 下无法区分 |
| 重构成本递增 | 代码量越大，重构代价越高 |

---

## 附录 A：迁移影响统计

| 统计项 | 数量 |
|---|---|
| 需要迁移的文件 | 51 个 |
| 新建的文件 | ~15 个 (event-bus.ts + 各模块 events.ts/api.ts + 新模块骨架) |
| 需要删除的文件 | 51 个（迁移后） |
| 需要修改 import 的文件 | ~90 个 (API 50 + 页面 18 + 组件 31 + hooks/stores 9 - 部分重叠) |
| 预估总工时 | ~10 小时（3阶段） |
| 破坏性变更 | 0（渐进迁移 + 兼容层） |

---

*文档结束 — 基于 141 个源文件实际依赖分析的最优架构方案*
