import { useEffect, useState, useRef } from 'react';
import { readSave, saveWrite } from '../lib/system/saveClient';

export type Theme = 'system' | 'light' | 'dark';

const THEME_STORAGE_KEY = 'sparcclen_theme';
const FIRST_TIME_KEY = 'sparcclen_first_time';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
      if (stored && ['system', 'light', 'dark'].includes(stored)) return stored;
      return 'system'; // Default to system theme
    } catch {
      return 'system';
    }
  });

  const [isFirstTime, setIsFirstTime] = useState(() => {
    try {
      return localStorage.getItem(FIRST_TIME_KEY) === null;
    } catch {
      return true;
    }
  });

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionTheme, setTransitionTheme] = useState<'light' | 'dark'>('light');
  const [pendingTheme, setPendingTheme] = useState<Theme | null>(null);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    
    // Save theme to localStorage with error handling
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error);
    }

    // Persist to OS save file (best-effort)
    (async () => {
      try { await saveWrite({ theme }); } catch {}
    })();
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

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const setTheme = (newTheme: Theme) => {
    // Clear any existing debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // If currently transitioning, queue the new theme
    if (isTransitioning) {
      setPendingTheme(newTheme);
      return;
    }
    
    const currentResolved = getResolvedTheme();
    const newResolved = newTheme === 'system' 
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : newTheme as 'light' | 'dark';
    
    // Only trigger transition if theme actually changes
    if (currentResolved !== newResolved) {
      setTransitionTheme(newResolved);
      setIsTransitioning(true);
      setPendingTheme(null);
      
      // Apply theme change after a short delay to allow transition to start
      debounceTimeoutRef.current = setTimeout(() => {
        setThemeState(newTheme);
      }, 50);
      
      // Safety timeout to prevent getting stuck in transition
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
      transitionTimeoutRef.current = setTimeout(() => {
        console.warn('Theme transition timeout - forcing completion');
        setIsTransitioning(false);
      }, 750);
    } else {
      setThemeState(newTheme);
      setPendingTheme(null);
    }
  };

  const handleTransitionComplete = () => {
    setIsTransitioning(false);
    
    // Clear the safety timeout
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }
    
    // If there's a pending theme change, apply it after a short delay
    if (pendingTheme) {
      const nextTheme = pendingTheme;
      setPendingTheme(null);
      
      setTimeout(() => {
        setTheme(nextTheme);
      }, 100);
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system';
    setTheme(nextTheme);
  };

  const markFirstTimeComplete = () => {
    try {
      localStorage.setItem(FIRST_TIME_KEY, 'false');
      setIsFirstTime(false);
    } catch (error) {
      console.warn('Failed to save first time flag to localStorage:', error);
      setIsFirstTime(false);
    }

    // Persist to OS save file (best-effort)
    (async () => {
      try { await saveWrite({ firstRun: false }); } catch {}
    })();
  };

  // On mount, sync theme and firstRun from OS save file if available
  useEffect(() => {
    (async () => {
      try {
        const s = await readSave();
        if (s) {
          // Update theme if different
          if (s.theme && s.theme !== theme) {
            setTheme(s.theme);
          }
          // Update firstRun
          setIsFirstTime(!!s.firstRun);
        }
      } catch {
        // ignore
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
