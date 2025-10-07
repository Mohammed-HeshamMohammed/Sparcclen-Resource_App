import React, { useState, useEffect, useRef } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { useTheme } from './ThemeProvider';

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
  const [switchCount, setSwitchCount] = useState(0);
  const [lastSwitchTime, setLastSwitchTime] = useState(0);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [isCooldownActive, setIsCooldownActive] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipMessage, setTooltipMessage] = useState('');
  const [cooldownEndTime, setCooldownEndTime] = useState(0);
  const [remainingCooldownTime, setRemainingCooldownTime] = useState(0);
  const switchTimestamps = useRef<number[]>([]);
  const cooldownTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (cooldownTimeoutRef.current) clearTimeout(cooldownTimeoutRef.current);
      if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  // Check if user has exceeded rate limit (4+ switches in 1 minute)
  const checkRateLimit = () => {
    const now = Date.now();
    const oneMinuteAgo = now - 60000; // 1 minute ago
    
    // Clean up old timestamps
    switchTimestamps.current = switchTimestamps.current.filter(time => time > oneMinuteAgo);
    
    return switchTimestamps.current.length >= 4;
  };

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
    const now = Date.now();
    
    // If in cooldown mode, just show tooltip
    if (isCooldownActive) {
      const remainingTime = Math.ceil((cooldownEndTime - now) / 1000);
      showTooltipMessage(`Cooldown: ${remainingTime}s remaining`);
      return;
    }
    
    // If clicked too soon (within 1 second), show rate limit message
    if (now - lastSwitchTime < 1000) {
      setIsRateLimited(true);
      const remainingTime = Math.ceil((1000 - (now - lastSwitchTime)) / 100) / 10;
      showTooltipMessage(`Wait ${remainingTime}s between switches`);
      
      // Clear rate limit after the remaining time
      setTimeout(() => {
        setIsRateLimited(false);
      }, 1000 - (now - lastSwitchTime));
      
      return;
    }
    
    // Check if this would exceed the rate limit
    if (checkRateLimit()) {
      // Activate 1-minute cooldown
      setIsCooldownActive(true);
      const cooldownEnd = now + 60000; // 1 minute from now
      setCooldownEndTime(cooldownEnd);
      setRemainingCooldownTime(60);
      
      showTooltipMessage("Too many switches! 60s cooldown activated", 3000);
      
      // Start countdown timer
      countdownIntervalRef.current = setInterval(() => {
        const currentTime = Date.now();
        const remaining = Math.ceil((cooldownEnd - currentTime) / 1000);
        setRemainingCooldownTime(remaining);
        
        if (remaining <= 0) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
          }
        }
      }, 1000);
      
      // Set timeout to clear cooldown
      cooldownTimeoutRef.current = setTimeout(() => {
        setIsCooldownActive(false);
        switchTimestamps.current = []; // Clear timestamps
        setCooldownEndTime(0);
        setRemainingCooldownTime(0);
        
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
        }
      }, 60000);
      
      return;
    }
    
    // Record this switch attempt
    switchTimestamps.current.push(now);
    setLastSwitchTime(now);
    setSwitchCount(prev => prev + 1);
    
    // Allow the theme change
    setTheme(newTheme);
  };

  if (!isMounted) {
    return <div className="flex h-8 w-24" />;
  }

  return (
    <div className="relative">
      <motion.div
        key={String(isMounted)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg inline-flex items-center overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-200",
          (isRateLimited || isCooldownActive) && "border-red-400 dark:border-red-600 bg-red-50/80 dark:bg-red-950/80",
          isCooldownActive && "animate-pulse"
        )}
        role="radiogroup"
      >
        {THEME_OPTIONS.map((option) => (
          <button
            key={option.value}
            className={cn(
              'relative flex size-8 items-center justify-center rounded-md transition-all duration-200',
              (isRateLimited || isCooldownActive)
                ? 'cursor-not-allowed text-red-500 dark:text-red-400' 
                : 'cursor-pointer',
              !(isRateLimited || isCooldownActive) && theme === option.value
                ? 'text-indigo-600 dark:text-indigo-400'
                : !(isRateLimited || isCooldownActive) && 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            )}
            role="radio"
            aria-checked={theme === option.value}
            aria-label={`Switch to ${option.label} theme`}
            onClick={() => handleThemeClick(option.value)}
            title={(isRateLimited || isCooldownActive) ? "Rate limited - slow down!" : `Switch to ${option.label} theme`}
            disabled={isRateLimited || isCooldownActive}
          >
            {!(isRateLimited || isCooldownActive) && theme === option.value && (
              <motion.div
                layoutId="theme-option"
                transition={{ type: 'spring', bounce: 0.1, duration: 0.4 }}
                className="absolute inset-0 rounded-md bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700"
              />
            )}
            {(isRateLimited || isCooldownActive) && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={cn(
                  "absolute inset-0 rounded-md border",
                  isCooldownActive
                    ? "bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-700"
                    : "bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700"
                )}
              />
            )}
            <option.icon className={cn(
              "size-3.5 relative z-10 transition-all duration-200",
              (isRateLimited || isCooldownActive) && "animate-pulse"
            )} />
          </button>
        ))}
      </motion.div>

      {/* Cooldown Badge */}
      <AnimatePresence>
        {isCooldownActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center z-10 shadow-lg"
          >
            {remainingCooldownTime}
          </motion.div>
        )}
      </AnimatePresence>

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
