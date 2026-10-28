import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { Colors, ThemeColors, ThemeType } from '@/constants/theme';

interface ThemeContextValue {
  theme: ThemeType;
  colors: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (t: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeType>('dark'); // Default to Gitiseir Dark Luxury theme

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const setTheme = useCallback((t: ThemeType) => {
    setThemeState(t);
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    return {
      theme,
      colors: Colors[theme],
      isDark: theme === 'dark',
      toggleTheme,
      setTheme,
    };
  }, [theme, toggleTheme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within an AppThemeProvider');
  }
  return context;
}
