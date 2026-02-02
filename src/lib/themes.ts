export interface ThemeColors {
  id: string;
  name: string;
  primary: string;
  primaryForeground: string;
  income: string;
  expense: string;
  accent: string;
}

export const PRESET_THEMES: ThemeColors[] = [
  {
    id: 'default',
    name: 'Índigo (Padrão)',
    primary: '79 70 229', // indigo-600
    primaryForeground: '255 255 255',
    income: '34 197 94', // green-500
    expense: '239 68 68', // red-500
    accent: '139 92 246', // violet-500
  },
  {
    id: 'ocean',
    name: 'Oceano',
    primary: '6 182 212', // cyan-500
    primaryForeground: '255 255 255',
    income: '52 211 153', // emerald-400
    expense: '251 146 60', // orange-400
    accent: '56 189 248', // sky-400
  },
  {
    id: 'sunset',
    name: 'Pôr do Sol',
    primary: '249 115 22', // orange-500
    primaryForeground: '255 255 255',
    income: '34 197 94',
    expense: '220 38 38',
    accent: '251 191 36', // amber-400
  },
  {
    id: 'forest',
    name: 'Floresta',
    primary: '22 163 74', // green-600
    primaryForeground: '255 255 255',
    income: '74 222 128', // green-400
    expense: '248 113 113', // red-400
    accent: '34 197 94',
  },
  {
    id: 'monochrome',
    name: 'Monocromático',
    primary: '31 41 55', // gray-800
    primaryForeground: '255 255 255',
    income: '75 85 99', // gray-600
    expense: '0 0 0', // black
    accent: '107 114 128', // gray-500
  },
];

// Apply theme via CSS variables to root
export function applyTheme(themeId: string) {
  const theme = PRESET_THEMES.find(t => t.id === themeId) || PRESET_THEMES[0];
  const root = document.documentElement;
  
  // Format: "R G B" for Tailwind usage with opacity/alpha modifiers
  // Only setting custom main colors, leaving shadcn defaults for structural greys
  root.style.setProperty('--primary', theme.primary);
  root.style.setProperty('--primary-foreground', theme.primaryForeground);
  
  // Custom functional colors
  root.style.setProperty('--income', theme.income);
  root.style.setProperty('--expense', theme.expense);
  root.style.setProperty('--accent', theme.accent);
  
  localStorage.setItem('finansix-theme', theme.id);
}

export function getSavedTheme(): string {
  return localStorage.getItem('finansix-theme') || 'default';
}
