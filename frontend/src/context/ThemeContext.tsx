import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark'; // The actual theme being applied after resolving 'system'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('worktwin-theme');
    return (saved as Theme) || 'system';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    localStorage.setItem('worktwin-theme', theme);

    const applyTheme = (resolved: 'light' | 'dark') => {
      const root = window.document.documentElement;
      setResolvedTheme(resolved);
      if (resolved === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    if (theme === 'system') {
      const systemQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(systemQuery.matches ? 'dark' : 'light');

      const listener = (e: MediaQueryListEvent) => applyTheme(e.matches ? 'dark' : 'light');
      systemQuery.addEventListener('change', listener);
      return () => systemQuery.removeEventListener('change', listener);
    } else {
      applyTheme(theme);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
