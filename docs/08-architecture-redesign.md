# 沐海旅行 - 签证行业ERP系统

# 架构升级方案 — 门户化改造（不动存量，纯增量构建）

> **文档版本**: V3.0
> **创建日期**: 2026-03-31
> **最后更新**: 2026-03-31
> **基于**: 141 源文件实际依赖扫描 + 逐文件 import 追踪
> **目标**: 在不改动现有 ERP 任何代码的前提下，新增旅行服务平台门户 + 6大工具模块
> **原则**: 零回归、零拆分、零兼容层，纯增量构建

---

## 目录

1. [现状分析](#1-现状分析)
2. [方案对比与决策](#2-方案对比与决策)
3. [核心设计](#3-核心设计)
4. [路由架构](#4-路由架构)
5. [统一登录与入口体系](#5-统一登录与入口体系)
6. [门户首页设计](#6-门户首页设计)
7. [6大功能模块](#7-6大功能模块)
8. [目录结构与文件清单](#8-目录结构与文件清单)
9. [middleware 改造方案](#9-middleware-改造方案)
10. [ERP 入口集成](#10-erp-入口集成)
11. [迁移执行计划](#11-迁移执行计划)
12. [开发规范约束](#12-开发规范约束)
13. [风险与应对](#13-风险与应对)

---

## 1. 现状分析

### 1.1 当前项目规模

| 维度 | 数量 |
|---|---|
| 源文件 | 141 个 |
| 代码行数 | ~18,649 行 |
| API 路由 | 50 个 |
| 页面 | 18 个 |
| 组件 | 31 个 |
| Hooks | 5 个 |
| Stores | 4 个 |
| lib/ 工具 | 14 个 |
| 测试 | 5 个（93 用例） |
| Prisma 表 | 14 张 |
| 里程碑 | M1-M6 全部 ✅ 100% |

### 1.2 当前路由结构

```
/login                  ← 登录页（登录后跳 /admin/dashboard 或 /customer/orders）
/register               ← 公司入驻注册
/reset-password         ← 客户首次登录重置密码
/                       ← 根路径 → redirect('/login')

/admin/*                ← 管理端（侧边栏+顶栏布局，Lv1-8 员工）
  dashboard / orders / pool / workspace / templates / team / analytics / settings

/customer/*             ← 客户端（底部Tab布局：订单/消息/我的）
  orders / notifications / profile

/api/*                  ← 50 个 API 路由
```

### 1.3 现有布局系统

| 布局 | 路由 | 组件 | 特点 |
|---|---|---|---|
| 全局 | `layout.tsx` | DynamicBackground + ToastProvider | 所有页面共享 |
| 认证 | `(auth)/layout.tsx` | 无（全屏居中） | 登录/注册/重置密码 |
| 管理端 | `admin/layout.tsx` | Sidebar + Topbar | 桌面侧边栏 / 移动抽屉 |
| 客户端 | `customer/layout.tsx` | 顶栏 + 底部3Tab | Tab: 订单/消息/我的 |

### 1.4 核心依赖扫描结果

**被引用最多的 lib/ 文件**：

| 文件 | 被引用数 | 引用来源 |
|---|:---:|---|
| `auth.ts` | 47 | API路由(43) + middleware + socket + rbac |
| `prisma.ts` | 45 | API路由(42) + transition + socket + chat-system |
| `rbac.ts` | 28 | API路由 + middleware |
| `api-client.ts` | 24 | stores(4) + pages(16) + hooks(2) |
| `utils.ts` | 31 | 组件(15+) + 页面(8+) |
| `socket.ts` | 9 | API路由 + events + chat-system + server.ts |
| `oss.ts` | 5 | API路由 |
| `transition.ts` | 5 | API路由(4) + 测试(1) |
| `events.ts` | 1 | 仅 transition.ts |
| `chat-system.ts` | 1 | 仅 events.ts |

**关键发现**：

1. `prisma.ts` 和 `auth.ts` 是绝对核心（45/47文件引用），任何路径变更都是灾难性改动
2. `events.ts` 虽然 import 了 3 个领域（耦合方向），但仅被 1 个文件 import（被消费方向），耦合度被高估
3. `server.ts`（Custom Server 入口）引用 `@/lib/socket`，且在 src/ 外部
4. `vitest.config.ts` 的 coverage 路径引用 `src/lib/**`

---

## 2. 方案对比与决策

### 2.1 方案一：架构拆分重构（已否决）

```
lib/ → core/
components/ → features/*/components/ + shared/ui/
stores/ → features/*/store/
hooks/ → features/*/hooks/
```

| 维度 | 评估 |
|---|---|
| 需改文件数 | ~101 个 |
| 回归风险 | 🔴 高（改 45 个 prisma 引用 + 47 个 auth 引用） |
| 工时 | 17h |
| 兼容性 | 需要 barrel export 兼容层 |
| 遗漏风险 | server.ts / vitest / CSS / seed.ts 均需同步改造 |

**否决理由**：对一个已100%完成的系统进行大规模拆分，投入产出比极低，且引入大量回归风险。

### 2.2 方案二：不动存量，纯增量门户（采纳 ✅）

```
现有 ERP（141文件）→ 完全不动
新增门户层（~15个文件）→ 纯增量
连接点 → 仅改 2 个现有文件
```

| 维度 | 评估 |
|---|---|
| 需改文件数 | **2 个**（page.tsx + login/page.tsx） |
| 回归风险 | 🟢 **零**（ERP 代码完全不动） |
| 工时 | **~3.5h**（骨架+入口） |
| 兼容性 | **不需要**（旧路由原样保留） |
| 新旧代码关系 | 新代码直接复用 `@/lib/*` `@/hooks/*` `@/stores/*` |

**采纳理由**：
- 零回归风险，已 100% 完成的 M1-M6 不受任何影响
- 工时降低 80%（3.5h vs 17h）
- 新模块可独立开发，互不干扰
- 未来如需重构，可在门户稳定后再渐进执行

### 2.3 设计原则

| 原则 | 说明 |
|---|---|
| **ERP 零改动** | /admin/* 和 /customer/* 下的全部代码、路由、布局不变 |
| **纯增量构建** | 新文件只新增，不修改、不移动已有文件 |
| **门户独立路由** | 使用 `/portal/*` 前缀，与 ERP 路由完全隔离 |
| **共享基础设施** | 新模块直接使用现有 `@/lib/*`、`@/hooks/*`、`@/stores/*` |
| **统一登录入口** | 所有角色通过同一个 `/login` 进入，登录后回首页 |
| **按需进入 ERP** | 员工通过"我的"面板进入管理端，客户通过"我的订单"进入客户端 |

---

## 3. 核心设计

### 3.1 产品分层模型

```
    ┌──────────────────────────────────────────────────────────┐
    │              Portal 首页 /（旅行服务平台）                  │  所有人
    │                                                          │
    │  顶栏: 品牌 + 搜索 + 登录/头像下拉                          │
    │  ┌─ Banner 广告轮播 ──────────────────────────────────┐   │
    │  │  🌸 春季赏花去哪里？[立即办理]                       │   │
    │  └────────────────────────────────────────────────────┘   │
    │  ┌─ 6大工具入口 ──────────────────────────────────────┐   │
    │  │ 📰签证资讯  🗺️行程助手  📝申请表                     │   │
    │  │ 🔍签证评估  🌐翻译助手  📄证明文件                    │   │
    │  └────────────────────────────────────────────────────┘   │
    │  ┌─ 推荐内容流 / 攻略 / 热门目的地 ────────────────────┐   │
    │  └────────────────────────────────────────────────────┘   │
    ├──────────────────────────────────────────────────────────┤
    │  底部 Tab:  [首页]  [我的订单]  [消息]  [我的]              │
    └────┬─────────────┬──────────────┬────────────┬───────────┘
         │             │              │            │
    ┌────▼────┐  ┌─────▼──────┐      │      ┌─────▼────────────┐
    │ /tools/*│  │ /portal/   │      │      │ /portal/         │
    │ 6大工具  │  │ orders     │      │      │ profile          │
    │ 页面     │  │            │      │      │                  │
    └─────────┘  │ → ERP客户  │      │      │ Lv1-8:           │
                 │   订单详情  │      │      │ "进入ERP管理后台"  │
                 │   资料上传  │      │      │   → /admin/*     │
                 │   进度跟踪  │      │      │                  │
                 │   材料下载  │      │      │ Lv9:             │
                 │   出签反馈  │      │      │ 个人设置          │
                 └────────────┘      │      └──────────────────┘
                                     │
                               ┌─────▼──────┐
                               │ /portal/    │
                               │ notifications│
                               │ 消息中心     │
                               └────────────┘

    ┌──────────────────────────┐
    │    ERP 管理端 /admin/*    │  仅 Lv1-8
    │  （现有代码，完全不动）     │  侧边栏+顶栏
    │  dashboard/orders/pool/  │
    │  workspace/templates/   │
    │  team/analytics/settings │
    └──────────────────────────┘

    ┌──────────────────────────┐
    │    ERP 客户端 /customer/* │  仅 Lv9
    │  （现有代码，完全不动）     │  底部Tab
    │  orders/notifications/  │
    │  profile                │
    └──────────────────────────┘
```

### 3.2 用户流转路径

#### 员工（Lv1-8）

```
/login → 首页 / → 浏览工具/资讯
                   │
                   ├── 点击"我的" → /portal/profile
                   │                  └── "进入ERP管理后台" → /admin/dashboard
                   │
                   └── 点击"我的订单" → /portal/orders
                                          └── 查看关联订单（员工也可查看）
```

#### 客户（Lv9）

```
/login → 首页 / → 浏览工具/资讯
                   │
                   ├── 点击"我的订单" → /portal/orders
                   │                      └── /customer/orders（复用现有页面）
                   │
                   └── 点击"我的" → /portal/profile
                                      └── 个人设置 / 修改密码 / 退出
```

#### 未登录

```
/ → 首页（公开浏览工具介绍、资讯内容）
     │
     ├── 点击工具/功能 → 弹出登录提示 或 跳转 /login
     │
     └── /login → 登录后回到 /
```

---

## 4. 路由架构

### 4.1 最终路由表

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
| `/admin/*` | Admin 布局（现有） | Lv1-8 | ✅ 不动 |
| `/customer/*` | Customer 布局（现有） | Lv9 | ✅ 不动 |
| `/api/*` | — | 按端点 | ✅ 不动 |

### 4.2 路由隔离原则

- `/admin/*` → ERP 管理端，侧边栏+顶栏布局，**零改动**
- `/customer/*` → ERP 客户端，底部Tab布局，**零改动**
- `/portal/*` → 新门户，独立底部Tab布局，**纯新增**
- 三套布局互不干扰，各自有独立的 `layout.tsx`
- 门户页面不 import 任何 admin/customer 的布局组件

---

## 5. 统一登录与入口体系

### 5.1 登录流程改造

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
// 改前（第49-53行）：
if (user.role === 'CUSTOMER') {
  router.push('/customer/orders')
} else {
  router.push('/admin/dashboard')
}

// 改后：
router.push('/')
```

### 5.2 首页路由改造

**改造前**：`src/app/page.tsx` → `redirect('/login')`

**改造后**：渲染 Portal 首页组件（内含登录状态判断）

```typescript
// src/app/page.tsx
import { PortalHomePage } from '@/components/portal/portal-home'

export const metadata = {
  title: '沐海旅行 - 签证服务平台',
  description: '签证资讯、行程规划、智能评估，一站式签证服务',
}

export default function HomePage() {
  return <PortalHomePage />
}
```

### 5.3 账号面板（"我的" Tab）

#### 员工面板（Lv1-8）

```
┌─ /portal/profile ──────────────────────┐
│  👤 张三                               │
│  角色：签证部管理员 · 沐海旅行            │
│────────────────────────────────────────│
│  🖥️ 进入ERP管理后台        → /admin/*  │  ← 员工专属
│  📋 我的订单               → /portal/orders │
│  💬 消息中心               → /portal/notifications │
│  🔐 修改密码                          │
│  🚪 退出登录                          │
└────────────────────────────────────────┘
```

#### 客户面板（Lv9）

```
┌─ /portal/profile ──────────────────────┐
│  👤 李四                               │
│  手机：138****5678                     │
│────────────────────────────────────────│
│  📋 我的订单               → /portal/orders │
│  💬 消息中心               → /portal/notifications │
│  🔐 修改密码                          │
│  🚪 退出登录                          │
└────────────────────────────────────────┘
```

---

## 6. 门户首页设计

### 6.1 首页布局（公开可访问）

```
┌──────────────────────────────────────────────────────────┐
│  顶栏（glass-topbar sticky）                               │
│  🌊 沐海旅行    [搜索栏...]         [登录] / [👤头像下拉]   │
├──────────────────────────────────────────────────────────┤
│  ┌─ Banner 广告轮播 ───────────────────────────────────┐  │
│  │  背景渐变 + 文案 + CTA按钮                           │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌─ 6大工具入口（glass-card 网格）──────────────────────┐  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐                   │  │
│  │  │📰      │ │🗺️      │ │📝      │                   │  │
│  │  │签证资讯 │ │行程助手 │ │申请表   │                   │  │
│  │  │最新政策 │ │AI规划  │ │填写指导 │                   │  │
│  │  └────────┘ └────────┘ └────────┘                   │  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐                   │  │
│  │  │🔍      │ │🌐      │ │📄      │                   │  │
│  │  │签证评估 │ │翻译助手 │ │证明文件 │                   │  │
│  │  │通过率   │ │证件翻译 │ │模板    │                   │  │
│  │  └────────┘ └────────┘ └────────┘                   │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌─ 热门目的地 / 推荐攻略 ──────────────────────────────┐  │
│  │  卡片流（可后续接入资讯模块数据）                        │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  底部 Tab:  [首页🏠]  [我的订单📋]  [消息💬]  [我的👤]     │
└──────────────────────────────────────────────────────────┘
```

**首页特点**：
- 未登录可浏览（工具介绍、资讯内容）
- 点击具体功能时判断登录状态，未登录弹提示或跳转 `/login`
- 首页不使用 Portal 布局的底部 Tab（首页自己在页面内渲染 Tab）
- 登录后从首页进入 `/portal/*` 子页面时使用 Portal 布局

### 6.2 广告位定义

| 广告位 | 位置 | 类型 | 说明 |
|---|---|---|---|
| `hero_banner` | 顶部 | 轮播/静态 | 主推活动、签证套餐 |
| `tool_highlight` | 工具区上方 | 固定 | 季节性推荐 |

广告数据初期用静态配置，后续可接入 API。

---

## 7. 6大功能模块

### 7.1 模块总览

| # | 模块 | 路径 | 功能简述 | 新增 Prisma 表 |
|---|---|---|---|---|
| 1 | 签证资讯 | `/portal/tools/news` | 各国签证政策/攻略发布 | `erp_news_articles` |
| 2 | 行程助手 | `/portal/tools/itinerary` | AI 行程规划/推荐/导出 | `erp_itineraries` |
| 3 | 申请表助手 | `/portal/tools/form-helper` | 签证申请表填写指导 | `erp_form_templates` + `erp_form_records` |
| 4 | 签证评估 | `/portal/tools/assessment` | 签证通过率评估 | `erp_visa_assessments` |
| 5 | 翻译助手 | `/portal/tools/translator` | 文档/证件翻译 | `erp_translation_requests` |
| 6 | 证明文件 | `/portal/tools/documents` | 在职/收入证明模板 | `erp_doc_helper_templates` + `erp_generated_documents` |

### 7.2 各模块 Prisma Model

#### 7.2.1 签证资讯 `erp_news_articles`

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

#### 7.2.2 行程助手 `erp_itineraries`

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

#### 7.2.3 申请表助手 `erp_form_templates` + `erp_form_records`

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

#### 7.2.4 签证评估 `erp_visa_assessments`

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

#### 7.2.5 翻译助手 `erp_translation_requests`

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

#### 7.2.6 证明文件助手 `erp_doc_helper_templates` + `erp_generated_documents`

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

## 8. 目录结构与文件清单

### 8.1 新增文件清单

```
src/
├── app/
│   ├── page.tsx                              ✏️ 改（1行：redirect → 组件渲染）
│   ├── portal/
│   │   ├── layout.tsx                        🆕 Portal 布局壳（顶栏+底部4Tab）
│   │   ├── page.tsx                          🆕 空（redirect to /）
│   │   ├── orders/
│   │   │   └── page.tsx                      🆕 我的订单（Link 到 /customer/orders）
│   │   ├── notifications/
│   │   │   └── page.tsx                      🆕 消息中心
│   │   ├── profile/
│   │   │   └── page.tsx                      🆕 我的（含ERP管理入口）
│   │   └── tools/
│   │       ├── news/
│   │       │   └── page.tsx                  🆕 签证资讯
│   │       ├── itinerary/
│   │       │   └── page.tsx                  🆕 行程助手
│   │       ├── form-helper/
│   │       │   └── page.tsx                  🆕 申请表助手
│   │       ├── assessment/
│   │       │   └── page.tsx                  🆕 签证评估
│   │       ├── translator/
│   │       │   └── page.tsx                  🆕 翻译助手
│   │       └── documents/
│   │           └── page.tsx                  🆕 证明文件
│   └── (auth)/
│       └── login/
│           └── page.tsx                      ✏️ 改（2行：跳转目标改为 /）
│
├── components/
│   └── portal/
│       ├── portal-home.tsx                   🆕 首页 Portal 组件
│       ├── portal-topbar.tsx                 🆕 门户顶栏（品牌+搜索+登录/头像）
│       ├── tool-grid.tsx                     🆕 6大工具入口网格
│       └── hero-banner.tsx                   🆕 广告 Banner 轮播
│
└── middleware.ts                              ✏️ 改（新增 /portal 公开/鉴权逻辑）
```

### 8.2 变更统计

| 类型 | 数量 | 说明 |
|---|:---:|---|
| 新增文件 | 16 个 | 12 页面 + 4 组件 |
| 修改文件 | 3 个 | page.tsx + login/page.tsx + middleware.ts |
| 删除文件 | 0 个 | |
| 移动文件 | 0 个 | |
| 改 import | 0 个 | ERP 代码全部不动 |

---

## 9. middleware 改造方案

### 9.1 改造后逻辑

```typescript
// src/middleware.ts

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { canAccessRoute } from '@/lib/rbac'

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

  // 3. 统一鉴权
  const user = await getCurrentUser(request)

  // 4. API 路由鉴权（不变）
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

  // 9. /admin 和 /customer 路由权限检查（不变）
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
| 根路径 `/` | 员工→`/admin/dashboard`，客户→不动 | 直接放行（渲染首页） |
| `/portal/*` | 不存在 | 登录用户放行 |
| 客户访问 `/admin` | → `/customer/orders` | → `/` |
| 员工访问 `/customer` | 无处理（403） | → `/` |
| 其他 | 不变 | 不变 |

---

## 10. ERP 入口集成

### 10.1 "我的订单" Tab → ERP 客户端

`/portal/orders/page.tsx` 有两种实现方案：

**方案 A：重定向（推荐，最简单）**
```typescript
// src/app/portal/orders/page.tsx
import { redirect } from 'next/navigation'
export default function PortalOrdersPage() {
  redirect('/customer/orders')
}
```

**方案 B：内嵌 iframe（如需保持门户 Tab 可见）**
```typescript
// 不推荐 — iframe 有样式/通信/权限问题
```

**采纳方案 A**：直接重定向到 `/customer/orders`，复用现有完整客户端。用户从 ERP 客户端返回门户时点击底部 Tab 即可。

### 10.2 "消息" Tab → 通知中心

`/portal/notifications/page.tsx` 同样重定向到 `/customer/notifications`。

### 10.3 "我的" Tab → 账号面板

`/portal/profile/page.tsx` 独立实现（不重定向），包含：
- 用户信息展示（复用 useAuth）
- 员工显示"进入ERP管理后台"按钮 → Link `/admin/dashboard`
- 订单入口 → Link `/portal/orders`
- 修改密码（复用现有 change-password API）
- 退出登录

### 10.4 ERP 内返回门户

在 `/admin/layout.tsx` 的 Sidebar 底部，或在 `/customer/layout.tsx` 的顶栏中，可选添加"返回首页"链接。但这属于**可选优化**，不影响核心功能。

---

## 11. 迁移执行计划

### 阶段 1：入口改造（~0.5h）

| 任务 | 文件 | 说明 |
|---|---|---|
| 改根路径 | `src/app/page.tsx` | `redirect('/login')` → 渲染 PortalHomePage |
| 改登录跳转 | `src/app/(auth)/login/page.tsx` | `router.push('/admin/dashboard')` → `router.push('/')` |
| 改 middleware | `src/middleware.ts` | 根路径放行 + /portal 鉴权 + 角色跳转改为 `/` |

**验证**：`npx tsc --noEmit` = 0 错误 + `npm run build` = 通过

### 阶段 2：门户骨架（~1.5h）

| 任务 | 文件 | 说明 |
|---|---|---|
| 门户顶栏 | `src/components/portal/portal-topbar.tsx` | 品牌+搜索+登录/头像下拉 |
| 工具网格 | `src/components/portal/tool-grid.tsx` | 6大工具入口卡片 |
| 广告 Banner | `src/components/portal/hero-banner.tsx` | 顶部轮播/静态广告 |
| 首页组装 | `src/components/portal/portal-home.tsx` | 组装 topbar+banner+grid+内容流 |
| Portal 布局 | `src/app/portal/layout.tsx` | 顶栏 + 底部4Tab（复用 customer layout 样式） |
| 空路由 | `src/app/portal/page.tsx` | redirect to / |

**验证**：`npx tsc --noEmit` = 0 + `npm run build` = 通过

### 阶段 3：ERP 入口页面（~0.5h）

| 任务 | 文件 | 说明 |
|---|---|---|
| 我的订单 | `src/app/portal/orders/page.tsx` | redirect('/customer/orders') |
| 消息中心 | `src/app/portal/notifications/page.tsx` | redirect('/customer/notifications') |
| 我的面板 | `src/app/portal/profile/page.tsx` | 用户信息+ERP入口+设置+退出 |

**验证**：端到端测试（登录→首页→Tab切换→进入ERP→返回门户）

### 阶段 4：6大工具模块骨架（~1h）

| 任务 | 文件 | 说明 |
|---|---|---|
| 签证资讯 | `src/app/portal/tools/news/page.tsx` | 占位页面 |
| 行程助手 | `src/app/portal/tools/itinerary/page.tsx` | 占位页面 |
| 申请表助手 | `src/app/portal/tools/form-helper/page.tsx` | 占位页面 |
| 签证评估 | `src/app/portal/tools/assessment/page.tsx` | 占位页面 |
| 翻译助手 | `src/app/portal/tools/translator/page.tsx` | 占位页面 |
| 证明文件 | `src/app/portal/tools/documents/page.tsx` | 占位页面 |

**验证**：`npx tsc --noEmit` = 0 + `npm run build` = 通过

### 阶段 5：工具模块内容开发（按需）

每个模块按以下流程开发：
1. Prisma Schema 新增 Model（erp_ 前缀 + @@map）
2. `npx prisma migrate dev` 创建迁移
3. 创建 `/api/{module}/` API 路由
4. 实现页面 UI（复用现有组件 + 新增模块专属组件）
5. `npx tsc --noEmit` + `npm run build` 验证

### 验证清单（每个阶段后执行）

```bash
# 1. TypeScript 编译
npx tsc --noEmit
# 期望: 0 errors

# 2. 构建
npm run build
# 期望: 成功

# 3. 单元测试
npx vitest run
# 期望: 93 passed

# 4. ERP 功能零影响确认
# - 访问 /admin/dashboard → 正常渲染
# - 访问 /customer/orders → 正常渲染
# - 所有 API 端点 → 正常响应
```

---

## 12. 开发规范约束

### 12.1 新模块开发必须遵守

所有规范继承自 `04-dev-standards.md`，新增以下约束：

| 规则 | 说明 |
|---|---|
| ERP 代码零改动 | 禁止修改 /admin/*、/customer/*、/api/*、/lib/*、/hooks/*、/stores/* 下的任何现有文件 |
| 新增 Prisma Model | 必须带 `erp_` 前缀 + `@@map("erp_xxx")` |
| 新增 API 路由 | 使用 `/api/{module}/` 路径前缀 |
| 新增页面 | 放在 `src/app/portal/` 下 |
| 新增组件 | 放在 `src/components/portal/` 或模块专属目录 |
| import 路径 | 直接使用 `@/lib/*`、`@/hooks/*`、`@/stores/*`、`@/types/*` |
| 样式 | 复用现有 CSS 变量 + morandi 色板 + glass-card 组件系统 |
| `'use client'` | 必须在文件首行 |
| 内部导航 | 使用 `<Link>`，禁止 `<a href>` |
| Prisma 可选字段 | 必须 `?? null` |
| 提交前验证 | `npx tsc --noEmit` = 0 + `npm run build` = 通过 |

### 12.2 目录命名规范

```
src/app/portal/tools/{module-name}/page.tsx    ← 工具模块页面
src/components/portal/{component-name}.tsx     ← 门户通用组件
src/app/api/{module-name}/route.ts             ← 新模块 API
```

### 12.3 Git 提交规范

```
feat(portal): 新增门户首页 + 6大工具入口
feat(tools/news): 签证资讯模块 CRUD
feat(tools/itinerary): 行程助手 AI 生成
fix(portal): 修复底部 Tab 角标不更新
```

---

## 13. 风险与应对

### 13.1 技术风险

| 风险 | 等级 | 应对方案 |
|---|:---:|---|
| 门户和 ERP 的登录态冲突 | 低 | 共用 JWT Cookie，无冲突 |
| 底部 Tab 样式不一致 | 低 | 门户 Tab 复用 customer layout 的 glass-topbar 样式 |
| 首页 SSR/CSR 选择 | 低 | 首页用 Server Component（SEO），交互部分用 Client Component |
| 新模块大量 import 现有 lib | 无 | 这是特性不是问题——直接用，不需要兼容层 |

### 13.2 产品风险

| 风险 | 等级 | 应对方案 |
|---|:---:|---|
| 客户找不到 ERP 入口 | 中 | "我的订单" Tab 放在底部第二个位置，高频入口 |
| 员工找不到管理端入口 | 低 | "我的"面板第一项就是"进入ERP管理后台" |
| 首页内容空洞 | 中 | 第一版用静态工具介绍+示例内容，后续接入真实数据 |

### 13.3 零风险确认

| 原方案风险 | 本方案 |
|---|---|
| events.ts 拆分丢事件 | **不拆，不存在** |
| prisma.ts 改 45 文件 | **不改，不存在** |
| server.ts 遗漏 | **不动，不存在** |
| vitest 路径失效 | **不动，不存在** |
| CSS 文件归属争议 | **不动，不存在** |
| 101 文件 import 迁移 | **0 文件迁移，不存在** |

---

## 附录 A：变更统计

| 统计项 | 数量 |
|---|---|
| 新增文件 | 16 个 |
| 修改文件 | 3 个（page.tsx + login + middleware） |
| 删除文件 | 0 |
| 移动文件 | 0 |
| 需改 import | 0 |
| 新增 Prisma Model | 8 个（6 工具模块） |
| 新增 API 路由 | 按模块逐步添加 |
| 新增页面 | 12 个 |
| 预估工时（骨架） | ~3.5h |
| 预估工时（含工具开发） | 按模块逐步 |

## 附录 B：执行优先级

| 优先级 | 阶段 | 内容 | 预估工时 |
|:---:|---|---|:---:|
| P0 | 阶段 1 | 入口改造（middleware + page.tsx + login） | 0.5h |
| P0 | 阶段 2 | 门户骨架（首页 + 布局 + 顶栏 + Tab） | 1.5h |
| P0 | 阶段 3 | ERP 入口页面（订单/消息/我的） | 0.5h |
| P1 | 阶段 4 | 6大工具模块骨架 | 1h |
| P2 | 阶段 5 | 工具模块内容开发 | 按需 |
| | | **骨架合计** | **~3.5h** |

---

*文档结束 — 基于 141 个源文件实际依赖扫描的零风险增量方案*
