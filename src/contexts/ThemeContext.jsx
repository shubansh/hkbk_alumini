import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // Support: 'light', 'dark', 'midnight'
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('hkbk-theme') || 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;

    // Remove all theme classes and data attributes first
    root.classList.remove('light', 'dark');
    root.removeAttribute('data-theme');

    if (theme === 'light') {
      root.classList.add('light');
    } else if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'midnight') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'midnight');
    } else {
      // fallback
      root.classList.add('dark');
    }

    localStorage.setItem('hkbk-theme', theme);
  }, [theme]);

  /** Simple two-way toggle: light ↔ dark */
  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  /** Cycle through all themes: light → dark → midnight → light */
  const cycleTheme = () =>
    setTheme(prev => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'midnight';
      return 'light';
    });

  const value = { theme, setTheme, toggleTheme, cycleTheme };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
