# 华夏签证 - C端平台化改造方案（M8 全知开发手册）

> **文档版本**: V4.3
> **最后更新**: 2026-04-03
> **用途**: 本文件是 C 端平台化改造的唯一开发手册（M8-M12）。任何开发者/AI 拿到本文件 + Git仓库即可完整执行开发，无需额外上下文。
> **前置状态**: M1-M7 全部完成 ✅，M8 Phase 1-5 全部完成 ✅，账户系统审查通过 ✅，177 源文件 / ~22,500 行 / 57 API 路由 / 91 测试用例

---

## 目录

1. [项目现状速查](#1-项目现状速查)
2. [改造目标与设计哲学](#2-改造目标与设计哲学)
   - [2.4 视觉设计创新（10大设计模式）](#24-视觉设计创新顶尖网站深度研究)
3. [手机端设计规范（全局强制执行）](#3-手机端设计规范全局强制执行)
4. [ERP 保护红线](#4-erp-保护红线)
5. [新路由架构](#5-新路由架构)
6. [文件变更总表](#6-文件变更总表)
7. [Phase 1: 品牌统一](#7-phase-1-品牌统一)
8. [Phase 2: 导航体系改造](#8-phase-2-导航体系改造)
9. [Phase 3: 首页重写（10 Section）](#9-phase-3-首页重写)
10. [Phase 4: "我的"页面重写](#10-phase-4-我的页面重写)
11. [Phase 5: 服务页 + 工具箱首页](#11-phase-5-服务页--工具箱首页)
12. [Phase 6: 全量验收](#12-phase-6-全量验收)
13. [M8 成熟度评估](#13-m8-成熟度评估)
14. [M9: 工具模块实装](#14-m9-工具模块实装)
15. [M10: C端下单闭环](#15-m10-c端下单闭环)
16. [M11: 搜索+个性化](#16-m11-搜索个性化)
17. [M12: 真实评价+SEO](#17-m12-真实评价seo)
18. [附录A: 现有文件完整清单](#18-附录a-现有文件完整清单)
19. [附录B: 设计规范速查](#19-附录b-设计规范速查)
20. [附录C: 常见问题](#20-附录c-常见问题)

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

### 2.4 视觉设计创新（顶尖网站深度研究）

> 以下设计模式提炼自 Stripe / Airbnb / Linear / Apple / Notion / Framer 的核心设计语言，
> 针对签证服务场景做了适配，每条都给出具体落地方案。

#### 创新 1：渐变网格背景（参考 Stripe）

Stripe 首页的标志性设计：大面积渐变色块在背景中缓慢流动，营造"高端科技感"。

**落地**：
```tsx
// HeroSection 背景层
<div className="absolute inset-0 overflow-hidden">
  {/* 渐变网格：3个大色块缓慢漂移 */}
  <div className="absolute -top-1/4 -left-1/4 w-[600px] h-[600px] rounded-full
    bg-gradient-to-br from-[#7C8DA6]/15 to-transparent
    animate-[gradientDrift1_25s_ease-in-out_infinite]" />
  <div className="absolute top-1/3 -right-1/4 w-[500px] h-[500px] rounded-full
    bg-gradient-to-bl from-[#9B8EC4]/12 to-transparent
    animate-[gradientDrift2_30s_ease-in-out_infinite]" />
  <div className="absolute -bottom-1/4 left-1/3 w-[400px] h-[400px] rounded-full
    bg-gradient-to-tr from-[#8FA3A6]/10 to-transparent
    animate-[gradientDrift3_20s_ease-in-out_infinite]" />
  {/* 微光噪点纹理（增加质感） */}
  <div className="absolute inset-0 opacity-[0.03]"
    style={{ backgroundImage: 'url("data:image/svg+xml,...noise...")' }} />
</div>
```

**效果**：背景不是静态渐变，而是3个莫兰迪色球体在缓慢漂移，叠加噪点纹理产生高级的纸张质感。

#### 创新 2：视差滚动分层（参考 Apple）

Apple 产品页的灵魂：不同层次的内容以不同速度滚动，产生深度感。

**落地**：
- Hero 标题固定在背景上，底部内容滑过时标题产生 `translateY` 视差偏移
- 目的地卡片区：左侧标题固定，右侧卡片横向滚动
- 统计数字：进入视口时从模糊 `blur(8px)` 渐变到清晰

```tsx
// 视差标题
const [scrollY, setScrollY] = useState(0)
<h1 style={{ transform: `translateY(${scrollY * 0.3}px)` }}>
  {/* 标题内容 */}
</h1>
```

**效果**：页面滚动时产生空间纵深感，不再是"平铺直叙"。

#### 创新 3：Scroll-Driven 渐显（参考 Linear / Framer）

Linear 的标志性交互：内容不是一次性展示，而是随着滚动逐块"生长"出来。

**落地**：
- 每个 Section 使用 `IntersectionObserver` + CSS `animation-timeline: view()`
- 进入视口时：`opacity: 0→1` + `translateY(40px→0)` + `blur(4px→0)`
- 不同子元素 stagger 延迟 80-120ms

```tsx
// 所有 Section 的入场动画
<section className="animate-on-scroll opacity-0 translate-y-10 blur-[4px]
  transition-all duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]
  data-[visible=true]:opacity-100 data-[visible=true]:translate-y-0 data-[visible=true]:blur-0">
```

**效果**：用户向下滚动时，内容如"生长"般逐段出现，比传统的 fadeInUp 更有生命力。

#### 创新 4：磁性按钮（参考 Stripe / Linear）

鼠标靠近按钮一定范围时，按钮"被吸引"向鼠标方向微移，产生物理吸附感。

**落地**（仅桌面端）：
```tsx
const handleMouseMove = (e: React.MouseEvent) => {
  const rect = buttonRef.current.getBoundingClientRect()
  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 2
  const deltaX = (e.clientX - centerX) * 0.15  // 15% 吸附强度
  const deltaY = (e.clientY - centerY) * 0.15
  buttonRef.current.style.transform = `translate(${deltaX}px, ${deltaY}px)`
}
```

**效果**：CTA按钮有"活着"的感觉，吸引用户点击。

#### 创新 5：卡片 3D 倾斜（参考 Stripe 产品卡）

鼠标在卡片上移动时，卡片跟随鼠标位置做微小的 3D 旋转，产生深度感。

**落地**（仅桌面端）：
```tsx
const handleMouseMove = (e: React.MouseEvent, card: HTMLDivElement) => {
  const rect = card.getBoundingClientRect()
  const x = (e.clientX - rect.left) / rect.width - 0.5   // -0.5 ~ 0.5
  const y = (e.clientY - rect.top) / rect.height - 0.5
  card.style.transform = `perspective(1000px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateZ(10px)`
}
const handleMouseLeave = (card: HTMLDivElement) => {
  card.style.transform = 'perspective(1000px) rotateY(0) rotateX(0) translateZ(0)'
}
```

**应用**：目的地卡片、工具卡片、价值主张卡片。

**效果**：卡片不再是平面的，鼠标移动时有真实的"翻转"质感。

#### 创新 6：数字滚动 + 位数分离（参考 Stripe 数据展示）

Stripe 的统计数据不只是数字变大，而是每位数字独立翻转，像老式计数器。

**落地**：
```tsx
// 每位数字独立滚动
function AnimatedCounter({ value, suffix }) {
  const digits = value.toString().split('')
  return (
    <span className="flex items-center">
      {digits.map((d, i) => (
        <span key={i} className="overflow-hidden inline-block h-[1.2em]">
          <span className="block animate-[digitSlide_1.5s_ease-out_forwards]"
            style={{ animationDelay: `${i * 100}ms` }}>
            {[0,1,2,3,4,5,6,7,8,9].map(n => (
              <span key={n} className="block h-[1.2em] leading-[1.2em]">{n}</span>
            ))}
          </span>
        </span>
      ))}
      {suffix && <span>{suffix}</span>}
    </span>
  )
}
```

**效果**：数字不是"跳变"，而是每位数像老虎机一样滚动到位，极具仪式感。

#### 创新 7：光标跟随聚光灯（参考 Linear）

桌面端鼠标位置产生一个柔和的聚光灯光晕，照亮经过的内容。

**落地**：
```tsx
// 全局鼠标追踪
<div className="fixed inset-0 pointer-events-none z-50"
  style={{
    background: `radial-gradient(600px circle at ${mouseX}px ${mouseY}px, rgba(124,141,166,0.06), transparent 40%)`
  }}
/>
```

**效果**：鼠标移动时，经过的区域微微提亮，像手电筒照在页面上。

#### 创新 8：文字渐变扫光（参考 Apple / Notion）

标题文字不是静态颜色，而是有一个光泽从左到右周期性扫过。

**落地**：
```css
.shimmer-text {
  background: linear-gradient(
    120deg,
    var(--color-text-primary) 0%,
    var(--color-text-primary) 40%,
    var(--color-primary-light) 50%,
    var(--color-text-primary) 60%,
    var(--color-text-primary) 100%
  );
  background-size: 200% 100%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: shimmerSweep 4s ease-in-out infinite;
}
@keyframes shimmerSweep {
  0%, 100% { background-position: 200% center; }
  50% { background-position: 0% center; }
}
```

**应用**：Hero 大标题、CTA 区域标题。

**效果**：标题每隔几秒有光泽扫过，像金属反光，极具质感。

#### 创新 9：玻璃态深度层级（参考 iOS / Notion）

不是所有卡片都一样的透明度，而是建立 3 层深度系统：

| 层级 | 背景 | blur | 用途 | 感受 |
|---|---|---|---|---|
| L0 - 地面 | `rgba(255,255,255,0.03)` | 8px | 背景卡片、列表项 | 贴地 |
| L1 - 悬浮 | `rgba(255,255,255,0.06)` | 16px | 内容卡片、工具卡片 | 浮起 |
| L2 - 玻璃 | `rgba(255,255,255,0.10)` | 24px | 弹窗、下拉菜单、顶栏 | 悬空 |

**配合阴影层级**：
- L0：`shadow-none`
- L1：`shadow-[0_4px_24px_rgba(0,0,0,0.08)]`
- L2：`shadow-[0_8px_40px_rgba(0,0,0,0.16)]`

**效果**：用户直觉感受到"哪些元素在前面，哪些在后面"，空间感极强。

#### 创新 10：入场编排（参考 Framer / Apple）

不是每个元素同时出现，而是像舞台剧一样，有角色、有顺序、有节奏。

**编排方案**：

| 顺序 | 元素 | 动画 | 延迟 |
|---|---|---|---|
| 1 | 顶栏 | fadeDown | 0ms |
| 2 | Hero 标题（逐词） | 每词 80ms 间隔 | 200ms |
| 3 | 底部光带 | glowPulse | 标题完成后 |
| 4 | 副标题 | fadeIn | +200ms |
| 5 | 搜索框 | fadeIn + scaleIn | +300ms |
| 6 | 快捷标签（逐个） | 每个 50ms stagger | +400ms |
| 7 | CTA 按钮 | springIn | +600ms |
| 8+ | 后续 Section | scroll-driven | 滚动触发 |

**效果**：首屏打开像一场精心编排的表演，每个元素有"角色感"。

---

## 3. 手机端设计规范（全局强制执行）

> **原则**：手机端优先设计，桌面端渐进增强。手机端优化不得破坏桌面端体验。
> **参考**：Airbnb App / Apple.com 移动端 / Linear / Notion / Stripe
> **适用范围**：所有新增门户层组件和页面，M8 起强制执行。

### 3.1 视口与布局基础

```css
/* 强制：所有 C 端页面必须包含 viewport meta */
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1" />

/* 强制：安全区域适配（刘海屏/底部横条） */
padding-top: env(safe-area-inset-top);
padding-bottom: env(safe-area-inset-bottom);
padding-left: env(safe-area-inset-left);
padding-right: env(safe-area-inset-right);
```

| 规则 | 说明 |
|---|---|
| 内容限宽 | `max-w-lg`（448px），超出居中留白 |
| 侧边距 | `px-4`（16px），大屏可增至 `px-6` |
| 底部留白 | `pb-[68px]`（避开底部Tab 56px + safe-area） |
| 顶部留白 | `pt-14`（56px，避开固定顶栏） |
| safe-area | 底部Tab + 顶栏必须用 `env(safe-area-inset-*)` |

### 3.2 触控交互规范（参考 Airbnb/Apple）

| 规则 | 标准 | 说明 |
|---|---|---|
| **最小触控区域** | 44×44px（`min-h-[44px] min-w-[44px]`） | Apple HIG 标准，防止误触 |
| **按钮内边距** | `px-5 py-3`（20px 12px）最小 | 保证拇指舒适点击 |
| **列表项高度** | 最小 56px（`min-h-[56px]`） | 信息密度与可触控的平衡 |
| **输入框高度** | 48px（`py-3.5`） | 方便手机键盘输入 |
| **卡片间距** | `gap-3`（12px） | 既紧凑又不误触 |
| **:active 反馈** | `active:scale-[0.97]` 或 `active:bg-white/[0.08]` | 点击即时视觉反馈（手机无hover） |
| **长按操作** | 重要操作支持长按确认（如删除） | 防止误操作 |

### 3.3 手势交互规范（参考 Linear/Notion）

| 手势 | 场景 | 实现 |
|---|---|---|
| **左右滑动** | 目的地卡片轮播 | `overflow-x-auto scroll-snap-x` + 拖拽检测 |
| **下拉刷新** | 订单列表/资讯列表 | `pull-to-refresh` 组件（可选，M9+） |
| **上滑加载** | 列表分页 | IntersectionObserver 底部触发 |
| **双指缩放** | 图片预览/地图 | 禁用（`touch-action: pan-y`）防止页面缩放 |
| **滑动返回** | 详情页→列表页 | 浏览器原生，不干预 |

**横向滚动强制规范**：
```css
/* 所有横向滚动容器必须遵守 */
overflow-x: auto;
scroll-snap-type: x mandatory;
-webkit-overflow-scrolling: touch;
scrollbar-width: none;           /* Firefox */
-ms-overflow-style: none;        /* IE */
/* Webkit */
&::-webkit-scrollbar { display: none; }
```

### 3.4 动画与性能（手机端专项）

| 规则 | 说明 |
|---|---|
| **GPU加速** | 动画只用 `transform` 和 `opacity`，禁止动画 `width/height/top/left` |
| **will-change** | 滚动容器加 `will-change: scroll-position`，动画元素加 `will-change: transform` |
| **帧率** | 所有动画必须 60fps（16ms/frame），复杂动画用 `requestAnimationFrame` |
| **禁用桌面特效** | 移动端自动禁用：鼠标跟随光晕、桌面端hover浮起、液态光泽层 |
| **减少模糊** | 移动端 `backdrop-blur` 降至 `blur(12px)`（桌面 20px），低端机更省性能 |
| **图片优化** | 移动端加载小图（`srcSet` + `sizes`），非首屏图片 `loading="lazy"` |
| **骨架屏** | 数据加载时必须显示骨架屏（`skeleton` CSS 类），禁止空白闪烁 |
| **减少动画** | `prefers-reduced-motion: reduce` 时禁用所有非必要动画 |

```css
/* 媒体查询：尊重用户偏好 */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 3.5 手机端 vs 桌面端差异化清单

以下交互在手机端和桌面端**必须不同**，通过 `@media (hover: hover)` 区分：

| 特性 | 桌面端（hover: hover） | 移动端（hover: none） |
|---|---|---|
| 卡片悬停 | 浮起 `translateY(-2px)` + 阴影加深 + 光泽层渐显 | 无hover效果，仅 `:active` 缩放 |
| 按钮悬停 | 光泽扫过 `::before` + 背景提亮 | 无，仅 `:active` 变暗 |
| 鼠标跟随光晕 | 400px 径向渐变追踪鼠标 | **完全禁用**（display:none） |
| 浮动光球 | 4个 orb + blur(80px) + 20s动画 | **降级为2个静态渐变圆**（更小+更透明） |
| 顶栏 | 滚动透明→毛玻璃（opacity 0.72→0.92） | 同，但初始就半透明（0.85） |
| 搜索栏 | 始终展开 | 默认收起为🔍图标，点击展开 |
| 下拉菜单 | hover 展开 | 点击展开（已有实现） |
| 滚动条 | 自定义细滚动条 | 隐藏（`display:none`） |

```css
/* CSS 实现差异化 */
@media (hover: hover) {
  .card:hover { transform: translateY(-2px); box-shadow: ...; }
  .card:hover::before { opacity: 1; }
}
@media (hover: none) {
  .card:active { transform: scale(0.97); }
  .card::before { display: none; }     /* 光泽层禁用 */
  .mouse-glow { display: none; }       /* 鼠标光晕禁用 */
}
```

### 3.6 手机端专属 UI 模式

| 模式 | 场景 | 参考 |
|---|---|---|
| **底部弹出面板** | 筛选/排序/操作菜单 | Airbnb 筛选面板 |
| **全屏模态** | 创建订单/填写表单 | Linear 新建Issue |
| **Toast 底部居中** | 操作反馈（非右下角） | iOS 风格 |
| **标签页滑动** | 订单状态筛选 Tab | 横向滚动 Tab 栏 |
| **骨架屏列表** | 列表加载 | 所有主流App |
| **空状态插画** | 无数据时的友好提示 | Notion/Slack |
| **下拉刷新指示器** | 列表顶部旋转圈 | 微信/淘宝 |

**底部弹出面板规格**（Bottom Sheet）：
```css
/* 参考 Airbnb 筛选面板 */
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
  animation: slideUp 0.35s var(--ease-spring);
  /* 顶部拖拽条 */
  &::before {
    content: '';
    display: block;
    width: 36px;
    height: 4px;
    border-radius: 2px;
    background: rgba(255,255,255,0.2);
    margin: 12px auto;
  }
}
```

### 3.7 文字与排版（手机端）

| 层级 | 手机端字号 | 字重 | 用途 |
|---|---|---|---|
| Hero标题 | 28px | 700 | 首屏大标题（桌面32-40px） |
| 页面标题 | 20px | 700 | 各Section标题 |
| 卡片标题 | 16px | 600 | 工具/目的地/服务卡片 |
| 正文 | 14px | 400 | 描述/说明文字 |
| 辅助文字 | 12px | 400 | 标签/时间/次要信息 |
| 极小文字 | 11px | 500 | 角标/版权 |

**行高**：中文正文 `leading-relaxed`（1.625），标题 `leading-tight`（1.25）

### 3.8 验证清单（手机端专项）

每次提交前，用 Chrome DevTools 手机模式验证：

```
□ 375px 宽度（iPhone SE）无水平滚动条
□ 390px 宽度（iPhone 14）布局正常
□ 414px 宽度（iPhone 14 Pro Max）布局正常
□ 底部Tab不遮挡内容（pb-[68px]）
□ 顶栏不遮挡内容（pt-14）
□ 刘海屏 safe-area 正常
□ 所有按钮可点击（≥44px）
□ 横向滚动流畅（scroll-snap）
□ 无桌面端hover特效（光泽层/浮起）
□ 骨架屏加载正常
□ 3G网络下首屏 < 3s
```

---

## 4. ERP 保护红线

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

## 5. 新路由架构

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

## 6. 文件变更总表

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
Phase 1 (0.5h) → 品牌统一（8文件改文字） ✅ 已完成 2026-04-03
Phase 2 (1.0h) → 导航体系（底部Tab+middleware+重定向+新路由页面壳） ✅ 已完成 2026-04-03
Phase 3 (3.5h) → 首页重写（11个新组件+删除6个旧文件+page.tsx组装） ✅ 已完成 2026-04-03
Phase 4 (0.5h) → "我的"页面重写 ✅ 已完成 2026-04-03
Phase 5 (1.0h) → 服务页+工具箱首页 ✅ 已完成 2026-04-03
Phase 6 (0.5h) → 全量验收
─────────────────────────────────
合计 7.0h（Phase 1-5 已完成，剩余 0.5h）
```

---

## 7. Phase 1: 品牌统一 ✅ 已完成

> **完成日期**: 2026-04-03
> **验证结果**: TypeScript 0 错误 / Build 通过 / 91 测试通过 / 旧品牌名无残留

### 6.1 品牌替换清单

| # | 文件 | 查找 | 替换 | 状态 |
|---|---|---|---|:---:|
| 1 | `src/app/layout.tsx` | `沐海旅行 - 签证ERP系统` | `华夏签证 - 一站式签证服务平台` | ✅ 已为最新，无需修改 |
| 2 | `src/app/layout.tsx` | `签证办理行业专属 SaaS 多租户 ERP 系统` | `专业签证办理 · 智能工具 · 一站式服务` | ✅ 已为最新，无需修改 |
| 3 | `src/app/(auth)/login/page.tsx` | `签证行业 ERP 管理系统` | `一站式签证服务平台` | ✅ 已替换 |
| 4 | `src/app/(auth)/register/page.tsx` | `注册账号，开始使用签证 ERP 系统` | `注册账号，开启便捷签证之旅` | ✅ 已替换 |
| 5 | `src/app/(auth)/register/page.tsx` | `公司入驻` | 保持"公司入驻" | ✅ 保持不变 |
| 6 | `src/app/customer/layout.tsx` | 任何"沐海"/"盼达"品牌名 | `华夏签证` | ✅ 已为最新，无需修改 |
| 7 | `src/app/page.tsx` | 注释中"ERP 系统" | "后台" | ✅ 已替换 |
| 8 | `src/shared/lib/utils.ts` | 注释中"沐海" | "华夏签证" | ✅ 已替换 |
| 9 | `src/components/public/public-navbar.tsx` | "点击访问 ERP 系统" | "点击进入后台管理" | ✅ 已替换 |

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

## 8. Phase 2: 导航体系改造 ✅ 已完成

> **完成日期**: 2026-04-03
> **验证结果**: TypeScript 0 错误 / Build 通过 / 91 测试通过

### Phase 2 实际变更

| # | 文件 | 操作 | 状态 |
|---|---|---|:---:|
| 1 | `src/middleware.ts` | PUBLIC_ROUTES 加 `/services` `/tools`；加 `/orders` `/profile` 重定向 | ✅ |
| 2 | `src/components/portal/app-bottom-tab.tsx` | 新建 5 Tab 底部导航（首页/服务/工具/订单/我的） | ✅ |
| 3 | `src/app/portal/layout.tsx` | 重写：移除 PortalTopbar，使用 AppBottomTab，去掉 pt-14 | ✅ |
| 4 | `src/app/orders/page.tsx` | 新建：重定向到 /portal/orders | ✅ |
| 5 | `src/app/portal/notifications/page.tsx` | 改为 Server Component 重定向到 /portal/profile | ✅ |

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

## 9. Phase 3: 首页重写 ✅ 已完成

> **完成日期**: 2026-04-03
> **验证结果**: TypeScript 0 错误 / Build 通过 / 91 测试通过 / 旧引用无残留 / as any 0

### Phase 3 实际变更

**删除 6 个旧文件**：
| 文件 | 状态 |
|---|:---:|
| `components/public/public-navbar.tsx` | ✅ 已删除 |
| `components/public/public-home-page.tsx` | ✅ 已删除 |
| `components/portal/portal-topbar.tsx` | ✅ 已删除 |
| `components/portal/hero-banner.tsx` | ✅ 已删除 |
| `components/portal/portal-home.tsx` | ✅ 已删除 |
| `components/portal/tool-grid.tsx` | ✅ 已删除 |

**新建 10 个组件 + 重写 page.tsx**：
| 文件 | 说明 | 创新点 |
|---|---|---|
| `app-navbar.tsx` | 顶部导航栏（滚动透明→毛玻璃+搜索+登录态判断） | — |
| `hero-section.tsx` | Hero区域（渐变网格+逐词渐显+视差+搜索+标签+磁性CTA） | #1 #2 #4 #7 #8 #10 |
| `destination-cards.tsx` | 热门目的地横向滚动（8国家卡片+3D倾斜+scroll-snap） | #3 #5 |
| `tool-showcase.tsx` | 6大工具展示（2×3网格+stagger入场+hover sweep） | #9 #10 |
| `value-props.tsx` | 价值主张（4格大数字锚点+scroll-driven入场） | #3 |
| `how-it-works.tsx` | 四步流程（步骤连接线动画） | #3 |
| `testimonials.tsx` | 用户评价（3条模拟数据+自动轮播+指示点） | — |
| `stats-section.tsx` | 数据统计（数字滚动动画+stagger入场） | #3 #6 |
| `cta-section.tsx` | CTA行动召唤（渐变背景+发光按钮） | — |
| `app-footer.tsx` | 页脚（4列布局+品牌slogan） | — |
| `page.tsx` | 组装首页（Server Component壳+DynamicBackground+AppBottomTab） | — |

**CSS 新增**（globals.css）：7个关键帧（gradientDrift×3/shimmerSweep/springInUp/drawLine/slideUp/digitSlide）+ 4个工具类（shimmer-text/scroll-reveal/bottom-sheet）

**Tailwind 新增**：8个动画注册

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

**参考**：Stripe（渐变网格背景） + Apple（视差滚动） + Linear（入场编排）

**完整结构（从底到顶，7层）**：
```
Layer 0: 深色背景渐变（#1A1F2E → #1F2536 → #252B3B）
Layer 1: 渐变网格（3个莫兰迪色球体缓慢漂移 + 噪点纹理）   ← 创新1: Stripe渐变网格
Layer 2: 微光网格线（60px间距半透明网格，中心渐隐）
Layer 3: 鼠标跟随聚光灯（600px径向渐变，仅桌面端）         ← 创新7: Linear聚光灯
Layer 4: 内容层（标题+副标题+搜索框+标签+CTA）
Layer 5: 底部渐隐遮罩（过渡到下一个Section）
```

**标题动画（编排入场 ← 创新10）**：
```
时序：
  0ms   → 顶栏 fadeDown
  200ms → "想" 字渐显
  280ms → "去" 字渐显（每词间隔80ms）
  ...   → 逐词直到标题完整
  +100ms → 底部光带 glowPulse 开始
  +200ms → 副标题 fadeIn
  +300ms → 搜索框 scaleIn(0.95→1) + fadeIn
  +50ms×N → 快捷标签逐个 slideIn（N=标签序号）
  +600ms → CTA 按钮 springIn
```

**标题文字特效 ← 创新8：文字渐变扫光**：
```tsx
<h1 className="shimmer-text text-[28px] sm:text-[40px] font-bold tracking-tight">
  想去哪，华夏签证帮你搞定
</h1>
// shimmer-text: 文字每隔4秒有金属光泽从左到右扫过
```

**视差滚动 ← 创新2**：
```tsx
// Hero 标题层产生视差偏移，内容区滑过时标题减速
style={{ transform: `translateY(${scrollY * 0.25}px)` }}
```

**搜索框设计**：
- 大尺寸毛玻璃输入框（h-14, rounded-2xl）
- 左侧搜索图标 + placeholder="输入国家或签证类型..."
- 聚焦时：边框 primary/40 + 外发光 `shadow-[0_0_0_4px_rgba(124,141,166,0.15)]`
- 回车搜索 → 跳转 `/services?search=xxx`

**快捷标签**：
- 6个毛玻璃小胶囊：`rounded-full bg-white/[0.06] backdrop-blur-sm border border-white/[0.08]`
- 内容：🇯🇵日本 🇰🇷韩国 🇪🇺申根 🇺🇸美国 🇹🇭泰国 🌍更多
- hover：背景提亮 + 边框 primary/30
- active：缩放 0.95
- 点击：跳转 `/services?country=xxx`

**CTA 按钮 ← 创新4：磁性按钮（仅桌面端）**：
- "开始探索 →"（glass-btn-primary，px-8 py-4，text-[15px] font-semibold）
- 桌面端：鼠标靠近时按钮微移吸附（0.15强度）
- 移动端：纯 `active:scale-[0.97]` 反馈

**最低高度**：`min-h-[92vh]`（几乎全屏）

**移动端降级**：
- 渐变网格：球体缩小50%，opacity 降至 0.3
- 鼠标聚光灯：`display:none`
- 视差效果：禁用（`transform: none`）
- 磁性按钮：禁用
- 标题：28px（桌面40px）
- 搜索栏：默认收起为圆角搜索图标，点击展开为完整输入框

#### 8.4.3 `destination-cards.tsx` — 热门目的地

**类型**：`'use client'`

**参考**：Airbnb（图片驱动卡片） + Stripe（3D倾斜）

**卡片设计 ← 创新5：3D倾斜（仅桌面端）**：
- 桌面端鼠标在卡片上移动 → 卡片产生微小 3D 旋转（±8deg）
- `perspective(1000px) rotateY(${x}deg) rotateX(${-y}deg) translateZ(10px)`
- 鼠标离开 → 弹簧回弹 `transition: transform 0.5s var(--ease-spring)`
- 移动端：无 3D 效果，仅 `active:scale-[0.97]`

**卡片视觉（每张不同渐变背景）**：
```tsx
// 每个国家独有的渐变配色（非随机，经过设计）
const GRADIENTS = {
  '日本': 'from-pink-500/20 via-rose-400/10 to-transparent',
  '韩国': 'from-blue-500/20 via-sky-400/10 to-transparent',
  '申根': 'from-indigo-500/20 via-blue-400/10 to-transparent',
  '美国': 'from-red-500/15 via-blue-500/10 to-transparent',
  '泰国': 'from-purple-500/20 via-amber-400/10 to-transparent',
  // ... 每个国家
}
```

**卡片结构**：
```
┌──────────────────────────┐
│ bg-gradient-to-br         │  ← 国家专属渐变
│                          │
│          🇯🇵              │  ← 国旗 emoji (text-5xl)
│                          │
│ ──────────────────────── │  ← 分隔线（border-white/[0.06]）
│                          │
│ 日本 单次旅游             │  ← 国家 + 签证类型
│ 5-7工作日出签             │  ← 出签时间（带时钟小图标）
│ ¥599 起                  │  ← 价格（font-bold text-[18px] primary色）
│                          │
│ [立即办理 →]             │  ← 微型CTA（仅hover时显现）
└──────────────────────────┘
```

**尺寸**：`w-[200px] h-[260px] flex-shrink-0`

**入场 ← 创新3：Scroll-Driven**：
- IntersectionObserver 检测可见性
- 每张卡片 stagger 100ms 入场
- `opacity: 0→1` + `translateX(40px→0)` + `blur(3px→0)`

**悬停效果（桌面端）**：
- 3D倾斜 ← 创新5
- 底部"立即办理"从 `opacity-0 translate-y-2` → `opacity-100 translate-y-0`
- 整体阴影加深

#### 8.4.4 `tool-showcase.tsx` — 6大工具展示

**类型**：`'use client'`

**参考**：Linear（极简卡片） + Framer（stagger编排）

**卡片设计 ← 创新9：玻璃态深度层级**：
- 使用 L1 层级（`rgba(255,255,255,0.06)` + blur 16px）
- 每个工具独特颜色的图标背景渐变（非统一灰色）

```tsx
const TOOL_COLORS = {
  '签证资讯': 'from-blue-400/20 to-cyan-400/10',
  '行程助手': 'from-green-400/20 to-emerald-400/10',
  '申请表': 'from-amber-400/20 to-orange-400/10',
  '签证评估': 'from-purple-400/20 to-violet-400/10',
  '翻译助手': 'from-pink-400/20 to-rose-400/10',
  '证明文件': 'from-indigo-400/20 to-blue-400/10',
}
```

**卡片内图标**：不再用 emoji，改用 SVG 图标 + 对应工具色渐变背景圆

**入场 ← 创新10：编排入场**：
- IntersectionObserver 触发
- 每张卡片 stagger 120ms
- 动画：`opacity + translateY(30px→0) + scale(0.95→1)`
- 缓动：`--ease-spring`（弹性出场）

**hover（桌面端）**：
- 卡片浮起 `translateY(-4px)` + 阴影加深
- 图标微放大 `scale(1.1)`
- 背景色渐变微微提亮
- 底部箭头从右侧滑入 `translateX(0)`

**移动端**：2列网格不变，`active:scale-[0.97]`

#### 8.4.5 `value-props.tsx` — 价值主张

**类型**：`'use client'`（需要滚动触发动画）

**参考**：Stripe（数据+图标精准排版）

**每格设计**：
```
┌─────────────────────┐
│                     │
│  ┌───────────────┐  │
│  │   ⚡ (icon)    │  │  ← 图标在渐变圆内（w-14 h-14 rounded-2xl bg-gradient-to-br）
│  └───────────────┘  │
│                     │
│  极速出签            │  ← 标题 (text-[18px] font-bold)
│                     │
│  最快1个工作日       │  ← 数字/关键信息 (text-[28px] font-bold primary色)
│  出签，不让等待      │  ← 描述 (text-[13px] secondary)
│  耽误行程            │
│                     │
└─────────────────────┘
```

**核心差异**：每个价值主张有一个**大数字**作为视觉锚点（如"1天""99.2%""0隐藏""AI"），不是纯文字堆砌。

**入场**：scroll-driven，4格 stagger 150ms

#### 8.4.6 `how-it-works.tsx` — 办理流程

**参考**：Linear（步骤连接线动画）

**设计**：水平步骤条，桌面4列，移动端2×2网格

**连接线动画**：
- 步骤之间有虚线连接
- 进入视口时，连接线从左到右"绘制"出来（`stroke-dashoffset` 动画）

```tsx
// SVG 连接线
<line x1="0" y1="50%" x2="100%" y2="50%"
  strokeDasharray="6 4"
  className="animate-[drawLine_1s_ease-out_forwards]"
  style={{ strokeDashoffset: '100 → 0' }} />
```

#### 8.4.7 `testimonials.tsx` — 用户评价

**参考**：Airbnb（评价卡片） + Notion（简洁排版）

**卡片设计**：
- GlassCard L1 层级
- 头像渐变圆（非emoji，用首字母 + 莫兰迪色背景）
- 星级用渐变填充星星（`text-amber-400`）
- 评价内容：`text-[14px] leading-relaxed`
- 评价涉及国家：小标签 badge

**自动轮播（桌面端可选）**：
- 3秒间隔自动切换
- 底部指示点（3个小圆点，active 加大+变色）

#### 8.4.8 `stats-section.tsx` — 数据统计

**参考**：Stripe（数字展示） + Apple（入场效果）

**数字动画 ← 创新6：位数分离翻转**：
- 每位数字独立从0翻转到位
- 像老式机械计数器，每位延迟100ms
- 非简单数字递增，而是0-9轮播后停在目标数字

**布局**：
- `grid grid-cols-2 md:grid-cols-4`
- 每格：数字（text-[36px] font-bold） + 后缀（text-[20px]） + 标签（text-[13px] secondary）
- 数字和后缀同一行，标签在下方

**入场**：scroll-driven + 数字触发

#### 8.4.9 `cta-section.tsx` — 行动召唤

**参考**：Stripe（渐变背景+发光按钮） + Apple（大字标题）

**背景**：
- 全宽渐变（from-primary/8 via-accent/5 to-primary/8）
- 顶部渐隐遮罩（与上一个Section衔接）

**按钮 ← 创新4：磁性按钮（桌面端）**：
- 大号渐变按钮（px-10 py-5, text-[16px] font-bold）
- 背景：`bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)]`
- 发光阴影：`shadow-[0_0_40px_rgba(124,141,166,0.3)]`
- hover：阴影扩大 + 光泽扫过 `::before`
- 桌面端：磁性吸附效果

#### 8.4.10 `app-footer.tsx` — 页脚

**参考**：Notion（清晰分组） + Stripe（底部品牌感）

**4列布局保持，但视觉升级**：
- Logo区域增加品牌slogan + 社交图标（微信/微博占位）
- 每列标题 `text-[12px] uppercase tracking-widest`（宽松大写标签风格）
- 链接 hover 时：颜色变 primary-light + 左移 2px（微交互）
- 底部版权：居中 + 分隔线渐变

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

### 8.5 CSS 动效与 Tailwind 扩展

> 以下 CSS 和 Tailwind 配置需新增到项目中，用于支撑 10 大设计创新。

#### 8.5.1 新增 CSS 关键帧（globals.css）

```css
/* 创新1: 渐变网格漂移 */
@keyframes gradientDrift1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(60px, -40px) scale(1.1); }
  66% { transform: translate(-30px, 30px) scale(0.95); }
}
@keyframes gradientDrift2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(-50px, 50px) scale(1.05); }
  66% { transform: translate(40px, -20px) scale(0.9); }
}
@keyframes gradientDrift3 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(30px, -60px) scale(1.15); }
}

/* 创新6: 数字位翻转 */
@keyframes digitSlide {
  0% { transform: translateY(0); }
  100% { transform: translateY(-90%); }
}

/* 创新8: 文字扫光 */
@keyframes shimmerSweep {
  0%, 100% { background-position: 200% center; }
  50% { background-position: 0% center; }
}

/* 创新10: 入场编排 */
@keyframes springInUp {
  0% { opacity: 0; transform: translateY(30px) scale(0.95); }
  60% { opacity: 1; transform: translateY(-5px) scale(1.02); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes drawLine {
  0% { stroke-dashoffset: 100; }
  100% { stroke-dashoffset: 0; }
}

@keyframes slideUp {
  0% { transform: translateY(100%); }
  100% { transform: translateY(0); }
}
```

#### 8.5.2 新增 CSS 类

```css
/* 文字扫光效果 */
.shimmer-text {
  background: linear-gradient(120deg,
    var(--color-text-primary) 0%, var(--color-text-primary) 40%,
    var(--color-primary-light) 50%,
    var(--color-text-primary) 60%, var(--color-text-primary) 100%);
  background-size: 200% 100%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: shimmerSweep 4s ease-in-out infinite;
}

/* Scroll-driven 入场 */
.scroll-reveal {
  opacity: 0; transform: translateY(30px); filter: blur(4px);
  transition: all 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.scroll-reveal[data-visible="true"] {
  opacity: 1; transform: translateY(0); filter: blur(0);
}

/* 隐藏滚动条 */
.scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
.scrollbar-none::-webkit-scrollbar { display: none; }

/* 底部弹出面板 */
.bottom-sheet {
  position: fixed; bottom: 0; left: 0; right: 0;
  max-height: 85vh;
  background: rgba(32, 38, 54, 0.96);
  backdrop-filter: blur(40px);
  border-radius: 20px 20px 0 0;
  border-top: 1px solid rgba(255,255,255,0.08);
  animation: slideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.bottom-sheet::before {
  content: ''; display: block;
  width: 36px; height: 4px; border-radius: 2px;
  background: rgba(255,255,255,0.2); margin: 12px auto;
}
```

#### 8.5.3 Tailwind 配置扩展（tailwind.config.ts）

```typescript
animation: {
  'gradient-drift-1': 'gradientDrift1 25s ease-in-out infinite',
  'gradient-drift-2': 'gradientDrift2 30s ease-in-out infinite',
  'gradient-drift-3': 'gradientDrift3 20s ease-in-out infinite',
  'digit-slide': 'digitSlide 1.5s ease-out forwards',
  'shimmer-sweep': 'shimmerSweep 4s ease-in-out infinite',
  'spring-in-up': 'springInUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
  'draw-line': 'drawLine 1s ease-out forwards',
  'slide-up': 'slideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
}
```

---

## 10. Phase 4: "我的"页面重写 ✅ 已完成

> **完成日期**: 2026-04-03
> **验证结果**: TypeScript 0 错误 / Build 通过 / 91 测试通过 / as any 0 / console.log 0

### Phase 4 实际变更

| # | 文件 | 操作 | 状态 |
|---|---|---|:---:|
| 1 | `src/app/portal/profile/page.tsx` | 完全重写：6个区块（用户信息/订单统计/工具入口/通知预览/菜单/密码） | ✅ |
| 2 | `src/app/portal/notifications/page.tsx` | 恢复为独立通知中心页面（分页+全部已读+未读标记） | ✅ |

### 9.1 重写 `src/app/portal/profile/page.tsx`

**改造前**：用户信息 + ERP入口 + 订单/通知/密码/退出菜单
**改造后**：增强版个人中心（6个区块）

**实现结构**：
```
┌─────────────────────────────────────┐
│ 用户信息卡片（GlassCard medium）      │
│ [头像] 姓名 · 角色 · 公司名  [编辑]  │
├─────────────────────────────────────┤
│ 订单快捷统计（🆕 3格并排）            │
│ [进行中 2] [已交付 1] [已完成 5]     │ ← 真实API数据，点击跳转订单
├─────────────────────────────────────┤
│ 常用工具快捷入口（🆕 3格并排）        │
│ [🗺️行程] [📝申请表] [🌐翻译]         │ ← 渐变图标+描述
├─────────────────────────────────────┤
│ 通知中心预览（🆕 最近3条）            │
│ 📬 新订单 · 2分钟前                   │ ← 未读红点+相对时间
│ 🔄 状态变更 · 1小时前                 │
│ 查看全部 →                           │
├─────────────────────────────────────┤
│ 菜单列表                             │
│ 🖥️ 后台管理（仅B端）                  │
│ 📋 我的订单（含未读数角标）            │
│ 💬 消息中心（含未读数角标）            │
│ 🔒 修改密码（展开式表单）              │
│ 🚪 退出登录（红色文字）               │
└─────────────────────────────────────┘
```

**关键实现**：
- 订单统计：并行请求3组状态计数（客户/员工分组不同），`apiFetch` 防抖
- 通知预览：`GET /api/notifications?pageSize=3`，含未读数角标 + 相对时间格式化
- 工具入口：3个渐变卡片（行程/申请表/翻译），hover浮起 + active缩放
- 通知恢复：`/portal/notifications` 从重定向恢复为完整页面（分页+全部已读）
- Skeleton加载态：3个区块独立加载，不阻塞整体渲染
- Stagger入场：6个区块依次 fadeInUp（80ms间隔）

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

## 11. Phase 5: 服务页 + 工具箱首页 ✅ 已完成

> **完成日期**: 2026-04-03
> **验证结果**: TypeScript 0 错误 / Build 通过 / 91 测试通过

### Phase 5 实际变更

| # | 文件 | 操作 | 状态 |
|---|---|---|:---:|
| 1 | `src/app/services/page.tsx` | 新建：签证服务列表页（搜索+地区筛选+12国卡片网格） | ✅ |
| 2 | `src/app/services/layout.tsx` | 新建：服务页布局（DynamicBackground + AppBottomTab） | ✅ |
| 3 | `src/app/tools/page.tsx` | 新建：工具箱聚合首页（6大工具列表卡片） | ✅ |
| 4 | `src/app/tools/layout.tsx` | 新建：工具页布局（DynamicBackground + AppBottomTab） | ✅ |

### 10.1 服务页实现

**路径**: `/services`

**结构**：
```
┌─────────────────────────────────────┐
│ ← 返回 + 标题"签证服务" + 副标题     │
├─────────────────────────────────────┤
│ 🔍 搜索国家或签证类型...             │
├─────────────────────────────────────┤
│ [全部] [亚洲] [欧洲] [北美] [大洋洲] │ ← 横向滚动Tab筛选
├─────────────────────────────────────┤
│ 共 12 个目的地                       │
├─────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐          │
│ │ 🇯🇵 日本  │ │ 🇰🇷 韩国  │          │
│ │ 单次旅游  │ │ 旅游签证  │          │
│ │ ⏰5-7天   │ │ ⏰3-5天   │          │
│ │ ¥599 起  │ │ ¥399 起  │          │
│ └──────────┘ └──────────┘          │
│ ...（12国，2列网格）                 │
└─────────────────────────────────────┘
```

**关键实现**：
- 实时搜索过滤（国家名+签证类型）
- 5个地区Tab切换（全部/亚洲/欧洲/北美/大洋洲）
- 12个国家卡片（渐变背景+国旗+出签时间+价格+hover CTA）
- Stagger入场动画
- 空结果友好提示
- 点击显示"功能开发中" toast（下单闭环 M10）

### 10.2 工具箱首页实现

**路径**: `/tools`

**关键实现**：
- Server Component（纯展示，零JS开销）
- 6个工具列表卡片（渐变图标+名称+描述+箭头）
- hover浮起 + 箭头右移微交互
- 底部"免费使用"提示卡片
- 每个工具 Link 到 `/portal/tools/xxx`

---

## 12. Phase 6: 全量验收

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

## 13. M8 成熟度评估

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

## 14. M9: 工具模块实装

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

## 15. M10: C端下单闭环

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

## 16. M11: 搜索+个性化

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

## 17. M12: 真实评价+SEO

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

## 18. 附录A: 现有文件完整清单

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

## 19. 附录B: 设计规范速查

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

## 20. 附录C: 常见问题

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

*文档结束 — C端平台化改造全知手册 V4.0（M8-M12 + 10大设计创新 + 手机端规范）*
