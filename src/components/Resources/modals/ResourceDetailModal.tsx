import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Heart, Eye, Calendar, Tag as TagIcon } from 'lucide-react';
import type { Resource } from '@/types';
import { getThumbnailUrl, formatDate, cn } from '@/lib/utils';
import { useEffect } from 'react';

interface ResourceDetailModalProps {
  resource: Resource | null;
  onClose: () => void;
  onToggleFavorite: (resourceId: string) => void;
  onOpenExternal: (url: string) => void;
}

export function ResourceDetailModal({
  resource,
  onClose,
  onToggleFavorite,
  onOpenExternal,
}: ResourceDetailModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (resource) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [resource, onClose]);

  if (!resource) return null;

  const thumbnailUrl = getThumbnailUrl(resource.url || '');
  const isColorResource = resource.colors && resource.colors.length > 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="relative">
            {isColorResource ? (
              <div className="h-64 flex">
                {resource.colors!.map((color, index) => (
                  <div
                    key={index}
                    className="flex-1 relative group"
                    style={{ backgroundColor: color }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                      <span className="text-white font-mono text-sm font-semibold bg-black/40 px-3 py-1 rounded">
                        {color}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt={resource.title}
                className="w-full h-64 object-cover"
              />
            ) : (
              <div className="h-64 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <ExternalLink className="h-16 w-16 text-gray-400 dark:text-gray-600" />
              </div>
            )}

            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-900 dark:text-white hover:bg-white dark:hover:bg-gray-800 transition-colors"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <h2
                id="modal-title"
                className="text-3xl font-bold text-gray-900 dark:text-white"
              >
                {resource.title}
              </h2>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(resource.id);
                }}
                className={cn(
                  'p-2 rounded-lg transition-colors flex-shrink-0',
                  resource.is_favorite
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400'
                )}
                aria-label={resource.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Heart
                  className={cn('h-5 w-5', resource.is_favorite && 'fill-current')}
                />
              </button>
            </div>

            <div className="flex flex-wrap gap-4 mb-6 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(resource.date_added)}</span>
              </div>

              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{resource.view_count} views</span>
              </div>

              {resource.resource_type && (
                <span className="bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-3 py-1 rounded-full">
                  {resource.resource_type}
                </span>
              )}
            </div>

            {resource.description && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Description
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {resource.description}
                </p>
              </div>
            )}

            {resource.tags && resource.tags.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <TagIcon className="h-5 w-5" />
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {resource.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg text-sm"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {resource.url && (
              <button
                onClick={() => onOpenExternal(resource.url!)}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <span>Open Resource</span>
                <ExternalLink className="h-5 w-5" />
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
