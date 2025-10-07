import React from 'react';
import { useTheme } from '../../hooks/useTheme';
import { ThemeTransition } from './ThemeTransition';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { isTransitioning, transitionTheme, handleTransitionComplete } = useTheme();

  return (
    <>
      {children}
      <ThemeTransition
        isTransitioning={isTransitioning}
        newTheme={transitionTheme}
        onTransitionComplete={handleTransitionComplete}
      />
    </>
  );
}
