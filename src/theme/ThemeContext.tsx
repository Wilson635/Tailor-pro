import React, { createContext, useContext, useMemo } from 'react';
import type { Palette, ResolvedTheme, ThemeScheme } from './palette';
import { getPalette } from './palette';

type ThemeContextValue = {
  scheme: ThemeScheme;
  resolved: ResolvedTheme;
  isDark: boolean;
  colors: Palette;
  setScheme: (scheme: ThemeScheme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider: React.FC<{
  scheme: ThemeScheme;
  resolved: ResolvedTheme;
  setScheme: (scheme: ThemeScheme) => void;
  children: React.ReactNode;
}> = ({ scheme, resolved, setScheme, children }) => {
  const value = useMemo<ThemeContextValue>(() => ({
    scheme,
    resolved,
    isDark: resolved === 'dark',
    colors: getPalette(resolved),
    setScheme,
  }), [scheme, resolved, setScheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
};
