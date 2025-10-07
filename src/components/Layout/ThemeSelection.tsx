import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Monitor, Sun, Moon, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export type ThemeOption = 'system' | 'light' | 'dark';

interface ThemeSelectionProps {
  onThemeSelect: (theme: ThemeOption) => void;
  isVisible?: boolean;
}

const THEME_OPTIONS = [
  {
    id: 'system' as ThemeOption,
    name: 'System',
    description: 'Follow your system preference',
    icon: Monitor,
    preview: {
      light: {
        background: 'bg-white',
        sidebar: 'bg-gray-100',
        content: 'bg-gray-50',
        text: 'text-gray-900',
        accent: 'bg-indigo-500'
      },
      dark: {
        background: 'bg-gray-900',
        sidebar: 'bg-gray-800',
        content: 'bg-gray-950',
        text: 'text-white',
        accent: 'bg-indigo-400'
      }
    }
  },
  {
    id: 'light' as ThemeOption,
    name: 'Light',
    description: 'Clean and bright interface',
    icon: Sun,
    preview: {
      light: {
        background: 'bg-white',
        sidebar: 'bg-gray-100',
        content: 'bg-gray-50',
        text: 'text-gray-900',
        accent: 'bg-indigo-500'
      }
    }
  },
  {
    id: 'dark' as ThemeOption,
    name: 'Dark',
    description: 'Easy on the eyes',
    icon: Moon,
    preview: {
      dark: {
        background: 'bg-gray-900',
        sidebar: 'bg-gray-800',
        content: 'bg-gray-950',
        text: 'text-white',
        accent: 'bg-indigo-400'
      }
    }
  }
];

export function ThemeSelection({ onThemeSelect, isVisible = true }: ThemeSelectionProps) {
  const [selectedTheme, setSelectedTheme] = useState<ThemeOption>('system');

  const handleThemeSelect = (theme: ThemeOption) => {
    setSelectedTheme(theme);
    // Add a small delay for better UX
    setTimeout(() => {
      onThemeSelect(theme);
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-900 dark:via-gray-950 dark:to-slate-950"
    >
      <div className="w-full max-w-4xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Choose Your Theme
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Select the perfect theme for your Sparcclen experience. You can always change this later.
          </p>
        </motion.div>

        {/* Theme Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {THEME_OPTIONS.map((option, index) => (
            <motion.div
              key={option.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
              className="relative"
            >
              <button
                onClick={() => handleThemeSelect(option.id)}
                className={cn(
                  'w-full group relative overflow-hidden rounded-2xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-2xl',
                  selectedTheme === option.id
                    ? 'border-indigo-500 shadow-2xl shadow-indigo-500/25'
                    : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600'
                )}
              >
                {/* Preview Container */}
                <div className="aspect-[4/3] relative overflow-hidden">
                  {/* System Theme - Split Preview */}
                  {option.id === 'system' ? (
                    <div className="absolute inset-0 flex">
                      {/* Light Side */}
                      <div className="w-1/2 bg-white relative">
                        <div className="absolute top-4 left-4 w-8 h-8 bg-gray-100 rounded-lg"></div>
                        <div className="absolute top-4 right-4 w-16 h-4 bg-gray-200 rounded"></div>
                        <div className="absolute top-12 left-4 w-12 h-2 bg-gray-300 rounded"></div>
                        <div className="absolute top-16 left-4 w-20 h-2 bg-gray-300 rounded"></div>
                        <div className="absolute top-20 left-4 w-10 h-2 bg-gray-300 rounded"></div>
                        <div className="absolute bottom-4 left-4 w-24 h-16 bg-gray-200 rounded-lg"></div>
                        <div className="absolute bottom-4 right-4 w-6 h-6 bg-indigo-500 rounded-full"></div>
                      </div>
                      {/* Dark Side */}
                      <div className="w-1/2 bg-gray-900 relative">
                        <div className="absolute top-4 left-4 w-8 h-8 bg-gray-800 rounded-lg"></div>
                        <div className="absolute top-4 right-4 w-16 h-4 bg-gray-700 rounded"></div>
                        <div className="absolute top-12 left-4 w-12 h-2 bg-gray-600 rounded"></div>
                        <div className="absolute top-16 left-4 w-20 h-2 bg-gray-600 rounded"></div>
                        <div className="absolute top-20 left-4 w-10 h-2 bg-gray-600 rounded"></div>
                        <div className="absolute bottom-4 left-4 w-24 h-16 bg-gray-800 rounded-lg"></div>
                        <div className="absolute bottom-4 right-4 w-6 h-6 bg-indigo-400 rounded-full"></div>
                      </div>
                    </div>
                  ) : (
                    /* Single Theme Preview */
                    <div className={cn(
                      'absolute inset-0',
                      option.preview.light?.background || option.preview.dark?.background
                    )}>
                      <div className={cn(
                        'absolute top-4 left-4 w-8 h-8 rounded-lg',
                        option.preview.light?.sidebar || option.preview.dark?.sidebar
                      )}></div>
                      <div className={cn(
                        'absolute top-4 right-4 w-16 h-4 rounded',
                        option.preview.light?.content || option.preview.dark?.content
                      )}></div>
                      <div className={cn(
                        'absolute top-12 left-4 w-12 h-2 rounded',
                        option.preview.light?.text || option.preview.dark?.text,
                        'bg-current opacity-30'
                      )}></div>
                      <div className={cn(
                        'absolute top-16 left-4 w-20 h-2 rounded',
                        option.preview.light?.text || option.preview.dark?.text,
                        'bg-current opacity-30'
                      )}></div>
                      <div className={cn(
                        'absolute top-20 left-4 w-10 h-2 rounded',
                        option.preview.light?.text || option.preview.dark?.text,
                        'bg-current opacity-30'
                      )}></div>
                      <div className={cn(
                        'absolute bottom-4 left-4 w-24 h-16 rounded-lg',
                        option.preview.light?.content || option.preview.dark?.content
                      )}></div>
                      <div className={cn(
                        'absolute bottom-4 right-4 w-6 h-6 rounded-full',
                        option.preview.light?.accent || option.preview.dark?.accent
                      )}></div>
                    </div>
                  )}

                  {/* Selection Overlay */}
                  {selectedTheme === option.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className="absolute inset-0 bg-indigo-500/20 flex items-center justify-center"
                    >
                      <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                        <Check className="w-6 h-6 text-white" />
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Theme Info */}
                <div className="p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                  <div className="flex items-center justify-center mb-3">
                    <div className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center',
                      selectedTheme === option.id
                        ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    )}>
                      <option.icon className="w-5 h-5" />
                    </div>
                  </div>
                  
                  <h3 className={cn(
                    'text-lg font-semibold text-center mb-2',
                    selectedTheme === option.id
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-gray-900 dark:text-white'
                  )}>
                    {option.name}
                  </h3>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                    {option.description}
                  </p>
                </div>
              </button>
            </motion.div>
          ))}
        </div>

        {/* Continue Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center mt-12"
        >
          <button
            onClick={() => handleThemeSelect(selectedTheme)}
            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl shadow-lg"
          >
            Continue with {THEME_OPTIONS.find(opt => opt.id === selectedTheme)?.name}
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
