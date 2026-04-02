# 沐海旅行 - 旅行服务平台

# 架构升级方案 — 分层模块化 + 门户化改造

> **文档版本**: V6.0
> **创建日期**: 2026-03-31
$12026-04-01 19:00
> **基于**: 160 源文件实际依赖扫描 + 逐文件 import 追踪
> **目标**: 将现有 ERP 系统重构为平台的一个业务模块，新建门户层和共享基础设施层，实现真正的模块化架构
> **原则**: 源码级模块化、故障隔离、可扩展、门户首页精心设计
> **当前状态**: Phase 0 ✅ | Phase 1 ✅ | Phase 2 ✅ | Phase 3 ✅ | Phase 4 ✅ | 架构合规修复 ✅ | Phase 5 ✅（tsc 0 错误 / build 通过 / 91 测试通过 / 166 源文件 / 20,770 行）

---

## 目录

1. [现状分析](#1-现状分析)
2. [原方案问题诊断](#2-原方案问题诊断)
3. [核心设计：分层模块化架构](#3-核心设计分层模块化架构)
4. [目录结构与文件清单](#4-目录结构与文件清单)
5. [路由架构](#5-路由架构)
6. [门户首页设计](#6-门户首页设计)
7. [统一登录与入口体系](#7-统一登录与入口体系)
8. [ERP 入口集成](#8-erp-入口集成)
9. [middleware 改造方案](#9-middleware-改造方案)
10. [6大功能模块](#10-6大功能模块)
11. [迁移执行计划](#11-迁移执行计划)
12. [tsconfig 路径别名](#12-tsconfig-路径别名)
13. [开发规范约束](#13-开发规范约束)
14. [风险与应对](#14-风险与应对)

---

## 1. 现状分析

### 1.1 当前项目规模（Phase 0 完成后）

| 维度 | 数量 |
|---|---|
| 源文件 | 166 个 |
| 代码行数 | ~20,770 行 |
| API 路由 | 57 个 |
| 页面 | 28 个（含 portal 16 个） |
| 组件 | 37 个 |
| Hooks | 5 个 |
| Stores | 4 个 |
| lib/ 工具 | 14 个 |
| 测试 | 5 个（91 用例） |
| Prisma 表 | 22 张 |
| 里程碑 | M1-M6 全部 ✅ 100% | M7 Phase 0-5 ✅ |

### 1.2 当前目录结构（Phase 2 已完成 — 分层模块化 + 门户首页）

```
src/
├── app/                              # Next.js App Router（路由层）
│   ├── page.tsx                      ✅ Phase 2 Portal 首页（PortalHomePage + PortalTopbar + DynamicBackground）
│   ├── admin/*                       ← ERP 管理端（不变）
│   ├── customer/*                    ← ERP 客户端（不变）
│   ├── (auth)/*                      ← 认证页面
│   ├── api/*                         ← 50 个 API 路由
│   └── portal/                       ✅ 门户路由
│       ├── layout.tsx                # 门户布局（PortalTopbar + 底部 4 Tab）
│       ├── page.tsx                  # redirect → /
│       ├── orders/page.tsx           # redirect → /customer/orders
│       ├── notifications/page.tsx    # redirect → /customer/notifications
│       ├── profile/page.tsx          # 账号面板（用户信息+ERP入口+退出）
│       └── tools/
│           ├── news/page.tsx         # 签证资讯（占位）
│           ├── itinerary/page.tsx    # 行程助手（占位）
│           ├── form-helper/page.tsx  # 申请表助手（占位）
│           ├── assessment/page.tsx   # 签证评估（占位）
│           ├── translator/page.tsx   # 翻译助手（占位）
│           └── documents/page.tsx    # 证明文件（占位）
│
├── components/                       ✅ Phase 2 新增 Portal 组件
│   └── portal/
│       ├── portal-topbar.tsx         # 门户顶栏（品牌+登录/头像下拉+滚动透明度）
│       ├── hero-banner.tsx           # Hero 区域（逐词渐显+光带脉动+CTA sweep）
│       ├── stats-counter.tsx         # 数据统计卡片（Intersection Observer+数字滚动）
│       ├── tool-grid.tsx             # 6大工具入口（stagger+sweep+未登录弹窗）
│       ├── destination-carousel.tsx  # 热门目的地（scroll-snap+拖拽手势）
│       └── portal-home.tsx           # 首页组装（Server Component 壳）
│
├── shared/                           ✅ Phase 0 已迁移
│   ├── lib/                          # prisma/auth/rbac/utils/api-client/oss/socket/logger/file-types/notification-icons
│   │   └── __tests__/                # 5 个测试文件（91 用例）
│   ├── ui/                           # glass-card/button/input/modal/badge/card/select/toast/file-preview/camera-capture/dynamic-bg
│   ├── styles/                       # globals.css + glassmorphism.css
│   ├── types/                        # api.ts + user.ts
│   ├── stores/                       # auth-store + notification-store
│   ├── hooks/                        # use-auth + use-socket-client + use-notifications
│   └── components/layout/            # page-header + notification-bell
│
├── modules/erp/                      ✅ Phase 0 已迁移
│   ├── lib/                          # transition + desensitize + chat-system + events
│   ├── components/
│   │   ├── orders/                   # status-badge/status-timeline/applicant-card/applicant-form-item/material-checklist
│   │   ├── documents/                # document-panel/material-panel/customer-upload
│   │   ├── analytics/                # stat-card/trend-chart/ranking-table
│   │   ├── chat/                     # chat-panel/chat-input/chat-message/chat-message-list/chat-room-list
│   │   └── layout/                   # sidebar + topbar
│   ├── hooks/                        # use-orders + use-chat
│   ├── stores/                       # order-store + chat-store
│   └── types/                        # order.ts + chat.ts
│
├── middleware.ts                      # ✅ 已更新 import 路径
└── (旧目录 lib/components/stores/hooks/types/styles 已全部清理)
```

### 1.3 核心依赖扫描结果

**被引用最多的 lib/ 文件**：

| 文件 | 被引用数 | 性质 |
|---|:---:|---|
| `auth.ts` | 47 | ✅ 共享基础设施 |
| `prisma.ts` | 45 | ✅ 共享基础设施 |
| `rbac.ts` | 28 | ✅ 共享基础设施 |
| `api-client.ts` | 24 | ✅ 共享基础设施 |
| `utils.ts` | 31 | ✅ 共享基础设施 |
| `socket.ts` | 9 | ✅ 共享基础设施 |
| `oss.ts` | 5 | ✅ 共享基础设施 |
| `transition.ts` | 5 | ❌ ERP 专属（状态机） |
| `events.ts` | 1 | ❌ ERP 专属（事件总线） |
| `chat-system.ts` | 1 | ❌ ERP 专属（聊天系统消息） |
| `desensitize.ts` | 3 | ❌ ERP 专属（数据脱敏） |

### 1.4 当前路由结构

```
/login                  ← 登录页
/register               ← 注册页
/reset-password         ← 密码重置
/                       ← 根路径 → redirect('/login')
/admin/*                ← ERP 管理端（Lv1-8）
/customer/*             ← ERP 客户端（Lv9）
/api/*                  ← 45 个 API 路由
```

---

## 2. 原方案问题诊断

### 2.1 V3.0 方案（不动存量、纯增量）的不足

| 问题 | 影响 |
|---|---|
| ERP 代码仍然"污染"全局共享层 | 新模块无法区分"公共基础设施"和"ERP 业务逻辑" |
| 组件层按技术类型而非业务领域划分 | `components/orders/` 跟 `components/ui/` 同层，模块边界模糊 |
| stores/hooks 混合 | `order-store.ts`（ERP专属）跟 `auth-store.ts`（共享）同级 |
| 门户首页设计粗糙 | 简单拼接 Banner + 工具网格，缺乏高级交互体验 |
| 工具模块全是占位页 | 没有模块化组织，未来扩展困难 |
| 没有解决代码组织问题 | 新功能不知道往哪放，随着模块增多会越来越乱 |

### 2.2 矛盾与解法

**矛盾**：用户要"模块化"、"故障隔离"、"便于扩展"，但 Next.js 单体应用天然难以做到运行时隔离。

**解法**：在 Next.js 单体内实现 **源码级模块化** —— 通过目录分层清晰划定模块边界：
- ERP 只是 `modules/erp/`，跟 `modules/travel/`、`modules/xxx/` 平级
- 共享基础设施在 `shared/`，干干净净
- 新模块新建目录即可，互不影响

---

## 3. 核心设计：分层模块化架构

### 3.1 三层架构模型

```
┌─────────────────────────────────────────────────────────────────┐
│                     Next.js App (单进程)                         │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  🌐 Portal 层 — 面向用户的门户                              │  │
│  │  / (首页) + /portal/* (工具+个人中心)                        │  │
│  └────────────────────────────────────────────────────────────┘  │
│                              │                                   │
│  ┌──────────────────────────▼────────────────────────────────┐  │
│  │  📦 Modules 层 — 业务模块（互相隔离）                       │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │  │
│  │  │  modules/erp │  │ modules/travel│  │ modules/xxx  │    │  │
│  │  │  (现有 ERP)  │  │  (旅行工具)   │  │  (未来模块)   │    │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘    │  │
│  └────────────────────────────────────────────────────────────┘  │
│                              │                                   │
│  ┌──────────────────────────▼────────────────────────────────┐  │
│  │  🔧 Shared 层 — 纯公共基础设施                              │  │
│  │  shared/lib (prisma/auth/utils/rbac/oss/socket)           │  │
│  │  shared/ui (glass-card/button/modal/badge/toast)          │  │
│  │  shared/styles (globals.css/glassmorphism.css/tokens)     │  │
│  │  shared/types (api.ts/user.ts)                            │  │
│  │  shared/stores (auth-store/notification-store)            │  │
│  │  shared/hooks (use-auth/use-socket-client/use-notifications)│  │
│  └────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 分层职责

| 层 | 职责 | 目录 | 被谁引用 |
|---|---|---|---|
| **Shared** | 纯公共基础设施，任何模块可安全引用 | `src/shared/` | 所有模块 + Portal |
| **Modules** | 业务逻辑，模块间互不引用 | `src/modules/erp/` | Portal 路由 + 本模块页面 |
| **Portal** | 用户入口，组装各模块能力 | `src/app/portal/` + `src/components/portal/` | 用户直接访问 |

### 3.3 模块隔离规则

| 规则 | 说明 |
|---|---|
| 模块间禁止互相引用 | `modules/erp/` 不能 import `modules/travel/` 的任何文件 |
| 模块只能引用 shared 层 | `@shared/*` 是唯一允许的跨层 import |
| shared 层不能引用 modules | `shared/` 不知道任何业务模块的存在 |
| Portal 层可引用所有模块 | 组装层，负责组合各模块的组件和能力 |
| API 路由可引用 shared + 本模块 | `/api/orders/*` → `@shared/lib/*` + `@erp/lib/*` |

### 3.4 设计原则

| 原则 | 说明 |
|---|---|
| **源码级模块化** | 通过目录结构和 tsconfig 别名划定模块边界 |
| **共享层纯粹** | `shared/` 只放真正的公共代码，不含任何业务逻辑 |
| **模块自治** | 每个模块有自己的 components/hooks/stores/types/lib |
| **Portal 组装** | 门户层负责"组装"而非"实现"，引用各模块的组件 |
| **路径别名隔离** | `@shared/*`、`@erp/*`、`@portal/*` 三套别名，IDE 可检查边界 |
| **门户首页精品** | 逐词动画+数据滚动+工具卡片 sweep+横向滚动，精心打磨 |

---

## 4. 目录结构与文件清单

### 4.1 最终目录结构

```
src/
├── app/                              # Next.js App Router（路由层）
│   ├── layout.tsx                    # 全局布局
│   ├── page.tsx                      # 🆕 Portal 首页（替代 redirect）
│   ├── globals.css                   # 全局样式
│   │
│   ├── (auth)/                       # 认证页面组
│   │   ├── login/page.tsx            # ✏️ 改跳转目标为 /
│   │   ├── register/page.tsx
│   │   └── reset-password/page.tsx
│   │
│   ├── portal/                       # 🆕 门户路由
│   │   ├── layout.tsx                # 门户布局（顶栏+底部4Tab）
│   │   ├── page.tsx                  # redirect → /
│   │   ├── orders/page.tsx           # → redirect('/customer/orders')
│   │   ├── notifications/page.tsx    # → redirect('/customer/notifications')
│   │   ├── profile/page.tsx          # 账号面板（含ERP入口）
│   │   └── tools/                    # 6大工具
│   │       ├── news/page.tsx
│   │       ├── itinerary/page.tsx
│   │       ├── form-helper/page.tsx
│   │       ├── assessment/page.tsx
│   │       ├── translator/page.tsx
│   │       └── documents/page.tsx
│   │
│   ├── admin/                        # ✅ ERP 管理端（路由不动，import 路径更新）
│   ├── customer/                     # ✅ ERP 客户端（路由不动，import 路径更新）
│   │
│   └── api/                          # API 路由（路由不动，import 路径更新）
│       ├── auth/
│       ├── orders/
│       ├── documents/
│       ├── ...
│
├── modules/                          # 🆕 业务模块层
│   └── erp/                          # ERP 模块
│       ├── components/               # ERP 专属组件
│       │   ├── orders/
│       │   │   ├── status-badge.tsx
│       │   │   ├── status-timeline.tsx
│       │   │   ├── applicant-card.tsx
│       │   │   ├── applicant-form-item.tsx
│       │   │   └── material-checklist.tsx
│       │   ├── documents/
│       │   │   ├── document-panel.tsx
│       │   │   ├── material-panel.tsx
│       │   │   └── customer-upload.tsx
│       │   ├── analytics/
│       │   │   ├── stat-card.tsx
│       │   │   ├── trend-chart.tsx
│       │   │   └── ranking-table.tsx
│       │   ├── chat/
│       │   │   ├── chat-panel.tsx
│       │   │   ├── chat-input.tsx
│       │   │   ├── chat-message.tsx
│       │   │   ├── chat-message-list.tsx
│       │   │   └── chat-room-list.tsx
│       │   └── layout/
│       │       ├── sidebar.tsx
│       │       └── topbar.tsx
│       ├── hooks/
│       │   ├── use-orders.ts
│       │   └── use-chat.ts
│       ├── stores/
│       │   ├── order-store.ts
│       │   └── chat-store.ts
│       ├── lib/
│       │   ├── transition.ts          # 状态机引擎
│       │   ├── desensitize.ts         # 数据脱敏
│       │   ├── chat-system.ts         # 聊天系统消息
│       │   └── events.ts              # 事件总线
│       └── types/
│           ├── order.ts
│           └── chat.ts
│
├── shared/                           # 🆕 共享基础设施层（纯公共）
│   ├── lib/
│   │   ├── prisma.ts                 # Prisma 客户端单例
│   │   ├── auth.ts                   # JWT 认证
│   │   ├── rbac.ts                   # RBAC 权限
│   │   ├── utils.ts                  # 通用工具
│   │   ├── api-client.ts             # 前端 fetch 封装（401刷新）
│   │   ├── oss.ts                    # 阿里云 OSS
│   │   ├── socket.ts                 # Socket.io 服务端
│   │   ├── logger.ts                 # 日志
│   │   ├── file-types.ts             # 文件类型白名单
│   │   └── notification-icons.ts     # 通知图标映射
│   ├── ui/                           # 通用 UI 组件
│   │   ├── glass-card.tsx
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── modal.tsx
│   │   ├── badge.tsx
│   │   ├── card.tsx
│   │   ├── select.tsx
│   │   ├── toast.tsx
│   │   ├── file-preview.tsx
│   │   ├── camera-capture.tsx
│   │   └── dynamic-bg.tsx
│   ├── styles/
│   │   ├── globals.css               # CSS 变量 + 动效 + 背景
│   │   └── glassmorphism.css         # 液态玻璃组件系统
│   ├── types/
│   │   ├── api.ts                    # ApiResponse/ApiError/AppError
│   │   └── user.ts                   # UserProfile/UserRole/JwtPayload
│   ├── stores/
│   │   ├── auth-store.ts             # 认证状态
│   │   └── notification-store.ts     # 通知状态
│   ├── hooks/
│   │   ├── use-auth.ts
│   │   ├── use-socket-client.ts
│   │   └── use-notifications.ts
│   └── components/                   # 通用布局组件
│       ├── layout/
│       │   ├── page-header.tsx
│       │   └── notification-bell.tsx
│
├── components/                       # 🆕 Portal 专属组件
│   └── portal/
│       ├── portal-home.tsx           # 首页组装组件
│       ├── portal-topbar.tsx         # 门户顶栏
│       ├── hero-banner.tsx           # Hero 区域（逐词动画+光带）
│       ├── tool-grid.tsx             # 6大工具入口（stagger+sweep）
│       ├── stats-counter.tsx         # 数据统计卡片（数字滚动）
│       └── destination-carousel.tsx  # 热门目的地（scroll-snap）
│
├── middleware.ts                      # ✏️ 改（首页放行 + portal 鉴权）
└── styles/                           # ⚠️ 迁移后可删除
```

### 4.2 文件迁移映射

#### Shared 层（从现有位置迁移）

| 现有路径 | 新路径 | 性质 |
|---|---|---|
| `lib/prisma.ts` | `shared/lib/prisma.ts` | 共享 |
| `lib/auth.ts` | `shared/lib/auth.ts` | 共享 |
| `lib/rbac.ts` | `shared/lib/rbac.ts` | 共享 |
| `lib/utils.ts` | `shared/lib/utils.ts` | 共享 |
| `lib/api-client.ts` | `shared/lib/api-client.ts` | 共享 |
| `lib/oss.ts` | `shared/lib/oss.ts` | 共享 |
| `lib/socket.ts` | `shared/lib/socket.ts` | 共享 |
| `lib/logger.ts` | `shared/lib/logger.ts` | 共享 |
| `lib/file-types.ts` | `shared/lib/file-types.ts` | 共享 |
| `lib/notification-icons.ts` | `shared/lib/notification-icons.ts` | 共享 |
| `lib/__tests__/*` | `shared/lib/__tests__/*` | 测试 |
| `components/ui/*` | `shared/ui/*` | 共享 |
| `components/layout/dynamic-bg.tsx` | `shared/ui/dynamic-bg.tsx` | 共享 |
| `components/layout/page-header.tsx` | `shared/components/layout/page-header.tsx` | 共享 |
| `components/notifications/notification-bell.tsx` | `shared/components/layout/notification-bell.tsx` | 共享 |
| `types/api.ts` | `shared/types/api.ts` | 共享 |
| `types/user.ts` | `shared/types/user.ts` | 共享 |
| `stores/auth-store.ts` | `shared/stores/auth-store.ts` | 共享 |
| `stores/notification-store.ts` | `shared/stores/notification-store.ts` | 共享 |
| `hooks/use-auth.ts` | `shared/hooks/use-auth.ts` | 共享 |
| `hooks/use-socket-client.ts` | `shared/hooks/use-socket-client.ts` | 共享 |
| `hooks/use-notifications.ts` | `shared/hooks/use-notifications.ts` | 共享 |
| `styles/globals.css` | `shared/styles/globals.css` | 共享 |
| `styles/glassmorphism.css` | `shared/styles/glassmorphism.css` | 共享 |

#### ERP 模块（从现有位置迁移）

| 现有路径 | 新路径 | 性质 |
|---|---|---|
| `lib/transition.ts` | `modules/erp/lib/transition.ts` | ERP 专属 |
| `lib/desensitize.ts` | `modules/erp/lib/desensitize.ts` | ERP 专属 |
| `lib/chat-system.ts` | `modules/erp/lib/chat-system.ts` | ERP 专属 |
| `lib/events.ts` | `modules/erp/lib/events.ts` | ERP 专属 |
| `components/orders/*` | `modules/erp/components/orders/*` | ERP 专属 |
| `components/documents/*` | `modules/erp/components/documents/*` | ERP 专属 |
| `components/analytics/*` | `modules/erp/components/analytics/*` | ERP 专属 |
| `components/chat/*` | `modules/erp/components/chat/*` | ERP 专属 |
| `components/layout/sidebar.tsx` | `modules/erp/components/layout/sidebar.tsx` | ERP 专属 |
| `components/layout/topbar.tsx` | `modules/erp/components/layout/topbar.tsx` | ERP 专属 |
| `hooks/use-orders.ts` | `modules/erp/hooks/use-orders.ts` | ERP 专属 |
| `hooks/use-chat.ts` | `modules/erp/hooks/use-chat.ts` | ERP 专属 |
| `stores/order-store.ts` | `modules/erp/stores/order-store.ts` | ERP 专属 |
| `stores/chat-store.ts` | `modules/erp/stores/chat-store.ts` | ERP 专属 |
| `types/order.ts` | `modules/erp/types/order.ts` | ERP 专属 |
| `types/chat.ts` | `modules/erp/types/chat.ts` | ERP 专属 |

### 4.3 变更统计

| 类型 | 数量 | 说明 |
|---|:---:|---|
| 移动文件 | ~50 | 从旧位置到 modules/erp/ 或 shared/ |
| 新增文件 | ~16 | portal 页面 + portal 组件 |
| 修改文件 | ~130 | import 路径更新（机械替换） |
| 删除文件 | 0 | 旧目录确认无引用后清理 |
| 新增 tsconfig 路径 | 2 | @shared/* + @erp/* |

---

## 5. 路由架构

### 5.1 最终路由表

| 路径 | 布局 | 权限 | 状态 |
|---|---|---|:---:|
| `/` | Portal 首页（独立组件，无 Tab 壳） | 公开浏览 | 🆕 |
| `/login` | 认证布局（现有） | 公开 | ✏️ 改跳转 |
| `/register` | 认证布局（现有） | 公开 | ✅ 不动 |
| `/reset-password` | 认证布局（现有） | 公开 | ✅ 不动 |
| `/portal` | Portal 布局（顶栏+底部4Tab） | 已登录 | 🆕 |
| `/portal/tools/news` | Portal 布局 | 已登录 | 🆕 |
| `/portal/tools/itinerary` | Portal 布局 | 已登录 | 🆕 |
| `/portal/tools/form-helper` | Portal 布局 | 已登录 | 🆕 |
| `/portal/tools/assessment` | Portal 布局 | 已登录 | 🆕 |
| `/portal/tools/translator` | Portal 布局 | 已登录 | 🆕 |
| `/portal/tools/documents` | Portal 布局 | 已登录 | 🆕 |
| `/portal/orders` | Portal 布局 | 已登录 | 🆕 |
| `/portal/notifications` | Portal 布局 | 已登录 | 🆕 |
| `/portal/profile` | Portal 布局 | 已登录 | 🆕 |
| `/admin/*` | Admin 布局 | Lv1-8 | ✅ 路由不动 |
| `/customer/*` | Customer 布局 | Lv9 | ✅ 路由不动 |
| `/api/*` | — | 按端点 | ✅ 路由不动 |

### 5.2 路由隔离原则

- `/admin/*` → ERP 管理端（模块代码在 `modules/erp/`）
- `/customer/*` → ERP 客户端（模块代码在 `modules/erp/`）
- `/portal/*` → 新门户（代码在 `components/portal/` + `app/portal/`）
- 三套布局互不干扰，各自有独立的 `layout.tsx`

---

## 6. 门户首页设计

### 6.1 设计理念

**"静谧的高级感"** —— 不是堆砌动效，而是克制中的精致。深蓝暗色底 + 莫兰迪冷色系 + 液态玻璃组件，营造专业旅行平台的高端质感。

### 6.2 首页视觉结构

```
┌──────────────────────────────────────────────────────────────────┐
│  ┌─── 全屏背景 ───────────────────────────────────────────────┐  │
│  │  深蓝黑渐变 (#1A1F2E → #1F2536 → #252B3B)                 │  │
│  │  + 4个浮动光球（更大尺寸、更慢动画、更柔和渐变）             │  │
│  │  + 微光网格（40px间距，更细的线）                           │  │
│  │  + 鼠标跟随光晕（600px，柔和径向渐变）                      │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌── 顶栏 (glass-topbar sticky, z-50) ──────────────────────┐  │
│  │  🌊 MUHAI    ────  [搜索栏]  [消息🔔]  [登录/头像下拉]    │  │
│  │  顶栏滚动时背景透明度渐变：0.72 → 0.92                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌── Hero 区域 (视口居中) ──────────────────────────────────┐  │
│  │                                                            │  │
│  │     一  站  式  签  证  服  务  平  台                        │  │
│  │     ═══════════════════════════════                        │  │
│  │     资讯 · 行程 · 评估 · 办理 — 从了解到出发，全程陪伴       │  │
│  │                                                            │  │
│  │     [ 开始探索 → ]     [ 了解详情 ]                         │  │
│  │                                                            │  │
│  │  动画：                                                     │  │
│  │  · 标题逐词渐显（stagger 100ms/词，从模糊到清晰）           │  │
│  │  · 底部渐变光带缓慢脉动（glowPulse 4s 循环）                │  │
│  │  · CTA 按钮 hover 时光泽扫过（sweep 0.6s）                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌── 核心数据 (scroll-triggered) ───────────────────────────┐  │
│  │  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ │  │
│  │  │                │ │                │ │                │ │  │
│  │  │     200+       │ │     50+        │ │    98.5%       │ │  │
│  │  │   服务客户      │ │   覆盖国家     │ │    出签率       │ │  │
│  │  │                │ │                │ │                │ │  │
│  │  └────────────────┘ └────────────────┘ └────────────────┘ │  │
│  │  · glass-card-accent 变体，带微光边框                       │  │
│  │  · Intersection Observer 触发数字从 0 滚动到目标值（2s）    │  │
│  │  · stagger 入场动画（200ms/卡片）                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌── 6大工具 (scroll-triggered stagger 入场) ────────────────┐  │
│  │                                                            │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │  │
│  │  │   📰        │ │   🗺️        │ │   📝        │          │  │
│  │  │  签证资讯    │ │  行程助手    │ │  申请表     │          │  │
│  │  │  各国政策    │ │  AI 智能规划 │ │  填写指导   │          │  │
│  │  │  实时更新    │ │  一键生成    │ │  逐步引导   │          │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘          │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │  │
│  │  │   🔍        │ │   🌐        │ │   📄        │          │  │
│  │  │  签证评估    │ │  翻译助手    │ │  证明文件   │          │  │
│  │  │  通过率预测  │ │  证件翻译    │ │  模板生成   │          │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘          │  │
│  │                                                            │  │
│  │  交互细节：                                                 │  │
│  │  · scroll-triggered stagger 入场（30ms/卡片）              │  │
│  │  · hover: 浮起 4px + 阴影加深 + 图标微缩放 1.05x + 光晕    │  │
│  │  · hover: 卡片内渐变光扫过 (sweep ::before 从左到右)        │  │
│  │  · click: scale(0.98) 极速反馈                             │  │
│  │  · 未登录点击 → 弹出 glass-modal "请先登录"                │  │
│  │  · 已登录点击 → 进入对应 /portal/tools/* 页面              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌── 热门目的地 (横向 scroll-snap 滚动) ─────────────────────┐  │
│  │  ← 拖拽滚动 →                                              │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │  │
│  │  │ 🇯🇵 日本 │ │ 🇫🇷 法国 │ │ 🇺🇸 美国 │ │ 🇦🇺 澳洲 │          │  │
│  │  │ 单次旅游 │ │ 申根旅游 │ │ B1/B2   │ │ 旅游签  │          │  │
│  │  │ 5-7工作日│ │ 10-15日 │ │ 面签后   │ │ 15-20日 │          │  │
│  │  │ 599元起  │ │ 899元起 │ │ 1299元起 │ │ 999元起 │          │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │  │
│  │  · CSS scroll-snap-type: x mandatory                       │  │
│  │  · 拖拽手势支持（touch + mouse）                            │  │
│  │  · 每张卡片：glass-card + 国旗 emoji + 签证信息 + 价格      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌── CTA 区域 ──────────────────────────────────────────────┐  │
│  │                                                            │  │
│  │         "准备好了吗？让签证办理变得简单"                     │  │
│  │                                                            │  │
│  │              [ 免费注册，立即体验 → ]                        │  │
│  │         · 按钮渐变光扫过效果（sweep）                        │  │
│  │         · hover 浮起 + 阴影加深                             │  │
│  │                                                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌── 页脚 (glass-card-light) ───────────────────────────────┐  │
│  │  © 2026 沐海旅行 · 关于我们 · 联系方式 · 隐私政策           │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### 6.3 新增 CSS 动画

```css
/* 数字滚动入场 */
@keyframes countUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 光带脉动 */
@keyframes glowPulse {
  0%, 100% { opacity: 0.3; width: 60%; }
  50% { opacity: 0.6; width: 80%; }
}

/* 工具卡片 sweep 光效 */
@keyframes sweep {
  0% { left: -100%; }
  100% { left: 200%; }
}

/* Hero 逐词渐显 */
@keyframes wordReveal {
  from { opacity: 0; transform: translateY(12px) scale(0.95); filter: blur(4px); }
  to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
}

/* 目的地卡片入场 */
@keyframes slideInRight {
  from { opacity: 0; transform: translateX(40px); }
  to { opacity: 1; transform: translateX(0); }
}
```

### 6.4 Portal 首页组件清单

| 组件 | 文件 | 说明 |
|---|---|---|
| `PortalHomePage` | `components/portal/portal-home.tsx` | 首页组装（Server Component 包裹 Client 交互部分） |
| `PortalTopbar` | `components/portal/portal-topbar.tsx` | 门户顶栏（品牌+搜索+登录/头像+滚动透明度渐变） |
| `HeroBanner` | `components/portal/hero-banner.tsx` | Hero 区域（逐词动画+光带脉动+CTA按钮） |
| `ToolGrid` | `components/portal/tool-grid.tsx` | 6大工具卡片网格（stagger入场+hover sweep+登录判断） |
| `StatsCounter` | `components/portal/stats-counter.tsx` | 数据统计卡片（Intersection Observer + 数字滚动动画） |
| `DestinationCarousel` | `components/portal/destination-carousel.tsx` | 热门目的地（scroll-snap 横向拖拽滚动） |

---

## 7. 统一登录与入口体系

### 7.1 登录流程改造

**改造前**：
```
/login → 客户 → /customer/orders
/login → 员工 → /admin/dashboard
```

**改造后**：
```
/login → 所有角色 → / （首页 Portal）
```

**修改文件**：`src/app/(auth)/login/page.tsx`

```typescript
// 改前（第39-41行）：
if (user.role === 'CUSTOMER') {
  router.push('/customer/orders')
} else {
  router.push('/admin/dashboard')
}

// 改后：
router.push('/')
```

### 7.2 用户流转路径

#### 员工（Lv1-8）

```
/login → 首页 / → 浏览门户
                   ├── 点击"我的" → /portal/profile
                   │                  └── "进入ERP管理后台" → /admin/dashboard
                   └── 点击"我的订单" → /portal/orders
                                          └── 查看关联订单
```

#### 客户（Lv9）

```
/login → 首页 / → 浏览门户
                   ├── 点击"我的订单" → /portal/orders
                   │                      └── /customer/orders（复用现有页面）
                   └── 点击"我的" → /portal/profile
                                      └── 个人设置 / 修改密码 / 退出
```

#### 未登录

```
/ → 首页（公开浏览工具介绍、资讯内容）
     ├── 点击工具/功能 → 弹出 glass-modal 登录提示
     └── /login → 登录后回到 /
```

---

## 8. ERP 入口集成

### 8.1 Tab 重定向方案

| Tab | 路径 | 实现 |
|---|---|---|
| 首页 | `/` | 渲染 PortalHomePage |
| 我的订单 | `/portal/orders` | redirect → `/customer/orders` |
| 消息 | `/portal/notifications` | redirect → `/customer/notifications` |
| 我的 | `/portal/profile` | 独立实现（含 ERP 管理入口） |

### 8.2 账号面板

#### 员工面板（Lv1-8）

```
┌─ /portal/profile ──────────────────────┐
│  👤 张三                               │
│  角色：签证部管理员 · 沐海旅行            │
│────────────────────────────────────────│
│  🖥️ 进入ERP管理后台     → /admin/*     │
│  📋 我的订单            → /portal/orders│
│  💬 消息中心            → /portal/notif │
│  🔐 修改密码                           │
│  🚪 退出登录                           │
└────────────────────────────────────────┘
```

#### 客户面板（Lv9）

```
┌─ /portal/profile ──────────────────────┐
│  👤 李四                               │
│  手机：138****5678                     │
│────────────────────────────────────────│
│  📋 我的订单            → /portal/orders│
│  💬 消息中心            → /portal/notif │
│  🔐 修改密码                           │
│  🚪 退出登录                           │
└────────────────────────────────────────┘
```

---

## 9. middleware 改造方案

### 9.1 改造后逻辑

```typescript
// src/middleware.ts

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getCurrentUser } from '@/shared/lib/auth'
import { canAccessRoute } from '@/shared/lib/rbac'

const PUBLIC_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/auth/reset-password',
  '/api/health',
  '/api/cron/',
  '/api/shop/',
  '/api/sms/',
  '/login',
  '/register',
  '/reset-password',
]

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. 公开路由直接放行
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // 2. 首页公开可浏览（未登录也能看门户首页）
  if (pathname === '/') {
    return NextResponse.next()
  }

  // 3. 统一鉴权（只调用一次）
  const user = await getCurrentUser(request)

  // 4. API 路由鉴权
  if (pathname.startsWith('/api/')) {
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '未登录或Token已过期' } },
        { status: 401 }
      )
    }
    const response = NextResponse.next()
    response.headers.set('x-user-id', user.userId)
    response.headers.set('x-company-id', user.companyId)
    response.headers.set('x-role', user.role)
    response.headers.set('x-department-id', user.departmentId ?? '')
    return response
  }

  // 5. 页面路由鉴权
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 6. 门户页面 → 所有登录用户可访问
  if (pathname.startsWith('/portal')) {
    return NextResponse.next()
  }

  // 7. 客户访问 /admin → 跳转门户首页
  if (user.role === 'CUSTOMER' && pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // 8. 员工访问 /customer → 跳转门户首页
  if (user.role !== 'CUSTOMER' && pathname.startsWith('/customer')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // 9. /admin 和 /customer 路由权限检查
  if (pathname.startsWith('/admin') || pathname.startsWith('/customer')) {
    if (!canAccessRoute(user.role, pathname)) {
      return NextResponse.redirect(new URL('/403', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
```

### 9.2 与现有 middleware 的差异

| 位置 | 改前 | 改后 |
|---|---|---|
| 根路径 `/` | 员工→`/admin/dashboard` | 直接放行（渲染首页） |
| `/portal/*` | 不存在 | 登录用户放行 |
| 客户访问 `/admin` | → `/customer/orders` | → `/` |
| 员工访问 `/customer` | 无处理 | → `/` |
| 其他 | 不变 | 不变 |

---

## 10. 6大功能模块

### 10.1 模块总览

| # | 模块 | 路径 | 功能简述 | 新增 Prisma 表 |
|---|---|---|---|---|
| 1 | 签证资讯 | `/portal/tools/news` | 各国签证政策/攻略发布 | `erp_news_articles` |
| 2 | 行程助手 | `/portal/tools/itinerary` | AI 行程规划/推荐/导出 | `erp_itineraries` |
| 3 | 申请表助手 | `/portal/tools/form-helper` | 签证申请表填写指导 | `erp_form_templates` + `erp_form_records` |
| 4 | 签证评估 | `/portal/tools/assessment` | 签证通过率评估 | `erp_visa_assessments` |
| 5 | 翻译助手 | `/portal/tools/translator` | 文档/证件翻译 | `erp_translation_requests` |
| 6 | 证明文件 | `/portal/tools/documents` | 在职/收入证明模板 | `erp_doc_helper_templates` + `erp_generated_documents` |

### 10.2 各模块 Prisma Model

#### 签证资讯 `erp_news_articles`

```prisma
model NewsArticle {
  id          String    @id @default(cuid())
  companyId   String?   @db.VarChar(30)
  title       String    @db.VarChar(200)
  content     String    @db.Text
  coverImage  String?   @db.Text
  category    String    @db.VarChar(50)
  tags        Json?
  authorId    String    @db.VarChar(30)
  viewCount   Int       @default(0)
  likeCount   Int       @default(0)
  isPublished Boolean   @default(false)
  isPinned    Boolean   @default(false)
  publishedAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([category])
  @@index([isPublished, publishedAt])
  @@map("erp_news_articles")
}
```

#### 行程助手 `erp_itineraries`

```prisma
model Itinerary {
  id          String    @id @default(cuid())
  userId      String    @db.VarChar(30)
  companyId   String?   @db.VarChar(30)
  title       String    @db.VarChar(200)
  destination String    @db.VarChar(100)
  startDate   DateTime?
  endDate     DateTime?
  days        Json      // [{day, date, activities:[{time, place, desc, tips}]}]
  budget      Decimal?  @db.Decimal(10,2)
  preferences Json?
  coverImage  String?   @db.Text
  isPublic    Boolean   @default(false)
  isTemplate  Boolean   @default(false)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([userId])
  @@map("erp_itineraries")
}
```

#### 申请表助手 `erp_form_templates` + `erp_form_records`

```prisma
model FormTemplate {
  id        String   @id @default(cuid())
  country   String   @db.VarChar(50)
  visaType  String   @db.VarChar(50)
  name      String   @db.VarChar(200)
  fields    Json     // [{label, key, type, required, hint, example}]
  isSystem  Boolean  @default(false)
  createdAt DateTime @default(now())

  @@index([country])
  @@map("erp_form_templates")
}

model FormRecord {
  id         String   @id @default(cuid())
  userId     String   @db.VarChar(30)
  templateId String   @db.VarChar(30)
  data       Json
  progress   Int      @default(0)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([userId])
  @@map("erp_form_records")
}
```

#### 签证评估 `erp_visa_assessments`

```prisma
model VisaAssessment {
  id          String    @id @default(cuid())
  userId      String    @db.VarChar(30)
  country     String    @db.VarChar(50)
  visaType    String    @db.VarChar(50)
  answers     Json
  score       Int       @default(0)
  level       String    @db.VarChar(20) // high/medium/low
  suggestions Json?
  createdAt   DateTime  @default(now())

  @@index([userId])
  @@map("erp_visa_assessments")
}
```

#### 翻译助手 `erp_translation_requests`

```prisma
model TranslationRequest {
  id         String    @id @default(cuid())
  userId     String    @db.VarChar(30)
  sourceLang String    @db.VarChar(10)
  targetLang String    @db.VarChar(10)
  docType    String    @db.VarChar(30)
  sourceFile String    @db.Text
  resultText String?   @db.Text
  resultFile String?   @db.Text
  status     String    @db.VarChar(20)
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt

  @@index([userId])
  @@map("erp_translation_requests")
}
```

#### 证明文件助手 `erp_doc_helper_templates` + `erp_generated_documents`

```prisma
model DocumentHelperTemplate {
  id        String   @id @default(cuid())
  name      String   @db.VarChar(200)
  type      String   @db.VarChar(50)
  language  String   @db.VarChar(10)
  fields    Json
  template  String   @db.Text
  isSystem  Boolean  @default(false)
  createdAt DateTime @default(now())

  @@map("erp_doc_helper_templates")
}

model GeneratedDocument {
  id         String   @id @default(cuid())
  userId     String   @db.VarChar(30)
  templateId String   @db.VarChar(30)
  data       Json
  fileUrl    String   @db.Text
  createdAt  DateTime @default(now())

  @@index([userId])
  @@map("erp_generated_documents")
}
```

---

## 11. 迁移执行计划

### Phase 0：目录重构（模块化基础）✅ 已完成

| 步骤 | 操作 | 验证 | 状态 |
|---|---|---|:---:|
| 1 | 创建 `shared/` 和 `modules/erp/` 目录结构 | 目录存在 | ✅ |
| 2 | 移动共享文件到 `shared/`（lib/ui/types/stores/hooks/styles/components） | 文件到位 | ✅ |
| 3 | 移动 ERP 专属文件到 `modules/erp/`（components/lib/hooks/stores/types） | 文件到位 | ✅ |
| 4 | 更新 `tsconfig.json` 添加 `@shared/*` 和 `@erp/*` 路径别名 | 别名有效 | ✅ |
| 5 | 批量更新 import 路径（`@/lib/xxx` → `@shared/lib/xxx` 等，含动态 import） | 编译通过 | ✅ |
| 6 | 更新 `vitest.config.ts` + `tailwind.config.ts` 的 alias/content | 配置正确 | ✅ |
| 7 | 清理旧空目录（lib/components/stores/hooks/types/styles） | 无残留 | ✅ |
| 8 | **`npx tsc --noEmit` = 0 错误** | ✅ | ✅ |
| 9 | **`npm run build` = 通过** | ✅ | ✅ |
| 10 | **`npx vitest run` = 91 pass** | ✅ | ✅ |

> **Phase 0 完成时间**: 2026-04-01 00:00 | **实际工时**: ~2h | **验证结果**: tsc 0 错误 / build 通过 / 91 测试通过 / 无旧代码残留

### Phase 1：入口改造 ✅ 已完成

| 步骤 | 文件 | 改动 | 状态 |
|---|---|---|:---:|
| 1 | `src/app/page.tsx` | `redirect('/login')` → 渲染 Portal 首页（登录/注册入口+6工具预览） | ✅ |
| 2 | `src/app/(auth)/login/page.tsx` | 所有角色登录后跳转 `/`（门户首页） | ✅ |
| 3 | `src/middleware.ts` | 根路径公开 + /portal 鉴权放行 + shop/sms 公开路由 + 客户/员工互斥跳转 `/` | ✅ |
| 4 | `src/app/portal/layout.tsx` | 门户布局壳（底部 4 Tab：首页/订单/消息/我的） | ✅ |
| 5 | `src/app/portal/page.tsx` | redirect → / | ✅ |
| 6 | `src/app/portal/orders/page.tsx` | redirect → /customer/orders | ✅ |
| 7 | `src/app/portal/notifications/page.tsx` | redirect → /customer/notifications | ✅ |
| 8 | `src/app/portal/profile/page.tsx` | 账号面板（用户信息+ERP入口+订单/消息+退出） | ✅ |
| 9 | `src/app/portal/tools/*/page.tsx` | 6 大工具占位页（资讯/行程/申请表/评估/翻译/证明文件） | ✅ |
| 10 | **`npx tsc --noEmit` + `npm run build` + `npx vitest run`** | 0 错误 / build 通过 / 91 测试通过 | ✅ |

> **Phase 1 完成时间**: 2026-04-01 01:00 | **实际工时**: ~0.5h | **新增文件**: 11 个（portal 布局+路由+工具占位） | **修改文件**: 3 个（page.tsx/login/middleware） | **源文件**: 154 个 / 50 API 路由 / 28 页面

### Phase 2：门户首页（精心打造）✅ 已完成

| 文件 | 说明 | 状态 |
|---|---|:---:|
| `shared/styles/globals.css` | 新增 glowPulse/sweep/wordReveal/slideInRight 动画 + scrollbar-hide | ✅ |
| `components/portal/portal-topbar.tsx` | 门户顶栏（品牌+登录/头像下拉+滚动透明度渐变 0.72→0.92） | ✅ |
| `components/portal/hero-banner.tsx` | Hero 区域（逐词渐显 100ms stagger + 光带 glowPulse + CTA sweep） | ✅ |
| `components/portal/stats-counter.tsx` | 数据统计卡片（Intersection Observer + requestAnimationFrame 数字滚动 2s） | ✅ |
| `components/portal/tool-grid.tsx` | 6大工具入口（scroll-triggered stagger 30ms + hover sweep + 未登录 glass-modal） | ✅ |
| `components/portal/destination-carousel.tsx` | 热门目的地（scroll-snap + 拖拽手势 6 国目的地） | ✅ |
| `components/portal/portal-home.tsx` | 首页组装（Server Component 壳，CTA + 页脚） | ✅ |
| `src/app/page.tsx` | 替换占位为 PortalHomePage + PortalTopbar + DynamicBackground | ✅ |
| `src/app/portal/layout.tsx` | 集成 PortalTopbar + pt-14 适配顶栏 | ✅ |
| **验证** | **tsc 0 错误 / build 通过 / 91 tests pass** | ✅ |

> **完成时间**: 2026-04-01 14:45 | **实际工时**: ~0.5h | **新增文件**: 6 个 Portal 组件 | **修改文件**: 3 个 | **源文件**: 158 个

### Phase 3：ERP 入口页面 ✅ 已完成

| 文件 | 说明 | 状态 |
|---|---|:---:|
| `src/app/portal/orders/page.tsx` | 按角色分流：CUSTOMER → /customer/orders，员工 → /admin/workspace | ✅ |
| `src/app/portal/notifications/page.tsx` | 按角色分流：CUSTOMER → /customer/notifications，员工 → /admin/dashboard | ✅ |
| `src/app/portal/profile/page.tsx` | 账号面板（用户信息+ERP入口+修改密码+订单/消息链接+退出登录） | ✅ |
| **验证** | **tsc 0 错误 / build 通过 / 91 tests pass** | ✅ |

**关键修复（2026-04-01）**：
- P0：Portal 底部 Tab "订单"和"消息"对员工失效（redirect 到 /customer/* 被 middleware 拦截）→ 改为客户端按角色分流
- P0：Portal 个人中心缺少"修改密码" → 复用 customer/profile 的密码修改逻辑（旧密码校验+强度条+可见性切换）
- P1：Portal 布局缺少 DynamicBackground → portal/layout.tsx 引入

> **完成时间**: 2026-04-01 17:36 | **修改文件**: 3 个（orders/notifications/profile page.tsx）+ 1 个（portal/layout.tsx）

### Phase 4：6大工具骨架 ✅ 已完成

| 文件 | 说明 | 状态 |
|---|---|:---:|
| `src/app/portal/tools/news/page.tsx` | 签证资讯（glass-card 占位 + metadata） | ✅ |
| `src/app/portal/tools/itinerary/page.tsx` | 行程助手（glass-card 占位 + metadata） | ✅ |
| `src/app/portal/tools/form-helper/page.tsx` | 申请表助手（glass-card 占位 + metadata） | ✅ |
| `src/app/portal/tools/assessment/page.tsx` | 签证评估（glass-card 占位 + metadata） | ✅ |
| `src/app/portal/tools/translator/page.tsx` | 翻译助手（glass-card 占位 + metadata） | ✅ |
| `src/app/portal/tools/documents/page.tsx` | 证明文件（glass-card 占位 + metadata） | ✅ |
| **验证** | **tsc 0 错误 / build 通过 / 91 tests pass** | ✅ |

> 6个工具页在 Phase 1 中创建，每个均为标准"即将上线"占位页，带 title metadata，UI 风格统一。

### Phase 4.5：架构合规修复（2026-04-01）

Phase 0-4 完成后深度审查发现 5 项架构违规/缺口，已全部修复：

| # | 级别 | 问题 | 修复 | 文件 |
|---|:---:|---|---|---|
| 1 | 🔴 P0 | `shared/hooks/use-socket-client.ts` import `@erp/types/chat`，违反 shared→modules 边界 | 新建 `shared/types/socket-events.ts`，将 3 个 Socket payload 类型提升到 shared 层；`use-socket-client.ts` 改引 `@shared/types/socket-events`；`modules/erp/types/chat.ts` 改为 re-export | 3 文件 |
| 2 | 🔴 P0 | ChatRoom/ChatMessage/ChatRead Schema 有但无 migration 文件，数据库不会创建表 | 新建 `prisma/migrations/20260329_add_m4_chat_tables/migration.sql`（含 3 张表 + 全部索引） | 1 文件 |
| 3 | 🟡 P1 | 3 个 ERP 模块测试文件（transition/desensitize/chat-system）仍在 `shared/lib/__tests__/`，违反模块边界 | 移到 `modules/erp/lib/__tests__/` | 3 文件移动 |
| 4 | 🟡 P1 | `/403` 页面硬编码"返回工作台"链接 `/admin/dashboard`，客户用户点击会再次被 middleware 拦截 | 改为 `'use client'` + `useAuth` 按角色分流：CUSTOMER → `/`，员工 → `/admin/dashboard` | 1 文件 |
| 5 | 📝 | 文档多处测试数量写 "93 passed"，实际 91 | 08-architecture-redesign + 04-dev-standards 统一修正为 91 | 2 文件 |

**验证**: `npx tsc --noEmit` = 0 错误 / `npm run build` = 通过 / `npx vitest run` = 91 pass

**架构边界确认（修复后）**:
- `shared/` → 无任何 `@erp/*` 引用 ✅
- `modules/erp/` → 仅引用 `@shared/*` ✅
- `src/app/` → 引用 `@shared/*` + `@erp/*` ✅（组装层允许）
- `src/components/portal/` → 仅引用 `@shared/*` ✅

### Phase 5：工具模块内容开发 ✅ 已完成

| 文件 | 说明 | 状态 |
|---|---|:---:|
| Prisma Schema | 新增 8 个 Model（NewsArticle/Itinerary/FormTemplate/FormRecord/VisaAssessment/TranslationRequest/DocHelperTemplate/GeneratedDocument）| ✅ |
| Migration | `prisma/migrations/20260402_add_m7_tool_modules/migration.sql` | ✅ |
| `/api/news` | 资讯列表+创建 API（分类筛选+分页+置顶） | ✅ |
| `/api/itineraries` | 行程 CRUD API（创建/列表/日期/预算） | ✅ |
| `/api/form-templates` | 申请表模板列表+创建 API | ✅ |
| `/api/form-records` | 申请表填写记录 API | ✅ |
| `/api/visa-assessments` | 签证评估 API（4题评分+level+suggestions） | ✅ |
| `/api/translations` | 翻译请求 API（多语言+记录） | ✅ |
| `/api/doc-helper` | 证明文件模板+生成 API（模板渲染） | ✅ |
| `portal/tools/news/page.tsx` | 签证资讯页（分类筛选+列表+置顶标记+骨架屏） | ✅ |
| `portal/tools/itinerary/page.tsx` | 行程助手页（创建表单+列表+Modal） | ✅ |
| `portal/tools/form-helper/page.tsx` | 申请表助手页（模板分组+动态表单+进度保存） | ✅ |
| `portal/tools/assessment/page.tsx` | 签证评估页（选国家→4步问卷→评分环形图+建议） | ✅ |
| `portal/tools/translator/page.tsx` | 翻译助手页（语言选择+文档类型+输入+历史记录） | ✅ |
| `portal/tools/documents/page.tsx` | 证明文件页（模板分组+动态字段+模板渲染+复制） | ✅ |
| Initial Migration | `prisma/migrations/0000_init_full_schema/migration.sql`（完整初始Schema 381行） | ✅ |
| **验证** | **tsc 0 错误 / build 通过 / 91 tests pass** | ✅ |

> **完成时间**: 2026-04-02 01:37 | **新增文件**: 13 个（7 API + 6 页面） | **修改文件**: 1 个（prisma schema） | **源文件**: 166 个 / 20,770 行 / 57 API 路由

### 阶段验证清单

```bash
# 每个阶段完成后执行
npx tsc --noEmit           # 0 errors
npm run build              # 通过
npx vitest run             # 91 passed

# ERP 功能零影响确认
# /admin/dashboard → 正常
# /customer/orders → 正常
# /api/health → 正常
```

---

## 12. tsconfig 路径别名

### 12.1 新增路径配置

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@shared/*": ["./src/shared/*"],
      "@erp/*": ["./src/modules/erp/*"],
      "@/*": ["./src/*"]
    }
  }
}
```

### 12.2 vitest.config.ts 同步更新

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, './src/shared'),
      '@erp': path.resolve(__dirname, './src/modules/erp'),
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
  },
})
```

### 12.3 next.config.js 同步更新

```javascript
const nextConfig = {
  // ... existing config ...
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@shared': path.resolve(__dirname, './src/shared'),
      '@erp': path.resolve(__dirname, './src/modules/erp'),
    }
    return config
  },
}
```

### 12.4 import 路径映射规则

| 旧路径 | 新路径 | 说明 |
|---|---|---|
| `@/lib/prisma` | `@shared/lib/prisma` | 共享 |
| `@/lib/auth` | `@shared/lib/auth` | 共享 |
| `@/lib/rbac` | `@shared/lib/rbac` | 共享 |
| `@/lib/utils` | `@shared/lib/utils` | 共享 |
| `@/lib/api-client` | `@shared/lib/api-client` | 共享 |
| `@/lib/oss` | `@shared/lib/oss` | 共享 |
| `@/lib/socket` | `@shared/lib/socket` | 共享 |
| `@/lib/logger` | `@shared/lib/logger` | 共享 |
| `@/lib/transition` | `@erp/lib/transition` | ERP |
| `@/lib/desensitize` | `@erp/lib/desensitize` | ERP |
| `@/lib/events` | `@erp/lib/events` | ERP |
| `@/lib/chat-system` | `@erp/lib/chat-system` | ERP |
| `@/components/ui/*` | `@shared/ui/*` | 共享 |
| `@/components/orders/*` | `@erp/components/orders/*` | ERP |
| `@/components/documents/*` | `@erp/components/documents/*` | ERP |
| `@/components/chat/*` | `@erp/components/chat/*` | ERP |
| `@/components/layout/sidebar` | `@erp/components/layout/sidebar` | ERP |
| `@/components/layout/topbar` | `@erp/components/layout/topbar` | ERP |
| `@/components/layout/glass-card` | `@shared/ui/glass-card` | 共享 |
| `@/components/layout/dynamic-bg` | `@shared/ui/dynamic-bg` | 共享 |
| `@/stores/auth-store` | `@shared/stores/auth-store` | 共享 |
| `@/stores/notification-store` | `@shared/stores/notification-store` | 共享 |
| `@/stores/order-store` | `@erp/stores/order-store` | ERP |
| `@/stores/chat-store` | `@erp/stores/chat-store` | ERP |
| `@/hooks/use-auth` | `@shared/hooks/use-auth` | 共享 |
| `@/hooks/use-socket-client` | `@shared/hooks/use-socket-client` | 共享 |
| `@/hooks/use-notifications` | `@shared/hooks/use-notifications` | 共享 |
| `@/hooks/use-orders` | `@erp/hooks/use-orders` | ERP |
| `@/hooks/use-chat` | `@erp/hooks/use-chat` | ERP |
| `@/types/api` | `@shared/types/api` | 共享 |
| `@/types/user` | `@shared/types/user` | 共享 |
| `@/types/order` | `@erp/types/order` | ERP |
| `@/types/chat` | `@erp/types/chat` | ERP |

> 过渡期：`@/*` 路径别名保留，确保渐进迁移期间不破坏现有引用。

---

## 13. 开发规范约束

### 13.1 模块化规则（强制）

| 规则 | 说明 |
|---|---|
| 模块间禁止互相引用 | `@erp/*` 不能引用 `@travel/*`（未来模块） |
| 模块只能引用 shared 层 | `@shared/*` 是唯一允许的跨层 import |
| shared 层不能引用 modules | `@shared/*` 不知道任何业务模块的存在 |
| Portal 层可引用所有模块 | 组装层，负责组合各模块的组件 |
| 新增 Prisma Model | 必须带 `erp_` 前缀 + `@@map("erp_xxx")` |
| 新增模块目录 | `src/modules/{module-name}/` 下创建 components/hooks/stores/lib/types |

### 13.2 目录命名规范

```
src/modules/{module-name}/              ← 业务模块根目录
  components/                           ← 模块专属组件
  hooks/                                ← 模块专属 Hooks
  stores/                               ← 模块专属 Stores
  lib/                                  ← 模块专属逻辑
  types/                                ← 模块专属类型

src/shared/                             ← 共享基础设施
  lib/                                  ← 公共工具函数
  ui/                                   ← 通用 UI 组件
  types/                                ← 公共类型
  stores/                               ← 公共状态
  hooks/                                ← 公共 Hooks
  styles/                               ← 全局样式
  components/                           ← 通用布局组件

src/components/portal/                  ← Portal 专属组件
src/app/portal/                         ← Portal 路由
```

### 13.3 Git 提交规范

```
feat(portal): 新增门户首页 + 6大工具入口
feat(erp): ERP 模块化重构
refactor(shared): 提取共享基础设施层
feat(tools/news): 签证资讯模块 CRUD
fix(portal): 修复底部 Tab 角标不更新
```

### 13.4 门户开发规范

所有规范继承自 `04-dev-standards.md`，新增约束：

| 规则 | 说明 |
|---|---|
| 新模块页面 | 放 `src/app/portal/tools/{module}/page.tsx` |
| 新模块组件 | 放 `src/components/portal/{module}/` 或页面内联 |
| 新模块 API | 放 `src/app/api/{module}/route.ts` |
| import 路径 | 使用 `@shared/*`、`@erp/*`（新代码禁止用 `@/*` 引用 shared/erp） |
| 样式 | 复用现有 CSS 变量 + morandi 色板 + glass-card 组件系统 |
| `'use client'` | 必须在文件首行 |
| 内部导航 | 使用 `<Link>`，禁止 `<a href>` |
| Prisma 可选字段 | 必须 `?? null` |
| 提交前验证 | `npx tsc --noEmit` = 0 + `npm run build` = 通过 |

### 13.5 门户布局规范

- 门户使用独立 `layout.tsx`，不复用 admin/customer 布局
- 底部 Tab 使用 `glass-topbar` 样式（与 customer layout 统一视觉语言）
- 门户页面默认 `max-w-lg mx-auto`（移动端优先）
- 首页 `/` 是 Server Component（SEO），交互部分用 Client Component

---

## 14. 风险与应对

### 14.1 技术风险

| 风险 | 等级 | 应对方案 |
|---|:---:|---|
| import 路径批量替换出错 | 中 | `npx tsc --noEmit` 逐个定位，0 错误后才提交 |
| 运行时路径不匹配 | 中 | 每阶段后 `npm run build` 验证 |
| 测试用例路径失效 | 低 | 更新 vitest.config.ts 的 alias，确保 93 测试全过 |
| server.ts 的 @/lib/socket 引用 | 低 | 保持 `@/*` 路径别名兼容，server.ts 不需要改 |
| 门户和 ERP 的登录态冲突 | 低 | 共用 JWT Cookie，无冲突 |
| 首页 SSR/CSR 选择 | 低 | 首页用 Server Component（SEO），交互部分用 Client Component |

### 14.2 产品风险

| 风险 | 等级 | 应对方案 |
|---|:---:|---|
| 客户找不到 ERP 入口 | 中 | "我的订单" Tab 放在底部第二个位置，高频入口 |
| 员工找不到管理端入口 | 低 | "我的"面板第一项就是"进入ERP管理后台" |
| 首页内容空洞 | 中 | 第一版用静态工具介绍+示例内容，后续接入真实数据 |

### 14.3 零风险确认

| 原 V3.0 方案风险 | 本方案 |
|---|---|
| events.ts 拆分丢事件 | **不拆，移动到 modules/erp/lib/，import 路径更新** |
| prisma.ts 改 45 文件 | **文件不动，仅 import 路径从 @/lib/ 改为 @shared/lib/** |
| server.ts 遗漏 | **@/* 别名保留兼容，server.ts 不需要改** |
| vitest 路径失效 | **更新 vitest.config.ts alias 即可** |
| ERP 功能受损 | **tsc 0 错误 + build 通过 + 93 test pass = 功能等价证明** |

### 14.4 方案对比总结

| 维度 | V3.0（不动存量） | V4.0（分层模块化） |
|---|---|---|
| 模块化程度 | ❌ 无 | ✅ `modules/erp/` + `shared/` 清晰分层 |
| 故障隔离 | ❌ ERP bug 可能影响新模块 | ✅ ERP 逻辑在 `modules/erp/lib/` |
| 可扩展性 | ⚠️ 新模块不知放哪 | ✅ 新建 `modules/xxx/` 即可 |
| 首页设计 | ⚠️ 简单拼接 | ✅ 精心设计：逐词动画+数据滚动+工具卡片 sweep+横向滚动 |
| ERP 风险 | 🟢 零改动 | 🟡 import 路径更新（tsc 保证正确） |
| 总工时 | ~3.5h | ~8h（含模块化重构） |
| 长期价值 | 低（会越来越乱） | 高（架构清晰，可支撑 3+ 年） |

---

## 附录 A：执行优先级

| 优先级 | 阶段 | 内容 | 预估工时 | 状态 |
|:---:|---|---|:---:|:---:|
| P0 | Phase 0 | 目录重构（模块化基础：shared/ + modules/erp/ + import 迁移） | 2h | ✅ 完成 |
| P0 | Phase 1 | 入口改造（middleware + page.tsx + login + portal 布局 + 11 新文件） | 0.5h | ✅ 完成 |
| P0 | Phase 2 | 门户首页（Hero + 工具网格 + 数据统计 + 目的地 + 顶栏 + 布局） | 3h | ✅ 完成 |
| P0 | Phase 3 | ERP 入口页面（角色分流Tab+修改密码+动态背景） | 0.5h | ✅ 完成 |
| P1 | Phase 4 | 6大工具模块骨架 | 1h | ✅ 完成 |
| P2 | Phase 5 | 工具模块内容开发（8 Model + 7 API + 6 页面） | 2h | ✅ 完成 |
| | | **Phase 0-5 全部合计** | **~9h（已完成）** | |

## 附录 B：验证清单

每个阶段完成后执行：

```bash
# 1. TypeScript 编译
npx tsc --noEmit
# 期望: 0 errors

# 2. 构建
npm run build
# 期望: 成功

# 3. 单元测试
npx vitest run
# 期望: 91 passed

# 4. ERP 功能零影响确认
# 浏览器访问 /admin/dashboard → 正常
# 浏览器访问 /customer/orders → 正常
# 浏览器访问 /api/health → 正常

# 5. 无违规修改（Phase 0 后检查）
git diff --name-only | grep -v "^src/shared/\|^src/modules/\|^src/components/portal/\|^src/app/portal/\|^src/app/page.tsx\|^src/app/(auth)/login/\|^src/middleware.ts\|^tsconfig\|^vitest\|^next.config\|^src/styles/"
# 期望: 空或仅含允许的文件
```

---

*文档结束 — 基于 143 个源文件实际依赖扫描的分层模块化方案*
