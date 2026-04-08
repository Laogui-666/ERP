# 华夏签证 ERP 系统 UI 全链路全方位深度改造方案

> **版本**: 1.0.0  
> **日期**: 2026-04-08  
> **目标**: 全面升级为液态玻璃风格 + 莫兰迪冷色调 + 弹簧物理动画  
> **优先级**: 功能完整性 > 视觉美观 > 性能优化

---

## 目录

1. [项目现状深度分析](#1-项目现状深度分析)
2. [改造核心原则](#2-改造核心原则)
3. [技术架构方案](#3-技术架构方案)
4. [分阶段实施计划](#4-分阶段实施计划)
5. [组件库改造方案](#5-组件库改造方案)
6. [页面重构方案](#6-页面重构方案)
7. [样式系统迁移](#7-样式系统迁移)
8. [动画系统实现](#8-动画系统实现)
9. [测试验证方案](#9-测试验证方案)
10. [风险管控与回滚](#10-风险管控与回滚)

---

## 1. 项目现状深度分析

### 1.1 当前技术栈

| 层级 | 技术 | 版本 | 状态 |
|------|------|------|------|
| 框架 | Next.js | 15.5.14 | ✅ 最新 |
| React | React | 19.2.4 | ✅ 最新 |
| 样式 | Tailwind CSS | 3.4.16 | ✅ 兼容 |
| 动画 | CSS + 原生 | - | ⚠️ 需升级 |
| 组件 | 自定义 | - | ⚠️ 需重构 |

### 1.2 现有设计系统问题

**颜色系统**
- 使用传统蓝色主色调 (`#3B82F6`)
- 缺乏液态玻璃专用色
- 深色模式支持不完整

**组件系统**
- 基础组件过于简单
- 缺乏液态玻璃效果
- 动画效果单一

**布局系统**
- 传统侧边栏布局
- 缺少响应式优化
- 移动端体验待提升

### 1.3 核心页面清单

```
src/app/
├── (auth)/                    # 认证页面
│   ├── login/page.tsx         # 登录页
│   ├── register/page.tsx      # 注册页
│   └── reset-password/page.tsx # 重置密码
├── admin/                     # 管理端
│   ├── dashboard/page.tsx     # 仪表盘
│   ├── orders/page.tsx        # 订单列表
│   ├── orders/[id]/page.tsx   # 订单详情
│   ├── pool/page.tsx          # 公共池
│   ├── workspace/page.tsx     # 工作台
│   ├── templates/page.tsx     # 签证模板
│   ├── team/page.tsx          # 团队管理
│   ├── analytics/page.tsx     # 数据统计
│   └── settings/page.tsx      # 设置
├── customer/                  # 客户端
│   ├── orders/page.tsx        # 我的订单
│   ├── orders/[id]/page.tsx   # 订单详情
│   ├── chat/page.tsx          # 聊天
│   ├── notifications/page.tsx # 通知
│   └── profile/page.tsx       # 个人资料
├── portal/                    # 门户
│   ├── page.tsx               # 首页
│   ├── tools/page.tsx         # 工具中心
│   └── ...
└── api/                       # API路由
```

---

## 2. 改造核心原则

### 2.1 设计原则

1. **液态玻璃优先**: 所有卡片、按钮、输入框采用液态玻璃效果
2. **莫兰迪色调**: 全面替换为低饱和度冷色调
3. **弹簧动画**: 所有交互添加物理弹簧动画
4. **移动优先**: 默认移动端样式，渐进增强桌面端
5. **渐进式改造**: 逐页面改造，确保功能连续性

### 2.2 技术原则

1. **向后兼容**: 保留原有API和功能逻辑
2. **组件复用**: 最大化复用现有业务逻辑
3. **样式隔离**: 新样式与旧样式完全隔离
4. **性能优先**: 动画使用GPU加速，避免重排

### 2.3 颜色映射表

| 旧颜色 | 新颜色 | 用途 |
|--------|--------|------|
| `#3B82F6` (primary) | `#5B7B7A` (liquid-ocean) | 主色调 |
| `#10B981` (success) | `#078a52` | 成功状态 |
| `#F59E0B` (warning) | `#fbbd41` | 警告状态 |
| `#EF4444` (error) | `#ff385c` | 错误状态 |
| `#111827` (text) | `#1A262E` | 主要文字 |
| `#4B5563` (secondary) | `#6A7A7A` | 次要文字 |
| `#FFFFFF` (bg) | `#F0F4F7` | 页面背景 |
| `#F9FAFB` (bg-secondary) | `#E5EBEF` | 卡片背景 |

---

## 3. 技术架构方案

### 3.1 新设计系统架构

```
src/design-system/
├── theme/
│   ├── colors.ts              # 颜色系统
│   ├── typography.ts          # 字体系统
│   ├── spacing.ts             # 间距系统
│   ├── shadows.ts             # 阴影系统
│   └── animations.ts          # 动画配置
├── components/
│   ├── liquid-button.tsx      # 液态按钮
│   ├── liquid-card.tsx        # 液态卡片
│   ├── liquid-input.tsx       # 液态输入框
│   ├── liquid-modal.tsx       # 液态模态框
│   ├── liquid-select.tsx      # 液态选择器
│   ├── liquid-badge.tsx       # 液态徽章
│   ├── liquid-avatar.tsx      # 液态头像
│   ├── liquid-skeleton.tsx    # 液态骨架屏
│   └── liquid-toast.tsx       # 液态通知
├── hooks/
│   ├── use-liquid-animation.ts # 动画钩子
│   └── use-liquid-theme.ts     # 主题钩子
└── utils/
    └── liquid-utils.ts        # 工具函数
```

### 3.2 Tailwind 配置升级

```typescript
// tailwind.config.ts 关键更新
{
  theme: {
    extend: {
      colors: {
        liquid: {
          ocean: '#5B7B7A',
          oceanLight: '#7FA0A0',
          sand: '#A8B8B8',
          mist: '#6A7A7A',
          clay: '#6A6D6D',
          blush: '#C4CCD6',
          deep: '#1A262E',
          light: '#F0F4F7',
          cream: '#E5EBEF',
          steel: '#4A5A63',
          silver: '#8A9AA7',
        }
      },
      boxShadow: {
        'liquid-soft': [
          '0 2px 8px rgba(0, 0, 0, 0.04)',
          '0 1px 2px rgba(0, 0, 0, 0.06)',
        ],
        'liquid-medium': [
          '0 8px 24px rgba(0, 0, 0, 0.08)',
          '0 2px 8px rgba(0, 0, 0, 0.04)',
        ],
        'liquid-strong': [
          '0 16px 48px rgba(0, 0, 0, 0.12)',
          '0 4px 16px rgba(0, 0, 0, 0.08)',
        ],
        'liquid-glow': [
          '0 0 0 1px rgba(255, 255, 255, 0.5) inset',
          '0 8px 32px rgba(0, 0, 0, 0.10)',
        ],
      },
      backdropBlur: {
        'liquid': '20px',
        'liquid-sm': '12px',
        'liquid-lg': '28px',
      },
      borderRadius: {
        'liquid': '1.75rem',
        'liquid-sm': '1.25rem',
        'liquid-lg': '2.25rem',
      }
    }
  }
}
```

### 3.3 动画系统配置

```typescript
// src/design-system/theme/animations.ts
export const liquidSpringConfig = {
  gentle: { type: 'spring', stiffness: 350, damping: 25, mass: 1 },
  medium: { type: 'spring', stiffness: 450, damping: 30, mass: 1 },
  snappy: { type: 'spring', stiffness: 550, damping: 35, mass: 0.8 },
  bouncy: { type: 'spring', stiffness: 450, damping: 18, mass: 1 },
  liquid: { type: 'spring', stiffness: 400, damping: 28, mass: 0.9 },
};

export const liquidEasing = {
  standard: [0.4, 0, 0.2, 1],
  easeIn: [0.4, 0, 1, 1],
  easeOut: [0, 0, 0.2, 1],
  smooth: [0.25, 0.1, 0.25, 1],
};
```

---

## 4. 分阶段实施计划

### 阶段一：基础架构搭建 (第1-2天)

**目标**: 建立新设计系统基础

#### 4.1.1 更新配置文件

```bash
# 1. 备份现有配置
cp tailwind.config.ts tailwind.config.ts.backup
cp src/shared/styles/globals.css src/shared/styles/globals.css.backup

# 2. 更新 tailwind.config.ts
# 添加 liquid 颜色、阴影、圆角、模糊配置

# 3. 创建新全局样式
# src/shared/styles/liquid-globals.css
```

#### 4.1.2 创建核心组件

```typescript
// src/design-system/components/liquid-button.tsx
// src/design-system/components/liquid-card.tsx
// src/design-system/components/liquid-input.tsx
// src/design-system/components/liquid-modal.tsx
```

#### 4.1.3 创建动画工具

```typescript
// src/design-system/hooks/use-liquid-animation.ts
// src/design-system/theme/animations.ts
```

**验收标准**:
- [ ] Tailwind 配置成功更新
- [ ] 新全局样式正常加载
- [ ] 核心组件可在页面中使用
- [ ] 动画系统正常工作

---

### 阶段二：认证页面改造 (第3-4天)

**目标**: 完成登录、注册、重置密码页面

#### 4.2.1 登录页面改造

**改造前**:
```tsx
// 现有登录页面使用传统样式
<div className="flex min-h-screen items-center justify-center px-4">
  <div className="w-full max-w-[400px]">
    <div className="glass-card p-7 md:p-8">...</div>
  </div>
</div>
```

**改造后**:
```tsx
// 新登录页面使用液态玻璃风格
<div className="min-h-screen flex items-center justify-center px-4 bg-liquid-light">
  <LiquidCard 
    variant="liquid-elevated" 
    liquidIntensity="strong"
    padding="xl"
    className="w-full max-w-[420px]"
  >
    {/* 登录表单 */}
  </LiquidCard>
</div>
```

**改造清单**:
- [ ] 登录页面布局重构
- [ ] 登录表单组件替换
- [ ] 添加弹簧入场动画
- [ ] 移动端适配优化
- [ ] 表单验证样式更新

#### 4.2.2 注册页面改造

**改造清单**:
- [ ] 注册表单布局重构
- [ ] 步骤指示器液态化
- [ ] 表单字段动画效果
- [ ] 错误提示样式更新

#### 4.2.3 重置密码页面改造

**改造清单**:
- [ ] 重置密码表单重构
- [ ] 成功状态动画
- [ ] 邮件发送提示样式

**验收标准**:
- [ ] 所有认证页面正常访问
- [ ] 表单功能完整
- [ ] 动画效果流畅
- [ ] 移动端显示正常

---

### 阶段三：管理端布局改造 (第5-7天)

**目标**: 完成侧边栏、顶部栏、布局框架

#### 4.3.1 侧边栏改造

**改造前**:
```tsx
<aside className="fixed left-0 top-0 h-full w-64 z-40 flex flex-col bg-background/80 backdrop-blur-md border-r border-border">
  {/* 传统侧边栏 */}
</aside>
```

**改造后**:
```tsx
<LiquidSidebar 
  variant="liquid"
  liquidIntensity="medium"
  collapsible={true}
  className="fixed left-0 top-0 h-full w-64 z-40"
>
  {/* 液态玻璃侧边栏 */}
</LiquidSidebar>
```

**改造清单**:
- [ ] 侧边栏容器液态化
- [ ] 导航项悬停动画
- [ ] 激活状态指示器
- [ ] 折叠/展开动画
- [ ] 移动端抽屉模式

#### 4.3.2 顶部栏改造

**改造清单**:
- [ ] 顶部栏液态玻璃效果
- [ ] 通知铃铛动画
- [ ] 用户菜单下拉
- [ ] 面包屑导航样式

#### 4.3.3 布局框架改造

**改造清单**:
- [ ] 主内容区域背景
- [ ] 页面切换动画
- [ ] 加载状态骨架屏
- [ ] 错误边界样式

**验收标准**:
- [ ] 侧边栏正常显示和交互
- [ ] 顶部栏功能完整
- [ ] 布局响应式正常
- [ ] 页面切换流畅

---

### 阶段四：仪表盘页面改造 (第8-10天)

**目标**: 完成数据卡片、图表、快捷入口

#### 4.4.1 数据卡片改造

**改造清单**:
- [ ] 统计卡片液态化
- [ ] 数字滚动动画
- [ ] 趋势指示器样式
- [ ] 卡片悬停效果

#### 4.4.2 图表区域改造

**改造清单**:
- [ ] 图表容器液态化
- [ ] 图表颜色更新
- [ ] 加载状态样式
- [ ] 空状态样式

#### 4.4.3 快捷入口改造

**改造清单**:
- [ ] 快捷入口卡片液态化
- [ ] 图标动画效果
- [ ] 悬停交互反馈

**验收标准**:
- [ ] 数据展示正常
- [ ] 图表渲染正常
- [ ] 动画效果流畅
- [ ] 响应式布局正常

---

### 阶段五：订单管理页面改造 (第11-14天)

**目标**: 完成订单列表、订单详情、筛选器

#### 4.5.1 订单列表改造

**改造清单**:
- [ ] 列表容器液态化
- [ ] 表格行悬停效果
- [ ] 状态标签样式
- [ ] 分页器样式
- [ ] 批量操作栏

#### 4.5.2 订单详情改造

**改造清单**:
- [ ] 详情卡片液态化
- [ ] 时间线组件样式
- [ ] 申请人信息卡片
- [ ] 资料审核区域
- [ ] 聊天面板样式

#### 4.5.3 筛选器改造

**改造清单**:
- [ ] 筛选面板液态化
- [ ] 日期选择器样式
- [ ] 下拉选择器样式
- [ ] 搜索框样式

**验收标准**:
- [ ] 订单列表正常显示
- [ ] 筛选功能正常
- [ ] 详情页面完整
- [ ] 所有交互正常

---

### 阶段六：工作台页面改造 (第15-17天)

**目标**: 完成我的工作台、公共池

#### 4.6.1 我的工作台改造

**改造清单**:
- [ ] 待办事项卡片
- [ ] 快捷操作按钮
- [ ] 最近订单列表
- [ ] 通知提醒区域

#### 4.6.2 公共池改造

**改造清单**:
- [ ] 订单卡片液态化
- [ ] 抢单按钮动画
- [ ] 实时更新提示
- [ ] 空状态样式

**验收标准**:
- [ ] 工作台功能完整
- [ ] 公共池交互正常
- [ ] 实时更新正常

---

### 阶段七：客户端页面改造 (第18-20天)

**目标**: 完成客户门户所有页面

#### 4.7.1 客户订单页面改造

**改造清单**:
- [ ] 订单列表液态化
- [ ] 订单状态展示
- [ ] 资料上传区域
- [ ] 进度指示器

#### 4.7.2 客户聊天页面改造

**改造清单**:
- [ ] 聊天界面液态化
- [ ] 消息气泡样式
- [ ] 输入框样式
- [ ] 文件发送样式

#### 4.7.3 客户个人资料改造

**改造清单**:
- [ ] 资料卡片液态化
- [ ] 表单字段样式
- [ ] 头像上传样式

**验收标准**:
- [ ] 客户端页面正常
- [ ] 客户功能完整
- [ ] 移动端适配良好

---

### 阶段八：门户页面改造 (第21-23天)

**目标**: 完成首页、工具中心

#### 4.8.1 首页改造

**改造清单**:
- [ ] Hero区域液态化
- [ ] 服务卡片液态化
- [ ] 统计数据动画
- [ ] 合作伙伴展示

#### 4.8.2 工具中心改造

**改造清单**:
- [ ] 工具卡片液态化
- [ ] 工具图标动画
- [ ] 工具使用界面

**验收标准**:
- [ ] 首页展示正常
- [ ] 工具功能完整
- [ ] 动画效果流畅

---

### 阶段九：优化与测试 (第24-26天)

**目标**: 性能优化、全面测试

#### 4.9.1 性能优化

**优化清单**:
- [ ] 图片懒加载
- [ ] 组件按需加载
- [ ] 动画性能优化
- [ ] 缓存策略优化

#### 4.9.2 全面测试

**测试清单**:
- [ ] 功能测试
- [ ] 兼容性测试
- [ ] 性能测试
- [ ] 无障碍测试

**验收标准**:
- [ ] 所有功能正常
- [ ] 性能指标达标
- [ ] 无明显bug

---

### 阶段十：上线与监控 (第27-30天)

**目标**: 部署上线、监控反馈

#### 4.10.1 部署上线

**上线清单**:
- [ ] 生产环境部署
- [ ] 回滚方案准备
- [ ] 用户通知

#### 4.10.2 监控反馈

**监控清单**:
- [ ] 错误监控
- [ ] 性能监控
- [ ] 用户反馈收集
- [ ] 问题修复

---

## 5. 组件库改造方案

### 5.1 LiquidButton 组件

```typescript
// src/design-system/components/liquid-button.tsx
'use client';

import { forwardRef, ButtonHTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@shared/lib/utils';
import { liquidSpringConfig } from '../theme/animations';

interface LiquidButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'liquid' | 'liquid-fill';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  width?: 'full' | 'auto' | 'fixed';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  withGlow?: boolean;
}

const LiquidButton = forwardRef<HTMLButtonElement, LiquidButtonProps>(
  ({ 
    children, 
    variant = 'primary', 
    size = 'md', 
    width = 'auto',
    isLoading = false,
    leftIcon,
    rightIcon,
    withGlow = true,
    className,
    disabled,
    ...props 
  }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-semibold transition-all duration-300 focus:outline-none relative overflow-hidden';

    const variants = {
      primary: 'bg-liquid-ocean text-white hover:bg-liquid-ocean/90 active:bg-liquid-ocean/80',
      secondary: 'bg-liquid-sand text-liquid-deep hover:bg-liquid-sand/90 active:bg-liquid-sand/80',
      ghost: 'bg-transparent text-liquid-deep hover:bg-liquid-cream active:bg-liquid-cream/80',
      liquid: 'bg-white/60 backdrop-blur-xl border border-white/50 text-liquid-deep hover:bg-white/70 active:bg-white/65',
      'liquid-fill': 'bg-white/75 backdrop-blur-2xl border border-white/60 text-liquid-deep hover:bg-white/85 active:bg-white/80',
    };

    const glowStyles = withGlow ? {
      primary: 'shadow-[0_0_0_1px_rgba(255,255,255,0.2)_inset,0_8px_24px_rgba(91,123,122,0.25)]',
      liquid: 'shadow-liquid-glow',
      'liquid-fill': 'shadow-liquid-glow',
    } : {};

    const sizes = {
      sm: 'px-5 py-3 text-sm md:py-2.5',
      md: 'px-7 py-4 text-base md:py-3.5',
      lg: 'px-9 py-5 text-lg md:py-4.5',
      xl: 'px-11 py-6 text-xl md:py-5.5',
    };

    const radius = {
      sm: 'rounded-2xl',
      md: 'rounded-3xl',
      lg: 'rounded-3xl',
      xl: 'rounded-3xl',
    };

    const widthStyles = {
      full: 'w-full md:w-auto',
      auto: 'w-auto',
      fixed: 'w-full',
    };

    return (
      <motion.button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          glowStyles[variant as keyof typeof glowStyles],
          sizes[size],
          radius[size],
          widthStyles[width],
          (disabled || isLoading) && 'opacity-50 cursor-not-allowed',
          className
        )}
        disabled={disabled || isLoading}
        whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.97 }}
        transition={liquidSpringConfig.liquid}
        {...props}
      >
        {/* 光泽效果层 */}
        {(variant === 'liquid' || variant === 'liquid-fill') && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-t-[inherit]" />
          </div>
        )}

        <div className="relative z-10 flex items-center">
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>加载中...</span>
            </>
          ) : (
            <>
              {leftIcon && <span className="mr-2">{leftIcon}</span>}
              {children}
              {rightIcon && <span className="ml-2">{rightIcon}</span>}
            </>
          )}
        </div>
      </motion.button>
    );
  }
);

LiquidButton.displayName = 'LiquidButton';
export { LiquidButton };
```

### 5.2 LiquidCard 组件

```typescript
// src/design-system/components/liquid-card.tsx
'use client';

import { forwardRef, HTMLAttributes } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@shared/lib/utils';
import { liquidSpringConfig } from '../theme/animations';

interface LiquidCardProps extends HTMLMotionProps<'div'> {
  variant?: 'liquid' | 'solid' | 'outlined' | 'liquid-elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hoverable?: boolean;
  liquidIntensity?: 'light' | 'medium' | 'strong' | 'ultra';
  withGloss?: boolean;
  withBorder?: boolean;
}

const LiquidCard = forwardRef<HTMLDivElement, LiquidCardProps>(
  ({ 
    children, 
    variant = 'liquid', 
    padding = 'md', 
    hoverable = false,
    liquidIntensity = 'medium',
    withGloss = true,
    withBorder = true,
    className,
    ...props 
  }, ref) => {
    const baseStyles = 'transition-all duration-400 relative overflow-hidden';

    const intensityConfig = {
      light: {
        bg: 'bg-white/45',
        blur: 'backdrop-blur-lg',
        border: 'border-white/35',
        shadow: 'shadow-liquid-soft',
      },
      medium: {
        bg: 'bg-white/60',
        blur: 'backdrop-blur-xl',
        border: 'border-white/50',
        shadow: 'shadow-liquid-medium',
      },
      strong: {
        bg: 'bg-white/72',
        blur: 'backdrop-blur-2xl',
        border: 'border-white/60',
        shadow: 'shadow-liquid-strong',
      },
      ultra: {
        bg: 'bg-white/80',
        blur: 'backdrop-blur-3xl',
        border: 'border-white/70',
        shadow: 'shadow-liquid-glow',
      },
    };

    const config = intensityConfig[liquidIntensity];

    const variants = {
      liquid: cn(
        config.bg,
        config.blur,
        withBorder && config.border,
        config.shadow
      ),
      'liquid-elevated': cn(
        config.bg,
        config.blur,
        withBorder && config.border,
        'shadow-liquid-glow',
        'transform-gpu'
      ),
      solid: 'bg-white shadow-liquid-medium',
      outlined: 'bg-transparent border border-liquid-silver/30',
    };

    const paddings = {
      none: '',
      sm: 'p-5',
      md: 'p-6',
      lg: 'p-8',
      xl: 'p-10',
    };

    const hoverStyles = hoverable
      ? 'cursor-pointer hover:scale-[1.02] hover:-translate-y-1 hover:shadow-liquid-strong active:scale-[0.99]'
      : '';

    return (
      <motion.div
        ref={ref}
        className={cn(
          baseStyles,
          'rounded-liquid',
          variants[variant],
          paddings[padding],
          hoverStyles,
          className
        )}
        initial={hoverable ? { y: 0 } : undefined}
        whileHover={hoverable ? { y: -6, scale: 1.02 } : undefined}
        transition={liquidSpringConfig.liquid}
        {...props}
      >
        {/* 顶部光泽效果 */}
        {(variant === 'liquid' || variant === 'liquid-elevated') && withGloss && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 right-0 h-2/5 bg-gradient-to-b from-white/30 via-white/10 to-transparent rounded-t-liquid" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          </div>
        )}

        {/* 内容层 */}
        <div className="relative z-10">
          {children}
        </div>
      </motion.div>
    );
  }
);

LiquidCard.displayName = 'LiquidCard';

const LiquidCardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} className={cn('mb-5', className)} {...props}>{children}</div>
  )
);
LiquidCardHeader.displayName = 'LiquidCardHeader';

const LiquidCardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} className={cn('', className)} {...props}>{children}</div>
  )
);
LiquidCardContent.displayName = 'LiquidCardContent';

const LiquidCardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} className={cn('mt-5 pt-5 border-t border-white/20', className)} {...props}>{children}</div>
  )
);
LiquidCardFooter.displayName = 'LiquidCardFooter';

export { LiquidCard, LiquidCardHeader, LiquidCardContent, LiquidCardFooter };
```

### 5.3 LiquidInput 组件

```typescript
// src/design-system/components/liquid-input.tsx
'use client';

import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@shared/lib/utils';

interface LiquidInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'liquid' | 'solid';
}

const LiquidInput = forwardRef<HTMLInputElement, LiquidInputProps>(
  ({ 
    label, 
    error, 
    helperText, 
    leftIcon,
    rightIcon,
    variant = 'liquid',
    className,
    id,
    ...props 
  }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    const baseStyles = 'w-full px-5 py-4 md:py-3.5 rounded-3xl transition-all duration-300 focus:outline-none text-base md:text-sm';

    const variants = {
      liquid: 'bg-white/55 backdrop-blur-xl border border-white/50 focus:bg-white/70 focus:border-liquid-ocean/60 hover:border-liquid-ocean/40 shadow-liquid-soft focus:shadow-liquid-medium',
      solid: 'bg-white border border-liquid-silver/30 focus:border-liquid-ocean focus:shadow-liquid-medium',
    };

    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={inputId}
            className="block text-sm font-semibold text-liquid-deep mb-2"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-liquid-mist">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              baseStyles,
              variants[variant],
              leftIcon && 'pl-14',
              rightIcon && 'pr-14',
              error && 'border-red-400/60 focus:border-red-500 animate-shake',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-liquid-mist">
              {rightIcon}
            </span>
          )}
        </div>
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        {helperText && !error && (
          <p className="mt-2 text-sm text-liquid-mist">{helperText}</p>
        )}
      </div>
    );
  }
);

LiquidInput.displayName = 'LiquidInput';
export { LiquidInput };
```

---

## 6. 页面重构方案

### 6.1 登录页面重构

```typescript
// src/app/(auth)/login/page.tsx (改造后)
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { LiquidCard } from '@design-system/components/liquid-card';
import { LiquidButton } from '@design-system/components/liquid-button';
import { LiquidInput } from '@design-system/components/liquid-input';
import { liquidSpringConfig } from '@design-system/theme/animations';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    // 原有登录逻辑保持不变
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-liquid-light via-liquid-cream to-liquid-blush">
      {/* 背景装饰 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-liquid-ocean/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-liquid-blush/20 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={liquidSpringConfig.gentle}
        className="relative z-10 w-full max-w-[420px]"
      >
        {/* Logo区域 */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...liquidSpringConfig.gentle, delay: 0.1 }}
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-liquid-ocean flex items-center justify-center shadow-lg shadow-liquid-ocean/25">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-liquid-deep mb-2">华夏签证</h1>
          <p className="text-liquid-mist">一站式签证服务平台</p>
        </motion.div>

        {/* 登录表单 */}
        <LiquidCard 
          variant="liquid-elevated" 
          liquidIntensity="strong"
          padding="xl"
        >
          <form onSubmit={handleLogin} className="space-y-6">
            <LiquidInput
              label="用户名"
              placeholder="请输入用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              leftIcon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
            />

            <LiquidInput
              label="密码"
              type="password"
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
            />

            {error && (
              <motion.div 
                className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={liquidSpringConfig.snappy}
              >
                {error}
              </motion.div>
            )}

            <LiquidButton 
              type="submit" 
              variant="primary" 
              size="lg" 
              width="full"
              isLoading={loading}
              withGlow
            >
              登录
            </LiquidButton>
          </form>

          <div className="mt-6 text-center">
            <a href="/register" className="text-sm text-liquid-ocean hover:text-liquid-oceanLight transition-colors">
              还没有账号？立即注册
            </a>
          </div>
        </LiquidCard>

        <p className="mt-8 text-center text-xs text-liquid-silver">
          华夏签证 © 2026 · 专业签证服务
        </p>
      </motion.div>
    </div>
  );
}
```

### 6.2 侧边栏重构

```typescript
// src/modules/erp/components/layout/liquid-sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@shared/hooks/use-auth';
import { cn } from '@shared/lib/utils';
import { liquidSpringConfig } from '@design-system/theme/animations';
import type { UserRole } from '@shared/types/user';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  // 原有导航项保持不变
];

interface LiquidSidebarProps {
  className?: string;
}

export function LiquidSidebar({ className }: LiquidSidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const visibleItems = NAV_ITEMS.filter(
    (item) => user?.role && item.roles.includes(user.role as UserRole)
  );

  return (
    <motion.aside 
      className={cn(
        "fixed left-0 top-0 h-full w-64 z-40 flex flex-col",
        "bg-white/60 backdrop-blur-xl border-r border-white/50",
        "shadow-liquid-medium",
        className
      )}
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={liquidSpringConfig.gentle}
    >
      {/* 顶部光泽效果 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/40 via-white/10 to-transparent" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
      </div>

      {/* Logo */}
      <div className="relative z-10 h-16 flex items-center px-6 border-b border-white/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-liquid-ocean flex items-center justify-center shadow-lg shadow-liquid-ocean/25">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <span className="text-lg font-bold text-liquid-deep">华夏签证</span>
        </div>
      </div>

      {/* 导航 */}
      <nav className="relative z-10 flex-1 mt-4 px-3 space-y-1 overflow-y-auto">
        {visibleItems.map((item, index) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...liquidSpringConfig.medium, delay: index * 0.05 }}
            >
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-2xl transition-all duration-300',
                  isActive
                    ? 'bg-liquid-ocean/10 text-liquid-ocean shadow-liquid-soft'
                    : 'text-liquid-mist hover:bg-white/50 hover:text-liquid-deep'
                )}
              >
                <span className={cn(
                  'transition-colors duration-300',
                  isActive ? 'text-liquid-ocean' : 'text-liquid-mist'
                )}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
                {isActive && (
                  <motion.div 
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-liquid-ocean"
                    layoutId="activeIndicator"
                    transition={liquidSpringConfig.snappy}
                  />
                )}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* 底部用户信息 */}
      <div className="relative z-10 p-4 border-t border-white/30">
        <div className="bg-white/40 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/40 shadow-liquid-soft">
          <div className="text-xs text-liquid-mist mb-2 tracking-wide uppercase">
            {user?.company?.name ?? '未关联公司'}
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-liquid-ocean/10 flex items-center justify-center text-sm font-semibold text-liquid-ocean border border-white/50">
              {user?.realName?.[0] ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-liquid-deep font-medium truncate">{user?.realName ?? '未知'}</div>
              <div className="text-xs text-liquid-mist">{user?.role}</div>
            </div>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
```

---

## 7. 样式系统迁移

### 7.1 全局样式更新

```css
/* src/shared/styles/liquid-globals.css */

/* ============================================================
   华夏签证 ERP - 液态玻璃设计系统
   ============================================================ */

:root {
  /* 莫兰迪冷色调 */
  --liquid-ocean: #5B7B7A;
  --liquid-ocean-light: #7FA0A0;
  --liquid-sand: #A8B8B8;
  --liquid-mist: #6A7A7A;
  --liquid-clay: #6A6D6D;
  --liquid-blush: #C4CCD6;
  --liquid-deep: #1A262E;
  --liquid-light: #F0F4F7;
  --liquid-cream: #E5EBEF;
  --liquid-steel: #4A5A63;
  --liquid-silver: #8A9AA7;

  /* 液态玻璃专用色 */
  --liquid-primary: rgba(255, 255, 255, 0.72);
  --liquid-secondary: rgba(255, 255, 255, 0.56);
  --liquid-tertiary: rgba(255, 255, 255, 0.40);
  --liquid-border-primary: rgba(255, 255, 255, 0.5);
  --liquid-border-secondary: rgba(255, 255, 255, 0.35);
  --liquid-gloss: rgba(255, 255, 255, 0.25);
  --liquid-shadow-soft: rgba(0, 0, 0, 0.04);
  --liquid-shadow-medium: rgba(0, 0, 0, 0.08);
  --liquid-shadow-strong: rgba(0, 0, 0, 0.12);

  /* 功能色 */
  --liquid-success: #078a52;
  --liquid-warning: #fbbd41;
  --liquid-error: #ff385c;
  --liquid-info: #3bd3fd;

  /* 间距系统 - 8pt grid */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;

  /* 圆角 */
  --radius-sm: 0.75rem;
  --radius-md: 1rem;
  --radius-lg: 1.5rem;
  --radius-xl: 1.75rem;
  --radius-2xl: 2rem;
  --radius-3xl: 2.5rem;
  --radius-full: 9999px;

  /* 字体大小 */
  --text-xs: 12px;
  --text-sm: 14px;
  --text-base: 16px;
  --text-lg: 18px;
  --text-xl: 20px;
  --text-2xl: 24px;
  --text-3xl: 30px;
  --text-4xl: 36px;

  /* 行高 */
  --leading-tight: 1.25;
  --leading-snug: 1.375;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;

  /* 字重 */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
}

/* 全局基础 */
body {
  background-color: var(--liquid-light);
  color: var(--liquid-deep);
  font-family: 'Inter', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  line-height: var(--leading-normal);
}

/* 滚动条美化 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--liquid-cream);
  border-radius: var(--radius-full);
}

::-webkit-scrollbar-thumb {
  background: var(--liquid-silver);
  border-radius: var(--radius-full);
  border: 2px solid var(--liquid-cream);
}

::-webkit-scrollbar-thumb:hover {
  background: var(--liquid-mist);
}

/* 文字选择 */
::selection {
  background: var(--liquid-ocean);
  color: white;
}

/* 液态玻璃基础类 */
.liquid-glass {
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.5) inset,
    0 8px 32px rgba(0, 0, 0, 0.10),
    0 2px 8px rgba(0, 0, 0, 0.04);
}

.liquid-glass-light {
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.35);
}

.liquid-glass-strong {
  background: rgba(255, 255, 255, 0.80);
  backdrop-filter: blur(28px);
  -webkit-backdrop-filter: blur(28px);
  border: 1px solid rgba(255, 255, 255, 0.60);
}

/* 光泽效果 */
.liquid-gloss::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 40%;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.3),
    rgba(255, 255, 255, 0.1),
    transparent
  );
  border-radius: inherit;
  pointer-events: none;
}

/* 动画关键帧 */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(91, 123, 122, 0.3); }
  50% { box-shadow: 0 0 0 12px rgba(91, 123, 122, 0); }
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-6px); }
  40% { transform: translateX(6px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
}

/* 动画工具类 */
.animate-float {
  animation: float 8s ease-in-out infinite;
}

.animate-pulse-glow {
  animation: pulse-glow 2.5s ease-in-out infinite;
}

.animate-shimmer {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.03) 25%,
    rgba(255, 255, 255, 0.07) 50%,
    rgba(255, 255, 255, 0.03) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.8s ease-in-out infinite;
}

.animate-shake {
  animation: shake 0.4s ease-in-out;
}
```

---

## 8. 动画系统实现

### 8.1 动画配置

```typescript
// src/design-system/theme/animations.ts

export const liquidSpringConfig = {
  gentle: {
    type: 'spring' as const,
    stiffness: 350,
    damping: 25,
    mass: 1,
  },
  medium: {
    type: 'spring' as const,
    stiffness: 450,
    damping: 30,
    mass: 1,
  },
  snappy: {
    type: 'spring' as const,
    stiffness: 550,
    damping: 35,
    mass: 0.8,
  },
  bouncy: {
    type: 'spring' as const,
    stiffness: 450,
    damping: 18,
    mass: 1,
  },
  liquid: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 28,
    mass: 0.9,
  },
};

export const liquidEasing = {
  standard: [0.4, 0, 0.2, 1],
  easeIn: [0.4, 0, 1, 1],
  easeOut: [0, 0, 0.2, 1],
  smooth: [0.25, 0.1, 0.25, 1],
};

export const liquidDurations = {
  fast: 0.15,
  normal: 0.3,
  slow: 0.5,
  slower: 0.7,
};
```

### 8.2 动画钩子

```typescript
// src/design-system/hooks/use-liquid-animation.ts

import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';

export function useLiquidAnimation(options?: {
  threshold?: number;
  triggerOnce?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, {
    once: options?.triggerOnce ?? true,
    amount: options?.threshold ?? 0.3,
  });

  return { ref, isInView };
}

export function useLiquidStagger(itemCount: number, baseDelay: number = 0.1) {
  return Array.from({ length: itemCount }, (_, i) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: {
      delay: i * baseDelay,
      type: 'spring',
      stiffness: 400,
      damping: 30,
    },
  }));
}

export function useLiquidHover() {
  const [isHovered, setIsHovered] = useState(false);

  return {
    isHovered,
    hoverProps: {
      onMouseEnter: () => setIsHovered(true),
      onMouseLeave: () => setIsHovered(false),
    },
  };
}
```

---

## 9. 测试验证方案

### 9.1 功能测试清单

#### 认证功能
- [ ] 登录功能正常
- [ ] 注册功能正常
- [ ] 密码重置功能正常
- [ ] 角色跳转正确

#### 订单管理
- [ ] 订单列表显示正常
- [ ] 订单筛选功能正常
- [ ] 订单详情页正常
- [ ] 订单状态更新正常

#### 资料管理
- [ ] 资料上传正常
- [ ] 资料审核正常
- [ ] 文件预览正常

#### 聊天功能
- [ ] 实时聊天正常
- [ ] 消息发送正常
- [ ] 文件传输正常

### 9.2 视觉测试清单

#### 颜色系统
- [ ] 所有颜色正确显示
- [ ] 液态玻璃效果正常
- [ ] 深色模式正常（如支持）

#### 布局系统
- [ ] 响应式布局正常
- [ ] 移动端显示正常
- [ ] 桌面端显示正常

#### 动画系统
- [ ] 入场动画正常
- [ ] 悬停动画正常
- [ ] 页面切换动画正常

### 9.3 性能测试清单

- [ ] 首屏加载时间 < 3s
- [ ] 交互响应时间 < 100ms
- [ ] 动画帧率 > 60fps
- [ ] 内存占用正常

---

## 10. 风险管控与回滚

### 10.1 风险识别

| 风险 | 可能性 | 影响 | 应对措施 |
|------|--------|------|----------|
| 功能回归 | 中 | 高 | 完整测试覆盖 |
| 性能下降 | 低 | 中 | 性能监控 |
| 兼容性问题 | 低 | 中 | 多浏览器测试 |
| 用户不适应 | 中 | 低 | 渐进式发布 |

### 10.2 回滚方案

#### 代码回滚
```bash
# 1. 回滚到上一个稳定版本
git revert HEAD
git push origin main

# 2. 重新部署
npm run build
npm run deploy
```

#### 配置回滚
```bash
# 1. 恢复配置文件
cp tailwind.config.ts.backup tailwind.config.ts
cp src/shared/styles/globals.css.backup src/shared/styles/globals.css

# 2. 重新构建
npm run build
```

### 10.3 监控指标

- 错误率 < 0.1%
- 页面加载时间 < 3s
- 用户满意度 > 90%
- 功能可用性 = 100%

---

## 附录

### A. 文件变更清单

#### 配置文件
- [ ] `tailwind.config.ts` - 添加液态玻璃配置
- [ ] `src/shared/styles/globals.css` - 更新全局样式
- [ ] `src/shared/styles/liquid-globals.css` - 新增液态玻璃样式

#### 组件文件
- [ ] `src/design-system/components/liquid-button.tsx` - 新增
- [ ] `src/design-system/components/liquid-card.tsx` - 新增
- [ ] `src/design-system/components/liquid-input.tsx` - 新增
- [ ] `src/design-system/components/liquid-modal.tsx` - 新增
- [ ] `src/design-system/components/liquid-select.tsx` - 新增
- [ ] `src/design-system/components/liquid-badge.tsx` - 新增
- [ ] `src/design-system/components/liquid-avatar.tsx` - 新增
- [ ] `src/design-system/components/liquid-skeleton.tsx` - 新增
- [ ] `src/design-system/components/liquid-toast.tsx` - 新增

#### 页面文件
- [ ] `src/app/(auth)/login/page.tsx` - 改造
- [ ] `src/app/(auth)/register/page.tsx` - 改造
- [ ] `src/app/(auth)/reset-password/page.tsx` - 改造
- [ ] `src/app/admin/dashboard/page.tsx` - 改造
- [ ] `src/app/admin/orders/page.tsx` - 改造
- [ ] `src/app/admin/orders/[id]/page.tsx` - 改造
- [ ] `src/app/admin/pool/page.tsx` - 改造
- [ ] `src/app/admin/workspace/page.tsx` - 改造
- [ ] `src/app/customer/orders/page.tsx` - 改造
- [ ] `src/app/portal/page.tsx` - 改造

### B. 依赖安装

```bash
# 动画库
npm install framer-motion

# 工具库
npm install clsx tailwind-merge

# 图标库（如需要）
npm install lucide-react
```

### C. 开发规范

1. **组件命名**: 所有新组件以 `Liquid` 前缀命名
2. **样式命名**: 使用 `liquid-` 前缀的 Tailwind 类
3. **动画配置**: 统一使用 `liquidSpringConfig` 配置
4. **颜色使用**: 统一使用 `liquid-*` 颜色变量

---

**文档结束**

> 本方案为华夏签证 ERP 系统 UI 全面改造的指导文档，实施过程中请严格按照阶段计划执行，确保功能完整性和用户体验。
