import { Search, Heart } from 'lucide-react'
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
    <div className="flex w-full flex-col items-center gap-4 px-6">
      <div className="relative w-full max-w-[32rem]">
        <input
          type="text"
          value={searchQuery}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => onSearchChange(event.target.value)}
          placeholder="Search resources... (Ctrl+K)"
          className="w-full rounded-full border border-white/25 bg-white/50 pl-12 pr-14 py-3 text-lg text-gray-900 placeholder-gray-500 shadow-2xl backdrop-blur-3xl transition focus:outline-none focus:ring-0 dark:border-gray-700/60 dark:bg-gray-900/55 dark:text-white dark:placeholder-gray-400"
        />
        <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <button
          onClick={onToggleFavoritesView}
          className={cn(
            'absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full transition-colors',
            favoritesOnly
              ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          )}
          title="Toggle favorites (Ctrl+F)"
        >
          <Heart className={cn('h-5 w-5', favoritesOnly && 'fill-current')} />
        </button>
      </div>
    </div>
  )
}
