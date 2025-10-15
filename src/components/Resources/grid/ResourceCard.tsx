import { motion } from 'framer-motion';
import { ExternalLink, Heart, Eye } from 'lucide-react';
import type { Resource } from '@/types';
import { getThumbnailUrl, truncateText, cn } from '@/lib/utils';

interface ResourceCardProps {
  resource: Resource;
  onOpen: (resource: Resource) => void;
  onToggleFavorite: (resourceId: string) => void;
  variant?: 'small' | 'medium' | 'large';
}

export function ResourceCard({
  resource,
  onOpen,
  onToggleFavorite,
  variant = 'medium',
}: ResourceCardProps) {
  const thumbnailUrl = getThumbnailUrl(resource.url || '');
  const classification = typeof resource.metadata?.classification === 'string'
    ? resource.metadata.classification
    : resource.resource_type;
  const isGradient = Boolean(classification && classification.toLowerCase().includes('gradient'));
  const isColorResource = resource.colors && resource.colors.length > 0;

  // Variant-specific styling
  const getVariantClasses = () => {
    switch (variant) {
      case 'large':
        return {
          container: 'h-full flex flex-col',
          image: 'flex-[3] min-h-0',
          content: 'p-3 flex-shrink-0',
          title: 'text-lg font-bold',
          description: 'text-sm',
          showDescription: true,
          maxTags: 3,
        };
      case 'small':
        return {
          container: 'h-full flex flex-col',
          image: 'flex-[2] min-h-0',
          content: 'p-2 flex-shrink-0',
          title: 'text-sm font-semibold',
          description: 'text-xs',
          showDescription: false,
          maxTags: 1,
        };
      default: // medium
        return {
          container: 'h-full flex flex-col',
          image: 'flex-[3] min-h-0',
          content: 'p-3 flex-shrink-0',
          title: 'text-base font-semibold',
          description: 'text-sm',
          showDescription: true,
          maxTags: 2,
        };
    }
  };

  const variantClasses = getVariantClasses();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group",
        variantClasses.container
      )}
      onClick={() => onOpen(resource)}
    >
      <div className={cn("bg-gray-100 dark:bg-gray-800 relative overflow-hidden", variantClasses.image)}>
        {isColorResource ? (
          isGradient ? (
            <div
              className="h-full w-full"
              style={{
                background: `linear-gradient(90deg, ${resource.colors!.join(', ')})`
              }}
            />
          ) : (
            <div className="h-full flex">
              {resource.colors!.slice(0, 6).map((color, index) => (
                <div
                  key={index}
                  className="flex-1"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          )
        ) : thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={resource.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-600">
            <ExternalLink className="h-12 w-12" />
          </div>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(resource.id);
          }}
          className={cn(
            'absolute top-2 right-2 p-2 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100',
            resource.is_favorite
              ? 'bg-red-500 text-white'
              : 'bg-white/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-400 hover:bg-red-500 hover:text-white'
          )}
        >
          <Heart
            className={cn('h-4 w-4', resource.is_favorite && 'fill-current')}
          />
        </button>
      </div>

      <div className={variantClasses.content}>
        <h3 className={cn("text-gray-900 dark:text-white mb-1 line-clamp-1", variantClasses.title)}>
          {resource.title}
        </h3>

        {resource.description && variantClasses.showDescription && (
          <p className={cn("text-gray-600 dark:text-gray-400 mb-3 line-clamp-2", variantClasses.description)}>
            {truncateText(resource.description, variant === 'large' ? 150 : 80)}
          </p>
        )}

        <div className="flex items-center justify-between mt-auto">
          <div className="flex flex-wrap gap-1">
            {resource.tags?.slice(0, variantClasses.maxTags).map((tag) => (
              <span
                key={tag.id}
                className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded"
              >
                {tag.name}
              </span>
            ))}
            {(resource.tags?.length || 0) > variantClasses.maxTags && (
              <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                +{resource.tags!.length - variantClasses.maxTags}
              </span>
            )}
          </div>

          {resource.view_count > 0 && variant !== 'small' && (
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
              <Eye className="h-3 w-3" />
              <span>{resource.view_count}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
