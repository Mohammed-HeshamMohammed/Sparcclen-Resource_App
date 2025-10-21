import { motion, type Variants } from 'framer-motion'

interface SkeletonLoaderProps {
  type?: 'card' | 'grid' | 'sidebar' | 'header'
  count?: number
}

export function SkeletonLoader({ type = 'card', count = 6 }: SkeletonLoaderProps) {
  const skeletonVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        // Use cubic-bezier to satisfy Easing type
        ease: [0.42, 0, 0.58, 1],
      },
    },
  }

  const Shimmer = () => (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-white/10"
      animate={{ x: ['-100%', '100%'] }}
      transition={{ repeat: Infinity, duration: 1.6, ease: 'linear' }}
    />
  )

  if (type === 'sidebar') {
    return (
      <motion.div
        variants={skeletonVariants}
        initial="hidden"
        animate="visible"
        className="h-full bg-gray-200 dark:bg-gray-800 rounded-lg"
      />
    )
  }

  if (type === 'header') {
    return (
      <motion.div
        variants={skeletonVariants}
        initial="hidden"
        animate="visible"
        className="flex gap-4 p-6"
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <motion.div
            key={i}
            variants={itemVariants}
            className="h-12 bg-gray-200 dark:bg-gray-800 rounded-lg flex-1"
          />
        ))}
      </motion.div>
    )
  }

  if (type === 'grid') {
    return (
      <motion.div
        variants={skeletonVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-4 p-6"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}
      >
        {Array.from({ length: count }).map((_, i) => (
          <motion.div key={i} variants={itemVariants} className="relative rounded-2xl border border-white/15 bg-white/60 dark:bg-gray-900/40 dark:border-gray-700/40 overflow-hidden shadow-sm">
            <div className="relative h-44 bg-gray-200/80 dark:bg-gray-800/80">
              <Shimmer />
            </div>
            <div className="p-3 space-y-3">
              <div className="flex items-center gap-2">
                <div className="relative h-10 w-10 rounded bg-gray-200/80 dark:bg-gray-800/80 overflow-hidden">
                  <Shimmer />
                </div>
                <div className="relative h-3 w-2/3 rounded-full bg-gray-200/80 dark:bg-gray-800/80 overflow-hidden">
                  <Shimmer />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="relative h-5 w-16 rounded-full bg-gray-200/80 dark:bg-gray-800/80 overflow-hidden">
                  <Shimmer />
                </div>
                <div className="relative h-5 w-10 rounded-full bg-gray-200/80 dark:bg-gray-800/80 overflow-hidden">
                  <Shimmer />
                </div>
                <div className="relative h-5 w-14 rounded-full bg-gray-200/80 dark:bg-gray-800/80 overflow-hidden">
                  <Shimmer />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    )
  }

  // Default card type
  return (
    <motion.div variants={skeletonVariants} initial="hidden" animate="visible" className="grid gap-4 p-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div key={i} variants={itemVariants} className="relative rounded-2xl border border-white/15 bg-white/60 dark:bg-gray-900/40 dark:border-gray-700/40 overflow-hidden shadow-sm">
          <div className="relative h-48 bg-gray-200/80 dark:bg-gray-800/80">
            <Shimmer />
          </div>
          <div className="p-3 space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative h-10 w-10 rounded bg-gray-200/80 dark:bg-gray-800/80 overflow-hidden">
                <Shimmer />
              </div>
              <div className="relative h-3 w-2/3 rounded-full bg-gray-200/80 dark:bg-gray-800/80 overflow-hidden">
                <Shimmer />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="relative h-5 w-16 rounded-full bg-gray-200/80 dark:bg-gray-800/80 overflow-hidden">
                <Shimmer />
              </div>
              <div className="relative h-5 w-10 rounded-full bg-gray-200/80 dark:bg-gray-800/80 overflow-hidden">
                <Shimmer />
              </div>
              <div className="relative h-5 w-14 rounded-full bg-gray-200/80 dark:bg-gray-800/80 overflow-hidden">
                <Shimmer />
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}
