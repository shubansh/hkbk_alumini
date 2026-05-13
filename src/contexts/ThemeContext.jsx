import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // Support: 'light', 'dark', 'midnight', 'glassmorphism'
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
      root.classList.add('dark'); // base tailwind dark mode
      root.setAttribute('data-theme', 'midnight');
    } else if (theme === 'glassmorphism') {
      root.classList.add('dark'); // base tailwind dark mode
      root.setAttribute('data-theme', 'glassmorphism');
    }

    localStorage.setItem('hkbk-theme', theme);
  }, [theme]);

  const value = { theme, setTheme };

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
