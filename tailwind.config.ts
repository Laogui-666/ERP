import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/shared/**/*.{js,ts,jsx,tsx,mdx}',
    './src/modules/**/*.{js,ts,jsx,tsx,mdx}',
    './src/design-system/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // 莫兰迪色系 - 玻璃拟态主题
        glass: {
          // 主色调 - 莫兰迪蓝灰
          primary: '#A8B8C8',
          primaryLight: '#C8D8E8',
          primaryDark: '#8898A8',
          
          // 辅助色 - 莫兰迪粉
          secondary: '#E8D8C8',
          secondaryLight: '#F8E8D8',
          secondaryDark: '#D8C8B8',
          
          // 莫兰迪绿
          accent: '#C8D8C8',
          accentLight: '#D8E8D8',
          accentDark: '#B8C8B8',
          
          // 莫兰迪黄
          warning: '#E8E8C8',
          warningLight: '#F8F8D8',
          warningDark: '#D8D8B8',
          
          // 莫兰迪红
          danger: '#E8C8C8',
          dangerLight: '#F8D8D8',
          dangerDark: '#D8B8B8',
          
          // 中性色
          neutral: {
            50: '#F8F8F8',
            100: '#F0F0F0',
            200: '#E8E8E8',
            300: '#D8D8D8',
            400: '#C8C8C8',
            500: '#A8A8A8',
            600: '#888888',
            700: '#686868',
            800: '#484848',
            900: '#282828',
          },
          
          // 背景色
          bg: {
            primary: '#F8F8F8',
            secondary: '#F0F0F0',
            card: 'rgba(255, 255, 255, 0.8)',
            modal: 'rgba(255, 255, 255, 0.9)',
          },
          
          // 文字色
          text: {
            primary: '#282828',
            secondary: '#484848',
            muted: '#686868',
            light: '#888888',
          },
          
          // 边框色
          border: {
            light: 'rgba(255, 255, 255, 0.5)',
            medium: 'rgba(255, 255, 255, 0.3)',
            dark: 'rgba(255, 255, 255, 0.1)',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans SC', 'system-ui', 'sans-serif'],
        display: ['Inter', 'Noto Sans SC', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Menlo', 'monospace'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem', letterSpacing: '-0.01em' }],
        sm: ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '-0.01em' }],
        base: ['1rem', { lineHeight: '1.5rem', letterSpacing: '-0.01em' }],
        lg: ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
        xl: ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.02em' }],
        '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.02em' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.03em' }],
        '5xl': ['3rem', { lineHeight: '3.5rem', letterSpacing: '-0.03em' }],
      },
      spacing: {
        '0.5': '0.125rem',
        '1': '0.25rem',
        '1.5': '0.375rem',
        '2': '0.5rem',
        '2.5': '0.625rem',
        '3': '0.75rem',
        '3.5': '0.875rem',
        '4': '1rem',
        '5': '1.25rem',
        '6': '1.5rem',
        '7': '1.75rem',
        '8': '2rem',
        '9': '2.25rem',
        '10': '2.5rem',
        '11': '2.75rem',
        '12': '3rem',
        '14': '3.5rem',
        '16': '4rem',
        '20': '5rem',
        '24': '6rem',
        '28': '7rem',
        '32': '8rem',
        '36': '9rem',
        '40': '10rem',
        '44': '11rem',
        '48': '12rem',
        '52': '13rem',
        '56': '14rem',
        '60': '15rem',
        '64': '16rem',
        '72': '18rem',
        '80': '20rem',
        '96': '24rem',
      },
      borderRadius: {
        none: '0',
        sm: '0.125rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
        'glass': '1.75rem',
        'glass-sm': '1.25rem',
        'glass-lg': '2.25rem',
        full: '9999px',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        // 玻璃拟态阴影
        'glass-soft': '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
        'glass-medium': '0 8px 24px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.06)',
        'glass-strong': '0 16px 32px rgba(0, 0, 0, 0.16), 0 8px 16px rgba(0, 0, 0, 0.08)',
        'glass-inset': 'inset 2px 2px 4px rgba(255, 255, 255, 0.7), inset -2px -2px 4px rgba(0, 0, 0, 0.1)',
        'glass-glow': '0 0 20px rgba(255, 255, 255, 0.5), 0 4px 12px rgba(0, 0, 0, 0.1)',
      },
      backdropBlur: {
        none: '0',
        sm: '4px',
        DEFAULT: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '40px',
        '3xl': '64px',
        // 玻璃拟态模糊
        'glass-sm': '12px',
        'glass': '20px',
        'glass-lg': '28px',
      },
      transitionTimingFunction: {
        'ease-default': 'cubic-bezier(0.2, 0.8, 0.4, 1)',
        'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
        'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
        'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'ease-spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'ease-damping': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },
      transitionDuration: {
        '75': '75ms',
        '100': '100ms',
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
        '500': '500ms',
        '700': '700ms',
        '1000': '1000ms',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
        'fade-in-down': 'fadeInDown 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
        'fade-in-left': 'fadeInLeft 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
        'fade-in-right': 'fadeInRight 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
        'scale-in': 'scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'spring-in': 'springIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'pulse-glow': 'pulseGlow 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite',
        'shimmer': 'shimmer 1.8s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'fade-out': 'fadeOut 0.3s ease-in forwards',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        fadeInRight: {
          '0%': { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        springIn: {
          '0%': { opacity: '0', transform: 'scale(0.8) translateY(20px)' },
          '60%': { opacity: '1', transform: 'scale(1.02) translateY(-4px)' },
          '80%': { transform: 'scale(0.99) translateY(1px)' },
          '100%': { transform: 'scale(1) translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(168, 184, 200, 0.3)' },
          '50%': { boxShadow: '0 0 0 12px rgba(168, 184, 200, 0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

export default config