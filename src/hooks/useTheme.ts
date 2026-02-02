import { useEffect, useState, useMemo } from 'react';
import { applyTheme, getSavedTheme } from '@/lib/themes';

type ThemeMode = 'light' | 'dark' | 'system';

export function useTheme() {
  // Mode State (Light/Dark)
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme-mode') as ThemeMode) || 'system';
    }
    return 'system';
  });

  // Color Theme State
  const [colorTheme, setColorThemeState] = useState<string>(() => getSavedTheme());

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem('theme-mode', newMode);
  };

  const setColorTheme = (newThemeId: string) => {
    setColorThemeState(newThemeId);
    applyTheme(newThemeId);
  };

  // Derived state: isDark
  const isDark = useMemo(() => {
    if (mode === 'light') return false;
    if (mode === 'dark') return true;
    
    // System mode
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    
    return false;
  }, [mode]);

  // Effect: Handle System Changes
  useEffect(() => {
    if (mode !== 'system') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      // Force re-render to update isDark if needed, though usually class toggle is enough
      // But for React state consistency we might want to know
      // Actually we manipulate DOM directly for the class
      document.documentElement.classList.toggle('dark', e.matches);
    };
    
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [mode]);

  // Effect: Apply Dark Class
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Effect: Apply Color Theme on mount
  useEffect(() => {
    applyTheme(colorTheme);
  }, [colorTheme, mode]); // Run when theme changes

  return { 
    mode, 
    setMode, 
    isDark,
    colorTheme,
    setColorTheme
  };
}
