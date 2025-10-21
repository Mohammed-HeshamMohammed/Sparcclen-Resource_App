import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import type { Resource } from '@/types';
import { ResourceCard } from './ResourceCard';
import { SkeletonLoader } from '@/components/ui';
import { cn } from '@/lib/utils';

interface ResourceGridProps {
  resources: Resource[];
  onOpenResource: (resource: Resource) => void;
  onToggleFavorite: (resourceId: string) => void;
  isLoading?: boolean;
}

const CARD_WIDTH = 220;
const GAP = 16;
const VIRTUALIZATION_THRESHOLD = Number.MAX_SAFE_INTEGER;
const ITEMS_PER_PAGE = 27;

export function ResourceGrid({
  resources,
  onOpenResource,
  onToggleFavorite,
  isLoading = false,
}: ResourceGridProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const shouldVirtualize = resources.length > VIRTUALIZATION_THRESHOLD;
  const totalPages = Math.ceil(resources.length / ITEMS_PER_PAGE);
  const showPagination = totalPages > 1;
  const isInitialLoading = isLoading && resources.length === 0;

  useEffect(() => {
    if (shouldVirtualize) {
      if (currentPage !== 1) setCurrentPage(1);
      return;
    }

    const maxPage = Math.max(1, totalPages);
    if (currentPage > maxPage) {
      setCurrentPage(maxPage);
    }
  }, [shouldVirtualize, totalPages, currentPage]);

  const paginatedResources = useMemo(() => {
    if (isLoading) return [];
    if (shouldVirtualize) return resources;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return resources.slice(startIndex, endIndex);
  }, [currentPage, resources, shouldVirtualize, isLoading]);

  if (isLoading || isInitialLoading) {
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

  const renderPagination = () => {
    if (!showPagination) return null;

    const maxPageButtons = 5;
    const halfWindow = Math.floor(maxPageButtons / 2);
    let startPage = Math.max(1, currentPage - halfWindow);
    let endPage = startPage + maxPageButtons - 1;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxPageButtons + 1);
    }

    const pages = [];
    for (let page = startPage; page <= endPage; page += 1) {
      pages.push(page);
    }

    return (
      <div className="sticky bottom-0 z-30 pb-6 pt-2">
        <div className="flex justify-center px-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/55 px-4 py-1 text-gray-700 text-sm shadow-xl backdrop-blur-2xl dark:border-gray-700/50 dark:bg-gray-900/55 dark:text-gray-200">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={cn(
                'px-4 py-2 rounded-full transition-colors',
                currentPage === 1
                  ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
            )}
          >
            Prev
          </button>
          {pages.map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={cn(
                'px-4 py-2 rounded-full transition-colors',
                currentPage === page
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className={cn(
              'px-4 py-2 rounded-full transition-colors',
              currentPage === totalPages
                ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
            )}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (!shouldVirtualize) {
    return (
      <div className="space-y-4">
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
          className="grid gap-4 px-6 pb-6 pt-4"
          style={{
            gridTemplateColumns: `repeat(auto-fill, minmax(${CARD_WIDTH}px, 1fr))`,
            gridAutoRows: '280px',
          }}
        >
          {paginatedResources.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              onOpen={onOpenResource}
              onToggleFavorite={onToggleFavorite}
              variant="small"
            />
          ))}
        </motion.div>
        {renderPagination()}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="px-6 pb-6 pt-4">
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: `repeat(auto-fit, minmax(${CARD_WIDTH}px, 1fr))`,
            gridAutoRows: '280px',
            gap: GAP,
          }}
        >
          {resources.map((resource) => (
            <div key={resource.id} style={{ minWidth: CARD_WIDTH }}>
              <ResourceCard
                resource={resource}
                onOpen={onOpenResource}
                onToggleFavorite={onToggleFavorite}
                variant="small"
              />
            </div>
          ))}
        </div>
      </div>
      {renderPagination()}
    </div>
  );
}
