import { motion } from 'framer-motion';
import { useEffect, useState, useCallback } from 'react';
import type { Resource } from '@/types';
import { ResourceCard } from './ResourceCard';
import { SkeletonLoader } from '@/components/ui';

interface ResourceGridProps {
  resources: Resource[];
  onOpenResource: (resource: Resource) => void;
  onToggleFavorite: (resourceId: string) => void;
  isLoading?: boolean;
}

const CARD_WIDTH = 280;
const GAP = 16;
const VIRTUALIZATION_THRESHOLD = 200;

export function ResourceGrid({
  resources,
  onOpenResource,
  onToggleFavorite,
  isLoading = false,
}: ResourceGridProps) {
  const [columns, setColumns] = useState(1);

  const updateDimensions = useCallback(() => {
    const width = window.innerWidth;
    const cols = Math.max(1, Math.floor((width + GAP) / (CARD_WIDTH + GAP)));
    setColumns(cols);
  }, []);

  useEffect(() => {
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [updateDimensions]);

  const shouldVirtualize = resources.length > VIRTUALIZATION_THRESHOLD;
  // number of rows is not needed for the non-virtualized grid

  if (isLoading) {
    return <SkeletonLoader type="grid" count={8} />;
  }

  if (resources.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">
            No resources found
          </p>
          <p className="text-gray-500 dark:text-gray-500 text-sm">
            Try adjusting your search or filters
          </p>
        </div>
      </div>
    );
  }

  if (!shouldVirtualize) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.04,
            },
          },
        }}
        className="grid gap-4 p-6"
        style={{
          gridTemplateColumns: `repeat(auto-fill, minmax(${CARD_WIDTH}px, 1fr))`,
          gridAutoRows: 'minmax(320px, auto)',
        } as React.CSSProperties}
      >
        {resources.map((resource) => (
          <ResourceCard
            key={resource.id}
            resource={resource}
            onOpen={onOpenResource}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </motion.div>
    );
  }

  // Fallback: render a regular CSS grid (keeps behavior simple and avoids
  // typing conflicts with react-window in the current project setup)
  return (
    <div id="resource-grid-container" className="flex-1" style={{ width: '100%', height: '100%' }}>
      <div
        className="grid p-6"
        style={{
          gridTemplateColumns: `repeat(${columns}, ${CARD_WIDTH}px)`,
          gridAutoRows: 'minmax(320px, auto)',
          gap: GAP,
          justifyContent: 'center',
        }}
      >
        {resources.map((resource) => (
          <div key={resource.id} style={{ width: CARD_WIDTH }}>
            <ResourceCard resource={resource} onOpen={onOpenResource} onToggleFavorite={onToggleFavorite} />
          </div>
        ))}
      </div>
    </div>
  );
}
