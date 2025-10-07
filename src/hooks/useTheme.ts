import { useEffect, useState } from 'react';

export type Theme = 'system' | 'light' | 'dark';

const THEME_STORAGE_KEY = 'sparcclen_theme';
const FIRST_TIME_KEY = 'sparcclen_first_time';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    if (stored) return stored;
    return 'system'; // Default to system theme
  });

  const [isFirstTime, setIsFirstTime] = useState(() => {
    return localStorage.getItem(FIRST_TIME_KEY) === null;
  });

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionTheme, setTransitionTheme] = useState<'light' | 'dark'>('light');

  // Get the actual theme to apply (resolves 'system' to light/dark)
  const getResolvedTheme = (): 'light' | 'dark' => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme as 'light' | 'dark';
  };

  const resolvedTheme = getResolvedTheme();

  useEffect(() => {
    const root = document.documentElement;
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme, resolvedTheme]);

  // Listen for system theme changes when using system theme
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        const root = document.documentElement;
        if (mediaQuery.matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    const currentResolved = getResolvedTheme();
    const newResolved = newTheme === 'system' 
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : newTheme as 'light' | 'dark';
    
    // Only trigger transition if theme actually changes
    if (currentResolved !== newResolved) {
      setTransitionTheme(newResolved);
      setIsTransitioning(true);
      
      // Apply theme change after a short delay to allow transition to start
      setTimeout(() => {
        setThemeState(newTheme);
      }, 50);
    } else {
      setThemeState(newTheme);
    }
  };

  const handleTransitionComplete = () => {
    setIsTransitioning(false);
  };

  const toggleTheme = () => {
    setThemeState(prev => {
      if (prev === 'system') return 'light';
      if (prev === 'light') return 'dark';
      return 'system';
    });
  };

  const markFirstTimeComplete = () => {
    localStorage.setItem(FIRST_TIME_KEY, 'false');
    setIsFirstTime(false);
  };

  return { 
    theme, 
    resolvedTheme,
    setTheme, 
    toggleTheme, 
    isFirstTime,
    markFirstTimeComplete,
    isTransitioning,
    transitionTheme,
    handleTransitionComplete
  };
}
