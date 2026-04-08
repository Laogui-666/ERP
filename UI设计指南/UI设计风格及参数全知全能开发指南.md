
# Panda002 UI设计风格及参数全知全能开发指南

&gt; 📋 可直接套用复刻的完整UI设计系统指南
&gt;
&gt; **版本**: 2.0.0
&gt; **最后更新**: 2026-04-03
&gt; **设计风格**: 莫兰迪冷色调 + 苹果液态玻璃 + 弹簧物理动画

---

## 目录

1. [设计理念](#设计理念)
2. [颜色系统](#颜色系统)
3. [字体排版](#字体排版)
4. [间距布局](#间距布局)
5. [圆角阴影](#圆角阴影)
6. [组件规范](#组件规范)
7. [动画系统](#动画系统)
8. [响应式设计](#响应式设计)
9. [液态玻璃效果](#液态玻璃效果)
10. [快速开始模板](#快速开始模板)

---

## 设计理念

### 核心原则
1. **苹果液态玻璃风格**: 细腻的模糊、柔和的渐变、微妙的光泽、深层阴影
2. **莫兰迪冷色调**: 低饱和度、温和优雅的色彩系统
3. **弹簧物理动画**: 模拟真实物理世界的自然回弹效果
4. **移动端优先**: 默认全宽、增大触摸区域、丝滑触控反馈
5. **渐进增强**: 悬停效果仅在支持设备上启用

### 苹果液态玻璃特征
- **超细腻模糊**: 多层模糊叠加，营造深度感
- **柔和渐变**: 从透明到半透明的微妙渐变
- **微妙边框**: 几乎不可见的白色高光边框
- **深层阴影**: 多层阴影叠加，营造漂浮感
- **光泽效果**: 顶部微妙的光泽高光
- **丝滑动画**: 流畅的贝塞尔曲线过渡

### 设计关键词
- 精致、细腻、高级、现代
- 丝滑、弹性、自然、有质感
- 简约、清晰、易用、无障碍

---

## 颜色系统

### 莫兰迪冷色调色板（升级版）

| 颜色名称 | Hex值 | 用途 | 色值示例 |
|---------|-------|------|---------|
| `liquid-ocean` | `#5B7B7A` | 主色调、按钮、强调 | 液态海洋绿 |
| `liquid-oceanLight` | `#7FA0A0` | 次要强调、渐变 | 浅液态海洋绿 |
| `liquid-sand` | `#A8B8B8` | 中性背景、次要按钮 | 液态沙色 |
| `liquid-mist` | `#6A7A7A` | 次级文字、边框 | 液态雾色 |
| `liquid-clay` | `#6A6D6D` | 图标、装饰 | 液态陶土色 |
| `liquid-blush` | `#C4CCD6` | 柔和背景、渐变 | 液态blush |
| `liquid-deep` | `#1A262E` | 主要文字、深色背景 | 深色文字 |
| `liquid-light` | `#F0F4F7` | 页面背景 | 浅色背景 |
| `liquid-cream` | `#E5EBEF` | 卡片背景、分区 | 液态奶油色 |
| `liquid-steel` | `#4A5A63` | 图标、次级强调 | 钢蓝色 |
| `liquid-silver` | `#8A9AA7` | 边框、装饰 | 银灰色 |

### 液态玻璃专用色

| 颜色名称 | RGBA值 | 用途 |
|---------|--------|------|
| `liquid-primary` | `rgba(255, 255, 255, 0.72)` | 主液态玻璃背景 |
| `liquid-secondary` | `rgba(255, 255, 255, 0.56)` | 次级液态玻璃背景 |
| `liquid-tertiary` | `rgba(255, 255, 255, 0.40)` | 三级液态玻璃背景 |
| `liquid-border-primary` | `rgba(255, 255, 255, 0.5)` | 主液态边框 |
| `liquid-border-secondary` | `rgba(255, 255, 255, 0.35)` | 次级液态边框 |
| `liquid-gloss` | `rgba(255, 255, 255, 0.25)` | 光泽高光 |
| `liquid-shadow-soft` | `rgba(0, 0, 0, 0.04)` | 柔和阴影 |
| `liquid-shadow-medium` | `rgba(0, 0, 0, 0.08)` | 中等阴影 |
| `liquid-shadow-strong` | `rgba(0, 0, 0, 0.12)` | 强阴影 |

### Tailwind配置（液态玻璃版）

```javascript
// tailwind.config.js
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  future: {
    hoverOnlyWhenSupported: true,
  },
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
        },
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans SC', 'system-ui', 'sans-serif'],
        display: ['Noto Sans SC', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
        '5xl': '2.5rem',
        'liquid': '1.75rem',
        'liquid-sm': '1.25rem',
        'liquid-lg': '2.25rem',
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
      animation: {
        'float': 'float 8s ease-in-out infinite',
        'pulse-slow': 'pulse 5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'liquid-shimmer': 'shimmer 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        shimmer: {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '0.6' },
        },
      }
    },
  },
  plugins: [],
}
```

### CSS变量定义（液态玻璃版）

```css
/* globals.css */
:root {
  --liquid-ocean: #5B7B7A;
  --liquid-sand: #A8B8B8;
  --liquid-mist: #6A7A7A;
  --liquid-clay: #6A6D6D;
  --liquid-blush: #C4CCD6;
  --liquid-deep: #1A262E;
  --liquid-light: #F0F4F7;
  --liquid-cream: #E5EBEF;

  --liquid-primary: rgba(255, 255, 255, 0.72);
  --liquid-secondary: rgba(255, 255, 255, 0.56);
  --liquid-border: rgba(255, 255, 255, 0.5);
  --liquid-gloss: rgba(255, 255, 255, 0.25);
}
```

---

## 字体排版

### 字体家族

| 用途 | 字体 | Fallback |
|------|------|----------|
| 正文 | Inter | Noto Sans SC → system-ui → sans-serif |
| 标题 | Noto Sans SC | Inter → system-ui → sans-serif |

### Google Fonts 引入

```html
&lt;link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&amp;family=Noto+Sans+SC:wght@300;400;500;600;700&amp;display=swap" rel="stylesheet"&gt;
```

### 字体大小层级（苹果风格）

| 元素 | 移动端 | 平板 | 桌面 | 字重 | 字间距 |
|------|--------|------|------|------|--------|
| H1 | 3xl (30px) | 4xl (36px) | 5-6xl (48-60px) | 700 (bold) | -0.02em |
| H2 | xl (20px) | 2xl (24px) | 2-3xl (24-30px) | 600 (semibold) | -0.01em |
| H3 | lg (18px) | lg (18px) | xl (20px) | 600 (semibold) | 0 |
| 正文 | base (16px) | base (16px) | base (16px) | 400 (normal) | 0.01em |
| 小字 | sm (14px) | sm (14px) | sm (14px) | 400 (normal) | 0.01em |
| 辅助文字 | xs (12px) | xs (12px) | xs (12px) | 400 (normal) | 0.02em |
| 标签 | 11px | 11px | xs (12px) | 500 (medium) | 0.03em |

### 行高设置

| 元素 | 行高 |
|------|------|
| 标题 | 1.25 |
| 正文 | 1.55 |
| 小字 | 1.45 |

### 字体颜色

| 用途 | 颜色 |
|------|------|
| 主标题 | `text-liquid-deep` |
| 副标题 | `text-liquid-deep` |
| 正文 | `text-liquid-deep` |
| 次级文字 | `text-liquid-mist` |
| 辅助文字 | `text-liquid-clay` |
| 强调文字 | `text-liquid-ocean` |

---

## 间距布局

### 基础间距单位（苹果8pt网格）

使用 8px 基础网格系统：

| 类名 | 像素值 | 常用场景 |
|------|--------|----------|
| `p-1` / `m-1` | 4px | 微调整 |
| `p-2` / `m-2` | 8px | 小型内边距 |
| `p-3` / `m-3` | 12px | 紧凑内边距 |
| `p-4` / `m-4` | 16px | 标准内边距 |
| `p-5` / `m-5` | 20px | 舒适内边距 |
| `p-6` / `m-6` | 24px | 卡片内边距 |
| `p-8` / `m-8` | 32px | 大卡片内边距 |

### 容器间距

| 断点 | 左右内边距 |
|------|-----------|
| 移动端 (xs) | px-4 (16px) |
| 平板 (sm) | px-6 (24px) |
| 桌面 (md+) | px-8 (32px) |

### 垂直间距

| 元素间关系 | 间距 |
|-----------|------|
| 标题与内容 | mb-4 ~ mb-5 |
| 段落之间 | mb-5 |
| 卡片之间 | gap-4 ~ gap-6 |
| 章节之间 | py-16 |

### 最大宽度容器

```jsx
&lt;div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8"&gt;
  {/* 内容 */}
&lt;/div&gt;
```

---

## 圆角阴影

### 圆角系统（苹果液态风格）

| 圆角大小 | 数值 | 使用场景 |
|---------|------|---------|
| `rounded-full` | 9999px | 圆形按钮、头像 |
| `rounded-liquid-lg` | 2.25rem (36px) | 大型服务卡片 |
| `rounded-5xl` | 2.5rem (40px) | 超大卡片 |
| `rounded-liquid` | 1.75rem (28px) | 标准卡片 |
| `rounded-4xl` | 2rem (32px) | 标准卡片备选 |
| `rounded-liquid-sm` | 1.25rem (20px) | 小型卡片 |
| `rounded-3xl` | 1.5rem (24px) | 按钮、输入框 |
| `rounded-2xl` | 1rem (16px) | 标签、徽章 |

### 阴影系统（液态玻璃多层阴影）

| 阴影名称 | 效果 | 使用场景 |
|---------|------|---------|
| `shadow-liquid-soft` | 双层柔和阴影 | 轻量元素 |
| `shadow-liquid-medium` | 双层中等阴影 | 标准元素 |
| `shadow-liquid-strong` | 双层强阴影 | 强调元素 |
| `shadow-liquid-glow` | 内发光 + 外阴影 | 液态玻璃元素 |

### 液态玻璃阴影示例

```css
/* 标准液态玻璃阴影 */
.liquid-shadow {
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.5) inset,
    0 8px 32px rgba(0, 0, 0, 0.10),
    0 2px 8px rgba(0, 0, 0, 0.04);
}
```

---

## 组件规范

### 1. LiquidButton 液态按钮组件

#### Props 接口

```typescript
interface LiquidButtonProps {
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'liquid' | 'liquid-fill';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  width?: 'full' | 'auto' | 'fixed';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () =&gt; void;
  type?: 'button' | 'submit' | 'reset';
  withGlow?: boolean;
}
```

#### 变体样式

| 变体 | 样式描述 |
|------|---------|
| `primary` | 液态海洋绿填充，白色文字，带内发光 |
| `secondary` | 液态沙色填充，深色文字 |
| `ghost` | 透明背景，悬停时液态奶油色 |
| `liquid` | 液态玻璃效果，半透明白色背景 |
| `liquid-fill` | 实心液态玻璃效果，更高不透明度 |

#### 尺寸规格

| 尺寸 | 内边距 | 字体 | 圆角 |
|------|--------|------|------|
| `sm` | px-5 py-3 (md:py-2.5) | text-sm | rounded-2xl |
| `md` | px-7 py-4 (md:py-3.5) | text-base | rounded-3xl |
| `lg` | px-9 py-5 (md:py-4.5) | text-lg | rounded-3xl |
| `xl` | px-11 py-6 (md:py-5.5) | text-xl | rounded-3xl |

#### 液态按钮完整实现

```tsx
import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface LiquidButtonProps {
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'liquid' | 'liquid-fill';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  width?: 'full' | 'auto' | 'fixed';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () =&gt; void;
  type?: 'button' | 'submit' | 'reset';
  withGlow?: boolean;
}

export const LiquidButton: React.FC&lt;LiquidButtonProps&gt; = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className,
  disabled,
  onClick,
  type = 'button',
  width = 'full',
  withGlow = true,
}) =&gt; {
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
    &lt;motion.button
      type={type}
      className={clsx(
        baseStyles,
        variants[variant],
        glowStyles[variant as keyof typeof glowStyles],
        sizes[size],
        radius[size],
        widthStyles[width],
        (disabled || isLoading) &amp;&amp; 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled || isLoading}
      onClick={onClick}
      whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    &gt;
      {/* 光泽效果层 */}
      {(variant === 'liquid' || variant === 'liquid-fill') &amp;&amp; (
        &lt;div className="absolute inset-0 pointer-events-none"&gt;
          &lt;div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-t-[inherit]" /&gt;
        &lt;/div&gt;
      )}

      &lt;div className="relative z-10 flex items-center"&gt;
        {isLoading ? (
          &lt;&gt;
            &lt;svg
              className="animate-spin -ml-1 mr-2 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            &gt;
              &lt;circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              /&gt;
              &lt;path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              /&gt;
            &lt;/svg&gt;
            &lt;span&gt;加载中...&lt;/span&gt;
          &lt;/&gt;
        ) : (
          &lt;&gt;
            {leftIcon &amp;&amp; &lt;span className="mr-2"&gt;{leftIcon}&lt;/span&gt;}
            {children}
            {rightIcon &amp;&amp; &lt;span className="ml-2"&gt;{rightIcon}&lt;/span&gt;}
          &lt;/&gt;
        )}
      &lt;/div&gt;
    &lt;/motion.button&gt;
  );
};
```

#### 使用示例

```tsx
import { LiquidButton } from '@/components/ui/LiquidButton';

// 主要液态按钮
&lt;LiquidButton variant="primary" size="lg"&gt;
  立即开始
&lt;/LiquidButton&gt;

// 液态玻璃按钮
&lt;LiquidButton variant="liquid" leftIcon={&lt;Icon /&gt;}&gt;
  查看详情
&lt;/LiquidButton&gt;

// 实心液态按钮
&lt;LiquidButton variant="liquid-fill" size="xl" withGlow&gt;
  开始体验
&lt;/LiquidButton&gt;
```

---

### 2. LiquidCard 液态卡片组件

#### Props 接口

```typescript
interface LiquidCardProps extends HTMLMotionProps&lt;'div'&gt; {
  variant?: 'liquid' | 'solid' | 'outlined' | 'liquid-elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hoverable?: boolean;
  liquidIntensity?: 'light' | 'medium' | 'strong' | 'ultra';
  withGloss?: boolean;
  withBorder?: boolean;
}
```

#### 变体样式

| 变体 | 效果 |
|------|------|
| `liquid` | 标准液态玻璃 |
| `liquid-elevated` | 增强悬浮液态玻璃 |
| `solid` | 纯白色背景 |
| `outlined` | 透明背景带边框 |

#### 液态强度

| 强度 | 透明度 | 模糊 | 阴影 |
|------|--------|------|------|
| `light` | bg-white/45 | backdrop-blur-lg | shadow-liquid-soft |
| `medium` | bg-white/60 | backdrop-blur-xl | shadow-liquid-medium |
| `strong` | bg-white/72 | backdrop-blur-2xl | shadow-liquid-strong |
| `ultra` | bg-white/80 | backdrop-blur-3xl | shadow-liquid-glow |

#### 内边距

| 大小 | 内边距 |
|------|--------|
| `none` | p-0 |
| `sm` | p-5 |
| `md` | p-6 |
| `lg` | p-8 |
| `xl` | p-10 |

#### 液态卡片完整实现

```tsx
import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { clsx } from 'clsx';

interface LiquidCardProps extends HTMLMotionProps&lt;'div'&gt; {
  variant?: 'liquid' | 'solid' | 'outlined' | 'liquid-elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hoverable?: boolean;
  liquidIntensity?: 'light' | 'medium' | 'strong' | 'ultra';
  withGloss?: boolean;
  withBorder?: boolean;
}

export const LiquidCard = React.forwardRef&lt;HTMLDivElement, LiquidCardProps&gt;(
  (
    {
      children,
      variant = 'liquid',
      padding = 'md',
      hoverable = false,
      liquidIntensity = 'medium',
      withGloss = true,
      withBorder = true,
      className,
      ...props
    },
    ref
  ) =&gt; {
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
      liquid: clsx(
        config.bg,
        config.blur,
        withBorder &amp;&amp; config.border,
        config.shadow
      ),
      'liquid-elevated': clsx(
        config.bg,
        config.blur,
        withBorder &amp;&amp; config.border,
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
      &lt;motion.div
        ref={ref}
        className={clsx(
          baseStyles,
          'rounded-liquid',
          variants[variant],
          paddings[padding],
          hoverStyles,
          className
        )}
        initial={hoverable ? { y: 0 } : undefined}
        whileHover={hoverable ? { y: -6, scale: 1.02 } : undefined}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 30,
        }}
        {...props}
      &gt;
        {/* 顶部光泽效果 */}
        {(variant === 'liquid' || variant === 'liquid-elevated') &amp;&amp; withGloss &amp;&amp; (
          &lt;div className="absolute inset-0 pointer-events-none"&gt;
            &lt;div className="absolute top-0 left-0 right-0 h-2/5 bg-gradient-to-b from-white/30 via-white/10 to-transparent rounded-t-liquid" /&gt;
            &lt;div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" /&gt;
          &lt;/div&gt;
        )}

        {/* 内容层 */}
        &lt;div className="relative z-10"&gt;
          {children}
        &lt;/div&gt;
      &lt;/motion.div&gt;
    );
  }
);

LiquidCard.displayName = 'LiquidCard';

/**
 * 卡片头部
 */
export const LiquidCardHeader: React.FC&lt;{ children: React.ReactNode; className?: string }&gt; = ({
  children,
  className,
}) =&gt; (
  &lt;div className={clsx('mb-5', className)}&gt;{children}&lt;/div&gt;
);

/**
 * 卡片内容
 */
export const LiquidCardContent: React.FC&lt;{ children: React.ReactNode; className?: string }&gt; = ({
  children,
  className,
}) =&gt; (
  &lt;div className={clsx('', className)}&gt;{children}&lt;/div&gt;
);

/**
 * 卡片底部
 */
export const LiquidCardFooter: React.FC&lt;{ children: React.ReactNode; className?: string }&gt; = ({
  children,
  className,
}) =&gt; (
  &lt;div className={clsx('mt-5 pt-5 border-t border-white/20', className)}&gt;
    {children}
  &lt;/div&gt;
);
```

---

### 3. LiquidServiceCard 液态服务卡片组件

#### Props 接口

```typescript
interface LiquidServiceCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBg?: string;
  gradient?: string;
  href?: string;
  status?: 'new' | 'coming_soon' | 'default';
  onClick?: () =&gt; void;
  className?: string;
}
```

#### 液态服务卡片完整实现

```tsx
import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { LiquidCard } from './LiquidCard';

interface LiquidServiceCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBg?: string;
  gradient?: string;
  href?: string;
  status?: 'new' | 'coming_soon' | 'default';
  onClick?: () =&gt; void;
  className?: string;
}

export const LiquidServiceCard: React.FC&lt;LiquidServiceCardProps&gt; = ({
  title,
  description,
  icon,
  iconBg = 'bg-liquid-ocean',
  gradient = 'from-liquid-ocean to-liquid-mist',
  href,
  status = 'default',
  onClick,
  className,
}) =&gt; {
  const CardContent = (
    &lt;LiquidCard
      variant="liquid-elevated"
      liquidIntensity="strong"
      padding="lg"
      hoverable={!!href || !!onClick}
      className={className}
      onClick={onClick}
    &gt;
      {/* 背景渐变层 */}
      &lt;div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-8 transition-opacity duration-500`} /&gt;

      &lt;div className="relative z-10 text-center"&gt;
        {/* 图标 */}
        &lt;div className="group"&gt;
          &lt;div className={`w-14 h-14 sm:w-16 sm:h-16 ${iconBg} rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-lg shadow-liquid-ocean/25 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-liquid-ocean/35 transition-all duration-400`}&gt;
            &lt;div className="w-8 h-8 sm:w-9 sm:h-9"&gt;{icon}&lt;/div&gt;
          &lt;/div&gt;
        &lt;/div&gt;

        {/* 标题 */}
        &lt;h3 className="text-base sm:text-lg md:text-xl font-bold text-liquid-deep mb-2"&gt;
          {title}
        &lt;/h3&gt;

        {/* 描述 */}
        &lt;p className="text-xs sm:text-sm text-liquid-mist leading-relaxed"&gt;
          {description}
        &lt;/p&gt;

        {/* 状态标签 */}
        {status === 'new' &amp;&amp; (
          &lt;span className="absolute top-4 right-4 text-[10px] sm:text-xs bg-liquid-ocean text-white px-2.5 py-1 rounded-full font-medium shadow-md"&gt;
            NEW
          &lt;/span&gt;
        )}
        {status === 'coming_soon' &amp;&amp; (
          &lt;span className="absolute top-4 right-4 text-[10px] sm:text-xs bg-liquid-silver text-liquid-deep px-2.5 py-1 rounded-full font-medium"&gt;
            即将上线
          &lt;/span&gt;
        )}
      &lt;/div&gt;
    &lt;/LiquidCard&gt;
  );

  if (href) {
    return (
      &lt;Link href={href} className="group block"&gt;
        {CardContent}
      &lt;/Link&gt;
    );
  }

  return &lt;div className="group"&gt;{CardContent}&lt;/div&gt;;
};
```

#### 使用示例

```tsx
import { LiquidServiceCard } from '@/components/ui/LiquidServiceCard';

&lt;LiquidServiceCard
  title="一键翻译"
  description="快速精准的多语言翻译"
  icon={&lt;TranslateIcon /&gt;}
  iconBg="bg-liquid-ocean"
  gradient="from-liquid-ocean to-liquid-blush"
  href="/translation"
  status="new"
/&gt;
```

---

### 4. LiquidInput 液态输入框组件

#### Props 接口

```typescript
interface LiquidInputProps extends React.InputHTMLAttributes&lt;HTMLInputElement&gt; {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'liquid' | 'solid';
}
```

#### 液态输入框完整实现

```tsx
import React from 'react';
import { clsx } from 'clsx';

interface LiquidInputProps extends React.InputHTMLAttributes&lt;HTMLInputElement&gt; {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'liquid' | 'solid';
}

export const LiquidInput = React.forwardRef&lt;HTMLInputElement, LiquidInputProps&gt;(
  (
    {
      label,
      error,
      leftIcon,
      rightIcon,
      variant = 'liquid',
      className,
      ...props
    },
    ref
  ) =&gt; {
    const baseStyles = 'w-full px-5 py-4 md:py-3.5 rounded-3xl transition-all duration-300 focus:outline-none text-base md:text-sm';

    const variants = {
      liquid: 'bg-white/55 backdrop-blur-xl border border-white/50 focus:bg-white/70 focus:border-liquid-ocean/60 hover:border-liquid-ocean/40 shadow-liquid-soft focus:shadow-liquid-medium',
      solid: 'bg-white border border-liquid-silver/30 focus:border-liquid-ocean focus:shadow-liquid-medium',
    };

    return (
      &lt;div className="w-full"&gt;
        {label &amp;&amp; (
          &lt;label className="block text-sm font-semibold text-liquid-deep mb-2"&gt;
            {label}
          &lt;/label&gt;
        )}
        &lt;div className="relative"&gt;
          {leftIcon &amp;&amp; (
            &lt;span className="absolute left-5 top-1/2 -translate-y-1/2 text-liquid-mist"&gt;
              {leftIcon}
            &lt;/span&gt;
          )}
          &lt;input
            ref={ref}
            className={clsx(
              baseStyles,
              variants[variant],
              leftIcon &amp;&amp; 'pl-14',
              rightIcon &amp;&amp; 'pr-14',
              error &amp;&amp; 'border-red-400/60 focus:border-red-500',
              className
            )}
            {...props}
          /&gt;
          {rightIcon &amp;&amp; (
            &lt;span className="absolute right-5 top-1/2 -translate-y-1/2 text-liquid-mist"&gt;
              {rightIcon}
            &lt;/span&gt;
          )}
        &lt;/div&gt;
        {error &amp;&amp; (
          &lt;p className="mt-2 text-sm text-red-500"&gt;{error}&lt;/p&gt;
        )}
      &lt;/div&gt;
    );
  }
);

LiquidInput.displayName = 'LiquidInput';
```

---

## 动画系统

### 弹簧物理动画配置

```typescript
// src/hooks/useLiquidAnimation.ts
export const liquidSpringConfig = {
  // 轻柔弹簧 - 用于大型元素
  gentle: {
    type: 'spring' as const,
    stiffness: 350,
    damping: 25,
    mass: 1,
  },
  // 中等弹簧 - 用于一般元素
  medium: {
    type: 'spring' as const,
    stiffness: 450,
    damping: 30,
    mass: 1,
  },
  // 强力弹簧 - 用于小型交互元素
  snappy: {
    type: 'spring' as const,
    stiffness: 550,
    damping: 35,
    mass: 0.8,
  },
  // 弹性弹簧 - 用于需要明显回弹效果
  bouncy: {
    type: 'spring' as const,
    stiffness: 450,
    damping: 18,
    mass: 1,
  },
  // 液态弹簧 - 丝滑流畅
  liquid: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 28,
    mass: 0.9,
  },
};
```

### 液态过渡曲线

```typescript
export const liquidEasing = {
  // 标准液态缓动
  standard: [0.4, 0, 0.2, 1],
  // 加速进入
  easeIn: [0.4, 0, 1, 1],
  // 减速离开
  easeOut: [0, 0, 0.2, 1],
  // 丝滑液态
  smooth: [0.25, 0.1, 0.25, 1],
};
```

### 常用液态动画效果

#### 按钮液态反馈

```tsx
&lt;motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.97 }}
  transition={liquidSpringConfig.liquid}
&gt;
  点击我
&lt;/motion.button&gt;
```

#### 卡片液态悬停

```tsx
&lt;motion.div
  whileHover={{ y: -6, scale: 1.02 }}
  transition={liquidSpringConfig.liquid}
&gt;
  卡片内容
&lt;/motion.div&gt;
```

#### 视口液态入场

```tsx
&lt;motion.div
  initial={{ opacity: 0, y: 24 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: '-100px' }}
  transition={{ ...liquidSpringConfig.medium, delay: 0.1 }}
&gt;
  内容
&lt;/motion.div&gt;
```

---

## 响应式设计

### 断点系统（苹果风格）

| 断点 | 宽度 | 设备类型 |
|------|------|---------|
| 默认 (xs) | &lt; 640px | iPhone 尺寸 |
| sm | ≥ 640px | 大屏手机 / 小平板 |
| md | ≥ 768px | iPad 尺寸 |
| lg | ≥ 1024px | 小屏桌面 / 大屏 iPad |
| xl | ≥ 1280px | 标准桌面 |
| 2xl | ≥ 1536px | 大屏桌面 |

### 移动端优先策略（液态优化）

1. **默认全宽**: 按钮、输入框默认 `w-full md:w-auto`
2. **增大触摸区域**: 移动端内边距比桌面端稍大
3. **隐藏桌面元素**: `hidden md:block`
4. **隐藏移动元素**: `block md:hidden`
5. **禁用悬停样式**: `hoverOnlyWhenSupported: true`

---

## 液态玻璃效果

### 基础液态玻璃样式

```css
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
```

### 顶部光泽效果

```css
.liquid-gloss {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

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
}

.liquid-gloss::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    to right,
    transparent,
    rgba(255, 255, 255, 0.4),
    transparent
  );
}
```

### 液态玻璃强度变体

| 强度 | 透明度 | 模糊 | 阴影 |
|------|--------|------|------|
| Light | 45% | blur-lg | soft |
| Medium | 60% | blur-xl | medium |
| Strong | 72% | blur-2xl | strong |
| Ultra | 80% | blur-3xl | glow |

---

## 快速开始模板

### 1. 项目初始化

```bash
npx create-next-app@latest my-project --typescript --tailwind --eslint
cd my-project
npm install framer-motion lucide-react clsx tailwind-merge
```

### 2. 配置 Tailwind

复制 [tailwind.config.js](#tailwind配置液态玻璃版) 内容

### 3. 全局样式

复制 [globals.css](#css变量定义液态玻璃版) 内容

### 4. 复制液态组件

从本项目复制以下组件：
- `src/components/ui/LiquidButton.tsx`
- `src/components/ui/LiquidCard.tsx`
- `src/components/ui/LiquidServiceCard.tsx`
- `src/components/ui/LiquidInput.tsx`
- `src/hooks/useLiquidAnimation.ts`

### 5. 基础液态页面模板

```tsx
// src/app/page.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LiquidButton } from '@/components/ui/LiquidButton';
import { LiquidCard, LiquidCardHeader, LiquidCardContent } from '@/components/ui/LiquidCard';
import { LiquidServiceCard } from '@/components/ui/LiquidServiceCard';
import { liquidSpringConfig } from '@/hooks/useLiquidAnimation';

const services = [
  {
    id: 1,
    title: '一键翻译',
    description: '快速精准的多语言翻译',
    icon: &lt;svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24"&gt;
      &lt;path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /&gt;
    &lt;/svg&gt;,
    href: '/translation',
    status: 'new' as const,
  },
  {
    id: 2,
    title: '行程规划',
    description: '智能规划您的旅行路线',
    icon: &lt;svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24"&gt;
      &lt;path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /&gt;
    &lt;/svg&gt;,
    status: 'coming_soon' as const,
  },
  {
    id: 3,
    title: '签证评估',
    description: 'AI 评估您的签证通过率',
    icon: &lt;svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24"&gt;
      &lt;path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /&gt;
    &lt;/svg&gt;,
    status: 'coming_soon' as const,
  },
];

export default function HomePage() {
  return (
    &lt;div className="min-h-screen bg-liquid-light"&gt;
      {/* Hero Section - 液态风格 */}
      &lt;section className="relative min-h-screen flex items-center"&gt;
        &lt;div className="absolute inset-0 bg-gradient-to-br from-liquid-light via-liquid-cream to-liquid-blush" /&gt;

        &lt;div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 md:px-8 text-center"&gt;
          &lt;motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...liquidSpringConfig.gentle, delay: 0.2 }}
          &gt;
            &lt;h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-liquid-deep mb-4 tracking-tight"&gt;
              欢迎使用
            &lt;/h1&gt;
            &lt;p className="text-base sm:text-lg text-liquid-mist mb-8 max-w-2xl mx-auto leading-relaxed"&gt;
              这是一个基于莫兰迪色系和苹果液态玻璃风格的现代网站
            &lt;/p&gt;
            &lt;LiquidButton variant="primary" size="xl" withGlow&gt;
              开始体验
            &lt;/LiquidButton&gt;
          &lt;/motion.div&gt;
        &lt;/div&gt;
      &lt;/section&gt;

      {/* Features Section - 液态服务卡片 */}
      &lt;section className="py-16 bg-gradient-to-br from-slate-50 via-liquid-cream to-liquid-blush"&gt;
        &lt;div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8"&gt;
          &lt;motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={liquidSpringConfig.medium}
          &gt;
            &lt;h2 className="text-xl md:text-2xl font-semibold text-liquid-deep"&gt;
              选择您需要的服务
            &lt;/h2&gt;
          &lt;/motion.div&gt;

          &lt;div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6"&gt;
            {services.map((service, index) =&gt; (
              &lt;motion.div
                key={service.id}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ ...liquidSpringConfig.medium, delay: index * 0.08 }}
              &gt;
                &lt;LiquidServiceCard
                  title={service.title}
                  description={service.description}
                  icon={service.icon}
                  href={service.href}
                  status={service.status}
                /&gt;
              &lt;/motion.div&gt;
            ))}
          &lt;/div&gt;
        &lt;/div&gt;
      &lt;/section&gt;
    &lt;/div&gt;
  );
}
```

---

## 附录

### 常用工具函数

#### cn - 合并类名

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### 滚动条美化（液态风格）

```css
::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

::-webkit-scrollbar-track {
  background: var(--liquid-cream);
  border-radius: 5px;
}

::-webkit-scrollbar-thumb {
  background: var(--liquid-silver);
  border-radius: 5px;
  border: 2px solid var(--liquid-cream);
}

::-webkit-scrollbar-thumb:hover {
  background: var(--liquid-mist);
}
```

### 文字选择颜色

```css
::selection {
  background: var(--liquid-ocean);
  color: white;
}
```

### 渐变背景（液态风格）

```css
.gradient-liquid {
  background: linear-gradient(
    135deg,
    #F0F4F7 0%,
    #E5EBEF 50%,
    #C4CCD6 100%
  );
}

.gradient-ocean-liquid {
  background: linear-gradient(
    180deg,
    #5B7B7A 0%,
    #4A6A69 100%
  );
}
```

---

## 参考文件

- [tailwind.config.js](file:///workspace/Panda002/tailwind.config.js)
- [globals.css](file:///workspace/Panda002/src/styles/globals.css)
- [page.tsx](file:///workspace/Panda002/src/app/page.tsx)
- [useAnimation.ts](file:///workspace/Panda002/src/hooks/useAnimation.ts)

---

**祝开发愉快！** ✨

这份指南已升级为苹果液态玻璃风格，提供了更精致、更高级的UI设计系统！
