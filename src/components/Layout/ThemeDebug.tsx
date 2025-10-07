import React, { useEffect, useState } from 'react';
import { useTheme } from './ThemeProvider';

export function ThemeDebug() {
  const { theme, resolvedTheme, setTheme, isTransitioning } = useTheme();
  const [htmlClass, setHtmlClass] = useState('');

  useEffect(() => {
    const updateHtmlClass = () => {
      setHtmlClass(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    };
    
    updateHtmlClass();
    
    // Observer to watch for class changes
    const observer = new MutationObserver(updateHtmlClass);
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });
    
    return () => observer.disconnect();
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 p-3 bg-background border border-input rounded-lg shadow-lg text-xs font-mono max-w-xs">
      <h3 className="text-sm font-bold text-foreground mb-2">Theme Debug</h3>
      <div className="space-y-1 text-muted-foreground">
        <div>Theme: <span className="text-primary">{theme}</span></div>
        <div>Resolved: <span className="text-primary">{resolvedTheme}</span></div>
        <div>HTML Class: <span className="text-primary">{htmlClass}</span></div>
        <div>Transitioning: <span className={isTransitioning ? "text-yellow-500" : "text-green-500"}>{isTransitioning ? 'Yes' : 'No'}</span></div>
        <div className="text-[10px] opacity-75">BG: {getComputedStyle(document.documentElement).backgroundColor.slice(0, 20)}</div>
      </div>
      
      <div className="mt-2 flex gap-1">
        <button
          onClick={() => setTheme('light')}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            theme === 'light' 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          Light
        </button>
        <button
          onClick={() => setTheme('dark')}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            theme === 'dark' 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          Dark
        </button>
        <button
          onClick={() => setTheme('system')}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            theme === 'system' 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          System
        </button>
      </div>
    </div>
  );
}