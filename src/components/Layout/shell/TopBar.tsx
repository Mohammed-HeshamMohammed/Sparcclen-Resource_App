import { Heart } from 'lucide-react'

interface TopBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  onToggleFavoritesView: () => void
  favoritesOnly: boolean
}

export function TopBar({
  searchQuery,
  onSearchChange,
  onToggleFavoritesView,
  favoritesOnly,
}: TopBarProps) {
  return (
    <div className="inline-flex items-center w-full sm:w-[45%]">
      <div className="relative w-full">
        <input
          type="text"
          value={searchQuery}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => onSearchChange(event.target.value)}
          placeholder="Search resources...  "
          className="w-full rounded-full border border-white/25 bg-white/80 px-5 pr-14 text-base text-gray-900 placeholder-gray-500 shadow-2xl backdrop-blur-3xl transition focus:outline-none focus:ring-0 dark:border-gray-700/60 dark:bg-gray-900/80 dark:text-white dark:placeholder-gray-400 h-10 sm:h-12"
        />
        <button
          onClick={onToggleFavoritesView}
          className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center text-red-600"
          title="Toggle favorites (Ctrl+F)"
          aria-label="Toggle favorites"
        >
          <Heart className={'h-4 w-4 text-red-600 ' + (favoritesOnly ? 'fill-current' : '')} />
        </button>
      </div>
    </div>
  )
}
