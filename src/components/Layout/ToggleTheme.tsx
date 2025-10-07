import React, { useState, useEffect } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { useTheme } from '../../hooks/useTheme';

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

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="flex h-8 w-24" />;
  }

  return (
    <motion.div
      key={String(isMounted)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg inline-flex items-center overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
      role="radiogroup"
    >
      {THEME_OPTIONS.map((option) => (
        <button
          key={option.value}
          className={cn(
            'relative flex size-8 cursor-pointer items-center justify-center rounded-md transition-all duration-200',
            theme === option.value
              ? 'text-indigo-600 dark:text-indigo-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          )}
          role="radio"
          aria-checked={theme === option.value}
          aria-label={`Switch to ${option.label} theme`}
          onClick={() => setTheme(option.value)}
          title={`Switch to ${option.label} theme`}
        >
          {theme === option.value && (
            <motion.div
              layoutId="theme-option"
              transition={{ type: 'spring', bounce: 0.1, duration: 0.4 }}
              className="absolute inset-0 rounded-md bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700"
            />
          )}
          <option.icon className="size-3.5 relative z-10" />
        </button>
      ))}
    </motion.div>
  );
}
