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
          blue: '#7C8DA6',        // --color-primary
          'blue-dark': '#5A6B82', // --color-primary-dark
          'blue-light': '#A8B5C7',// --color-primary-light
          gray: '#8E99A8',        // --color-text-secondary
          'gray-light': '#A8B5C7',// --color-primary-light (复用)
          'gray-dark': '#5A6478', // --color-text-placeholder
          green: '#7FA87A',       // --color-success
          'green-light': '#A3C4AD',
          coral: '#B87C7C',       // --color-error
          'coral-light': '#D4ADA9',
          purple: '#9B8EC4',      // --color-accent
          'purple-light': '#B8ADCF',
          cream: '#E8ECF1',       // --color-text-primary
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
