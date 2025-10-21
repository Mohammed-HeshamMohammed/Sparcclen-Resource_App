import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ThemeTransitionProps {
  isTransitioning: boolean;
  newTheme: 'light' | 'dark';
  onTransitionComplete: () => void;
}

export function ThemeTransition({ isTransitioning, newTheme, onTransitionComplete }: ThemeTransitionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(newTheme);

  useEffect(() => {
    if (isTransitioning) {
      setIsVisible(true);
      setCurrentTheme(newTheme);
    }
  }, [isTransitioning, newTheme]);

  const handleAnimationComplete = () => {
    setIsVisible(false);
    onTransitionComplete();
  };

  const themeColors = {
    light: {
      from: '#ffffff',
      to: '#f8fafc',
      accent: '#3b82f6'
    },
    dark: {
      from: '#0f172a',
      to: '#1e293b', 
      accent: '#60a5fa'
    }
  };

  const colors = themeColors[currentTheme];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
        >
          <motion.div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${colors.from} 0%, ${colors.to} 100%)`
            }}
            initial={{ clipPath: 'circle(0% at 50% 50%)' }}
            animate={{ clipPath: 'circle(150% at 50% 50%)' }}
            transition={{
              duration: 0.45,
              ease: [0.4, 0, 0.2, 1]
            }}
            onAnimationComplete={handleAnimationComplete}
          />
          
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.1, scale: 1.5 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.35,
              ease: [0.4, 0, 0.2, 1],
              delay: 0.1
            }}
          >
            <div
              className="w-96 h-96 rounded-full"
              style={{
                background: `radial-gradient(circle, ${colors.accent}40 0%, transparent 70%)`
              }}
            />
          </motion.div>

          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.5, rotate: -180 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.5, rotate: 180 }}
            transition={{
              duration: 0.3,
              ease: [0.4, 0, 0.2, 1],
              delay: 0.15
            }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center backdrop-blur-sm"
              style={{ backgroundColor: `${colors.accent}20` }}
            >
              {currentTheme === 'dark' ? (
                <svg className="w-8 h-8" style={{ color: colors.accent }} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              ) : (
                <svg className="w-8 h-8" style={{ color: colors.accent }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
