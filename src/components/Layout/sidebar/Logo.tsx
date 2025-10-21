import { motion } from 'framer-motion'
import { LibraryIcon } from './icons'

export const Logo = ({ open }: { open: boolean }) => {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
        <LibraryIcon />
      </div>
      <motion.div
        animate={{
          opacity: open ? 1 : 0,
          width: open ? "auto" : 0,
        }}
        transition={{
          duration: 0.15,
          ease: "easeInOut"
        }}
        className="flex flex-col overflow-hidden whitespace-nowrap"
      >
        <span className="font-bold text-lg text-[var(--app-sidebar-text)]">
          Sparcclen
        </span>
        <span className="text-xs sidebar-muted">
          Initiate the impossible
        </span>
      </motion.div>
    </div>
  );
};

export const LogoIcon = () => {
  return (
    <div className="flex items-center justify-center py-2">
      <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
        <LibraryIcon />
      </div>
    </div>
  );
};
