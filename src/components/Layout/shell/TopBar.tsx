import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils'

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
    <div className="inline-flex items-center gap-2">
      <input
        type="text"
        value={searchQuery}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => onSearchChange(event.target.value)}
        placeholder="Search resources... (Ctrl+K)"
        className="w-full max-w-[48rem] rounded-full border border-white/25 bg-white/80 px-5 py-3.5 text-lg text-gray-900 placeholder-gray-500 shadow-2xl backdrop-blur-3xl transition focus:outline-none focus:ring-0 dark:border-gray-700/60 dark:bg-gray-900/80 dark:text-white dark:placeholder-gray-400"
      />
      <button
        onClick={onToggleFavoritesView}
        className={cn(
          'flex h-11 w-11 items-center justify-center rounded-full transition-colors',
          favoritesOnly
            ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
        )}
        title="Toggle favorites (Ctrl+F)"
        aria-label="Toggle favorites"
      >
        <Heart className={cn('h-5 w-5', favoritesOnly && 'fill-current')} />
      </button>
    </div>
  )
}
