import { motion } from 'framer-motion';
import { useState } from 'react';
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
const ITEMS_PER_PAGE = 24;

export function ResourceGrid({
  resources,
  onOpenResource,
  onToggleFavorite,
  isLoading = false,
}: ResourceGridProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const shouldVirtualize = resources.length > VIRTUALIZATION_THRESHOLD;
  const totalPages = Math.ceil(resources.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedResources = resources.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

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
      <div className="flex flex-col h-full">
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
          className="grid gap-4 p-6 overflow-auto"
          style={{
            gridTemplateColumns: `repeat(3, 1fr)`,
            gridAutoRows: 'minmax(280px, auto)',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            marginLeft: '-10px',
          } as React.CSSProperties & { scrollbarWidth?: string; msOverflowStyle?: string }}
        >
          {paginatedResources.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              onOpen={onOpenResource}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </motion.div>
        {totalPages > 1 && (
          <div className="flex justify-center items-center p-4 gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded disabled:opacity-50"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1 rounded ${currentPage === page ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    );
  }

  // Fallback: render a regular CSS grid (keeps behavior simple and avoids
  // typing conflicts with react-window in the current project setup)
  return (
    <div id="resource-grid-container" className="flex-1" style={{ width: '100%', height: '100%' }}>
      <div
        className="grid p-6 overflow-auto"
        style={{
          gridTemplateColumns: `repeat(auto-fit, minmax(${CARD_WIDTH}px, 1fr))`,
          gridAutoRows: 'minmax(280px, auto)',
          gap: GAP,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          marginLeft: '-10px',
        } as React.CSSProperties & { scrollbarWidth?: string; msOverflowStyle?: string }}
      >
        {resources.map((resource) => (
          <div key={resource.id} style={{ minWidth: CARD_WIDTH }}>
            <ResourceCard resource={resource} onOpen={onOpenResource} onToggleFavorite={onToggleFavorite} />
          </div>
        ))}
      </div>
    </div>
  );
}
