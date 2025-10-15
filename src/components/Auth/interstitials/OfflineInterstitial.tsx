import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface OfflineInterstitialProps {
  onDone: () => void;
}

const messageSets: string[][] = [
  [
    "Normally I only let Officially Signed‑In Legends pass...",
    "But today you're lucky—I'm in a generous mood ✨",
    "Mwahahaha... still evil, just politely evil 😈",
    "Say 'thanks' and go have fun (before the Wi‑Fi notices).",
  ],
  [
    "Offline VIP lane unlocked.",
    "You didn't see me open it 👀",
    "Chaos... but tasteful chaos.",
    "Go have fun before the router tattles.",
  ],
  [
    "Welcome to the Secret Offline Club.",
    "Membership requirement: vibes only.",
    "Still the villain—today with customer service.",
    "Whisper 'thanks' and proceed like a ninja.",
  ],
];

export function OfflineInterstitial({ onDone }: OfflineInterstitialProps) {
  const [index, setIndex] = useState(0);
  const [messages] = useState<string[]>(() => {
    const i = Math.floor(Math.random() * messageSets.length);
    return messageSets[i];
  });

  useEffect(() => {
    if (index >= messages.length) {
      const t = setTimeout(onDone, 400);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setIndex((i) => i + 1), 1700);
    return () => clearTimeout(t);
  }, [index, onDone, messages.length]);

  return (
    <div className="h-screen w-screen overflow-hidden">
      <div className="h-full flex flex-col relative">
        <div className="flex-1 flex items-center justify-center app-page-surface">
          <div className="w-full max-w-none px-8 text-center">
            <AnimatePresence mode="wait">
              {index < messages.length && (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5 }}
                  className="w-full whitespace-nowrap text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white"
                >
                  {messages[index]}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
