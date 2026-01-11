import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';
import { theme } from './src/styles/theme';

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary colors (keeping compatibility + v2.0 enhancements)
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
        // NEW v2.0: Enhanced color system
        success: theme.colors.success,
        error: theme.colors.error,
        warning: theme.colors.warning,
        neutral: theme.colors.neutral,
        
        // Legacy compatibility
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
        sans: theme.typography.fontFamily.sans,
        display: theme.typography.fontFamily.display,
        mono: theme.typography.fontFamily.mono,
      },
      fontSize: theme.typography.fontSize,
      fontWeight: theme.typography.fontWeight,
      borderRadius: theme.borderRadius,
      boxShadow: theme.shadows,
      
      // NEW v2.0: Background gradients
      backgroundImage: {
        'gradient-primary': theme.colors.gradients.primary,
        'gradient-success': theme.colors.gradients.success,
        'gradient-error': theme.colors.gradients.error,
        'gradient-warning': theme.colors.gradients.warning,
        'gradient-info': theme.colors.gradients.info,
        'gradient-purple': theme.colors.gradients.purple,
        'gradient-blue': theme.colors.gradients.blue,
        'gradient-sunset': theme.colors.gradients.sunset,
        'gradient-ocean': theme.colors.gradients.ocean,
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
        // NEW v2.0: Additional animations
        ...theme.animations,
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
        shimmer: 'shimmer 1.5s infinite',
        // NEW v2.0
        'bounce-subtle': 'bounceSubtle 0.5s ease-in-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      
      // NEW v2.0: Transitions
      transitionDuration: {
        fast: theme.transitions.fast,
        base: theme.transitions.base,
        slow: theme.transitions.slow,
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
