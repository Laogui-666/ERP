// 华夏签证 ERP - 液态玻璃动画系统
// 弹簧物理动画配置
// 优化后更加丝滑响应，参考Panda002设计风格

export const liquidSpringConfig = {
  // 轻柔弹簧 - 用于大型元素
  gentle: {
    type: 'spring' as const,
    stiffness: 800,
    damping: 60,
    mass: 0.5,
  },
  // 中等弹簧 - 用于一般元素
  medium: {
    type: 'spring' as const,
    stiffness: 900,
    damping: 65,
    mass: 0.45,
  },
  // 强力弹簧 - 用于小型交互元素
  snappy: {
    type: 'spring' as const,
    stiffness: 1000,
    damping: 70,
    mass: 0.4,
  },
  // 弹性弹簧 - 用于需要明显回弹效果
  bouncy: {
    type: 'spring' as const,
    stiffness: 900,
    damping: 50,
    mass: 0.45,
  },
  // 液态弹簧 - 丝滑流畅
  liquid: {
    type: 'spring' as const,
    stiffness: 950,
    damping: 65,
    mass: 0.42,
  },
  // 超快速弹簧 - 用于微交互
  ultra: {
    type: 'spring' as const,
    stiffness: 1100,
    damping: 75,
    mass: 0.35,
  },
};

// 缓动函数配置
export const liquidEasing = {
  standard: [0.4, 0, 0.2, 1],
  easeIn: [0.4, 0, 1, 1],
  easeOut: [0, 0, 0.2, 1],
  smooth: [0.25, 0.1, 0.25, 1],
  spring: [0.34, 1.56, 0.64, 1],
  bounce: [0.68, -0.55, 0.265, 1.55],
};

// 动画持续时间
export const liquidDurations = {
  fast: 0.1,
  normal: 0.2,
  slow: 0.25,
  slower: 0.3,
};

// 入场动画变体
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: liquidSpringConfig.medium,
};

export const fadeInDown = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  transition: liquidSpringConfig.medium,
};

export const fadeInLeft = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  transition: liquidSpringConfig.medium,
};

export const fadeInRight = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  transition: liquidSpringConfig.medium,
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  transition: liquidSpringConfig.liquid,
};

export const springIn = {
  initial: { opacity: 0, scale: 0.8, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0 },
  transition: liquidSpringConfig.bouncy,
};

// 交错动画配置
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: liquidSpringConfig.medium,
  },
};

// 悬停动画 - 优化为更丝滑的效果
export const hoverScale = {
  whileHover: { scale: 1.015 },
  whileTap: { scale: 0.985 },
  transition: liquidSpringConfig.ultra,
};

export const hoverLift = {
  whileHover: { y: -4, scale: 1.01, boxShadow: '0 12px 32px rgba(0,0,0,0.1)' },
  whileTap: { y: 0, scale: 0.99, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' },
  transition: liquidSpringConfig.liquid,
};

// 服务卡片悬停动画 - 参考Panda002
export const serviceCardHover = {
  whileHover: { y: -6, scale: 1.02, boxShadow: '0 16px 48px rgba(0,0,0,0.12)' },
  whileTap: { y: 0, scale: 0.99, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' },
  transition: liquidSpringConfig.snappy,
};

// 目的地卡片悬停动画
export const destinationCardHover = {
  whileHover: { y: -4, scale: 1.02 },
  whileTap: { y: 0, scale: 0.98 },
  transition: liquidSpringConfig.snappy,
};

// 页面过渡动画
export const pageTransition = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: liquidSpringConfig.gentle,
};

// 模态框动画
export const modalOverlay = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
};

export const modalContent = {
  initial: { opacity: 0, scale: 0.95, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 20 },
  transition: liquidSpringConfig.bouncy,
};

// 侧边栏动画
export const sidebarSlide = {
  initial: { x: -100, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -100, opacity: 0 },
  transition: liquidSpringConfig.gentle,
};

// 下拉菜单动画
export const dropdownMenu = {
  initial: { opacity: 0, y: -10, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -10, scale: 0.95 },
  transition: liquidSpringConfig.snappy,
};

// 列表项动画
export const listItem = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
  transition: liquidSpringConfig.medium,
};

// 骨架屏动画
export const skeletonShimmer = {
  animate: {
    backgroundPosition: ['200% 0', '-200% 0'],
    transition: {
      repeat: Infinity,
      duration: 1.8,
      ease: 'linear',
    },
  },
};

// 脉冲动画
export const pulseGlow = {
  animate: {
    boxShadow: [
      '0 0 0 0 rgba(91, 123, 122, 0.3)',
      '0 0 0 12px rgba(91, 123, 122, 0)',
      '0 0 0 0 rgba(91, 123, 122, 0)',
    ],
    transition: {
      repeat: Infinity,
      duration: 2.5,
      ease: 'easeInOut',
    },
  },
};

// 浮动动画
export const floatAnimation = {
  animate: {
    y: [0, -12, 0],
    transition: {
      repeat: Infinity,
      duration: 6,
      ease: 'easeInOut',
    },
  },
};

// 摇晃动画（用于错误提示）
export const shakeAnimation = {
  animate: {
    x: [0, -6, 6, -4, 4, 0],
    transition: {
      duration: 0.4,
      ease: 'easeInOut',
    },
  },
};
