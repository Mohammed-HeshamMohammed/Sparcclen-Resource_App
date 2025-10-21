import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Eye, Calendar, Tag as TagIcon, ExternalLink } from 'lucide-react';
import type { Resource } from '@/types';
import { getThumbnailUrl, formatDate, cn } from '@/lib/utils';
import { normalizeToDataUrl } from '@/lib/utils/dataUrl';
import { useEffect, useMemo, useState } from 'react';
import * as viewsFavsService from '@/lib/services/viewsFavs';
import { HeaderMedia } from './HeaderMedia'

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
  const [copiedColorIndex, setCopiedColorIndex] = useState<number | null>(null);
  const [paletteCopied, setPaletteCopied] = useState(false);
  const [screenIndex, setScreenIndex] = useState(0);

  useEffect(() => {
    setScreenIndex(0);
  }, [resource]);

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

  useEffect(() => {
    if (copiedColorIndex === null) return undefined;
    const timeout = window.setTimeout(() => setCopiedColorIndex(null), 1500);
    return () => window.clearTimeout(timeout);
  }, [copiedColorIndex]);

  useEffect(() => {
    if (!paletteCopied) return undefined;
    const timeout = window.setTimeout(() => setPaletteCopied(false), 1500);
    return () => window.clearTimeout(timeout);
  }, [paletteCopied]);

  const copyText = useMemo(
    () => async (text: string) => {
      try {
        if (navigator?.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
          return;
        }
      } catch {
        // Ignore and fallback below.
      }

      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch (error) {
        console.error('Failed to copy text:', error);
      }
    },
    []
  );

  const paletteString = useMemo(() => {
    const colors = resource?.colors;
    if (!colors || colors.length === 0) return '';
    const formatted = colors.map((color) => `'${color}'`).join(',\n  ');
    return `[\n  ${formatted}\n]`;
  }, [resource?.colors]);

  // Defer null-check until after hooks so Hooks order is stable
  const toDataUrlMaybe = (value: unknown): string | null => {
    if (typeof value !== 'string' || value.trim().length === 0) return null;
    const s = value.trim();
    if (s.startsWith('data:')) return s;
    if (/^https?:\/\//i.test(s)) return null;
    try { return normalizeToDataUrl(s); } catch { return null; }
  };

  const screenImages = useMemo(() => {
    const out: string[] = [];
    const add = (v: unknown) => {
      const normalized = toDataUrlMaybe(v);
      if (normalized && !out.includes(normalized)) out.push(normalized);
    };
    const addMany = (arr: unknown) => {
      if (Array.isArray(arr)) arr.forEach(add);
    };
    if (resource?.metadata) {
      const meta = (resource?.metadata ?? {}) as { [k: string]: unknown; original?: { [k: string]: unknown } };
      add(meta['screen']);
      add(meta['screenshot']);
      addMany(meta['screens']);
      addMany(meta['screenshots']);
      addMany(meta['images']);
      if (meta.original) {
        const orig = meta.original;
        add(orig['screen']);
        add(orig['screenshot']);
        addMany(orig['screens']);
        addMany(orig['screenshots']);
        addMany(orig['images']);
      }
    }
    return out;
  }, [resource]);

  const embeddedImage = useMemo(() => {
    if (!resource?.metadata) return null;
    const imageFields = ['thumbnail', 'screenshot', 'screen'] as const;
    const meta = (resource?.metadata ?? {}) as { [k: string]: unknown; original?: { [k: string]: unknown } }
    for (const field of imageFields) {
      let imageData = meta[field];
      const normalized = toDataUrlMaybe(imageData);
      if (normalized) return normalized;
      imageData = meta.original?.[field];
      const normalizedOrig = toDataUrlMaybe(imageData);
      if (normalizedOrig) return normalizedOrig;
    }
    return null;
  }, [resource]);

  const embeddedThumb = useMemo(() => {
    if (!resource?.metadata) return null;
    const meta = (resource?.metadata ?? {}) as { [k: string]: unknown; original?: { [k: string]: unknown } };
    let t = meta['thumbnail'];
    const normalized = toDataUrlMaybe(t);
    if (normalized) return normalized;
    t = meta.original?.['thumbnail'];
    const normalizedOrig = toDataUrlMaybe(t);
    if (normalizedOrig) return normalizedOrig;
    return null;
  }, [resource]);

  const handleCopyColor = (color: string, index: number) => {
    void copyText(color);
    setPaletteCopied(false);
    setCopiedColorIndex(index);
  };

  const handleCopyPalette = () => {
    if (!paletteString) return;
    void copyText(paletteString);
    setPaletteCopied(true);
    setCopiedColorIndex(null);
  };

  const handlePrevScreen = () => setScreenIndex((prev) => (prev - 1 + screenImages.length) % screenImages.length)
  const handleNextScreen = () => setScreenIndex((prev) => (prev + 1) % screenImages.length)

  if (!resource) return null;
  const thumbnailUrl = getThumbnailUrl(resource.url || '');
  const isColorResource = !!(resource.colors && resource.colors.length > 0);

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
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-3xl w-full sm:max-h-[90vh] max-h-[85vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <HeaderMedia
            isColorResource={isColorResource}
            resourceColors={resource.colors}
            paletteCopied={paletteCopied}
            copiedColorIndex={copiedColorIndex}
            onCopyPalette={handleCopyPalette}
            onCopyColor={handleCopyColor}
            screenImages={screenImages}
            screenIndex={screenIndex}
            onPrevScreen={handlePrevScreen}
            onNextScreen={handleNextScreen}
            embeddedImage={embeddedImage}
            thumbnailUrl={thumbnailUrl}
            resourceTitle={resource.title}
            onClose={onClose}
          />

          <div className="flex-1 overflow-y-auto scrollbar-thin p-3 sm:p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                {embeddedThumb && (
                  <img src={embeddedThumb} alt="thumbnail" className="w-10 h-10 rounded object-cover" />
                )}
                <h2
                  id="modal-title"
                  className="text-2xl font-bold text-gray-900 dark:text-white"
                >
                  {resource.title}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                {resource.url && (
                  <button
                    onClick={() => onOpenExternal(resource.url!)}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors flex-shrink-0 shadow-sm"
                    title="Open in browser"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Open</span>
                  </button>
                )}
                
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      void viewsFavsService.upsertFromResource(resource, !resource.is_favorite)
                    } catch {}
                    onToggleFavorite(resource.id);
                  }}
                  className={cn(
                    'h-9 w-9 inline-flex items-center justify-center rounded-full transition-colors flex-shrink-0 ring-1',
                    resource.is_favorite
                      ? 'bg-red-500 text-white ring-red-500/60 hover:bg-red-600'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 ring-gray-300/60 dark:ring-gray-700/60 hover:ring-red-400/70'
                  )}
                  aria-label={resource.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Heart
                    className={cn('h-5 w-5', resource.is_favorite && 'fill-current')}
                  />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mb-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(resource.date_added)}</span>
              </div>

              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{resource.view_count} views</span>
              </div>

              {resource.resource_type && (
                <span className="bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-2 py-1 rounded-full text-xs">
                  {resource.resource_type}
                </span>
              )}
            </div>

            {resource.description && (
              <div className="mb-4">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                  Description
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {resource.description}
                </p>
              </div>
            )}

            {resource.tags && resource.tags.length > 0 && (
              <div className="mb-4">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <TagIcon className="h-4 w-4" />
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {resource.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-md text-sm"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
