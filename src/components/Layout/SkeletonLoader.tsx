import { motion } from 'framer-motion';

interface SkeletonLoaderProps {
  type?: 'card' | 'grid' | 'sidebar' | 'header';
  count?: number;
}

export function SkeletonLoader({ type = 'card', count = 6 }: SkeletonLoaderProps) {
  const skeletonVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: 'easeInOut',
      },
    },
  };

  if (type === 'sidebar') {
    return (
      <motion.div
        variants={skeletonVariants}
        initial="hidden"
        animate="visible"
        className="h-full bg-gray-200 dark:bg-gray-800 rounded-lg"
      />
    );
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
    );
  }

  if (type === 'grid') {
    return (
      <motion.div
        variants={skeletonVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-4 p-6"
        style={{
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        }}
      >
        {Array.from({ length: count }).map((_, i) => (
          <motion.div
            key={i}
            variants={itemVariants}
            className="h-48 bg-gray-200 dark:bg-gray-800 rounded-lg"
          />
        ))}
      </motion.div>
    );
  }

  // Default card type
  return (
    <motion.div
      variants={skeletonVariants}
      initial="hidden"
      animate="visible"
      className="grid gap-4 p-6"
      style={{
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          variants={itemVariants}
          className="h-64 bg-gray-200 dark:bg-gray-800 rounded-lg"
        />
      ))}
    </motion.div>
  );
}
