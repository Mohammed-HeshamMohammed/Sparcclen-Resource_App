import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ThemeTransitionProps {
  isTransitioning: boolean;
  newTheme: 'light' | 'dark';
  onTransitionComplete: () => void;
}

export function ThemeTransition({ isTransitioning, newTheme, onTransitionComplete }: ThemeTransitionProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isTransitioning) {
      setIsVisible(true);
    }
  }, [isTransitioning]);

  const handleAnimationComplete = () => {
    setIsVisible(false);
    onTransitionComplete();
  };

  // Theme colors for the transition circle
  const themeColors = {
    light: {
      primary: '#ffffff', // white
      secondary: '#f1f5f9', // slate-100
      accent: '#3b82f6', // blue-500
      wave: '#8b5cf6' // violet-500
    },
    dark: {
      primary: '#0f172a', // slate-900
      secondary: '#1e293b', // slate-800
      accent: '#60a5fa', // blue-400
      wave: '#a78bfa' // violet-400
    }
  };

  const currentColors = themeColors[newTheme];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-[9999] pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
        >
          {/* Background overlay */}
          <motion.div
            className="absolute inset-0"
            style={{ backgroundColor: currentColors.primary }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          />
          
          {/* Main expanding circle */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              duration: 0.8,
              ease: [0.25, 0.46, 0.45, 0.94], // Custom easing for smooth expansion
              delay: 0.1
            }}
            onAnimationComplete={handleAnimationComplete}
          >
            <motion.div
              className="w-full h-full rounded-full"
              style={{
                background: `radial-gradient(circle at center, ${currentColors.accent} 0%, ${currentColors.wave} 30%, ${currentColors.secondary} 60%, ${currentColors.primary} 100%)`,
                boxShadow: `0 0 0 100vw ${currentColors.primary}, 0 0 0 100vh ${currentColors.primary}`
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: 1, 
                opacity: 1 
              }}
              transition={{
                duration: 0.6,
                ease: [0.25, 0.46, 0.45, 0.94]
              }}
            />
          </motion.div>

          {/* Secondary wave effect */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              duration: 0.4,
              ease: [0.25, 0.46, 0.45, 0.94],
              delay: 0.3
            }}
          >
            <motion.div
              className="w-full h-full rounded-full"
              style={{
                background: `radial-gradient(circle, ${currentColors.wave}40 0%, ${currentColors.accent}20 50%, transparent 80%)`,
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: 1, 
                opacity: 0.4 
              }}
              transition={{
                duration: 0.4,
                ease: [0.25, 0.46, 0.45, 0.94]
              }}
            />
          </motion.div>

          {/* Third wave for extra depth */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              duration: 0.3,
              ease: [0.25, 0.46, 0.45, 0.94],
              delay: 0.5
            }}
          >
            <motion.div
              className="w-full h-full rounded-full"
              style={{
                background: `radial-gradient(circle, ${currentColors.accent}60 0%, transparent 60%)`,
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: 1, 
                opacity: 0.2 
              }}
              transition={{
                duration: 0.3,
                ease: [0.25, 0.46, 0.45, 0.94]
              }}
            />
          </motion.div>

          {/* Loading indicator */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <motion.div
              className="w-12 h-12 rounded-full border-4 border-white/20 border-t-white"
              animate={{ rotate: 360 }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "linear"
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
