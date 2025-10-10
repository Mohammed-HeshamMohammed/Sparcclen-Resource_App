import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from './ThemeProvider';
import { useThemeRateLimit } from '@/hooks/useThemeRateLimit';

export type ThemeOption = 'system' | 'light' | 'dark';

interface ThemeSelectionProps {
  onThemeSelect: (theme: ThemeOption) => void;
  onConfirm?: () => void;
  isVisible?: boolean;
}

// System Theme Preview Component
const SystemPreview = () => (
  <div className="w-full h-full flex">
    {/* Light half */}
    <div className="w-1/2 bg-white p-3 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600"></div>
        <div className="flex-1 h-2 bg-gray-200 rounded"></div>
      </div>
      <div className="flex gap-2 mt-1">
        <div className="w-12 h-1.5 bg-gray-300 rounded"></div>
        <div className="w-16 h-1.5 bg-gray-300 rounded"></div>
        <div className="w-10 h-1.5 bg-gray-300 rounded"></div>
      </div>
      <div className="flex-1 bg-gray-50 rounded-lg p-2 mt-1">
        <div className="w-full h-1.5 bg-gray-200 rounded mb-1.5"></div>
        <div className="w-3/4 h-1.5 bg-gray-200 rounded mb-1.5"></div>
        <div className="w-5/6 h-1.5 bg-gray-200 rounded"></div>
      </div>
      <div className="flex gap-1.5">
        <div className="flex-1 h-6 bg-indigo-500 rounded"></div>
        <div className="flex-1 h-6 bg-gray-200 rounded"></div>
      </div>
    </div>
    {/* Dark half */}
    <div className="w-1/2 bg-gray-950 p-3 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600"></div>
        <div className="flex-1 h-2 bg-gray-800 rounded"></div>
      </div>
      <div className="flex gap-2 mt-1">
        <div className="w-12 h-1.5 bg-gray-700 rounded"></div>
        <div className="w-16 h-1.5 bg-gray-700 rounded"></div>
        <div className="w-10 h-1.5 bg-gray-700 rounded"></div>
      </div>
      <div className="flex-1 bg-gray-900 rounded-lg p-2 mt-1">
        <div className="w-full h-1.5 bg-gray-800 rounded mb-1.5"></div>
        <div className="w-3/4 h-1.5 bg-gray-800 rounded mb-1.5"></div>
        <div className="w-5/6 h-1.5 bg-gray-800 rounded"></div>
      </div>
      <div className="flex gap-1.5">
        <div className="flex-1 h-6 bg-indigo-600 rounded"></div>
        <div className="flex-1 h-6 bg-gray-800 rounded"></div>
      </div>
    </div>
  </div>
);

// Light Theme Preview Component
const LightPreview = () => (
  <div className="w-full h-full bg-white p-4 flex flex-col gap-3">
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600"></div>
      <div className="flex-1 h-2.5 bg-gray-200 rounded"></div>
      <div className="w-8 h-8 rounded-full bg-gray-100"></div>
    </div>
    <div className="flex gap-2">
      <div className="w-14 h-2 bg-gray-300 rounded"></div>
      <div className="w-20 h-2 bg-gray-300 rounded"></div>
      <div className="w-12 h-2 bg-gray-300 rounded"></div>
    </div>
    <div className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3">
      <div className="bg-white rounded-lg p-2 mb-2 shadow-sm">
        <div className="w-full h-2 bg-gray-200 rounded mb-2"></div>
        <div className="w-4/5 h-2 bg-gray-200 rounded mb-2"></div>
        <div className="w-full h-2 bg-gray-200 rounded"></div>
      </div>
      <div className="bg-white rounded-lg p-2 shadow-sm">
        <div className="w-3/4 h-2 bg-gray-200 rounded mb-2"></div>
        <div className="w-full h-2 bg-gray-200 rounded"></div>
      </div>
    </div>
    <div className="flex gap-2">
      <div className="flex-1 h-8 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg"></div>
      <div className="w-8 h-8 bg-gray-100 rounded-lg"></div>
    </div>
  </div>
);

// Dark Theme Preview Component
const DarkPreview = () => (
  <div className="w-full h-full bg-gray-950 p-4 flex flex-col gap-3">
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600"></div>
      <div className="flex-1 h-2.5 bg-gray-800 rounded"></div>
      <div className="w-8 h-8 rounded-full bg-gray-900"></div>
    </div>
    <div className="flex gap-2">
      <div className="w-14 h-2 bg-gray-700 rounded"></div>
      <div className="w-20 h-2 bg-gray-700 rounded"></div>
      <div className="w-12 h-2 bg-gray-700 rounded"></div>
    </div>
    <div className="flex-1 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-3">
      <div className="bg-gray-900/50 rounded-lg p-2 mb-2 border border-gray-800">
        <div className="w-full h-2 bg-gray-800 rounded mb-2"></div>
        <div className="w-4/5 h-2 bg-gray-800 rounded mb-2"></div>
        <div className="w-full h-2 bg-gray-800 rounded"></div>
      </div>
      <div className="bg-gray-900/50 rounded-lg p-2 border border-gray-800">
        <div className="w-3/4 h-2 bg-gray-800 rounded mb-2"></div>
        <div className="w-full h-2 bg-gray-800 rounded"></div>
      </div>
    </div>
    <div className="flex gap-2">
      <div className="flex-1 h-8 bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-lg"></div>
      <div className="w-8 h-8 bg-gray-900 rounded-lg"></div>
    </div>
  </div>
);

const THEME_OPTIONS = [
  {
    id: 'light' as ThemeOption,
    name: 'Light',
    description: 'Clean and bright interface',
    preview: LightPreview,
  },
  {
    id: 'dark' as ThemeOption,
    name: 'Dark',
    description: 'Easy on the eyes',
    preview: DarkPreview,
  },
  {
    id: 'system' as ThemeOption,
    name: 'System',
    description: 'Adapts to your OS',
    preview: SystemPreview,
  },
];

export function ThemeSelection({ onThemeSelect, onConfirm, isVisible = true }: ThemeSelectionProps) {
  const { theme } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState<ThemeOption>(theme || 'system');
  const [isConfirming, setIsConfirming] = useState(false);
  const [rateLimitMessage, setRateLimitMessage] = useState<string | null>(null);
  
  const {
    canSwitch,
    recordSwitch,
    handleRateLimitViolation,
    isRateLimited,
    isCooldownActive,
    remainingCooldownTime
  } = useThemeRateLimit();

  // Sync with theme changes from toggle button
  useEffect(() => {
    setSelectedTheme(theme);
  }, [theme]);

  const handleThemeClick = (newTheme: ThemeOption) => {
    const switchCheck = canSwitch();
    
    if (!switchCheck.allowed) {
      setRateLimitMessage(switchCheck.reason || "Please wait");
      handleRateLimitViolation();
      
      // Clear message after a delay
      setTimeout(() => {
        setRateLimitMessage(null);
      }, switchCheck.reason?.includes("Cooldown") ? 3000 : 2000);
      
      return;
    }
    
    setSelectedTheme(newTheme);
    
    // Record this switch attempt
    recordSwitch((_remainingTime) => {
      setRateLimitMessage("Too many switches! 60s cooldown activated");
      setTimeout(() => setRateLimitMessage(null), 3000);
    });
    
    // Apply theme immediately for preview (but don't close the selection screen)
    onThemeSelect(newTheme);
  };

  const handleConfirm = () => {
    setIsConfirming(true);
    // Give a brief moment to show the confirming state, then call parent's onConfirm
    setTimeout(() => {
      onConfirm?.();
    }, 400);
  };

  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-950">
      <div className="w-full max-w-6xl mx-auto px-6 py-8">
        {/* Rate Limit Alert */}
        <AnimatePresence>
          {(rateLimitMessage || isCooldownActive) && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={cn(
                "mb-6 mx-auto max-w-2xl rounded-xl border-2 px-6 py-4 flex items-center gap-3 shadow-lg",
                isCooldownActive
                  ? "bg-red-50 dark:bg-red-950/30 border-red-500 text-red-700 dark:text-red-300"
                  : "bg-orange-50 dark:bg-orange-950/30 border-orange-500 text-orange-700 dark:text-orange-300"
              )}
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold">
                  {rateLimitMessage || `Cooldown: ${remainingCooldownTime}s remaining`}
                </p>
              </div>
              {isCooldownActive && (
                <div className="flex-shrink-0 font-bold text-xl">
                  {remainingCooldownTime}s
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
            Choose your interface
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Select the appearance that works best for you
          </p>
        </motion.div>

        {/* Theme Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {THEME_OPTIONS.map((option, index) => {
            const isSelected = selectedTheme === option.id;
            const PreviewComponent = option.preview;
            
            return (
              <motion.button
                key={option.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 1 }}
                onClick={() => handleThemeClick(option.id)}
                disabled={isRateLimited || isCooldownActive}
                className={cn(
                  'relative group overflow-hidden rounded-2xl transition-all duration-200',
                  'bg-gray-50 dark:bg-gray-900',
                  (isRateLimited || isCooldownActive) && 'opacity-50 cursor-not-allowed',
                  isSelected
                    ? 'ring-2 ring-indigo-600 ring-offset-4 ring-offset-white dark:ring-offset-gray-950'
                    : !isRateLimited && !isCooldownActive && 'hover:ring-2 hover:ring-gray-300 dark:hover:ring-gray-700 hover:ring-offset-4 hover:ring-offset-white dark:hover:ring-offset-gray-950'
                )}
              >
                {/* Preview */}
                <div className="aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-gray-800 relative rounded-t-2xl">
                  <PreviewComponent />
                  
                  {/* Checkmark overlay on preview */}
                  <AnimatePresence>
                    {isSelected && !(isRateLimited || isCooldownActive) && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: "spring", duration: 0.5 }}
                        className="absolute inset-0 bg-indigo-600/10 backdrop-blur-[2px] flex items-center justify-center rounded-t-2xl"
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", delay: 0.1 }}
                          className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center shadow-2xl ring-4 ring-white/50"
                        >
                          <Check className="w-8 h-8 text-white" strokeWidth={3} />
                        </motion.div>
                      </motion.div>
                    )}
                    
                    {/* Cooldown overlay */}
                    {(isRateLimited || isCooldownActive) && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-red-500/20 backdrop-blur-[2px] flex items-center justify-center rounded-t-2xl"
                      >
                        <motion.div
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                          className="w-20 h-20 rounded-full bg-red-600 flex flex-col items-center justify-center shadow-2xl ring-4 ring-white/50"
                        >
                          <span className="text-3xl font-bold text-white">{remainingCooldownTime}</span>
                          <span className="text-xs text-white/80">sec</span>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Label */}
                <div className="p-5 text-center bg-white dark:bg-gray-900">
                  <h3 className={cn(
                    'text-lg font-semibold mb-1',
                    isSelected 
                      ? 'text-indigo-600 dark:text-indigo-400' 
                      : 'text-gray-900 dark:text-white'
                  )}>
                    {option.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {option.description}
                  </p>
                </div>

                {/* Hover overlay */}
                <div className={cn(
                  'absolute inset-0 bg-indigo-600/0 transition-colors pointer-events-none',
                  'group-hover:bg-indigo-600/[0.02]'
                )} />
              </motion.button>
            );
          })}
        </div>

        {/* Confirm Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <button
            onClick={handleConfirm}
            disabled={isConfirming}
            className={cn(
              'px-8 py-3.5 rounded-xl font-semibold text-base',
              'bg-indigo-600 hover:bg-indigo-700 text-white',
              'shadow-lg shadow-indigo-600/25 hover:shadow-xl hover:shadow-indigo-600/30',
              'transition-all duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isConfirming ? 'Applying...' : 'Continue'}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
