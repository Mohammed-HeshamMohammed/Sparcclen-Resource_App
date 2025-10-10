import React, { createContext, useContext } from 'react';
import { useTheme as useThemeHook } from '@/hooks/useTheme';
import { ThemeTransition } from './ThemeTransition';
import type { Theme } from '@/hooks/useTheme';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isFirstTime: boolean;
  markFirstTimeComplete: () => void;
  isTransitioning: boolean;
  transitionTheme: 'light' | 'dark';
  handleTransitionComplete: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const themeData = useThemeHook();
  const { isTransitioning, transitionTheme, handleTransitionComplete } = themeData;

  return (
    <ThemeContext.Provider value={themeData}>
      {children}
      <ThemeTransition
        isTransitioning={isTransitioning}
        newTheme={transitionTheme}
        onTransitionComplete={handleTransitionComplete}
      />
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
