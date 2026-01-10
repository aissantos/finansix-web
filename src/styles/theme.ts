/**
 * Finansix v2.0 - Elite Fintech Theme
 * Paleta moderna com gradientes e glassmorphism
 */

export const theme = {
  colors: {
    // Primary Gradient (Azul vibrante → Roxo)
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },

    // Success (Verde vibrante)
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },

    // Error (Vermelho suave mas vibrante)
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    },

    // Warning (Amarelo/Laranja vibrante)
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
      gradient: 'linear-gradient(135deg, #fad0c4 0%, #ffd1ff 100%)',
    },

    // Neutral (Cinzas modernos)
    neutral: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
      950: '#0a0a0a',
    },

    // Glass Effects
    glass: {
      light: 'rgba(255, 255, 255, 0.1)',
      lightBorder: 'rgba(255, 255, 255, 0.2)',
      dark: 'rgba(0, 0, 0, 0.2)',
      darkBorder: 'rgba(255, 255, 255, 0.1)',
    },

    // Gradients
    gradients: {
      primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      success: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
      error: 'linear-gradient(135deg, #ee0979 0%, #ff6a00 100%)',
      warning: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
      info: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      purple: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      blue: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      sunset: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      ocean: 'linear-gradient(135deg, #2e3192 0%, #1bffff 100%)',
    },
  },

  // Typography (Inter font)
  typography: {
    fontFamily: {
      sans: '"Inter var", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      display: '"Sora", "Inter var", sans-serif',
      mono: '"JetBrains Mono", "Fira Code", monospace',
    },
    fontSize: {
      xs: '0.75rem',      // 12px
      sm: '0.875rem',     // 14px
      base: '1rem',       // 16px
      lg: '1.125rem',     // 18px
      xl: '1.25rem',      // 20px
      '2xl': '1.5rem',    // 24px
      '3xl': '1.875rem',  // 30px
      '4xl': '2.25rem',   // 36px
      '5xl': '3rem',      // 48px
      '6xl': '3.75rem',   // 60px
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
      black: 900,
    },
  },

  // Spacing
  spacing: {
    px: '1px',
    0: '0',
    0.5: '0.125rem',
    1: '0.25rem',
    1.5: '0.375rem',
    2: '0.5rem',
    2.5: '0.625rem',
    3: '0.75rem',
    3.5: '0.875rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    7: '1.75rem',
    8: '2rem',
    9: '2.25rem',
    10: '2.5rem',
    12: '3rem',
    14: '3.5rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    28: '7rem',
    32: '8rem',
  },

  // Border Radius
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    DEFAULT: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.5rem',
    '3xl': '2rem',
    full: '9999px',
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    none: 'none',
    // Glassmorphism shadows
    glass: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
    glassHover: '0 12px 40px 0 rgba(31, 38, 135, 0.25)',
  },

  // Animations
  animations: {
    // Bounce subtle
    bounceSubtle: {
      '0%, 100%': { transform: 'translateY(0)' },
      '50%': { transform: 'translateY(-5%)' },
    },
    // Pulse soft
    pulseSoft: {
      '0%, 100%': { opacity: 1 },
      '50%': { opacity: 0.8 },
    },
    // Shimmer (loading effect)
    shimmer: {
      '0%': { backgroundPosition: '-1000px 0' },
      '100%': { backgroundPosition: '1000px 0' },
    },
    // Slide up
    slideUp: {
      from: { transform: 'translateY(100%)', opacity: 0 },
      to: { transform: 'translateY(0)', opacity: 1 },
    },
    // Fade in
    fadeIn: {
      from: { opacity: 0 },
      to: { opacity: 1 },
    },
    // Scale in
    scaleIn: {
      from: { transform: 'scale(0.9)', opacity: 0 },
      to: { transform: 'scale(1)', opacity: 1 },
    },
  },

  // Timing functions
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '350ms cubic-bezier(0.4, 0, 0.2, 1)',
    spring: '500ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },

  // Z-index layers
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    fixed: 1200,
    modalBackdrop: 1300,
    modal: 1400,
    popover: 1500,
    tooltip: 1600,
  },
};

// CSS Variables for dynamic theming
export const cssVariables = `
  :root {
    --color-primary: ${theme.colors.primary[600]};
    --color-primary-hover: ${theme.colors.primary[700]};
    --color-success: ${theme.colors.success[500]};
    --color-error: ${theme.colors.error[500]};
    --color-warning: ${theme.colors.warning[500]};
    
    --gradient-primary: ${theme.colors.gradients.primary};
    --gradient-success: ${theme.colors.gradients.success};
    --gradient-error: ${theme.colors.gradients.error};
    
    --font-sans: ${theme.typography.fontFamily.sans};
    --font-display: ${theme.typography.fontFamily.display};
    
    --radius-base: ${theme.borderRadius.DEFAULT};
    --radius-lg: ${theme.borderRadius.lg};
    
    --shadow-glass: ${theme.shadows.glass};
    
    --transition-fast: ${theme.transitions.fast};
    --transition-base: ${theme.transitions.base};
  }
`;
