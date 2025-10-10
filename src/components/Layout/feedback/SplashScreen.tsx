import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Database } from 'lucide-react';

interface SplashScreenProps {
  onLoaded: () => void;
  brandName?: string;
  tagline?: string;
  minimumDisplayTime?: number;
}

export function SplashScreen({
  onLoaded,
  brandName = 'Sparcclen',
  tagline = 'Initiate the impossible',
  minimumDisplayTime = 2000,
}: SplashScreenProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, minimumDisplayTime);

    return () => clearTimeout(timer);
  }, [minimumDisplayTime]);

  useEffect(() => {
    if (isReady) {
      const fadeOutTimer = setTimeout(onLoaded, 400);
      return () => clearTimeout(fadeOutTimer);
    }
  }, [isReady, onLoaded]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: isReady ? 0 : 1 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-sky-100 dark:from-gray-900 dark:via-gray-950 dark:to-sky-950"
    >
      <div className="text-center">
        <motion.div
          animate={{
            scale: [0.9, 1.05, 1],
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            repeatDelay: 0.5,
          }}
          className="mb-6 flex justify-center"
        >
          <Database className="h-20 w-20 text-primary-500" strokeWidth={1.5} />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-bold text-gray-900 dark:text-white mb-2"
        >
          {brandName}
        </motion.h1>

        {tagline && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg text-gray-600 dark:text-gray-300 mb-6"
          >
            {tagline}
          </motion.p>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex justify-center gap-2"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0 }}
            className="h-2 w-2 rounded-full bg-primary-500"
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
            className="h-2 w-2 rounded-full bg-primary-500"
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
            className="h-2 w-2 rounded-full bg-primary-500"
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
