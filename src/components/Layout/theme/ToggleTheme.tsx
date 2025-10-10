import React, { useState, useEffect, useRef } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTheme } from './ThemeProvider';
import { useThemeRateLimit } from '@/hooks/useThemeRateLimit';

const THEME_OPTIONS = [
  {
    icon: Monitor,
    value: 'system' as const,
    label: 'System'
  },
  {
    icon: Sun,
    value: 'light' as const,
    label: 'Light'
  },
  {
    icon: Moon,
    value: 'dark' as const,
    label: 'Dark'
  },
];

export function ToggleTheme() {
  const { theme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipMessage, setTooltipMessage] = useState('');
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const {
    canSwitch,
    recordSwitch,
    handleRateLimitViolation,
    isRateLimited,
    isCooldownActive,
    remainingCooldownTime
  } = useThemeRateLimit();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
    };
  }, []);

  const showTooltipMessage = (message: string, duration = 2000) => {
    setTooltipMessage(message);
    setShowTooltip(true);
    
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }
    
    tooltipTimeoutRef.current = setTimeout(() => {
      setShowTooltip(false);
    }, duration);
  };

  const handleThemeClick = (newTheme: typeof theme) => {
    const switchCheck = canSwitch();
    
    if (!switchCheck.allowed) {
      showTooltipMessage(switchCheck.reason || "Please wait", 
        switchCheck.reason?.includes("Cooldown") ? 3000 : 2000);
      handleRateLimitViolation();
      return;
    }
    
    // Record this switch attempt
    recordSwitch((_remainingTime) => {
      showTooltipMessage("Too many switches! 60s cooldown activated", 3000);
    });
    
    // Allow the theme change
    setTheme(newTheme);
  };
  if (!isMounted) {
    return <div className="flex h-8 w-24" />;
  }

  return (
    <div className="flex items-center gap-2 relative">
      {isCooldownActive && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-red-600 text-white text-xs font-bold rounded-md px-2 py-1 h-6 min-w-[1.5rem] flex items-center justify-center shadow-lg"
        >
          {remainingCooldownTime}
        </motion.div>
      )}
      {THEME_OPTIONS.map((option) => (
        <button
          key={option.value}
          className={cn(
            'relative flex size-8 items-center justify-center rounded-md transition-all duration-200',
            (isRateLimited || isCooldownActive)
              ? 'cursor-not-allowed text-red-500 dark:text-red-400' 
              : 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800',
            !(isRateLimited || isCooldownActive) && theme === option.value
              ? 'text-indigo-600 dark:text-indigo-400 bg-gray-100 dark:bg-gray-800'
              : !(isRateLimited || isCooldownActive) && 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white',
            (isRateLimited || isCooldownActive) && "border-2 border-red-400 dark:border-red-600 bg-red-50/80 dark:bg-red-950/80",
            isCooldownActive && "animate-pulse"
          )}
          role="radio"
          aria-checked={theme === option.value}
          aria-label={`Switch to ${option.label} theme`}
          onClick={() => handleThemeClick(option.value)}
          title={(isRateLimited || isCooldownActive) ? "Rate limited - slow down!" : `Switch to ${option.label} theme`}
          disabled={isRateLimited || isCooldownActive}
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <option.icon className={cn(
            "size-3.5 relative z-10 transition-all duration-200",
            (isRateLimited || isCooldownActive) && "animate-pulse"
          )} />
        </button>
      ))}

      {/* Rate Limit Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -10 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className={cn(
              "px-3 py-2 rounded-lg text-xs font-medium shadow-lg whitespace-nowrap backdrop-blur-sm border",
              isCooldownActive 
                ? "bg-red-600/90 text-white border-red-500" 
                : "bg-orange-500/90 text-white border-orange-400"
            )}>
              <div className="relative">
                {tooltipMessage}
                {/* Arrow pointing down */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                  <div className={cn(
                    "w-2 h-2 rotate-45 border-r border-b",
                    isCooldownActive 
                      ? "bg-red-600/90 border-red-500" 
                      : "bg-orange-500/90 border-orange-400"
                  )}></div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
