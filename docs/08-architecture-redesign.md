# 架构重构方案 — 模块化全栈 Web App（合并优化版）

> **文档版本**: V2.0
> **创建日期**: 2026-03-31
> **最后更新**: 2026-03-31
> **基于**: 141 源文件实际依赖分析 + 产品级 Portal 设计
> **目标**: 将项目从单一 ERP 系统升级为模块化大型综合全栈 Web App（旅行服务平台）
> **原则**: 基于实际代码依赖分析，最小改动达到最大效果，零功能回归
> **核心变更**: 统一登录入口 + 首页旅行门户 + 6大服务工具 + ERP订单驱动客户入口

---

## 目录

1. [现状分析](#1-现状分析)
2. [核心问题](#2-核心问题)
3. [架构设计](#3-架构设计)
4. [统一登录与入口体系](#4-统一登录与入口体系)
5. [首页设计（Portal + 广告位）](#5-首页设计)
6. [6大功能模块预设](#6-6大功能模块预设)
7. [目标目录结构](#7-目标目录结构)
8. [依赖规则](#8-依赖规则)
9. [模块划分（完整映射表）](#9-模块划分)
10. [迁移方案](#10-迁移方案)
11. [新增模块开发规范](#11-新增模块开发规范)
12. [与现有规范的兼容](#12-与现有规范的兼容)
13. [风险与应对](#13-风险与应对)

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

### 1.2 当前登录架构问题

```
现状：
  /login → 管理端登录 → 跳转 /admin/dashboard
  /login → 客户端登录 → 跳转 /customer/orders
  客户和管理员走同一个登录页，靠 middleware 角色判断跳转

问题：
  1. 没有统一的"门户首页"，登录后直接进功能页
  2. 客户看不到平台提供的其他服务（资讯/工具/评估等）
  3. 新增模块没有入口——用户找不到"行程助手""签证评估"在哪
  4. 没有广告/营销位，无法做商业推广
```

### 1.3 依赖图谱（实际扫描结果）

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

### 1.4 lib/ 内部依赖关系（精确扫描）

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

### 1.5 组件分类（实际依赖分析）

| 分类 | 文件 | import 依赖 | 性质 |
|---|---|---|---|
| **纯 UI** | ui/ (10个) | 仅 `cn` 或无依赖 | → `shared/ui/` |
| **业务-ERP** | orders/ (5个) + documents/ (3个) + analytics/ (3个) | types/*, lib/oss | → `features/erp/components/` |
| **业务-聊天** | chat/ (5个) | stores/chat-store | → `features/chat/components/` |
| **业务-通知** | notifications/ (1个) | lib/notification-icons | → `features/notification/components/` |
| **布局-业务** | layout/sidebar.tsx | hooks/use-auth, lib/utils | ⚠️ 引用 hooks |
| **布局-业务** | layout/topbar.tsx | hooks/use-auth, 通知Bell, 聊天列表 | ⚠️ 深度耦合 features |
| **布局-纯 UI** | layout/glass-card.tsx | 仅 `cn` | → `shared/ui/` |
| **布局-纯 UI** | layout/dynamic-bg.tsx | 无依赖 | → `shared/ui/` |
| **布局-纯 UI** | layout/page-header.tsx | 无依赖 | → `shared/ui/` |

---

## 2. 核心问题

### 2.1 lib/ 是单体大泥球

14 个文件放在一起，无领域边界。`transition.ts`（ERP 状态机 365 行）和 `prisma.ts`（数据库 11 行）是邻居，但实际上属于完全不同的层次。

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

glass-card、dynamic-bg、page-header → 纯 UI，无业务依赖；sidebar、topbar → 引用 hooks（useAuth）和业务组件（NotificationBell、ChatRoomList）。当前都放在 `components/layout/` 下，但 sidebar/topbar 本质上是 admin 布局的一部分。

### 2.4 没有模块边界

新增一个"行程规划"模块，应该放哪？当前结构没有答案。所有业务组件混在 `components/` 下。

### 2.5 缺少统一门户

当前系统只有"管理端"和"客户端"两个入口，没有面向所有用户的统一封面页（Portal）。升级为综合 Web App 后，用户需要一个首页来发现和使用各种服务。

### 2.6 hooks/use-socket-client.ts 的定位模糊

它是 React Hook（useRef、useEffect、useCallback），但同时又是实时通信的基础设施。放 `core/` 不合适（不是纯 TS），放 `hooks/` 又是全局基础设施。

---

## 3. 架构设计

### 3.1 设计原则

| 原则 | 说明 |
|---|---|
| **模块自治** | 每个 feature 有独立的 types + api + store + hook + components |
| **共享最小化** | core/ 只放真正跨模块的基础设施（auth、db、logger、oss、utils） |
| **依赖单向** | 上层依赖下层，同层模块互不依赖 |
| **故障隔离** | 一个 feature 崩溃不影响其他 feature |
| **渐进迁移** | 4 阶段执行，阶段 1-2 不破坏任何现有功能 |
| **统一入口** | 单一登录 + 统一门户 + 账号面板驱动 |

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
- `layouts/sidebar.tsx` — admin 侧边栏（引用 features 的 hooks 和 user types）
- `layouts/topbar.tsx` — admin 顶栏（引用 features 的 hooks 和 notification/chat 组件）
- `layouts/app-layout.tsx` — 🆕 门户布局（顶栏 + 搜索 + 底部 Tab）

布局层的定位：Page 级组装，本质上属于 Layer 4 的一部分，但独立为 `layouts/` 目录以提高可维护性。

### 3.3 产品分层模型

```
    ┌──────────────────────────────────────────────────────┐
    │            Portal 首页（旅行服务平台）                  │  所有人
    │                                                      │
    │  顶栏: 品牌 + 搜索 + 导航(资讯/行程/评估...) + 登录/头像  │
    │  Banner 广告轮播                                      │
    │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐│
    │  │签证资讯│ │行程助手│ │申请表 │ │签证评估│ │翻译助手│ │证明文件││  ← 6大工具入口
    │  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘│
    │  推荐内容流 / 攻略 / 热门目的地                          │
    │                                                      │
    │  底部 Tab:  [首页]  [我的订单]  [消息]  [我的]           │
    └──┬──────────┬──────────┬──────────────┬──────────────┘
       │          │          │              │
       │     ┌────▼────┐     │         ┌────▼──────────────┐
       │     │ 我的订单  │     │         │ "我的" 账号面板    │
       │     │ /orders │     │         │                   │
       │     └────┬────┘     │         │ Lv1-8: ERP管理入口 │
       │          │有订单?    │         │ Lv9:  个人设置     │
       │     ┌────▼────┐     │         └───────────────────┘
       │     │ ERP客户  │     │
       │     │ 订单详情  │     │         ┌───────────────────┐
       │     │ 资料上传  │     │         │  ERP 管理端       │
       │     │ 进度跟踪  │     │         │  /admin/*         │
       │     │ 材料下载  │     │         │  仅 Lv1-8 员工    │
       │     │ 出签反馈  │     │         └───────────────────┘
       │     └─────────┘     │
       │                ┌────▼────┐
       └────────────────│ 工具页面  │
                        │ /tools/*│
                        └─────────┘
```

**核心设计原则**：
- **首页 = 旅行服务平台**：6大工具入口直接展示在首页，未登录可浏览，登录后使用
- **ERP 客户入口 = "我的订单"**：客户通过底部 Tab "我的订单" 进入 ERP 客户端（上传资料、查看进度、下载材料、出签反馈）。有订单才能进入，无订单显示空状态引导
- **ERP 员工入口 = "我的" 面板**：员工通过底部 Tab "我的" → "进入ERP管理后台" 进入管理端
- **ERP 是双向系统**：不是纯内部管理——客户也需要通过 ERP 走签证办理流程
- **底部 Tab 导航**：首页 / 我的订单 / 消息 / 我的（4 Tab）

---

## 4. 统一登录与入口体系

### 4.1 统一登录入口

**所有角色（Lv1-Lv9）通过同一个登录页 `/login` 进入系统。登录后统一回到首页。**

```
/login（统一登录页）
  │
  ├── 未登录 → 显示登录表单
  │
  └── 已登录 → 统一跳转到首页 /（Portal）
      │
      ├── 所有用户 → 首页（浏览工具、资讯、内容）
      ├── Lv1-8 → "我的" 面板中出现 "进入管理后台" 入口
      └── Lv9  → "我的" 面板为个人中心（订单/设置）
```

**登录页设计**：
- 液态玻璃风格（现有实现保留）
- 公司 Logo + "沐海旅行" 品牌标识
- 用户名/密码 + 记住我
- 客户首次登录 → 重置密码流程（现有实现保留）

**核心变化**：不再按角色跳转到 /admin 或 /customer。所有人登录后回首页，按需使用工具或进入管理后台。

### 4.2 账号面板与 ERP 入口

#### ERP 客户入口 — 底部 Tab "我的订单" `/orders`

```
"我的订单" 页面逻辑：

  ┌─ /orders ──────────────────────┐
  │                                │
  │  查询该用户关联的订单             │
  │                                │
  │  有订单 → 订单列表（卡片式）      │
  │    └─ 点击订单 → /orders/[id]   │
  │       └─ 进入 ERP 客户端：       │
  │          · 订单状态时间线         │
  │          · A类资料上传           │
  │          · 确认提交资料           │
  │          · B类材料下载           │
  │          · 出签结果反馈           │
  │          · 操作记录              │
  │          · 订单信息              │
  │                                │
  │  无订单 → 空状态                 │
  │    · "暂无订单" 提示             │
  │    · 引导联系客服下单             │
  │    · [浏览签证资讯] [行程助手]    │
  └────────────────────────────────┘
```

#### 员工账号面板（Lv1-8）— 底部 Tab "我的"

```
┌─ 我的 ──────────────────────────────┐
│  👤 张三                            │
│  角色：签证部管理员                   │
│  公司：沐海旅行                      │
│─────────────────────────────────────│
│  📊 ERP 管理后台                     │
│  ┌─────────────────────────────────┐│
│  │  🖥️ 进入管理后台  → /admin/*    ││  ← 员工专属入口
│  └─────────────────────────────────┘│
│  📋 我的订单 → /orders              │
│  💬 消息中心 → /chat                │
│  🔔 通知中心 → /notifications       │
│  👤 个人设置 → /profile             │
│  🔐 修改密码                        │
│  🚪 退出登录                        │
└─────────────────────────────────────┘
```

#### 客户账号面板（Lv9）— 底部 Tab "我的"

```
┌─ 我的 ──────────────────────────────┐
│  👤 李四                            │
│  手机：138****5678                  │
│─────────────────────────────────────│
│  📋 我的订单 → /orders              │
│  💬 我的消息 → /chat                │
│  🔔 通知中心 → /notifications       │
│  👤 个人设置 → /profile             │
│  🔐 修改密码                        │
│  🚪 退出登录                        │
└─────────────────────────────────────┘
```

### 4.3 路由权限映射

| 路径 | 角色 | 说明 |
|---|---|---|
| `/login` | 公开 | 统一登录页 |
| `/register` | 公开 | 公司入驻注册 |
| `/reset-password` | 公开 | 客户重置密码 |
| `/` | 公开→已登录 | 门户首页（所有人共用，未登录可浏览） |
| `/orders` | 已登录 | 我的订单 — 客户 ERP 入口 |
| `/chat` | 已登录 | 消息中心 |
| `/notifications` | 已登录 | 通知中心 |
| `/profile` | 已登录 | 个人中心（含 ERP 管理入口仅员工可见） |
| `/tools/*` | 公开可浏览/登录可用 | 6大工具页面 |
| `/admin/*` | Lv1-8 | ERP 管理端（仅员工） |
| `/api/*` | 按端点 | API 路由 |

### 4.4 中间件改造

```typescript
// middleware.ts 改造后逻辑

const PUBLIC_PATHS = [
  '/login', '/register', '/reset-password',
  '/api/auth/',
  '/tools/',          // 工具页可公开浏览（内容展示），使用功能需登录
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. 公开路由放行
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // 2. /admin/* 需要 Lv1-8 员工权限
  if (pathname.startsWith('/admin')) {
    const user = await getCurrentUser(request)
    if (!user || user.role === 'CUSTOMER') {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }

  // 3. /orders, /chat, /notifications, /profile 需要登录
  const authRequired = ['/orders', '/chat', '/notifications', '/profile']
  if (authRequired.some(p => pathname.startsWith(p))) {
    const user = await getCurrentUser(request)
    if (!user) return NextResponse.redirect(new URL('/login', request.url))
    return NextResponse.next()
  }

  // 4. 根路径 → 直接放行到首页（不跳转）
  if (pathname === '/') {
    return NextResponse.next()
  }
}
```

---

## 5. 首页设计（Portal + 广告位）

### 5.1 首页 `/` 布局

```
┌─────────────────────────────────────────────────────────┐
│  顶栏（glass-topbar sticky）                              │
│  沐海旅行    搜索栏              [登录] / [👤头像下拉]     │
├─────────────────────────────────────────────────────────┤
│  ┌─ 广告 Banner 区（轮播/固定） ──────────────────────┐  │
│  │  🌸 春季赏花去哪里？                                │  │
│  │  高品质赏樱签证套餐，快人一步                        │  │
│  │  [立即办理]                    🔍 搜索目的地/签证    │  │
│  └────────────────────────────────────────────────────┘  │
│  ┌─ 功能入口网格（6大工具 — 首页核心内容）────────────┐  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐                 │  │
│  │  │ 📰     │ │ 🗺️     │ │ 📝     │                 │  │
│  │  │签证资讯 │ │行程助手 │ │申请表   │                 │  │
│  │  └────────┘ └────────┘ └────────┘                 │  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐                 │  │
│  │  │ 🔍     │ │ 🌐     │ │ 📄     │                 │  │
│  │  │签证评估 │ │翻译助手 │ │证明文件 │                 │  │
│  │  └────────┘ └────────┘ └────────┘                 │  │
│  └────────────────────────────────────────────────────┘  │
│  ┌─ 推荐内容流（攻略/热门目的地/资讯）────────────────┐  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐           │  │
│  │  │ 📸 卡片  │ │ 📸 卡片  │ │ 📸 卡片  │           │  │
│  │  └──────────┘ └──────────┘ └──────────┘           │  │
│  └────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────┤
│  底部 Tab:  [首页]  [我的订单]  [消息]  [我的]            │
└─────────────────────────────────────────────────────────┘
```

### 5.2 广告位定义

| 广告位 | 位置 | 类型 | 尺寸建议 | 说明 |
|---|---|---|---|---|
| `hero_banner` | 顶部大图 | 轮播/静态 | 全宽 × 200px | 主推活动/签证套餐 |
| `feature_banner` | 功能入口上方 | 固定 | 全宽 × 80px | 季节性推荐 |
| `sidebar_ad` | 推荐流侧边 | 固定 | 280px × 250px | 合作广告 |
| `interstitial_card` | 推荐流中间 | 嵌入式 | 卡片宽度 | 原生广告卡片 |

### 5.3 广告数据模型

```typescript
interface AdSlot {
  id: string
  position: 'hero_banner' | 'feature_banner' | 'sidebar_ad' | 'interstitial_card'
  title: string
  imageUrl: string
  linkUrl?: string
  isActive: boolean
  sortOrder: number
  startDate?: string
  endDate?: string
}
```

### 5.4 首页 API

| 方法 | 路径 | 说明 | 权限 |
|---|---|---|---|
| GET | `/api/home` | 聚合首页数据（广告+推荐+统计） | 公开/已登录 |
| GET | `/api/home/ads` | 广告列表 | 公开 |
| POST | `/api/home/ads` | 创建广告 | Lv1-2 |
| PATCH | `/api/home/ads/[id]` | 更新广告 | Lv1-2 |
| DELETE | `/api/home/ads/[id]` | 删除广告 | Lv1-2 |

---

## 6. 6大功能模块预设

### 6.1 模块总览

| # | 模块 | 路径 | 功能简述 | 优先级 | 新增 Prisma 表 |
|---|---|---|---|:---:|---|
| 1 | 签证资讯 | `/tools/news` | 各国签证政策/变动/攻略发布 | P1 | `erp_news_articles` |
| 2 | 行程助手 | `/tools/itinerary` | AI 行程规划/推荐/导出 | P1 | `erp_itineraries` |
| 3 | 申请表助手 | `/tools/form-helper` | 签证申请表填写指导/模板 | P1 | `erp_form_templates` + `erp_form_records` |
| 4 | 签证评估 | `/tools/assessment` | 签证通过率评估/条件分析 | P1 | `erp_visa_assessments` |
| 5 | 翻译助手 | `/tools/translator` | 文档/证件/材料翻译 | P2 | `erp_translation_requests` |
| 6 | 证明文件助手 | `/tools/documents` | 在职证明/银行流水等模板 | P2 | `erp_doc_helper_templates` + `erp_generated_documents` |

### 6.2 各模块详细设计

#### 6.2.1 签证资讯 `/tools/news`

**功能**：签证政策变动推送、签证办理攻略/经验分享、行前须知、收藏/点赞/评论

**路由**：
```
/tools/news              → 资讯列表（筛选/搜索/分页）
/tools/news/[id]         → 资讯详情
/tools/news/category/[slug] → 分类浏览
```

**API**：GET/PUT `/api/news`、GET/PATCH/DELETE `/api/news/[id]`

**Prisma Model**：
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

#### 6.2.2 行程助手 `/tools/itinerary`

**功能**：AI 生成行程规划、行程编辑（拖拽/增删）、导出 PDF/分享链接、收藏/模板复用

**路由**：
```
/tools/itinerary         → 我的行程列表
/tools/itinerary/new     → 新建行程（向导式）
/tools/itinerary/[id]    → 行程详情/编辑
/tools/itinerary/templates → 行程模板库
```

**API**：GET/POST `/api/itinerary`、GET/PATCH/DELETE `/api/itinerary/[id]`、POST `/api/itinerary/[id]/generate`、GET `/api/itinerary/templates`

**Prisma Model**：
```prisma
model Itinerary {
  id          String    @id @default(cuid())
  userId      String    @db.VarChar(30)
  companyId   String?   @db.VarChar(30)
  title       String    @db.VarChar(200)
  destination String    @db.VarChar(100)
  startDate   DateTime?
  endDate     DateTime?
  days        Json      // [{day:1, date, activities:[{time, place, desc, tips}]}]
  budget      Decimal?  @db.Decimal(10,2)
  preferences Json?     // {interests:[], pace:'relaxed', transport:'public'}
  coverImage  String?   @db.Text
  isPublic    Boolean   @default(false)
  isTemplate  Boolean   @default(false)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([userId])
  @@map("erp_itineraries")
}
```

#### 6.2.3 申请表助手 `/tools/form-helper`

**功能**：各国签证申请表模板展示、逐项填写指导、填写进度跟踪、导出

**路由**：
```
/tools/form-helper           → 申请表模板列表
/tools/form-helper/[country] → 某国申请表模板
/tools/form-helper/fill/[id] → 填写表单
/tools/form-helper/records   → 我的填写记录
```

**API**：GET `/api/form-helper/templates`、GET `/api/form-helper/templates/[id]`、POST/GET/PATCH `/api/form-helper/records`

**Prisma Model**：
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
  data       Json     // {fieldKey: value}
  progress   Int      @default(0) // 0-100
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([userId])
  @@map("erp_form_records")
}
```

#### 6.2.4 签证评估 `/tools/assessment`

**功能**：选择目标国家+签证类型、填写个人条件、AI 评估通过率+改善建议、可关联到订单

**路由**：
```
/tools/assessment         → 评估首页（选择国家）
/tools/assessment/[country] → 填写评估问卷
/tools/assessment/result/[id] → 评估结果
/tools/assessment/history    → 历史评估记录
```

**API**：POST `/api/assessment`、GET `/api/assessment/[id]`、GET `/api/assessment/history`

**Prisma Model**：
```prisma
model VisaAssessment {
  id          String    @id @default(cuid())
  userId      String    @db.VarChar(30)
  country     String    @db.VarChar(50)
  visaType    String    @db.VarChar(50)
  answers     Json      // {income, assets, travelHistory, employment, ...}
  score       Int       @default(0)    // 0-100
  level       String    @db.VarChar(20) // high/medium/low
  suggestions Json?     // [{category, suggestion, priority}]
  createdAt   DateTime  @default(now())

  @@index([userId])
  @@map("erp_visa_assessments")
}
```

#### 6.2.5 翻译助手 `/tools/translator`

**功能**：上传文档/图片 → OCR + AI 翻译、证件翻译、材料翻译、翻译结果下载

**路由**：
```
/tools/translator        → 翻译首页（上传文件）
/tools/translator/result/[id] → 翻译结果
/tools/translator/history    → 翻译历史
```

**API**：POST `/api/translator`、GET `/api/translator/[id]`、GET `/api/translator/history`

**Prisma Model**：
```prisma
model TranslationRequest {
  id         String    @id @default(cuid())
  userId     String    @db.VarChar(30)
  sourceLang String    @db.VarChar(10)
  targetLang String    @db.VarChar(10)
  docType    String    @db.VarChar(30) // passport/id_card/household/...
  sourceFile String    @db.Text        // OSS key
  resultText String?   @db.Text
  resultFile String?   @db.Text
  status     String    @db.VarChar(20) // pending/processing/completed/failed
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt

  @@index([userId])
  @@map("erp_translation_requests")
}
```

#### 6.2.6 证明文件助手 `/tools/documents`

**功能**：在职证明/收入证明模板、自动填充 → 导出 PDF、自定义模板管理

**路由**：
```
/tools/documents           → 证明文件首页（模板选择）
/tools/documents/template/[type] → 填写模板
/tools/documents/generated     → 已生成的文件
```

**API**：GET `/api/doc-helper/templates`、POST `/api/doc-helper/generate`、GET `/api/doc-helper/generated`

**Prisma Model**：
```prisma
model DocumentHelperTemplate {
  id       String   @id @default(cuid())
  name     String   @db.VarChar(200)
  type     String   @db.VarChar(50)  // employment/income/business/...
  language String   @db.VarChar(10)  // zh/en/bilingual
  fields   Json     // [{label, key, type, required}]
  template String   @db.Text         // 模板内容（含占位符）
  isSystem Boolean  @default(false)
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

### 6.3 工具模块统一入口组件

```tsx
// features/home/components/tool-grid.tsx

const TOOLS = [
  { id: 'news',        icon: '📰', name: '签证资讯', desc: '最新政策与攻略',   href: '/tools/news',        color: 'var(--color-info)' },
  { id: 'itinerary',   icon: '🗺️', name: '行程助手', desc: 'AI 智能行程规划', href: '/tools/itinerary',   color: 'var(--color-accent)' },
  { id: 'form-helper', icon: '📝', name: '申请表助手', desc: '各国签证表指导', href: '/tools/form-helper', color: 'var(--color-warning)' },
  { id: 'assessment',  icon: '🔍', name: '签证评估', desc: '通过率智能评估',   href: '/tools/assessment',  color: 'var(--color-success)' },
  { id: 'translator',  icon: '🌐', name: '翻译助手', desc: '证件材料翻译',     href: '/tools/translator',  color: 'var(--color-primary)' },
  { id: 'documents',   icon: '📄', name: '证明文件', desc: '在职/收入证明模板', href: '/tools/documents',   color: 'var(--color-error)' },
]
```

---

## 7. 目标目录结构

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
│   ├── event-bus.ts                # 🆕 通用事件总线（纯事件分发）
│   └── __tests__/                  # 基础设施测试
│
├── features/                       # Layer 3: 领域模块
│   ├── auth/                       # 认证模块
│   │   ├── types.ts
│   │   ├── store.ts                # (原 stores/auth-store.ts)
│   │   ├── hooks.ts                # (原 hooks/use-auth.ts)
│   │   └── components/
│   │       └── account-panel.tsx   # 🆕 账号资料面板（统一入口）
│   │
│   ├── erp/                        # ERP 管理模块
│   │   ├── types.ts                # (原 types/order.ts)
│   │   ├── api.ts                  # 🆕 前端 API 封装
│   │   ├── store.ts                # (原 stores/order-store.ts)
│   │   ├── hooks.ts                # (原 hooks/use-orders.ts)
│   │   ├── transition.ts           # (原 lib/transition.ts)
│   │   ├── desensitize.ts          # (原 lib/desensitize.ts)
│   │   ├── analytics.ts            # 🆕 数据分析 API 封装
│   │   ├── events.ts               # 🆕 ERP 事件注册
│   │   └── components/             # (原 orders/documents/analytics 组件)
│   │
│   ├── chat/                       # 聊天模块
│   │   ├── types.ts                # (原 types/chat.ts)
│   │   ├── api.ts
│   │   ├── store.ts                # (原 stores/chat-store.ts)
│   │   ├── hooks.ts                # (原 hooks/use-chat.ts)
│   │   ├── system.ts               # (原 lib/chat-system.ts)
│   │   ├── events.ts               # 🆕 聊天事件注册
│   │   └── components/             # (原 chat/ 组件)
│   │
│   ├── notification/               # 通知模块
│   │   ├── types.ts
│   │   ├── api.ts
│   │   ├── store.ts                # (原 stores/notification-store.ts)
│   │   ├── hooks.ts                # (原 hooks/use-notifications.ts)
│   │   ├── icons.ts                # (原 lib/notification-icons.ts)
│   │   └── components/             # (原 notification-bell.tsx)
│   │
│   ├── home/                       # 🆕 首页模块
│   │   ├── types.ts                # AdSlot, FeaturedContent
│   │   ├── api.ts                  # 门户 API 封装
│   │   ├── store.ts                # 门户状态
│   │   └── components/
│   │       ├── hero-banner.tsx     # 顶部广告轮播
│   │       ├── tool-grid.tsx       # 功能入口网格（6大工具）
│   │       ├── content-feed.tsx    # 推荐内容流
│   │       ├── ad-card.tsx         # 广告卡片
│   │       ├── search-bar.tsx      # 搜索栏
│   │       └── filter-tabs.tsx     # 筛选标签栏
│   │
│   ├── news/                       # 🆕 签证资讯模块
│   │   ├── types.ts / api.ts / store.ts / hooks.ts
│   │   └── components/ (article-card / article-detail / category-filter)
│   │
│   ├── itinerary/                  # 🆕 行程助手模块
│   │   ├── types.ts / api.ts / store.ts / hooks.ts
│   │   └── components/ (itinerary-card / day-planner / activity-editor / ai-generator)
│   │
│   ├── form-helper/                # 🆕 申请表助手模块
│   │   ├── types.ts / api.ts / hooks.ts
│   │   └── components/ (form-template-card / form-field-guide / form-progress)
│   │
│   ├── assessment/                 # 🆕 签证评估模块
│   │   ├── types.ts / api.ts / hooks.ts
│   │   └── components/ (country-selector / questionnaire / result-card / score-gauge)
│   │
│   ├── translator/                 # 🆕 翻译助手模块
│   │   ├── types.ts / api.ts / hooks.ts
│   │   └── components/ (upload-zone / result-viewer / history-list)
│   │
│   └── doc-helper/                 # 🆕 证明文件助手模块
│       ├── types.ts / api.ts / hooks.ts
│       └── components/ (template-selector / form-filler / pdf-preview)
│
├── shared/                         # Layer 2: 共享 UI
│   └── ui/                         # (原 components/ui/ + layout/glass-card 等)
│       ├── glass-card.tsx / dynamic-bg.tsx / page-header.tsx
│       ├── button.tsx / badge.tsx / modal.tsx / input.tsx / select.tsx
│       ├── toast.tsx / card.tsx / file-preview.tsx / camera-capture.tsx
│       └── empty-state.tsx         # 🆕 空状态组件
│
├── layouts/                        # 布局组件
│   ├── sidebar.tsx                 # (原 components/layout/sidebar.tsx)
│   ├── topbar.tsx                  # (原 components/layout/topbar.tsx)
│   └── app-layout.tsx              # 🆕 门户布局（顶栏 + 底部 Tab）
│
├── types/                          # 全局共享类型
│   ├── api.ts                      # ApiResponse、ApiMeta (不变)
│   └── user.ts                     # UserProfile、UserRole (不变)
│
├── app/                            # Layer 4: 页面 + API 路由
│   ├── api/
│   │   ├── auth/                   # 认证 API (不变)
│   │   ├── home/                   # 🆕 首页 API（广告+推荐）
│   │   ├── orders/                 # 订单 API (路径不变)
│   │   ├── documents/              # 资料 API (路径不变)
│   │   ├── applicants/             # 申请人 API (不变)
│   │   ├── templates/              # 模板 API (不变)
│   │   ├── analytics/              # 分析 API (不变)
│   │   ├── chat/                   # 聊天 API (不变)
│   │   ├── notifications/          # 通知 API (不变)
│   │   ├── companies/              # 公司 API (不变)
│   │   ├── users/                  # 用户 API (不变)
│   │   ├── departments/            # 部门 API (不变)
│   │   ├── cron/                   # 定时任务 (不变)
│   │   ├── news/                   # 🆕 资讯 API
│   │   ├── itinerary/              # 🆕 行程 API
│   │   ├── form-helper/            # 🆕 申请表 API
│   │   ├── assessment/             # 🆕 评估 API
│   │   ├── translator/             # 🆕 翻译 API
│   │   └── doc-helper/             # 🆕 证明文件 API
│   │
│   ├── (auth)/                     # 登录/注册 (不变)
│   │
│   ├── page.tsx                    # 🆕 首页（旅行服务平台）
│   │
│   ├── orders/                     # 我的订单（所有登录用户）
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── chat/                       # 消息中心
│   ├── notifications/              # 通知中心
│   ├── profile/                    # "我的" 账号面板
│   │
│   ├── admin/                      # ERP 管理端（Lv1-8）
│   │   ├── dashboard/ / erp/ / portal-management/ / team/ / analytics/ / settings/
│   │   └── layout.tsx
│   │
│   ├── tools/                      # 🆕 6大工具与服务页面
│   │   ├── news/ (page.tsx + [id]/page.tsx)
│   │   ├── itinerary/ (page.tsx + new/page.tsx + [id]/page.tsx)
│   │   ├── form-helper/ (page.tsx + [country]/page.tsx)
│   │   ├── assessment/ (page.tsx + result/[id]/page.tsx)
│   │   ├── translator/ (page.tsx)
│   │   └── documents/ (page.tsx)
│   │
│   ├── layout.tsx                  # 全局布局
│   └── page.tsx                    # 根路径
│
├── middleware.ts                    # 改造（见 4.4）
├── server.ts                       # 不变
└── styles/                         # 不变
```

### 7.1 API 路由路径决策

**✅ 保持现有 ERP API 路径不变** (`/api/orders/`、`/api/documents/` 等)

理由：
- 50 个已有 API 路由，路径变更是破坏性变更
- 前端 16 个页面直接调用这些路径，改路径 = 全量回归测试
- 模块化在 import 层面实现（API 路由 import `@/core/` + `@/features/erp/types`），不在 URL 路径层面
- 新模块使用 `/api/{module}/` 前缀即可

---

## 8. 依赖规则

### 8.1 依赖箭头（单向，禁止反向）

```
Pages + API Routes (app/) ──→ Features ──→ Core
                               │              ▲
                               └──→ Shared UI ─┘

layouts/ ──→ Features + Shared UI + Core (utils/api-client)
```

### 8.2 具体规则

| 规则 | 允许 | 禁止 |
|---|---|---|
| Pages → Features | ✅ import erp/hooks、home/store 等 | ❌ 直接 import core/prisma |
| Pages → Core | ✅ import core/utils (cn)、core/api-client | ❌ import core/db |
| API Routes → Core | ✅ import core/* | — |
| API Routes → Features | ✅ import features/*/types | ❌ import features/*/store |
| Features → Core | ✅ import core/* | — |
| Features → Features | ⚠️ 只允许 import types | ❌ import 其他 feature 的 store/hook/api |
| Features 间通信 | 通过 core/event-bus.ts | ❌ 直接调用其他模块函数 |
| Shared UI → Core | ✅ 只允许 import core/utils | ❌ import core/auth、core/db |
| Core → 任何上层 | ❌ 永远禁止 | — |

### 8.3 模块间通信

```typescript
// 方式 1（推荐）：事件总线
eventBus.emit('order:completed', { orderId })
eventBus.on('order:completed', (data) => { ... })

// 方式 2：共享类型
import type { OrderStatus } from '@/features/erp/types'
```

### 8.4 events.ts 解耦 — 具体方案

当前 `events.ts` (157行) 做了 3 件事，需要拆成 2 个文件：

```
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

  (ORDER_STATUS_LABELS 删除重复定义，统一从 @/features/erp/types 导入)
```

### 8.5 use-socket-client.ts 处理方案

```
core/socket-client.ts (~120行)  — 纯 TS，无 React 依赖
├── SocketClient 类 (connect/disconnect/joinRoom/leaveRoom/on/off/emit)
├── 单例模式 + Cookie 认证 + 自动重连
└── export const socketClient = new SocketClient()

hooks/use-socket-client.ts (~60行)  — React Hook 包装
├── import { socketClient } from '@/core/socket-client'
├── useEffect (connect/disconnect 生命周期)
├── useState (isConnected)
└── useCallback (暴露 joinRoom/leaveRoom 等)
```

---

## 9. 模块划分（完整映射表）

### 9.1 lib/ → core/ 迁移

| 当前位置 | 目标位置 | 行数 | 说明 |
|---|---|---:|---|
| `lib/prisma.ts` | `core/db.ts` | 11 | 重命名 |
| `lib/auth.ts` | `core/auth.ts` | 110 | — |
| `lib/rbac.ts` | `core/rbac.ts` | 184 | — |
| `lib/api-client.ts` | `core/api-client.ts` | 56 | — |
| `lib/logger.ts` | `core/logger.ts` | 108 | — |
| `lib/oss.ts` | `core/oss.ts` | 214 | — |
| `lib/file-types.ts` | `core/file-types.ts` | 23 | — |
| `lib/utils.ts` | `core/utils.ts` | 108 | — |
| `lib/socket.ts` | `core/socket.ts` | 244 | — |
| `lib/events.ts` | 拆分 | 157 | → `core/event-bus.ts` + `features/erp/events.ts` |
| `hooks/use-socket-client.ts` | 拆分 | 210 | → `core/socket-client.ts` + `hooks/use-socket-client.ts` |

### 9.2 lib/ → features/ 迁移

| 当前位置 | 目标位置 | 行数 |
|---|---|---:|
| `lib/transition.ts` | `features/erp/transition.ts` | 365 |
| `lib/desensitize.ts` | `features/erp/desensitize.ts` | 80 |
| `lib/chat-system.ts` | `features/chat/system.ts` | 76 |
| `lib/notification-icons.ts` | `features/notification/icons.ts` | 25 |

### 9.3 stores/ → features/ 迁移

| 当前位置 | 目标位置 | 行数 |
|---|---|---:|
| `stores/auth-store.ts` | `features/auth/store.ts` | 61 |
| `stores/order-store.ts` | `features/erp/store.ts` | 68 |
| `stores/chat-store.ts` | `features/chat/store.ts` | 166 |
| `stores/notification-store.ts` | `features/notification/store.ts` | 97 |

### 9.4 hooks/ → features/ 迁移

| 当前位置 | 目标位置 | 行数 |
|---|---|---:|
| `hooks/use-auth.ts` | `features/auth/hooks.ts` | 21 |
| `hooks/use-orders.ts` | `features/erp/hooks.ts` | 88 |
| `hooks/use-chat.ts` | `features/chat/hooks.ts` | 151 |
| `hooks/use-notifications.ts` | `features/notification/hooks.ts` | 37 |

### 9.5 types/ → features/ 迁移

| 当前位置 | 目标位置 | 行数 |
|---|---|---:|
| `types/api.ts` | `types/api.ts` (不变) | 71 |
| `types/user.ts` | `types/user.ts` (不变) | 72 |
| `types/order.ts` | `features/erp/types.ts` | 237 |
| `types/chat.ts` | `features/chat/types.ts` | 73 |

### 9.6 components/ → shared/ + features/ 迁移

| 当前位置 | 目标位置 | 行数 |
|---|---|---:|
| `components/ui/*` (10个) | `shared/ui/` | 956 |
| `components/layout/glass-card.tsx` | `shared/ui/glass-card.tsx` | 64 |
| `components/layout/dynamic-bg.tsx` | `shared/ui/dynamic-bg.tsx` | 44 |
| `components/layout/page-header.tsx` | `shared/ui/page-header.tsx` | 37 |
| `components/layout/sidebar.tsx` | `layouts/sidebar.tsx` | 160 |
| `components/layout/topbar.tsx` | `layouts/topbar.tsx` | 81 |
| `components/orders/*` (5个) | `features/erp/components/` | 538 |
| `components/documents/*` (3个) | `features/erp/components/` | 1077 |
| `components/analytics/*` (3个) | `features/erp/components/` | 225 |
| `components/chat/*` (5个) | `features/chat/components/` | 882 |
| `components/notifications/*` (1个) | `features/notification/components/` | 107 |

### 9.7 测试文件迁移

| 当前位置 | 目标位置 | 行数 |
|---|---|---:|
| `lib/__tests__/utils.test.ts` | `core/__tests__/utils.test.ts` | 145 |
| `lib/__tests__/rbac.test.ts` | `core/__tests__/rbac.test.ts` | 142 |
| `lib/__tests__/desensitize.test.ts` | `features/erp/__tests__/desensitize.test.ts` | 132 |
| `lib/__tests__/transition.test.ts` | `features/erp/__tests__/transition.test.ts` | 135 |
| `lib/__tests__/chat-system.test.ts` | `features/chat/__tests__/system.test.ts` | 106 |

### 9.8 迁移后删除的旧文件（51个）

| 目录 | 文件数 | 删除时机 |
|---|---:|---|
| `src/lib/*.ts` | 14 | 阶段 4 |
| `src/stores/*.ts` | 4 | 阶段 4 |
| `src/hooks/*.ts` | 5 | 阶段 4（use-socket-client.ts 保留重写版） |
| `src/types/order.ts` + `chat.ts` | 2 | 阶段 4 |
| `src/components/orders/*` | 5 | 阶段 4 |
| `src/components/documents/*` | 3 | 阶段 4 |
| `src/components/chat/*` | 5 | 阶段 4 |
| `src/components/notifications/*` | 1 | 阶段 4 |
| `src/components/analytics/*` | 3 | 阶段 4 |
| `src/components/layout/*` | 5 | 阶段 4 |
| `src/components/ui/*` | 10 | 阶段 4 |

---

## 10. 迁移方案

### 10.1 四阶段执行

#### 阶段 1：统一登录 + 门户骨架 ~4h

```
├── 1.1 创建首页路由 app/page.tsx + AppLayout
│   ├── 顶栏（品牌+搜索+登录/头像）
│   ├── Banner 广告区
│   ├── 6大工具入口网格（tool-grid 组件）
│   ├── 推荐内容流
│   └── 底部 4 Tab 导航
│
├── 1.2 创建 /tools/* 路由骨架（6个模块各一个空页面）
│   ├── tools/news/page.tsx
│   ├── tools/itinerary/page.tsx
│   ├── tools/form-helper/page.tsx
│   ├── tools/assessment/page.tsx
│   ├── tools/translator/page.tsx
│   └── tools/documents/page.tsx
│
├── 1.3 创建 /orders + /chat + /notifications + /profile 页面
│   ├── orders/page.tsx（从 customer/orders 迁移逻辑）
│   ├── orders/[id]/page.tsx（从 customer/orders/[id] 迁移）
│   ├── chat/page.tsx
│   ├── notifications/page.tsx（从 customer/notifications 迁移）
│   └── profile/page.tsx（从 customer/profile 迁移）
│
├── 1.4 改造 middleware.ts
│   ├── /login → 公开放行
│   ├── /tools/* → 公开浏览（内容展示）
│   ├── /admin/* → Lv1-8 员工权限
│   ├── /orders, /chat, /notifications, /profile → 需登录
│   └── / → 直接放行到首页
│
├── 1.5 创建 features/home/ + features/auth/account-panel.tsx
│   ├── home/types.ts (AdSlot, ...)
│   ├── home/components/hero-banner / tool-grid / search-bar
│   └── auth/components/account-panel.tsx（角色区分入口）
│
├── 1.6 创建 layouts/app-layout.tsx（底部 Tab 布局）
│
└── 验证: npx tsc --noEmit = 0 + npm run build = 通过
```

#### 阶段 2：架构重构（core/features/shared 分层） ~5h

```
├── 2.1 创建 src/core/ 目录 + 迁移基础设施（纯新增，不删旧文件）
│   ├── db/auth/rbac/api-client/logger/oss/file-types/utils/socket
│   └── core/event-bus.ts（从 events.ts 提取 EventBus 类 + EVENTS 常量）
│
├── 2.2 创建 src/features/ + 各模块骨架（纯新增）
│   ├── erp/ (types + transition + desensitize + store + hooks + events + components)
│   ├── chat/ (types + system + store + hooks + events + components)
│   ├── notification/ (icons + store + hooks + components)
│   └── auth/ (store + hooks)
│
├── 2.3 创建 src/shared/ui/ + 迁移 UI 组件（纯新增）
│   └── 从 components/ui/ + layout/{glass-card,dynamic-bg,page-header} 复制
│
├── 2.4 创建 src/layouts/（纯新增）
│   └── sidebar.tsx + topbar.tsx
│
├── 2.5 更新 tsconfig.json — 添加 path 别名
│
├── 2.6 逐步迁移 API 路由 import（50个文件）
│   ├── @/lib/prisma → @/core/db
│   ├── @/lib/auth → @/core/auth
│   ├── @/lib/rbac → @/core/rbac
│   ├── @/lib/oss → @/core/oss
│   ├── @/lib/logger → @/core/logger
│   ├── @/lib/utils → @/core/utils
│   ├── @/lib/socket → @/core/socket
│   ├── @/lib/file-types → @/core/file-types
│   ├── @/lib/transition → @/features/erp/transition
│   ├── @/lib/desensitize → @/features/erp/desensitize
│   └── @/types/order → @/features/erp/types
│
├── 2.7 逐步迁移 hooks/stores import（9个文件）
│   ├── stores/* → @/core/api-client + @/features/*/store
│   └── hooks/* → @/features/*/store + @/features/*/hooks
│
├── 2.8 逐步迁移组件 import（31个文件）
│   ├── → @/shared/ui/* / @/features/*/components / @/layouts/*
│   └── → @/core/utils / @/features/*/types
│
├── 2.9 逐步迁移页面 import（18个文件）
│   ├── → @/features/*/hooks / @/features/*/store
│   └── → @/shared/ui/* / @/layouts/*
│
├── 2.10 events.ts 解耦 + use-socket-client 拆分
│   ├── 移除 ORDER_STATUS_LABELS 重复定义
│   ├── 事件处理器移到 features/erp/events.ts + features/chat/events.ts
│   └── use-socket-client 拆分 core/socket-client + hook 包装
│
└── 全量验证: tsc 0 + build 通过 + test 93 通过
```

#### 阶段 3：6大功能模块骨架 + API ~6h

```
├── 3.1 news/ 模块
│   ├── types/api/store/hooks + 2个 API 路由 + 2个页面
│   └── Prisma: erp_news_articles
│
├── 3.2 itinerary/ 模块
│   ├── types/api/store/hooks + 6个 API 路由 + 3个页面
│   └── Prisma: erp_itineraries
│
├── 3.3 form-helper/ 模块
│   ├── types/api/hooks + 4个 API 路由 + 2个页面
│   └── Prisma: erp_form_templates + erp_form_records
│
├── 3.4 assessment/ 模块
│   ├── types/api/hooks + 3个 API 路由 + 2个页面
│   └── Prisma: erp_visa_assessments
│
├── 3.5 translator/ 模块
│   ├── types/api/hooks + 3个 API 路由 + 1个页面
│   └── Prisma: erp_translation_requests
│
├── 3.6 doc-helper/ 模块
│   ├── types/api/hooks + 3个 API 路由 + 1个页面
│   └── Prisma: erp_doc_helper_templates + erp_generated_documents
│
├── 3.7 home/ 广告管理
│   ├── Prisma: erp_ad_slots（可选，或用 JSON 配置）
│   ├── API: /api/home + /api/home/ads CRUD
│   └── 管理端: /admin/portal-management/ads
│
└── 全量验证: tsc 0 + build 通过
```

#### 阶段 4：清理 + 收尾 ~2h

```
├── 4.1 删除旧文件（51个，见 9.8）
│   └── 删除 src/lib/ stores/ hooks/ 旧目录 + 旧 components/ 子目录
│
├── 4.2 customer/ → / 重定向路由（保留 1 周兼容）
│   └── /customer/orders → /orders (301)
│   └── /customer/notifications → /notifications (301)
│   └── /customer/profile → /profile (301)
│
├── 4.3 旧路径 barrel export 兼容层（可选，按需）
│   └── src/lib/prisma.ts → export { prisma } from '@/core/db'
│
├── 4.4 更新中间件路由表 + 新模块路由注册
│
├── 4.5 更新所有项目文档
│
└── 全量验证: tsc 0 + build 通过 + test 通过 + grep 零残留旧路径
```

### 10.2 tsconfig 路径别名

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
      "@home/*": ["./src/features/home/*"],
      "@shared/*": ["./src/shared/*"]
    }
  }
}
```

### 10.3 验证清单（每阶段后执行）

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

# 5. 确认无 as any / console.log / TODO
grep -rn "as any" src/ | wc -l  # 期望: 0
grep -rn "console.log" src/ | wc -l  # 期望: 0
```

---

## 11. 新增模块开发规范

### 11.1 模块目录结构

```
src/features/{module-name}/
├── types.ts                # 该模块的 TypeScript 类型
├── api.ts                  # 前端 API 调用封装
├── store.ts                # Zustand Store（可选）
├── hooks.ts                # 自定义 Hooks
├── events.ts               # 事件注册（可选，如需跨模块通信）
├── components/             # 该模块专属 UI 组件
└── __tests__/              # 模块测试（可选）
```

### 11.2 开发 Checklist

```markdown
## 前端
- [ ] 创建 features/{name}/ 目录结构
- [ ] 定义 types.ts
- [ ] 实现 api.ts
- [ ] 实现 store.ts（如需要）
- [ ] 实现 hooks.ts
- [ ] 创建 components/
- [ ] 创建 app/tools/{name}/ 页面
- [ ] 在 tool-grid.tsx 注册入口

## 后端
- [ ] 创建 app/api/{name}/ 路由
- [ ] API 路由只 import core/ 和本模块 types
- [ ] Zod 校验所有输入
- [ ] 通过 core/rbac.ts 注册权限
- [ ] 通过 core/event-bus.ts 注册事件

## 数据库
- [ ] Prisma Schema 加 Model + erp_ 前缀 + @map
- [ ] npx prisma migrate dev

## 验收
- [ ] npx tsc --noEmit = 0 错误
- [ ] npm run build = 通过
- [ ] 无 as any / console.log / TODO
```

---

## 12. 与现有规范的兼容

### 12.1 不变的部分

| 规范 | 状态 |
|---|---|
| erp_ 表前缀 | ✅ 不变 |
| Prisma Schema 规范 | ✅ 不变 |
| Git Commit 规范 | ✅ 不变 |
| UI 设计规范（液态玻璃 + 莫兰迪冷色系） | ✅ 不变 |
| 安全编码规范 | ✅ 不变 |
| API 响应格式 | ✅ 不变 |
| API 路由 URL 路径（已有 50 个） | ✅ 不变 |
| TypeScript 严格模式 | ✅ 不变 |
| 测试规范 | ✅ 不变 |

### 12.2 需要更新的部分

| 规范 | 变更 |
|---|---|
| 路由结构 | 新增首页 `/` + `/tools/*`，`/customer` → `/` 重定向 |
| 登录流程 | 统一 `/login`，所有人回首页，按角色使用功能 |
| 目录结构 | `lib/` → `core/`，`components/` → `features/*/components/` + `shared/ui/` |
| import 路径 | `@/lib/xxx` → `@/core/xxx` 或 `@/features/xxx` |
| 账号入口 | 新增 Account Panel 统一入口组件 |

### 12.3 开发者体验

```typescript
// 旧写法（兼容层保留）
import { prisma } from '@/lib/prisma'
import { transitionOrder } from '@/lib/transition'

// 新写法
import { prisma } from '@/core/db'
import { transitionOrder } from '@/features/erp/transition'

// 新模块
import { searchItineraries } from '@/features/itinerary/api'
import { useItinerary } from '@/features/itinerary/hooks'
```

---

## 13. 风险与应对

### 13.1 迁移风险

| 风险 | 等级 | 应对方案 |
|---|:---:|---|
| 迁移过程中引入回归 bug | 中 | 阶段 2 每批验证 tsc + build + test；阶段 1 不改现有代码 |
| import 路径遗漏导致运行时报错 | 中 | tsc --noEmit 编译时即可捕获；grep 扫描确认零残留 |
| events.ts 解耦后事件丢失 | 中 | 逐事件核对：旧 11 个处理器完全复制到 features/erp/events.ts |
| use-socket-client 拆分后断连 | 低 | 保持 hook 接口不变，底层实现替换为 SocketClient 类 |
| 首页改造影响现有路由 | 中 | middleware 优先级调整；旧 /customer 路由保留兼容 |
| 6大模块工作量超预期 | 中 | 先搭骨架（空页面+API stub），功能逐步填充 |

### 13.2 不迁移的风险

| 风险 | 说明 |
|---|---|
| 新模块无处安放 | 6大工具 + 未来模块无法清晰归类 |
| events.ts 持续膨胀 | 每新增一个模块都要修改 events.ts |
| 组件命名冲突 | 多模块都有 Card 组件时无法区分 |
| 无门户首页 | 用户无法发现新功能，商业价值无法体现 |
| 重构成本递增 | 代码量越大，重构代价越高 |

---

## 附录 A：迁移影响统计

| 统计项 | 数量 |
|---|---|
| 需要迁移的文件 | 51 个 |
| 新建的文件 | ~60 个（core/ 10 + features/ 40 + shared/ui/ 13 + layouts/ 3 + 首页 + 工具页） |
| 需要删除的旧文件 | 51 个（阶段 4） |
| 需要修改 import 的文件 | ~90 个 |
| 新增 Prisma Model | 8 个（6 工具模块 + ad_slots + 可选） |
| 新增 API 路由 | ~25 个（6 工具模块 + home/ads） |
| 新增页面 | ~18 个（首页 + 工具页 + 用户页） |
| 预估总工时 | ~17 小时（4 阶段 / 2 天） |
| 破坏性变更 | 0（渐进迁移 + 兼容层） |

---

## 附录 B：执行优先级

| 优先级 | 阶段 | 内容 | 预估工时 |
|:---:|---|---|:---:|
| P0 | 阶段 1 | 统一登录 + 门户首页 + 账号面板 | 4h |
| P1 | 阶段 2 | 架构重构（core/features/shared 分层） | 5h |
| P2 | 阶段 3 | 6大功能模块骨架 + API + 页面 | 6h |
| P3 | 阶段 4 | 清理 + 收尾 + 文档更新 | 2h |
| | | **合计** | **~17h (2天)** |

---

*文档结束 — 基于 141 个源文件实际依赖分析 + 产品级 Portal 设计的最优架构方案*
