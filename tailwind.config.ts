import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        morandi: {
          blue: '#7C8DA6',
          'blue-dark': '#5A6B82',
          'blue-light': '#A8B5C7',
          gray: '#8E99A8',
          'gray-light': '#A8B5C7',
          'gray-dark': '#5A6478',
          green: '#7FA87A',
          'green-light': '#A3C4AD',
          coral: '#B87C7C',
          'coral-light': '#D4ADA9',
          purple: '#9B8EC4',
          'purple-light': '#B8ADCF',
          cream: '#E8ECF1',
          'cream-dark': '#D4CFC8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans SC', 'system-ui', 'sans-serif'],
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
        'shake': 'shake 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        'float': 'float 6s ease-in-out infinite',
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
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(124, 141, 166, 0.3)' },
          '50%': { boxShadow: '0 0 0 8px rgba(124, 141, 166, 0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-6px)' },
          '40%': { transform: 'translateX(6px)' },
          '60%': { transform: 'translateX(-4px)' },
          '80%': { transform: 'translateX(4px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
        '4xl': '24px',
      },
    },
  },
  plugins: [],
}

export default config
