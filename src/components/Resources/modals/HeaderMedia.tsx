import { Check, Copy, ChevronLeft, ChevronRight, ExternalLink, X } from 'lucide-react'

interface HeaderMediaProps {
  isColorResource: boolean
  resourceColors?: string[] | null
  paletteCopied: boolean
  copiedColorIndex: number | null
  onCopyPalette: () => void
  onCopyColor: (color: string, index: number) => void
  screenImages: string[]
  screenIndex: number
  onPrevScreen: () => void
  onNextScreen: () => void
  embeddedImage: string | null
  thumbnailUrl: string | null
  resourceTitle: string
  onClose: () => void
}

export function HeaderMedia({
  isColorResource,
  resourceColors,
  paletteCopied,
  copiedColorIndex,
  onCopyPalette,
  onCopyColor,
  screenImages,
  screenIndex,
  onPrevScreen,
  onNextScreen,
  embeddedImage,
  thumbnailUrl,
  resourceTitle,
  onClose,
}: HeaderMediaProps) {
  return (
    <div className="relative">
      {isColorResource ? (
        <div className="h-56 sm:h-64 md:h-72 lg:h-80 xl:h-96 flex">
          <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                onCopyPalette()
              }}
              className="inline-flex items-center gap-2 rounded-full bg-black/40 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-black/55 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              {paletteCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span>{paletteCopied ? 'Palette copied!' : 'Copy palette'}</span>
            </button>
          </div>
          {(resourceColors ?? []).map((color, index) => (
            <div
              key={index}
              className="flex-1 relative group cursor-pointer outline-none"
              style={{ backgroundColor: color ?? undefined }}
              role="button"
              tabIndex={0}
              onClick={(event) => {
                event.stopPropagation()
                onCopyColor(color!, index)
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onCopyColor(color!, index)
                }
              }}
              title={`Copy ${color}`}
            >
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                <span className="text-white font-mono text-sm font-semibold bg-black/40 px-3 py-1 rounded">
                  {copiedColorIndex === index ? 'Copied!' : color}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : screenImages.length > 0 ? (
        <div className="h-56 sm:h-64 md:h-72 lg:h-80 xl:h-96 relative">
          <img
            src={screenImages[screenIndex]}
            alt={resourceTitle}
            className="w-full h-56 sm:h-64 md:h-72 lg:h-80 xl:h-96 object-cover"
          />
          {screenImages.length > 1 && (
            <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2">
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/55 transition"
                onClick={(e) => {
                  e.stopPropagation()
                  onPrevScreen()
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/55 transition"
                onClick={(e) => {
                  e.stopPropagation()
                  onNextScreen()
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      ) : embeddedImage ? (
        <img
          src={embeddedImage}
          alt={resourceTitle}
          className="w-full h-56 sm:h-64 md:h-72 lg:h-80 xl:h-96 object-cover"
        />
      ) : thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt={resourceTitle}
          className="w-full h-56 sm:h-64 md:h-72 lg:h-80 xl:h-96 object-cover"
        />
      ) : (
        <div className="h-56 sm:h-64 md:h-72 lg:h-80 xl:h-96 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <ExternalLink className="h-20 w-20 text-gray-400 dark:text-gray-600" />
        </div>
      )}

      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-3 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-900 dark:text-white hover:bg-white dark:hover:bg-gray-800 transition-colors shadow"
        aria-label="Close modal"
      >
        <X className="h-6 w-6" />
      </button>
    </div>
  )
}
