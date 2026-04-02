# 华夏签证 - C端平台化改造方案（M8 全知开发手册）

> **文档版本**: V3.0
> **最后更新**: 2026-04-03
> **用途**: 本文件是 C 端平台化改造的唯一开发手册（M8-M12）。任何开发者/AI 拿到本文件 + Git仓库即可完整执行开发，无需额外上下文。
> **前置状态**: M1-M7 全部完成 ✅，账户系统审查通过 ✅，168 源文件 / 21,383 行 / 57 API 路由 / 91 测试用例

---

## 目录

1. [项目现状速查](#1-项目现状速查)
2. [改造目标与设计哲学](#2-改造目标与设计哲学)
3. [ERP 保护红线](#3-erp-保护红线)
4. [新路由架构](#4-新路由架构)
5. [文件变更总表](#5-文件变更总表)
6. [Phase 1: 品牌统一](#6-phase-1-品牌统一)
7. [Phase 2: 导航体系改造](#7-phase-2-导航体系改造)
8. [Phase 3: 首页重写（10 Section）](#8-phase-3-首页重写)
9. [Phase 4: "我的"页面重写](#9-phase-4-我的页面重写)
10. [Phase 5: 服务页 + 工具箱首页](#10-phase-5-服务页--工具箱首页)
11. [Phase 6: 全量验收](#11-phase-6-全量验收)
12. [M8 成熟度评估](#12-m8-成熟度评估)
13. [M9: 工具模块实装](#13-m9-工具模块实装)
14. [M10: C端下单闭环](#14-m10-c端下单闭环)
15. [M11: 搜索+个性化](#15-m11-搜索个性化)
16. [M12: 真实评价+SEO](#16-m12-真实评价seo)
17. [附录A: 现有文件完整清单](#17-附录a-现有文件完整清单)
18. [附录B: 设计规范速查](#18-附录b-设计规范速查)
19. [附录C: 常见问题](#19-附录c-常见问题)

---

## 1. 项目现状速查

### 1.1 基本信息

| 维度 | 信息 |
|---|---|
| **项目** | 华夏签证 - C端综合签证服务平台（含ERP后台子系统） |
| **Git** | `https://github.com/Laogui-666/ERP` |
| **技术栈** | Next.js 15.5.14 + React 19.2.4 + Prisma 5.22 + MySQL 8.0 + Tailwind 3.4 + Zustand 5 + Socket.io 4.8 |
| **部署** | 阿里云 ECS `223.6.248.154:3002` |
| **数据库** | 阿里云 RDS MySQL，22张表（erp_ 前缀） |
| **文件存储** | 阿里云 OSS `oss-cn-beijing` / bucket: `hxvisa001` |
| **代码规模** | 168 源文件 / ~21,383 行 / 57 API 路由 / 28 页面 / 32 组件 / 91 测试用例 |

### 1.2 当前目录结构（M8改造前）

```
src/
├── app/
│   ├── page.tsx                          # 根首页 — PublicHomePage（简陋品牌页）
│   ├── layout.tsx                        # 全局布局（DynamicBackground + ToastProvider）
│   ├── portal/
│   │   ├── layout.tsx                    # 4 Tab布局（首页/订单/消息/我的）
│   │   ├── page.tsx                      # redirect('/')
│   │   ├── orders/page.tsx               # 订单页
│   │   ├── notifications/page.tsx        # 通知页
│   │   ├── profile/page.tsx              # 个人中心
│   │   └── tools/
│   │       ├── news/page.tsx             # 资讯工具
│   │       ├── itinerary/page.tsx        # 行程工具
│   │       ├── form-helper/page.tsx      # 申请表工具
│   │       ├── assessment/page.tsx       # 评估工具
│   │       ├── translator/page.tsx       # 翻译工具
│   │       └── documents/page.tsx        # 证明文件工具
│   ├── (auth)/
│   │   ├── login/page.tsx                # 登录页
│   │   ├── register/page.tsx             # 注册页
│   │   └── reset-password/page.tsx       # 首次登录重置密码
│   ├── admin/*                           # ERP管理端（10页面，禁止修改）
│   ├── customer/*                        # ERP客户端（4页面，禁止修改）
│   ├── api/*                             # 57个API路由（禁止修改）
│   ├── 403/page.tsx                      # 403页面
│   ├── not-found.tsx                     # 404页面
│   └── global-error.tsx                  # 全局错误边界
├── components/
│   ├── portal/
│   │   ├── portal-home.tsx               # Portal首页组件（HeroBanner+Stats+ToolGrid+Destinations）
│   │   ├── portal-topbar.tsx             # Portal顶栏（品牌+头像下拉）
│   │   ├── hero-banner.tsx               # Hero横幅（逐词动画+CTA）
│   │   ├── stats-counter.tsx             # 数据统计卡片（数字滚动）
│   │   ├── tool-grid.tsx                 # 6工具网格（2×3）
│   │   └── destination-carousel.tsx      # 目的地横向滚动
│   ├── public/
│   │   ├── public-navbar.tsx             # 公开导航栏
│   │   └── public-home-page.tsx          # 公开首页（与portal-home重复）
│   ├── layout/*                          # ERP布局组件（禁止修改）
│   ├── orders/*                          # ERP订单组件（禁止修改）
│   ├── documents/*                       # ERP资料组件（禁止修改）
│   ├── notifications/*                   # ERP通知组件（禁止修改）
│   ├── chat/*                            # ERP聊天组件（禁止修改）
│   ├── analytics/*                       # ERP分析组件（禁止修改）
│   └── ui/*                              # 基础UI组件（禁止修改）
├── shared/                               # 共享基础设施（禁止修改）
├── modules/erp/                          # ERP业务模块（禁止修改）
├── middleware.ts                          # 中间件
└── styles/                               # 样式文件
```

### 1.3 当前首页问题诊断

| # | 问题 | 详情 |
|---|---|---|
| 1 | 根路径 `/` 和 `/portal` 首页内容重复 | 两套首页：`public-home-page.tsx` vs `portal-home.tsx` |
| 2 | 根路径无底部Tab和顶栏 | 打开就是裸内容，无导航体系 |
| 3 | 底部Tab是4个不是5个 | 缺"服务"和"工具"Tab，多了"消息"（应移入通知铃铛） |
| 4 | Hero区缺乏沉浸感 | 静态渐变背景，无动态光球/鼠标跟随 |
| 5 | 目的地卡片纯文字Emoji | 无渐变背景图感、无出签时间信息层次 |
| 6 | 工具展示区太简陋 | 2列网格+emoji+一行描述，缺乏设计感 |
| 7 | 无搜索栏 | Airbnb风格核心入口缺失 |
| 8 | 无用户评价/社交证明 | 缺少testimonial section |
| 9 | 无价值主张Section | 极速/安全/透明/智能四大卖点未展示 |
| 10 | 无服务列表页 | `/services` 路由不存在 |
| 11 | 工具箱首页不存在 | `/tools` 只有6个子页面，无聚合入口 |
| 12 | middleware公开路由不全 | `/services`、`/tools/*` 未加入PUBLIC_ROUTES |
| 13 | portal-topbar品牌图标是🌊 | 应改为更专业的品牌标识 |
| 14 | "我的"页面功能单薄 | 缺订单快捷统计、工具快捷入口 |
| 15 | Footer信息架构弱 | 版权一行搞定，缺4列布局 |

---

## 2. 改造目标与设计哲学

### 2.1 产品重新定位

| 维度 | 改造前 | 改造后 |
|---|---|---|
| **品牌名** | 沐海旅行 / 盼达旅行 | **华夏签证** |
| **产品定位** | 签证行业 ERP 系统 | **C端综合签证服务平台** |
| **核心用户** | B端签证公司员工 | **C端需要办理签证的个人用户** |
| **核心价值** | 流程数字化、协同办公 | **一站式签证办理 + 智能工具** |
| **ERP角色** | 项目主体 | **子功能模块（"我的"中进入）** |

### 2.2 设计哲学（参考Airbnb）

> **不是"抄UI"，而是抄"设计哲学"**：
> 1. **内容驱动**而非功能列表 → 用目的地/工具感吸引用户
> 2. **搜索即入口** → 最显眼的位置给搜索框
> 3. **渐进式暴露** → 先被内容吸引 → 尝试工具 → 注册 → 下单
> 4. **微交互密集** → 每一次hover/scroll/click都有反馈
> 5. **品牌一致性** → 从首屏到Footer传达"专业签证"

### 2.3 设计风格

- **液态玻璃 (Liquid Glass)**：半透明毛玻璃组件，4级强度
- **莫兰迪冷色系**：低饱和度冷色调，高级克制
- **动态背景**：浮动渐变光球 + 微光网格 + 鼠标跟随光晕
- **弹簧阻尼动效**：物理弹簧缓动，4种预设曲线
- **响应式**：移动端优先（max-w-lg），桌面端自适应

---

## 3. ERP 保护红线

### 3.1 绝对禁止修改的文件/目录

| 目录/文件 | 文件数 | 原因 |
|---|:---:|---|
| `src/modules/erp/` | ~80 | ERP业务模块 |
| `src/shared/lib/` | ~15 | 共享基础设施（prisma/auth/rbac/socket/oss/transition/events） |
| `src/shared/ui/` | ~8 | 共享UI组件（glass-card/modal/toast/badge/button/input/select） |
| `src/shared/stores/` | ~4 | 共享状态管理 |
| `src/shared/hooks/` | ~5 | 共享Hooks |
| `src/shared/types/` | ~5 | 共享类型定义 |
| `src/shared/styles/` | ~3 | 全局样式（globals.css/glassmorphism.css） |
| `src/app/admin/` | ~10 | ERP管理端页面 |
| `src/app/customer/` | ~8 | ERP客户端页面 |
| `src/app/api/` | ~57 | API路由 |
| `prisma/` | ~5 | 数据库Schema和迁移 |
| `server.ts` | 1 | Custom Server |
| 配置文件 | ~8 | tsconfig/vitest/next.config/tailwind.config等 |

### 3.2 允许修改的文件

| 类别 | 文件 | 修改范围 |
|---|---|---|
| 品牌文字 | `src/app/layout.tsx` | title/description meta |
| 品牌文字 | `src/app/(auth)/login/page.tsx` | 副标题文字 |
| 品牌文字 | `src/app/(auth)/register/page.tsx` | 副标题文字 |
| 品牌文字 | `src/app/customer/layout.tsx` | 品牌名文字 |
| 门户层 | `src/app/page.tsx` | **完全重写** |
| 门户层 | `src/app/portal/layout.tsx` | **完全重写** |
| 门户层 | `src/app/portal/page.tsx` | 改重定向 |
| 门户层 | `src/app/portal/orders/page.tsx` | 适配新布局 |
| 门户层 | `src/app/portal/profile/page.tsx` | **完全重写** |
| 门户层 | `src/app/portal/notifications/page.tsx` | 改重定向 |
| 门户层 | `src/app/portal/tools/*/page.tsx` (6个) | 适配新布局头部 |
| 中间件 | `src/middleware.ts` | 添加新路由到PUBLIC_ROUTES |
| 新增 | `src/app/services/page.tsx` | 新文件 |
| 新增 | `src/app/tools/page.tsx` | 新文件 |
| 新增 | `src/app/orders/page.tsx` | 新文件 |
| 新增 | `src/components/portal/*.tsx` (11个) | 新文件 |
| 删除 | `src/components/public/*.tsx` (2个) | 被替代 |
| 删除 | `src/components/portal/portal-topbar.tsx` | 被替代 |
| 删除 | `src/components/portal/hero-banner.tsx` | 被替代 |
| 删除 | `src/components/portal/portal-home.tsx` | 被替代 |
| 删除 | `src/components/portal/tool-grid.tsx` | 被替代 |

### 3.3 验证清单（每Phase结束必须执行）

```bash
npx tsc --noEmit        # TypeScript 0 错误
npm run build            # 构建通过
npx vitest run           # 91 tests pass
# 浏览器手动验证：
# /admin/dashboard → 正常
# /customer/orders → 正常
# /api/health → 正常
```

---

## 4. 新路由架构

### 4.1 路由树

```
/                              → 首页（C端产品首页，含完整导航体系）
├── /services                  → 签证服务列表页
├── /tools                     → 工具箱首页（6大工具聚合）
│   ├── /tools/news            → 签证资讯（保留现有portal/tools/news功能）
│   ├── /tools/itinerary       → 行程规划
│   ├── /tools/form-helper     → 申请表助手
│   ├── /tools/assessment      → 签证评估
│   ├── /tools/translator      → 智能翻译
│   └── /tools/documents       → 证明文件
├── /orders                    → 重定向 → 已登录→/portal/orders，未登录→/login
├── /profile                   → 重定向 → 已登录→/portal/profile，未登录→/login
├── /login                     → 登录
├── /register                  → 注册
├── /reset-password            → 重置密码
│
├── /portal/                   → redirect('/')
├── /portal/orders             → 订单页（保留现有功能）
├── /portal/profile            → "我的"页面（完全重写）
├── /portal/notifications      → redirect('/profile')（通知移入"我的"）
├── /portal/tools/*            → redirect('/tools/*')
│
├── /admin/*                   → ERP管理端（不动）
├── /customer/*                → ERP客户端（不动）
└── /api/*                     → API（不动）
```

### 4.2 底部5 Tab

| Tab | 图标 | 路径 | 说明 |
|---|---|---|---|
| 首页 | 🏠 | `/` | 产品首页 |
| 服务 | 🛂 | `/services` | 签证服务列表 |
| 工具 | 🧰 | `/tools` | 6大智能工具 |
| 订单 | 📋 | `/orders` | 我的订单（重定向到/portal/orders） |
| 我的 | 👤 | `/profile` | 个人中心（重定向到/portal/profile） |

### 4.3 路由权限

| 路径 | 权限 | 说明 |
|---|---|---|
| `/` | 公开 | 所有人可浏览 |
| `/services` | 公开 | 所有人可浏览 |
| `/tools` | 公开 | 所有人可浏览（工具页内容需登录使用） |
| `/tools/*` | 公开 | 所有人可浏览（提交操作需登录） |
| `/orders` | 需登录 | 重定向到/portal/orders |
| `/profile` | 需登录 | 重定向到/portal/profile |
| `/portal/*` | 需登录 | 任何登录用户 |

---

## 5. 文件变更总表

### 5.1 需修改的文件（8个）

| # | 文件 | 操作 | Phase |
|---|---|---|:---:|
| 1 | `src/app/layout.tsx` | 改title/description | P1 |
| 2 | `src/app/page.tsx` | 完全重写 | P3 |
| 3 | `src/app/portal/layout.tsx` | 完全重写（5Tab） | P2 |
| 4 | `src/app/portal/page.tsx` | 改重定向目标 | P2 |
| 5 | `src/app/(auth)/login/page.tsx` | 改副标题 | P1 |
| 6 | `src/app/(auth)/register/page.tsx` | 改副标题 | P1 |
| 7 | `src/app/customer/layout.tsx` | 改品牌名 | P1 |
| 8 | `src/middleware.ts` | 加PUBLIC_ROUTES | P2 |

### 5.2 需新增的文件（14个）

| # | 文件 | 说明 | Phase |
|---|---|---|:---:|
| 1 | `src/components/portal/app-navbar.tsx` | 顶部导航栏 | P3 |
| 2 | `src/components/portal/hero-section.tsx` | Hero区域 | P3 |
| 3 | `src/components/portal/destination-cards.tsx` | 热门目的地卡片 | P3 |
| 4 | `src/components/portal/tool-showcase.tsx` | 6大工具展示 | P3 |
| 5 | `src/components/portal/value-props.tsx` | 价值主张 | P3 |
| 6 | `src/components/portal/how-it-works.tsx` | 办理流程 | P3 |
| 7 | `src/components/portal/testimonials.tsx` | 用户评价 | P3 |
| 8 | `src/components/portal/stats-section.tsx` | 数据统计 | P3 |
| 9 | `src/components/portal/cta-section.tsx` | CTA行动召唤 | P3 |
| 10 | `src/components/portal/app-footer.tsx` | 页脚 | P3 |
| 11 | `src/components/portal/app-bottom-tab.tsx` | 底部5Tab | P2 |
| 12 | `src/app/services/page.tsx` | 签证服务页 | P5 |
| 13 | `src/app/tools/page.tsx` | 工具箱首页 | P5 |
| 14 | `src/app/orders/page.tsx` | 订单重定向页 | P2 |

### 5.3 需删除的文件（6个）

| # | 文件 | 原因 | Phase |
|---|---|---|:---:|
| 1 | `src/components/public/public-navbar.tsx` | 被app-navbar替代 | P3 |
| 2 | `src/components/public/public-home-page.tsx` | 被新首页替代 | P3 |
| 3 | `src/components/portal/portal-topbar.tsx` | 被app-navbar替代 | P3 |
| 4 | `src/components/portal/hero-banner.tsx` | 被hero-section替代 | P3 |
| 5 | `src/components/portal/portal-home.tsx` | 被新首页组件替代 | P3 |
| 6 | `src/components/portal/tool-grid.tsx` | 被tool-showcase替代 | P3 |

### 5.4 执行顺序

```
Phase 1 (0.5h) → 品牌统一（8文件改文字）
Phase 2 (1.0h) → 导航体系（底部Tab+middleware+重定向+新路由页面壳）
Phase 3 (3.5h) → 首页重写（11个新组件+删除6个旧文件+page.tsx组装）
Phase 4 (0.5h) → "我的"页面重写
Phase 5 (1.0h) → 服务页+工具箱首页
Phase 6 (0.5h) → 全量验收
─────────────────────────────────
合计 7.0h
```

---

## 6. Phase 1: 品牌统一

### 6.1 品牌替换清单

| # | 文件 | 查找 | 替换 |
|---|---|---|---|
| 1 | `src/app/layout.tsx` | `沐海旅行 - 签证ERP系统` | `华夏签证 - 一站式签证服务平台` |
| 2 | `src/app/layout.tsx` | `签证办理行业专属 SaaS 多租户 ERP 系统` | `专业签证办理 · 智能工具 · 一站式服务` |
| 3 | `src/app/(auth)/login/page.tsx` | `签证行业 ERP 管理系统` | `一站式签证服务平台` |
| 4 | `src/app/(auth)/register/page.tsx` | `注册账号，开始使用签证 ERP 系统` | `注册账号，开启便捷签证之旅` |
| 5 | `src/app/(auth)/register/page.tsx` | `公司入驻` | `注册账号`（或保持"公司入驻"也行，视业务需要） |
| 6 | `src/app/customer/layout.tsx` | 任何"沐海"/"盼达"品牌名 | `华夏签证` |

### 6.2 执行步骤

1. 逐文件打开，搜索"沐海"、"盼达"、"ERP管理系统"、"ERP系统"
2. 按上表替换
3. 运行 `npx tsc --noEmit` 验证

### 6.3 验证

```bash
# 确认无残留品牌名
grep -rn "沐海\|盼达" src/ --include="*.tsx" --include="*.ts"
# 预期：无结果（或仅在禁止修改的文件中）
```

---

## 7. Phase 2: 导航体系改造

### 7.1 修改 `src/middleware.ts`

**变更内容**：在 `PUBLIC_ROUTES` 数组中添加新路由

```typescript
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
  '/services',      // 🆕 新增
  '/tools',         // 🆕 新增
]
```

**注意**：`'/tools'` 能匹配 `/tools`、`/tools/news`、`/tools/itinerary` 等所有子路径，因为 `isPublicRoute` 使用 `startsWith`。

### 7.2 新建 `src/app/orders/page.tsx`

```typescript
import { redirect } from 'next/navigation'

// /orders → 重定向到门户订单页
export default function OrdersRedirectPage() {
  redirect('/portal/orders')
}
```

> **注意**：中间件会先拦截未登录用户跳 `/login`，所以这里的 redirect 只对已登录用户生效。

### 7.3 新建 `src/components/portal/app-bottom-tab.tsx`

**功能**：底部5 Tab导航（首页/服务/工具/订单/我的）

**核心规格**：
- `'use client'` 组件
- 5个Tab：首页(`/`)、服务(`/services`)、工具(`/tools`)、订单(`/orders`)、我的(`/profile`)
- 使用 `usePathname()` 判断 active 状态
- active Tab：颜色 `var(--color-primary)` + 底部2px指示条
- 固定底部 `fixed bottom-0 z-50`
- 背景：`bg-[rgba(22,27,41,0.92)] backdrop-blur-xl border-t border-white/[0.06]`
- safe-area-bottom 适配
- 图标使用 SVG（与现有portal layout中图标风格一致）
- max-w-lg 居中

**Tab图标参考**（复用现有portal/layout.tsx中的SVG图标，加服务新图标）：
- 首页：HomeIcon（现有）
- 服务：护照/签证图标（新SVG，类似 `M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5...`）
- 工具：工具图标（新SVG）
- 订单：OrderIcon（现有）
- 我的：UserIcon（现有）

### 7.4 重写 `src/app/portal/layout.tsx`

**当前**：4 Tab布局（首页/订单/消息/我的）+ PortalTopbar
**改为**：5 Tab布局（首页/服务/工具/订单/我的）+ AppBottomTab + 无顶栏（首页自己管顶栏）

```typescript
'use client'

import { DynamicBackground } from '@shared/ui/dynamic-bg'
import { AppBottomTab } from '@/components/portal/app-bottom-tab'

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <DynamicBackground />
      {/* 内容区（底部 Tab 68px） */}
      <main className="flex-1 pb-[68px]">{children}</main>
      <AppBottomTab />
    </div>
  )
}
```

**关键**：去掉 `<PortalTopbar />` 引用（首页/AppNavbar自己管顶栏），去掉 pt-14（首页有顶栏自己处理padding）。

### 7.5 修改 `src/app/portal/page.tsx`

```typescript
import { redirect } from 'next/navigation'

export default function PortalPage() {
  redirect('/')  // 保持不变
}
```

### 7.6 修改 `src/app/portal/notifications/page.tsx`

```typescript
import { redirect } from 'next/navigation'

// 通知中心移入"我的"页面，此路由重定向
export default function NotificationsRedirectPage() {
  redirect('/portal/profile')
}
```

### 7.7 验证

```bash
npx tsc --noEmit
# 浏览器验证：
# / → 首页（此时还是旧内容，下一步重写）
# /services → 404（尚未创建，Phase 5处理）
# /tools → 404（尚未创建，Phase 5处理）
# /orders → 已登录→/portal/orders正常，未登录→/login
# /portal/profile → 正常
# /admin/dashboard → 正常
# /customer/orders → 正常
```

---

## 8. Phase 3: 首页重写

### 8.1 总览

首页由10个Section + 1个底部Tab组成：

```
AppNavbar → HeroSection → DestinationCards → ToolShowcase →
ValueProps → HowItWorks → Testimonials → StatsSection →
CtaSection → AppFooter → AppBottomTab（由portal/layout提供）
```

`src/app/page.tsx` 负责组装这些组件。

### 8.2 删除旧文件

删除以下6个文件（新组件替代）：
- `src/components/public/public-navbar.tsx`
- `src/components/public/public-home-page.tsx`
- `src/components/portal/portal-topbar.tsx`
- `src/components/portal/hero-banner.tsx`
- `src/components/portal/portal-home.tsx`
- `src/components/portal/tool-grid.tsx`

**保留**（被其他页面引用）：
- `src/components/portal/stats-counter.tsx` — 如无其他引用可删除
- `src/components/portal/destination-carousel.tsx` — 如无其他引用可删除

> 删除前检查：`grep -rn "stats-counter\|destination-carousel" src/ --include="*.tsx"` 确认无其他引用。

### 8.3 重写 `src/app/page.tsx`

**当前**：渲染 PublicHomePage + PublicNavbar + DynamicBackground
**改为**：组装新首页组件

```typescript
import { AppNavbar } from '@/components/portal/app-navbar'
import { HeroSection } from '@/components/portal/hero-section'
import { DestinationCards } from '@/components/portal/destination-cards'
import { ToolShowcase } from '@/components/portal/tool-showcase'
import { ValueProps } from '@/components/portal/value-props'
import { HowItWorks } from '@/components/portal/how-it-works'
import { Testimonials } from '@/components/portal/testimonials'
import { StatsSection } from '@/components/portal/stats-section'
import { CtaSection } from '@/components/portal/cta-section'
import { AppFooter } from '@/components/portal/app-footer'
import { AppBottomTab } from '@/components/portal/app-bottom-tab'
import { DynamicBackground } from '@shared/ui/dynamic-bg'

export default function HomePage() {
  return (
    <div className="relative min-h-screen">
      <DynamicBackground />
      <AppNavbar />
      <main className="pb-[68px]">
        <HeroSection />
        <DestinationCards />
        <ToolShowcase />
        <ValueProps />
        <HowItWorks />
        <Testimonials />
        <StatsSection />
        <CtaSection />
        <AppFooter />
      </main>
      <AppBottomTab />
    </div>
  )
}
```

**注意**：首页 `page.tsx` 是 Server Component，所有交互子组件各自标记 `'use client'`。

### 8.4 组件详细规格

#### 8.4.1 `app-navbar.tsx` — 顶部导航栏

**类型**：`'use client'`

**功能**：
- 固定顶部 `fixed top-0 z-50`
- 滚动前：透明背景
- 滚动后：毛玻璃 `bg-[rgba(22,27,41,0.92)] backdrop-blur-xl` + 底部阴影
- 监听 `window.scroll` 事件，计算 opacity 渐变

**布局**（左中右）：
```
[🌍 华夏签证]    [🔍 搜索国家、签证类型...]    [登录] [注册]
                                    或已登录：[🔔通知] [👤头像▾]
```

**左区 — Logo**：
- 地球/护照emoji + "华夏签证" 文字（font-semibold, text-[15px]）
- Link to `/`

**中区 — 搜索栏**：
- 毛玻璃输入框（glass-input风格）
- placeholder="搜索国家、签证类型..."
- 桌面端展开显示，移动端收缩为搜索图标（点击展开）
- 点击搜索可跳转到 `/services?search=xxx`（Phase 5实现）

**右区 — 登录态判断**：
- 未登录：显示"登录"和"注册"两个按钮
  - 登录：`glass-btn-secondary px-4 py-1.5 text-[13px]` → Link to `/login`
  - 注册：`glass-btn-primary px-4 py-1.5 text-[13px]` → Link to `/register`
- 已登录：通知铃铛 + 头像下拉
  - 通知铃铛：点击跳转 `/portal/notifications`（或展开通知面板）
  - 头像：圆形按钮，点击展开下拉菜单（个人中心/管理后台/退出）

**依赖**：
- `useAuth()` from `@shared/hooks/use-auth`
- `usePathname()` from `next/navigation`（可选，高亮当前页）

**参考**：现有 `portal-topbar.tsx` 的滚动监听 + 下拉菜单逻辑

#### 8.4.2 `hero-section.tsx` — Hero区域

**类型**：`'use client'`

**功能**：全屏沉浸式Hero区域

**结构**：
```
┌─────────────────────────────────────────────────┐
│ 动态背景层                                        │
│  - 4个浮动渐变光球（复用DynamicBackground风格）     │
│  - 鼠标跟随光晕（400px径向渐变，0.8s damping追踪）  │
│                                                   │
│ 标题："想去哪，华夏签证帮你搞定"                      │
│  - 逐词渐显动画（复用hero-banner.tsx的实现）         │
│  - text-[32px] sm:text-[40px] font-bold           │
│  - 渐变文字：from-text-primary via-primary-light   │
│    to-accent bg-clip-text text-transparent        │
│                                                   │
│ 底部光带（2px 渐变线，glowPulse动画）               │
│                                                   │
│ 副标题："一站式签证办理 + 智能旅行工具"              │
│  - 延迟200ms淡入                                   │
│                                                   │
│ 搜索框（核心CTA）                                   │
│  - 毛玻璃大输入框                                   │
│  - placeholder="输入国家或签证类型..."              │
│  - 右侧搜索按钮                                     │
│                                                   │
│ 快捷标签行                                          │
│  - [日本] [韩国] [申根] [美国] [泰国] [更多→]       │
│  - 毛玻璃小标签，hover变亮                          │
│  - 点击跳转 /services?country=xxx                   │
│                                                   │
│ CTA按钮                                            │
│  - "开始探索 →" (glass-btn-primary)                │
│  - "了解更多" (glass-btn-secondary)                │
└─────────────────────────────────────────────────┘
```

**关键实现**：
- 鼠标跟随光晕：`onMouseMove` → 更新CSS变量 `--mouse-x` / `--mouse-y` → 背景 `radial-gradient(circle at var(--mouse-x) var(--mouse-y), ...)`
- 逐词动画：复用现有 `hero-banner.tsx` 的 `TITLE_WORDS` 数组 + `visibleWords` state + `setInterval`
- 最小高度 `min-h-[85vh]`

#### 8.4.3 `destination-cards.tsx` — 热门目的地

**类型**：`'use client'`

**功能**：横向滚动的目的地卡片

**数据**（10个国家）：
```typescript
const DESTINATIONS = [
  { flag: '🇯🇵', country: '日本', type: '单次旅游', time: '5-7工作日', price: '¥599', color: 'from-pink-500/15 to-rose-400/10' },
  { flag: '🇰🇷', country: '韩国', type: '单次旅游', time: '3-5工作日', price: '¥399', color: 'from-blue-500/15 to-indigo-400/10' },
  { flag: '🇪🇺', country: '申根国家', type: '旅游签证', time: '7-15工作日', price: '¥358', color: 'from-cyan-500/15 to-blue-400/10' },
  { flag: '🇺🇸', country: '美国', type: 'B1/B2', time: '面签后3-5日', price: '¥1599', color: 'from-blue-600/15 to-red-400/10' },
  { flag: '🇹🇭', country: '泰国', type: '落地签/旅游', time: '1-3工作日', price: '¥299', color: 'from-purple-500/15 to-pink-400/10' },
  { flag: '🇬🇧', country: '英国', type: '标准访客', time: '15-20工作日', price: '¥1299', color: 'from-red-500/15 to-blue-400/10' },
  { flag: '🇦🇺', country: '澳大利亚', type: '旅游签证', time: '15-20工作日', price: '¥1399', color: 'from-green-500/15 to-teal-400/10' },
  { flag: '🇨🇦', country: '加拿大', type: '旅游签证', time: '15-20工作日', price: '¥1099', color: 'from-red-600/15 to-rose-400/10' },
  { flag: '🇻🇳', country: '越南', type: '电子签证', time: '3-5工作日', price: '¥299', color: 'from-yellow-500/15 to-red-400/10' },
  { flag: '🇲🇾', country: '马来西亚', type: '电子签证', time: '2-3工作日', price: '¥280', color: 'from-teal-500/15 to-blue-400/10' },
]
```

**卡片设计**：
- 固定宽度 `w-[180px]`，`flex-shrink-0`
- `scroll-snap-align: start`
- 渐变背景 `bg-gradient-to-br ${dest.color}`
- 国旗emoji大号显示（text-4xl）
- 国家名（font-semibold text-[15px]）
- 签证类型（text-[12px] secondary）
- 出签时间（text-[11px] placeholder）
- 价格（font-bold text-[16px] primary）
- 悬停浮起 `hover:-translate-y-1 hover:shadow-lg`
- GlassCard light 包裹

**滚动交互**：
- 拖拽滚动（复用现有 `destination-carousel.tsx` 的鼠标拖拽逻辑）
- `scroll-snap-type: x mandatory`
- `scrollbar-hide`（隐藏滚动条）
- IntersectionObserver 触发入场动画

**标题**："热门目的地"（text-[20px] font-bold, px-4）

#### 8.4.4 `tool-showcase.tsx` — 6大工具展示

**类型**：`'use client'`

**功能**：2×3网格展示6大工具

**数据**：
```typescript
const TOOLS = [
  { icon: '📰', label: '签证资讯', desc: '各国签证政策实时更新，出行无忧', href: '/tools/news' },
  { icon: '🗺️', label: '行程助手', desc: 'AI智能规划你的旅行路线', href: '/tools/itinerary' },
  { icon: '📝', label: '申请表', desc: '各国签证申请表智能填写', href: '/tools/form-helper' },
  { icon: '🔍', label: '签证评估', desc: 'AI评估通过率，拒签风险分析', href: '/tools/assessment' },
  { icon: '🌐', label: '翻译助手', desc: '多语言即时翻译，证件翻译', href: '/tools/translator' },
  { icon: '📄', label: '证明文件', desc: '在职证明等文件快速生成', href: '/tools/translator' },
]
```

**卡片设计**：
- GlassCard light 包裹
- 大emoji图标（text-3xl）+ hover scale(1.1)
- 标题（text-[16px] font-semibold）
- 描述（text-[13px] secondary）
- hover sweep光效（从左到右的渐变扫过）
- `hover:-translate-y-1 active:scale-[0.98]`
- 整个卡片可点击 → Link to `href`

**入场动画**：
- IntersectionObserver 触发
- Stagger 逐个入场（每张延迟 80ms）
- `animate-fade-in-up` + `anim-initial`

**标题**："智能工具箱" + 副标题 "华夏签证为你准备的旅行助手"

**未登录处理**：点击时检查 `useAuth().user`，未登录弹出登录引导 Modal（复用现有 tool-grid.tsx 的 Modal 逻辑）

#### 8.4.5 `value-props.tsx` — 价值主张

**类型**：Server Component（纯展示，无交互）

**功能**：4格价值主张

**数据**：
```typescript
const PROPS = [
  { icon: '⚡', title: '极速出签', desc: '最快1个工作日出签，不让等待耽误行程' },
  { icon: '🔒', title: '安全可靠', desc: '资料加密存储，隐私保护，可信赖' },
  { icon: '💰', title: '价格透明', desc: '费用公开，无隐藏收费，明明白白消费' },
  { icon: '🤖', title: '智能服务', desc: 'AI签证评估，智能填表，让办理更轻松' },
]
```

**布局**：`grid grid-cols-2 md:grid-cols-4 gap-4`

**卡片**：GlassCard light + 居中文字 + 图标 + 标题 + 描述

#### 8.4.6 `how-it-works.tsx` — 办理流程

**类型**：Server Component

**功能**：4步办理流程展示

**数据**：
```typescript
const STEPS = [
  { num: '01', title: '选择国家', desc: '搜索或浏览目标国家签证服务' },
  { num: '02', title: '提交资料', desc: '按清单准备并上传所需材料' },
  { num: '03', title: '专业办理', desc: '专员审核制作，进度实时可查' },
  { num: '04', title: '拿到签证', desc: '签证到手，安心出发' },
]
```

**布局**：4列横排（桌面），2×2网格（移动端）

**设计**：步骤编号大字 + 标题 + 描述 + 步骤间连接线/箭头

#### 8.4.7 `testimonials.tsx` — 用户评价

**类型**：Server Component（静态展示）

**功能**：3条用户评价卡片

**数据**：
```typescript
const TESTIMONIALS = [
  { name: '张先生', avatar: '👨', rating: 5, text: '3天就出签了，比之前找旅行社快多了！资料上传也很方便。', country: '日本' },
  { name: '李女士', avatar: '👩', rating: 5, text: '行程规划功能太好用了，帮我节省了大量做攻略的时间。', country: '申根' },
  { name: '王先生', avatar: '👨', rating: 5, text: '价格透明，没有任何隐藏收费，专业团队值得信赖！', country: '美国' },
]
```

**卡片设计**：GlassCard + 头像 + 姓名 + 星级（⭐×5）+ 评价内容 + 国家标签

**布局**：`grid grid-cols-1 md:grid-cols-3 gap-4`

#### 8.4.8 `stats-section.tsx` — 数据统计

**类型**：`'use client'`（需要 IntersectionObserver + 数字滚动动画）

**功能**：4个核心数据数字滚动

**数据**：
```typescript
const STATS = [
  { value: 50000, suffix: '+', label: '服务用户' },
  { value: 50, suffix: '+', label: '覆盖国家' },
  { value: 99.2, suffix: '%', label: '出签率' },
  { value: 24, suffix: 'h', label: '在线服务' },
]
```

**实现**：
- IntersectionObserver 检测可见性
- 数字从0滚动到目标值（2秒60帧，复用现有 `stats-counter.tsx` 的 AnimatedNumber 逻辑）
- GlassCard accent 包裹
- `grid grid-cols-2 md:grid-cols-4 gap-4`

#### 8.4.9 `cta-section.tsx` — 行动召唤

**类型**：Server Component

**功能**：CTA区域

```
"准备好了吗？让签证办理变得简单从容"
[免费注册，立即体验 →]
```

**设计**：
- 区域背景渐变（from-primary/5 to-accent/5）
- 标题 text-[24px] font-bold
- 副标题 text-[15px] secondary
- 按钮：渐变背景 `from-primary to-accent` + 发光阴影 + hover光泽扫过
- Link to `/register`

#### 8.4.10 `app-footer.tsx` — 页脚

**类型**：Server Component

**功能**：完整4列页脚

```
┌──────────┬──────────┬──────────┬──────────┐
│ 🌍 华夏签证 │ 产品服务   │ 热门国家   │ 关于支持   │
│ 专业签证   │ 签证办理   │ 日本      │ 关于我们   │
│ 一站搞定   │ 行程规划   │ 韩国      │ 联系我们   │
│           │ 智能翻译   │ 申根      │ 隐私政策   │
│           │ 签证评估   │ 美国      │ 服务条款   │
│           │ 证明文件   │ 泰国      │ 帮助中心   │
│           │ 签证资讯   │ 更多→     │           │
├──────────┴──────────┴──────────┴──────────┤
│ © 2026 华夏签证 · 专业签证，一站搞定          │
└─────────────────────────────────────────────┘
```

**设计**：
- `border-t border-white/[0.06]`
- `grid grid-cols-2 md:grid-cols-4 gap-8`
- Logo区域：地球图标 + "华夏签证" + slogan
- 链接：text-[13px] secondary → hover primary-light
- 底部版权：border-top + 居中文字

### 8.5 `app-navbar.tsx` 在首页 vs portal layout 的关系

**重要架构决策**：

- 首页 `/` 自己渲染 `<AppNavbar />` + `<AppBottomTab />`
- Portal layout（`/portal/*`）只提供 `<AppBottomTab />`，不提供顶栏
- 各portal子页面（如 `/portal/orders`、`/portal/profile`）自己管自己的顶栏（已有逻辑）
- `/services` 和 `/tools` 页面嵌套在 portal layout 内，通过 portal layout 获得底部Tab，自己渲染页面内容

**这意味着**：
- `page.tsx`（首页）不在 portal layout 内，它是独立的根路由
- `/services`、`/tools`、`/portal/*` 都在 portal layout 内
- 首页 AppNavbar 和 portal 子页面的顶栏是独立的，不共享组件（portal子页面保持现有各自的顶栏逻辑）

---

## 9. Phase 4: "我的"页面重写

### 9.1 重写 `src/app/portal/profile/page.tsx`

**当前**：用户信息 + ERP入口 + 订单/通知/密码/退出菜单
**改为**：增强版个人中心

**结构**：
```
┌─────────────────────────────────────┐
│ 用户信息卡片（保持现有 GlassCard）     │
│ [头像] 姓名                          │
│ 角色 · 公司名                        │
├─────────────────────────────────────┤
│ 订单快捷统计（🆕）                    │
│ [待对接 2] [收集中 1] [已交付 3]      │ ← 点击跳转对应状态筛选
├─────────────────────────────────────┤
│ 常用工具快捷入口（🆕）                │
│ [🗺️行程] [📝申请表] [🌐翻译]         │
├─────────────────────────────────────┤
│ 通知中心预览（🆕）                    │
│ 最近3条通知 + "查看全部"              │
├─────────────────────────────────────┤
│ 菜单列表（保持现有）                   │
│ 📋 我的订单                           │
│ 💬 消息中心                           │
│ 🔒 修改密码                           │
│ 🖥️ 后台管理（仅B端角色）              │
│ 🚪 退出登录                           │
└─────────────────────────────────────┘
```

**新增内容**：
- 订单快捷统计：调用 `GET /api/orders?pageSize=1` 获取各状态数量（或新增一个统计API）
  - 简化方案：只显示"我的订单"入口，不显示具体数字（避免多API调用）
- 常用工具：3个快捷入口卡片，Link to 对应工具页
- 通知预览：调用 `GET /api/notifications?pageSize=3` 显示最近3条

> **简化决策**：如果统计API太复杂，订单快捷统计区域可简化为3个静态标签（待办/进行中/已完成），点击跳转到 `/portal/orders`。通知预览也简化为"通知中心"入口，不实时拉取。

---

## 10. Phase 5: 服务页 + 工具箱首页

### 10.1 新建 `src/app/services/page.tsx`

**功能**：签证服务列表页

**结构**：
```
┌─────────────────────────────────────┐
│ 页面顶栏（返回 + 标题"签证服务"）     │
├─────────────────────────────────────┤
│ 搜索+筛选栏                          │
│ [🔍搜索国家...] [全部▾] [亚洲▾]      │
├─────────────────────────────────────┤
│ 国家卡片列表（网格）                  │
│ ┌──────┐ ┌──────┐ ┌──────┐         │
│ │ 🇯🇵   │ │ 🇰🇷   │ │ 🇪🇺   │         │
│ │ 日本  │ │ 韩国  │ │ 申根  │         │
│ │ ¥599  │ │ ¥399  │ │ ¥358  │         │
│ │ 5-7天 │ │ 3-5天 │ │ 7-15天│         │
│ └──────┘ └──────┘ └──────┘         │
│ ...（10+国家）                        │
└─────────────────────────────────────┘
```

**实现**：
- `'use client'`（需要搜索/筛选交互）
- 复用首页 DestinationCards 的数据
- 搜索过滤：输入关键字实时过滤国家名
- 地区筛选：全部/亚洲/欧洲/北美/大洋洲/其他
- 卡片点击：显示"功能开发中，即将上线" toast（下单流程尚未接入C端）
- 包裹在 portal layout 内（自动获得底部Tab）

### 10.2 新建 `src/app/tools/page.tsx`

**功能**：工具箱聚合首页

**结构**：
```
┌─────────────────────────────────────┐
│ 🧰 智能工具箱                         │
│ 华夏签证为你准备的旅行助手              │
├─────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐   │
│ │ 📰 签证资讯   │ │ 🗺️ 行程助手   │   │
│ │ 各国政策实时   │ │ AI智能规划    │   │
│ │ [使用 →]     │ │ [使用 →]     │   │
│ └──────────────┘ └──────────────┘   │
│ ┌──────────────┐ ┌──────────────┐   │
│ │ 📝 申请表     │ │ 🔍 签证评估   │   │
│ │ 智能填写      │ │ 通过率评估    │   │
│ │ [使用 →]     │ │ [使用 →]     │   │
│ └──────────────┘ └──────────────┘   │
│ ┌──────────────┐ ┌──────────────┐   │
│ │ 🌐 翻译助手   │ │ 📄 证明文件   │   │
│ │ 多语言翻译    │ │ 文件生成      │   │
│ │ [使用 →]     │ │ [使用 →]     │   │
│ └──────────────┘ └──────────────┘   │
└─────────────────────────────────────┘
```

**实现**：
- Server Component（纯展示，无交互）
- 复用首页 ToolShowcase 的数据
- 每个工具卡片 Link to `/tools/xxx`
- 包裹在 portal layout 内

### 10.3 适配现有 portal/tools/* 页面

6个工具页面（news/itinerary/form-helper/assessment/translator/documents）需要微调：

**变更内容**：页面顶部添加统一的返回导航

在每个 `page.tsx` 的内容顶部添加：
```tsx
<Link href="/tools" className="flex items-center gap-1 text-[13px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-4">
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
  返回工具箱
</Link>
```

> **注意**：这些页面现有内容已是真实实现（M7 Phase 5完成），不需要重写功能，只需添加返回导航。

---

## 11. Phase 6: 全量验收

### 11.1 技术验收

```bash
cd erp-project

# TypeScript 类型检查
npx tsc --noEmit
# 预期：0 errors

# 构建验证
npm run build
# 预期：成功，无警告

# 单元测试
npx vitest run
# 预期：91 tests pass
```

### 11.2 ERP 保护验收

| 路径 | 预期 | 状态 |
|---|---|:---:|
| `/admin/dashboard` | 正常显示管理端仪表盘 | 🔲 |
| `/admin/orders` | 正常显示订单列表 | 🔲 |
| `/admin/workspace` | 正常显示工作台 | 🔲 |
| `/customer/orders` | 正常显示客户订单 | 🔲 |
| `/customer/orders/[id]` | 正常显示订单详情 | 🔲 |
| `/api/health` | 返回 `{"success":true,...}` | 🔲 |

### 11.3 C端路由验收

| 路径 | 预期 | 状态 |
|---|---|:---:|
| `/` | 新首页（10个Section完整） | 🔲 |
| `/services` | 服务列表页 | 🔲 |
| `/tools` | 工具箱首页 | 🔲 |
| `/tools/news` | 资讯工具页（含返回导航） | 🔲 |
| `/tools/itinerary` | 行程工具页 | 🔲 |
| `/orders` | 未登录→/login，已登录→/portal/orders | 🔲 |
| `/profile` | 未登录→/login，已登录→/portal/profile | 🔲 |
| `/portal/profile` | "我的"页面（增强版） | 🔲 |
| `/login` | 登录页（品牌"华夏签证"） | 🔲 |
| `/register` | 注册页（品牌"华夏签证"） | 🔲 |

### 11.4 视觉验收

| 检查项 | 预期 | 状态 |
|---|---|:---:|
| Hero区动态光球 | 4个浮动渐变光球正常渲染 | 🔲 |
| Hero区鼠标跟随 | 桌面端鼠标移动时光晕跟随 | 🔲 |
| Hero区逐词动画 | 标题逐字渐显 | 🔲 |
| 目的地横向滚动 | 可拖拽滚动+scroll-snap | 🔲 |
| 目的地卡片悬停 | hover浮起+阴影 | 🔲 |
| 工具stagger入场 | 滚动到可视区后逐个淡入 | 🔲 |
| 工具hover sweep | 鼠标划过有光泽扫过效果 | 🔲 |
| 统计数字滚动 | 进入视口后数字从0滚动到目标值 | 🔲 |
| 底部5Tab | 切换正常+active指示条 | 🔲 |
| 顶栏滚动效果 | 透明→毛玻璃渐变 | 🔲 |
| Footer 4列 | 桌面端4列布局+移动端2列 | 🔲 |

### 11.5 品牌验收

```bash
grep -rn "沐海\|盼达" src/ --include="*.tsx" --include="*.ts"
# 预期：无结果（或仅在禁止修改的文件中）
```

### 11.6 代码质量验收

```bash
# 无 as any
grep -rn "as any" src/ --include="*.tsx" --include="*.ts" | grep -v node_modules | grep -v ".test."
# 预期：无结果

# 无 console.log（error/warn可接受）
grep -rn "console\.log" src/ --include="*.tsx" --include="*.ts" | grep -v node_modules | grep -v ".test."
# 预期：无结果

# 无 TODO
grep -rn "TODO\|FIXME\|HACK" src/ --include="*.tsx" --include="*.ts" | grep -v node_modules | grep -v ".test."
# 预期：无结果
```

---

## 12. M8 成熟度评估

### 12.1 M8 交付后的产品状态

> **M8 让它"看起来"是一个成熟的 C 端产品，但"用起来"还不成熟。**
> 比喻：M8 是装修好了店面（门头、橱窗、灯光、陈列），但货架上的商品还是空盒子。

| 维度 | M8 后效果 | 成熟度 |
|---|---|:---:|
| 首页观感 | Airbnb级沉浸式首页，10个Section完整，动画/交互/品牌一致 | 🟢 85% |
| 导航体系 | 底部5Tab + 滚动毛玻璃顶栏 + 搜索栏 | 🟢 90% |
| 品牌统一 | 全站"华夏签证"，无残留旧品牌 | 🟢 100% |
| 页面完整性 | 首页/服务/工具/订单/我的 全路由可达 | 🟢 95% |
| 工具可用性 | 6个工具UI完整，但提交后显示"即将上线" | 🔴 10% |
| 服务下单 | 服务页展示国家卡片，但无法走下单流程 | 🔴 5% |
| 搜索功能 | 顶栏有搜索栏，但无结果页 | 🔴 0% |
| 支付流程 | 无支付能力 | 🔴 0% |
| 用户评价 | 3条写死的模拟数据 | 🟡 30% |
| SEO | 首页是Client Component，搜索引擎收录差 | 🟡 20% |

### 12.2 后续里程碑总览

```
M1-M7 ████████████████████████████████████████ ✅ 全部完成
M8    ████████████████████████████████████████ 🔲 C端平台化改造（视觉+导航+品牌） 7h
M9    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 🔲 工具模块实装（6工具接入真实能力）  ~15h
M10   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 🔲 C端下单闭环（服务→下单→支付→ERP） ~10h
M11   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 🔲 搜索+个性化（全局搜索+推荐）     ~8h
M12   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 🔲 真实评价+SEO（评价系统+SSR优化）  ~5h
                                        合计                                ~45h
```

---

## 13. M9: 工具模块实装

> **目标**：将6个工具从 UI 空壳升级为有真实能力的功能模块
> **工时**：~15h（约2天）
> **前置**：M8 完成

### 13.1 工具模块现状与目标

| 工具 | 路径 | M8状态 | M9目标 | 优先级 |
|---|---|---|---|:---:|
| 签证资讯 | `/portal/tools/news` | UI壳+DB Model已有 | 真实内容CRUD+分类+置顶+阅读量 | P0 |
| 行程助手 | `/portal/tools/itinerary` | UI壳+DB Model已有 | 行程CRUD+日历视图+模板 | P0 |
| 申请表助手 | `/portal/tools/form-helper` | UI壳+DB Model已有 | 表单模板+分步填写+进度保存 | P1 |
| 签证评估 | `/portal/tools/assessment` | UI壳+DB Model已有 | 规则引擎评分+建议生成 | P0 |
| 翻译助手 | `/portal/tools/translator` | UI壳+DB Model已有 | 接翻译API（如百度/DeepL） | P1 |
| 证明文件 | `/portal/tools/documents` | UI壳+DB Model已有 | 模板填充+PDF生成 | P1 |

### 13.2 签证资讯（P0，3h）

**数据库**：`erp_news_articles` 表已有（M7 创建）

**API**：`/api/news` 已有（GET 列表 + POST 创建）

**M9 任务**：
- 完善资讯页面 UI（卡片列表 + 分类筛选 + 搜索 + 分页）
- 添加富文本渲染（支持 Markdown 或 HTML 内容）
- 阅读量自增（GET 详情时 +1）
- 管理端添加资讯管理入口（或通过 Prisma Studio 手动管理初期内容）

**初期内容策略**：手动录入 10-20 篇各国签证政策资讯（非爬虫，人工编写）

### 13.3 行程助手（P0，4h）

**数据库**：`erp_itineraries` 表已有

**API**：`/api/itineraries` 已有（GET 列表 + POST 创建）

**M9 任务**：
- 行程创建表单（目的地+日期+偏好）
- 行程展示（日历视图/列表视图切换）
- 每日活动编辑（时间+地点+描述+Tips）
- 预置 3-5 个热门目的地行程模板（日本5天/申根10天等）
- 公开行程浏览（isPublic=true 的行程）

### 13.4 签证评估（P0，3h）

**数据库**：`erp_visa_assessments` 表已有

**API**：`/api/visa-assessments` 工具已有

**M9 任务**：
- 4步问卷表单（基本信息→旅行历史→财务状况→特殊因素）
- 规则引擎评分算法：
  - 护照有效期 > 6月 → +15分
  - 有发达国家出入境记录 → +20分
  - 在职且收入稳定 → +20分
  - 银行流水余额 > 5万 → +15分
  - 有房产/车产 → +10分
  - 目标国家拒签史 → -30分
- 评分等级：high(≥80) / medium(50-79) / low(<50)
- 结果页面：分数+等级+个性化建议列表
- 评估历史（用户可查看过往评估记录）

### 13.5 申请表助手（P1，2.5h）

**数据库**：`erp_form_templates` + `erp_form_records` 表已有

**M9 任务**：
- 预置 3-5 个国家的签证申请表模板（DS-160字段映射/申根表/日本表）
- 分步填写引导（进度条+步骤切换）
- 自动保存（每步填写后 PATCH 保存进度）
- 填写完成后的预览/导出

### 13.6 翻译助手（P1，1.5h）

**数据库**：`erp_translation_requests` 表已有

**M9 任务**：
- 翻译输入框（源语言选择+目标语言选择+文本输入）
- 接入翻译API（百度翻译API免费额度 或 DeepL API）
- 翻译结果展示+复制按钮
- 翻译历史记录
- **降级方案**：如暂不接入外部API，可显示"翻译功能即将上线"但UI保持完整

### 13.7 证明文件（P1，1h）

**数据库**：`erp_doc_helper_templates` + `erp_generated_documents` 表已有

**M9 任务**：
- 预置 2-3 个模板（在职证明/收入证明/邀请函）
- 表单填写（公司名/职位/收入/出行日期等）
- 模板填充预览
- **降级方案**：生成 HTML 预览，暂不生成 PDF

### 13.8 M9 验收标准

- [ ] 资讯页：可浏览文章列表+查看详情+分类筛选
- [ ] 行程助手：可创建行程+编辑每日活动+使用模板
- [ ] 签证评估：完成问卷→得到分数+等级+建议
- [ ] 申请表：可选择模板→分步填写→进度保存
- [ ] 翻译：可输入文本→得到翻译结果（或显示即将上线）
- [ ] 证明文件：可选择模板→填写信息→预览结果
- [ ] tsc 0 错误 / build 通过 / 91+ tests pass

---

## 14. M10: C端下单闭环

> **目标**：用户从浏览服务到完成下单的完整闭环
> **工时**：~10h（约1.5天）
> **前置**：M8 + M9 完成

### 14.1 核心流程

```
首页/服务页 → 选择国家+签证类型 → 填写申请人信息 → 确认订单+金额
  → 选择支付方式 → 支付（微信/支付宝） → 订单创建（进入ERP流程）
  → 跳转订单详情页 → 后续状态跟踪
```

### 14.2 数据流设计

**关键决策**：C端下单走独立的 `/api/c-end/orders` 路由，与现有 `/api/orders`（ERP客服录单）分离。

```
C端表单 → POST /api/c-end/orders
  → 参数校验（Zod）
  → 创建客户账号（如不存在，复用现有逻辑）
  → 创建 Order（复用现有 Order Model，status=PENDING_CONNECTION）
  → 创建 Applicant（复用现有逻辑）
  → 通知资料员（复用现有通知逻辑）
  → 返回订单ID
  → 前端跳转 /portal/orders/[id]
```

**复用**：底层完全复用现有 Prisma Model、TransitionService、通知系统。C端路由只是新的入口。

### 14.3 服务页改造

**当前**：静态国家卡片列表
**改为**：可交互的服务选择入口

```
┌─────────────────────────────────────┐
│ 🇯🇵 日本单次旅游签证                   │
│ 5-7工作日出签 · ¥599起               │
│ 所需材料：护照/照片/在职证明/银行流水... │
│ [立即办理 →]                         │
└─────────────────────────────────────┘
```

点击"立即办理"→ 进入下单表单

### 14.4 下单表单（新页面）

**路径**：`/services/[country]/order`（或 `/services/order?country=japan`）

**表单字段**：
1. 签证信息（自动填充：国家+类型+价格）
2. 申请人信息（姓名+手机+护照号+出行日期）
3. 多申请人支持（动态添加）
4. 联系人信息（联系人姓名+手机+邮箱）
5. 上传资料（可选，或后续在订单详情中上传）
6. 支付方式选择

### 14.5 支付集成

| 支付方式 | 集成方案 | 工时 |
|---|---|:---:|
| 微信支付 | 微信支付 JSAPI / Native | 3h |
| 支付宝 | 支付宝手机网站支付 | 3h |
| 暂不接入 | 前端展示支付选项，提交后显示"支付功能开发中"，订单仍正常创建 | 0h |

**推荐**：M10 先用"暂不接入"方案，订单正常创建，支付状态手动更新。后续再接支付SDK。

### 14.6 M10 验收标准

- [ ] 服务页点击"立即办理"→ 进入下单表单
- [ ] 填写申请人信息 → 支持多申请人
- [ ] 提交订单 → Order 创建成功，status=PENDING_CONNECTION
- [ ] 订单出现在 ERP 公共池 + 客户订单列表
- [ ] 资料员收到通知
- [ ] 未登录用户点击"立即办理"→ 跳转登录
- [ ] tsc 0 错误 / build 通过 / tests pass

---

## 15. M11: 搜索+个性化

> **目标**：全局搜索能力 + 基础推荐
> **工时**：~8h（约1天）
> **前置**：M8 + M9 完成

### 15.1 全局搜索

**搜索范围**：

| 数据源 | 搜索字段 | 结果展示 |
|---|---|---|
| 签证服务 | 国家名+签证类型 | 服务卡片，点击进入服务详情 |
| 签证资讯 | 标题+内容+标签 | 资讯卡片，点击进入文章 |
| 工具 | 工具名+描述 | 工具卡片，点击进入工具 |
| 用户订单 | 订单号+客户名 | 订单卡片，点击进入详情（需登录） |

**实现方案**：

```
顶栏搜索框输入 → 防抖300ms → GET /api/search?q=xxx
  → 并行查询4个数据源（Prisma contains）
  → 合并结果 + 分类展示
  → 前端搜索结果页 /search?q=xxx
```

**API**：新增 `GET /api/search`（1个路由）

**页面**：新增 `src/app/search/page.tsx`（1个页面）

### 15.2 首页推荐

**推荐逻辑**（无用户行为数据时的冷启动方案）：

| 推荐区域 | 策略 |
|---|---|
| 热门目的地 | 按价格升序（低价引流）或按固定顺序 |
| 工具推荐 | 固定顺序 |
| 资讯推荐 | 最新发布 + isPinned 置顶 |
| 行程推荐 | isPublic + isTemplate |

**有用户行为后**：
- 浏览过的国家 → 首页优先展示
- 使用过的工具 → "常用工具"排序靠前
- 订单涉及的国家 → 推荐相关资讯

### 15.3 搜索结果页设计

```
┌─────────────────────────────────────┐
│ 🔍 "日本" 的搜索结果                  │
├─────────────────────────────────────┤
│ 🛂 签证服务 (2)                      │
│ ┌─────────────────────────────────┐ │
│ │ 🇯🇵 日本单次旅游 · ¥599起        │ │
│ │ 🇯🇵 日本三年多次 · ¥1299起       │ │
│ └─────────────────────────────────┘ │
│ 📰 签证资讯 (5)                      │
│ ┌─────────────────────────────────┐ │
│ │ 2026日本签证最新政策解读          │ │
│ │ 日本签证材料清单更新通知          │ │
│ │ ...                             │ │
│ └─────────────────────────────────┘ │
│ 🧰 工具 (1)                          │
│ ┌─────────────────────────────────┐ │
│ │ 🗺️ 行程助手 - 规划日本旅行       │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### 15.4 M11 验收标准

- [ ] 顶栏搜索框输入 → 防抖 → 显示结果
- [ ] 搜索结果按分类分组展示
- [ ] 点击结果 → 跳转对应页面
- [ ] 空结果 → 显示"未找到相关结果"
- [ ] 未登录也可搜索（公开数据）
- [ ] tsc 0 错误 / build 通过 / tests pass

---

## 16. M12: 真实评价+SEO

> **目标**：用户评价系统 + 搜索引擎优化
> **工时**：~5h（约半天）
> **前置**：M10 完成（有真实订单后才有评价基础）

### 16.1 用户评价系统

**数据库**：新增 `erp_reviews` 表

```prisma
model Review {
  id          String    @id @default(cuid())
  companyId   String    @map("company_id")
  userId      String    @map("user_id")
  orderId     String    @map("order_id")
  rating      Int       // 1-5星
  content     String    @db.Text
  country     String    @db.VarChar(50)  // 评价涉及的国家
  isPublic    Boolean   @default(false) @map("is_public")  // 是否展示在首页
  isVerified  Boolean   @default(false) @map("is_verified") // 已验证的真实订单
  createdAt   DateTime  @default(now()) @map("created_at")

  user        User      @relation(fields: [userId], references: [id])
  order       Order     @relation(fields: [orderId], references: [id])

  @@index([isPublic, rating])
  @@index([country])
  @@map("erp_reviews")
}
```

**API**：
- `POST /api/reviews` — 提交评价（仅订单状态为 APPROVED/DELIVERED 的客户）
- `GET /api/reviews` — 获取公开评价列表（用于首页展示）

**前端**：
- 订单详情页（客户视角）：订单完成后显示"评价"按钮
- 首页 Testimonials 区域：改为从 API 拉取真实评价（保留 3 条模拟数据作为 fallback）
- 评价表单：星级选择 + 文字评价 + 提交

### 16.2 SEO 优化

**问题**：当前首页是 `'use client'`，React 组件在客户端渲染，搜索引擎爬虫看不到内容。

**方案**：首页拆分为 Server Component 壳 + Client Component 交互层

```
page.tsx (Server Component)
├── <head> 注入 meta 标签（title/description/keywords/OG标签）
├── <AppNavbar /> (Client)
├── <HeroSection /> (Client)
├── <DestinationCards /> (Client)
├── <ToolShowcase /> (Client)
├── <ValueProps /> (Server) ← 纯展示，可SSR
├── <HowItWorks /> (Server) ← 纯展示，可SSR
├── <Testimonials /> (Server) ← 从API获取数据
├── <StatsSection /> (Client)
├── <CtaSection /> (Server) ← 纯展示
├── <AppFooter /> (Server) ← 纯展示
└── <AppBottomTab /> (Client)
```

**具体措施**：

| 措施 | 说明 |
|---|---|
| Meta 标签 | `metadata` export（Next.js App Router 原生支持） |
| OG 标签 | `openGraph` 配置（标题/描述/图片） |
| 结构化数据 | JSON-LD 标注（旅行社/服务/评价） |
| 图片 alt | 所有图片添加语义化 alt 属性 |
| 语义化 HTML | 使用 `<main>` `<section>` `<nav>` `<footer>` |
| Sitemap | `app/sitemap.ts` 自动生成 |
| robots.txt | `app/robots.ts` 配置 |

### 16.3 metadata 配置示例

```typescript
// src/app/page.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '华夏签证 - 一站式签证服务平台',
  description: '专业签证办理，覆盖50+国家，最快1天出签。AI智能评估、行程规划、翻译工具，让签证办理变得简单从容。',
  keywords: ['签证', '签证办理', '出国签证', '旅游签证', '签证服务', '华夏签证'],
  openGraph: {
    title: '华夏签证 - 专业签证，一站搞定',
    description: '一站式签证办理 + 智能旅行工具，50,000+用户的选择',
    type: 'website',
    locale: 'zh_CN',
    siteName: '华夏签证',
  },
}
```

### 16.4 M12 验收标准

- [ ] 订单完成后客户可提交评价
- [ ] 首页评价区展示真实评价（有则展示，无则 fallback 模拟数据）
- [ ] 首页 HTML 源码包含完整 meta/OG 标签
- [ ] 浏览器查看源码可见 SSR 内容（非空 `<div id="root">`）
- [ ] sitemap.xml 可访问
- [ ] robots.txt 配置正确
- [ ] tsc 0 错误 / build 通过 / tests pass

---

## 17. 附录A: 现有文件完整清单

### 12.1 门户层现有文件

| 文件 | 引用者 | 处理 |
|---|---|---|
| `components/portal/portal-home.tsx` | `portal/page.tsx`(间接) | 删除 |
| `components/portal/portal-topbar.tsx` | `portal/layout.tsx` | 删除 |
| `components/portal/hero-banner.tsx` | `portal-home.tsx` | 删除 |
| `components/portal/stats-counter.tsx` | `portal-home.tsx` | 删除（功能合并到stats-section） |
| `components/portal/tool-grid.tsx` | `portal-home.tsx` | 删除 |
| `components/portal/destination-carousel.tsx` | `portal-home.tsx` | 删除（功能合并到destination-cards） |
| `components/public/public-navbar.tsx` | `page.tsx` | 删除 |
| `components/public/public-home-page.tsx` | `page.tsx` | 删除 |

### 12.2 Portal工具页现有文件（保留，微调）

| 文件 | 功能 | M8变更 |
|---|---|---|
| `portal/tools/news/page.tsx` | 资讯列表 | 加返回导航 |
| `portal/tools/itinerary/page.tsx` | 行程CRUD | 加返回导航 |
| `portal/tools/form-helper/page.tsx` | 申请表填写 | 加返回导航 |
| `portal/tools/assessment/page.tsx` | 签证评估 | 加返回导航 |
| `portal/tools/translator/page.tsx` | 翻译工具 | 加返回导航 |
| `portal/tools/documents/page.tsx` | 证明文件生成 | 加返回导航 |

### 12.3 共享UI组件（直接复用，禁止修改）

| 组件 | 文件 | 首页使用场景 |
|---|---|---|
| GlassCard | `shared/ui/glass-card.tsx` | 所有卡片容器 |
| Modal | `shared/ui/modal.tsx` | 未登录提示弹窗 |
| Toast | `shared/ui/toast.tsx` | 操作反馈 |
| DynamicBackground | `shared/ui/dynamic-bg.tsx` | 全局动态背景 |
| Button | `shared/ui/button.tsx` | 按钮（可选，也可直接用CSS类） |

---

## 18. 附录B: 设计规范速查

### 13.1 莫兰迪色板

```css
--color-primary: #7C8DA6;          /* 主色-灰蓝 */
--color-primary-dark: #5A6B82;     /* 深沉蓝灰 */
--color-primary-light: #A8B5C7;    /* 浅灰蓝 */
--color-accent: #9B8EC4;           /* 紫灰 */
--color-success: #7FA87A;          /* 莫兰迪绿 */
--color-warning: #C4A97D;          /* 莫兰迪暖黄 */
--color-error: #B87C7C;            /* 莫兰迪红 */
--color-bg-from: #1A1F2E;          /* 深蓝黑 */
--color-bg-to: #252B3B;            /* 深蓝灰 */
--color-text-primary: #E8ECF1;     /* 冷白 */
--color-text-secondary: #8E99A8;   /* 灰蓝 */
--color-text-placeholder: #5A6478; /* 深灰蓝 */
```

### 13.2 液态玻璃CSS类

| 类名 | 用途 |
|---|---|
| `glass-card` | 默认卡片（medium强度） |
| `glass-card-light` | 轻量卡片 |
| `glass-card-accent` | 高亮卡片 |
| `glass-card-static` | 静态卡片（无hover动效） |
| `glass-btn-primary` | 主按钮 |
| `glass-btn-secondary` | 次要按钮 |
| `glass-btn-danger` | 危险按钮 |
| `glass-btn-success` | 确认按钮 |
| `glass-input` | 输入框 |
| `glass-modal` | 弹窗 |

### 13.3 动画类

| 类名 | 效果 |
|---|---|
| `animate-fade-in-up` | 淡入上移（最常用） |
| `animate-fade-in-down` | 淡入下移 |
| `animate-fade-in-left` | 淡入左移 |
| `animate-fade-in-right` | 淡入右移 |
| `animate-scale-in` | 缩放入场 |
| `animate-spring-in` | 弹簧缩放 |
| `animate-pulse-glow` | 脉动发光 |
| `animate-shake` | 抖动（表单错误） |
| `anim-initial` | 初始隐藏（等待JS触发） |
| `delay-50` ~ `delay-500` | 延迟类 |

### 13.4 缓动曲线

```css
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
--ease-damping: cubic-bezier(0.25, 0.46, 0.45, 0.94);
--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

---

## 19. 附录C: 常见问题

### Q1: 首页 `page.tsx` 和 portal layout 是什么关系？

首页 `/` 是根路由，不在 portal layout 内。它自己渲染 AppNavbar + AppBottomTab。`/services`、`/tools/*`、`/portal/*` 在 portal layout 内，通过 portal layout 获得 AppBottomTab。

### Q2: 删除 `public/` 目录下的文件会影响什么？

`public-navbar.tsx` 和 `public-home-page.tsx` 仅被 `src/app/page.tsx` 引用。重写 `page.tsx` 后不再引用它们，可以安全删除。

### Q3: 工具页从 `/portal/tools/xxx` 访问还是 `/tools/xxx`？

两者都可以。`/tools/*` 在 middleware 的 `PUBLIC_ROUTES` 中（`startsWith('/tools')`），公开可访问。`/portal/tools/*` 通过 portal layout 渲染，需登录。实际体验：
- 未登录用户通过首页 ToolShowcase 点击 → `/tools/xxx` → 可以看页面，但操作需登录
- 已登录用户通过底部Tab"工具" → `/tools` → 点击 → `/portal/tools/xxx`（在portal layout内）

> **简化方案**：统一使用 `/portal/tools/*` 路径（已有页面），首页和工具箱的Link直接指向 `/portal/tools/xxx`。`/tools` 页面只是portal layout内的一个聚合入口。middleware中PUBLIC_ROUTES无需添加 `/tools`，因为工具页在portal layout内，已登录即可访问。

### Q4: 如果用户在首页点击"订单"Tab但未登录？

中间件会拦截 `/orders` → 未登录 → redirect `/login`。登录成功后 login page 跳转 `/`，用户需再次点击"订单"Tab。

> **优化方案**：login page 登录成功后检查 URL 是否有 `redirect` 参数，有则跳转到目标页。但这是可选优化，不在 M8 必做范围。

### Q5: 组件中 import 路径怎么写？

```typescript
// 共享基础设施 — 用 @shared/
import { useAuth } from '@shared/hooks/use-auth'
import { GlassCard } from '@shared/ui/glass-card'
import { cn } from '@shared/lib/utils'

// 门户组件 — 用 @/
import { AppNavbar } from '@/components/portal/app-navbar'

// ERP模块 — 用 @erp/（门户层不应引用）
// import { xxx } from '@erp/...'  ← 禁止
```

---

*文档结束 — C端平台化改造全知手册 V3.0（M8-M12）*
