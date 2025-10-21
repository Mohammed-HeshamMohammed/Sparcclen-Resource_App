import { motion } from 'framer-motion';
import { memo } from 'react';
import { ExternalLink, Heart, Eye } from 'lucide-react';
import type { Resource } from '@/types';
import { getThumbnailUrl, truncateText, cn } from '@/lib/utils';
import { normalizeToDataUrl } from '@/lib/utils/dataUrl';
import { useAuth } from '@/lib/auth';
import * as viewsFavsService from '@/lib/services/viewsFavs';
import { addRecent } from '@/lib/services/recent';

interface ResourceCardProps {
  resource: Resource;
  onOpen: (resource: Resource) => void;
  onToggleFavorite: (resourceId: string) => void;
  variant?: 'small' | 'medium' | 'large';
  className?: string;
}

export const ResourceCard = memo(function ResourceCard({
  resource,
  onOpen,
  onToggleFavorite,
  variant = 'medium',
  className,
}: ResourceCardProps) {
  const { user } = useAuth();
  const thumbnailUrl = getThumbnailUrl(resource.url || '');
  const classification = typeof resource.metadata?.classification === 'string'
    ? resource.metadata.classification
    : resource.resource_type;
  const isGradient = Boolean(classification && classification.toLowerCase().includes('gradient'));
  const isColorResource = resource.colors && resource.colors.length > 0;
  
  const toDataUrlMaybe = (value: unknown): string | null => {
    if (typeof value !== 'string' || value.trim().length === 0) return null;
    const s = value.trim();
    if (s.startsWith('data:')) {
      // Accept only proper base64 payloads after 'base64,'
      const m = s.match(/^data:[^;]+;base64,([A-Za-z0-9+/=]+)$/);
      return m ? s : null;
    }
    if (/^https?:\/\//i.test(s)) return null;
    try { return normalizeToDataUrl(s); } catch { return null; }
  };

  // Get main card image (screen or screenshot, but not thumbnail)
  const getMainCardImage = () => {
    if (!resource.metadata) return null;
    
    // Priority order for main image: screenshot > screen (exclude thumbnail)
    const imageFields = ['screenshot', 'screen'];
    
    const meta = (resource.metadata ?? {}) as { [k: string]: unknown; original?: { [k: string]: unknown } }
    for (const field of imageFields) {
      // Check direct metadata field first
      let imageData = meta[field]
      const normalized = toDataUrlMaybe(imageData);
      if (normalized) return normalized;
      
      // Check nested in original object
      imageData = meta.original?.[field]
      const normalizedOrig = toDataUrlMaybe(imageData);
      if (normalizedOrig) return normalizedOrig;
    }
    return null;
  };
  
  // Get thumbnail image (only from thumbnail field)
  const getThumbnailImage = () => {
    const meta = (resource.metadata ?? {}) as { [k: string]: unknown; original?: { [k: string]: unknown } }
    // Check direct metadata field first
    let thumbnailData = meta['thumbnail']
    const normalized = toDataUrlMaybe(thumbnailData);
    if (normalized) return normalized;
    
    // Check nested in original object
    thumbnailData = meta.original?.['thumbnail']
    const normalizedOrig = toDataUrlMaybe(thumbnailData);
    if (normalizedOrig) return normalizedOrig;
    
    return null;
  };
  
  const mainCardImage = getMainCardImage();
  const thumbnailImage = getThumbnailImage();
  const hasEmbeddedThumbnail = Boolean(thumbnailImage);


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
          content: 'p-2 flex-shrink-0 h-20',
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
        variantClasses.container,
        className,
      )}
      onClick={async () => {
        try {
          void viewsFavsService.recordViewFromResource(resource)
        } catch (err) { console.warn('record view failed', err) }
        try {
          addRecent(user?.id ?? null, { id: resource.id, title: resource.title, url: resource.url })
        } catch {}
        onOpen(resource)
      }}
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
        ) : mainCardImage ? (
          <img
            src={mainCardImage}
            alt={resource.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
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
          onClick={async (e) => {
            e.stopPropagation();
            // Update views_favs locally and remotely
            try {
              void viewsFavsService.upsertFromResource(resource, !resource.is_favorite)
            } catch (err) { console.warn('fav toggle sync failed', err) }
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

      <div className={cn(variantClasses.content, 'flex flex-col justify-between')}>
        <div className="flex items-center gap-2 mb-1 min-h-[28px]">
          {hasEmbeddedThumbnail && (
            <div className="flex-shrink-0">
              <img
                src={thumbnailImage!}
                alt="thumbnail"
                className="w-10 h-10 rounded object-cover"
                loading="lazy"
              />
            </div>
          )}
          <h3 className={cn("text-gray-900 dark:text-white line-clamp-1 flex-1", variantClasses.title)}>
            {resource.title}
          </h3>
        </div>

        {resource.description && variantClasses.showDescription && (
          <p className={cn("text-gray-600 dark:text-gray-400 mb-3 line-clamp-2", variantClasses.description)}>
            {truncateText(resource.description, variant === 'large' ? 150 : 80)}
          </p>
        )}

        <div className="flex items-center justify-between mt-auto">
          <div className="flex flex-wrap gap-1 max-h-8 overflow-hidden items-start">
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

          <div className="flex items-center gap-2">
            {resource.view_count > 0 && variant !== 'small' && (
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
                <Eye className="h-3 w-3" />
                <span>{resource.view_count}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
})
