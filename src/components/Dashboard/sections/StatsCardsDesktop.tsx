import { memo } from 'react'
import { Library, TrendingUp, Heart, BarChart3, Tag } from 'lucide-react'

interface Props {
  resourcesCount: number
  totalViews: number
  totalFavourites: number
  categoriesCount: number
  subcategoriesCount: number
}

export const StatsCardsDesktop = memo(function StatsCardsDesktop({ resourcesCount, totalViews, totalFavourites, categoriesCount, subcategoriesCount }: Props) {
  return (
    <div className="hidden min-[1026px]:block">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-2 mb-2">
            <Library className="h-5 w-5 text-blue-500" />
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Resources</div>
          </div>
          <div className="text-2xl font-semibold text-gray-900 dark:text-white">{resourcesCount}</div>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-purple-500" />
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Views</div>
          </div>
          <div className="text-2xl font-semibold text-gray-900 dark:text-white">{totalViews}</div>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="h-5 w-5 text-red-500" />
            <div className="text-sm text-gray-500 dark:text-gray-400">Favourites</div>
          </div>
          <div className="text-2xl font-semibold text-gray-900 dark:text-white">{totalFavourites}</div>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-5 w-5 text-emerald-500" />
            <div className="text-sm text-gray-500 dark:text-gray-400">Categories</div>
          </div>
          <div className="text-2xl font-semibold text-gray-900 dark:text-white">{categoriesCount}</div>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-2 mb-2">
            <Tag className="h-5 w-5 text-orange-500" />
            <div className="text-sm text-gray-500 dark:text-gray-400">Subcategories</div>
          </div>
          <div className="text-2xl font-semibold text-gray-900 dark:text-white">{subcategoriesCount}</div>
        </div>
      </div>
    </div>
  )
})
