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
          blue: '#6B7FA3',
          'blue-dark': '#4A5C7A',
          'blue-light': '#8FA3C4',
          gray: '#9BA4B5',
          'gray-light': '#C5CCD6',
          'gray-dark': '#5A6275',
          green: '#7FA08A',
          'green-light': '#A3C4AD',
          coral: '#C4918F',
          'coral-light': '#D4ADA9',
          purple: '#9A8ABF',
          'purple-light': '#B8ADCF',
          cream: '#E8E4DF',
          'cream-dark': '#D4CFC8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(107, 127, 163, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(107, 127, 163, 0.6)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
