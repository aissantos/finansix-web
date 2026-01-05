import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#135bec',
          dark: '#0a44bf',
          light: '#4080f5',
          50: '#eef4ff',
          100: '#d9e6ff',
          200: '#bcd4ff',
          300: '#8eb9ff',
          400: '#5994ff',
          500: '#135bec',
          600: '#0a44bf',
          700: '#0835a0',
          800: '#0b2d84',
          900: '#0f2a6d',
        },
        background: {
          light: '#f6f6f8',
          dark: '#101622',
        },
        surface: {
          light: '#ffffff',
          dark: '#1e293b',
        },
        expense: '#ef4444',
        income: '#22c55e',
        card: {
          nubank: '#820AD1',
          inter: '#FF7A00',
          itau: '#EC7000',
          xp: '#101622',
          c6: '#1a1a1a',
          bradesco: '#cc092f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
        shimmer: 'shimmer 1.5s infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
