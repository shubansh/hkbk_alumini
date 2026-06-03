import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

const THEMES = ['midnight-blue', 'soft-light', 'glassmorphism', 'aurora'];

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('hkbk-theme') || 'midnight-blue';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    // Remove all old classes and data-theme
    root.classList.remove('light', 'dark');
    
    // Validate theme, fallback to midnight-blue
    const validTheme = THEMES.includes(theme) ? theme : 'midnight-blue';
    root.setAttribute('data-theme', validTheme);
    
    // For legacy tailwind support during transition, if it's soft-light it's light mode, else dark
    if (validTheme === 'soft-light') {
      root.classList.add('light');
    } else {
      root.classList.add('dark');
    }

    localStorage.setItem('hkbk-theme', validTheme);
  }, [theme]);

  const cycleTheme = () => {
    setTheme(prev => {
      const currentIndex = THEMES.indexOf(prev);
      const nextIndex = (currentIndex + 1) % THEMES.length;
      return THEMES[nextIndex];
    });
  };

  const toggleTheme = cycleTheme;

  const value = { theme, setTheme, toggleTheme, cycleTheme, availableThemes: THEMES };

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
