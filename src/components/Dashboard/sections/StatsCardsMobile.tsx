import { memo } from 'react'
import { Library, TrendingUp, BarChart3, Tag, Heart } from 'lucide-react'

interface Props {
  resourcesCount: number
  totalViews: number
  categoriesCount: number
  subcategoriesCount: number
  totalFavourites: number
}

export const StatsCardsMobile = memo(function StatsCardsMobile({ resourcesCount, totalViews, categoriesCount, subcategoriesCount, totalFavourites }: Props) {
  return (
    <div className="block min-[1026px]:hidden relative">
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-2 mb-2">
            <Library className="h-5 w-5 text-blue-500" />
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Resources</div>
          </div>
          <div className="text-2xl font-semibold text-gray-900 dark:text-white">{resourcesCount}</div>
        </div>
        
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-2 mb-2 justify-end">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Views</div>
            <TrendingUp className="h-5 w-5 text-purple-500" />
          </div>
          <div className="text-2xl font-semibold text-gray-900 dark:text-white text-right">{totalViews}</div>
        </div>
        
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-5 w-5 text-emerald-500" />
            <div className="text-sm text-gray-500 dark:text-gray-400">Categories</div>
          </div>
          <div className="text-2xl font-semibold text-gray-900 dark:text-white">{categoriesCount}</div>
        </div>
        
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-2 mb-2 justify-end">
            <div className="text-sm text-gray-500 dark:text-gray-400">Subcategories</div>
            <Tag className="h-5 w-5 text-orange-500" />
          </div>
          <div className="text-2xl font-semibold text-gray-900 dark:text-white text-right">{subcategoriesCount}</div>
        </div>
      </div>
      
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-36 h-36 rounded-full border-4 backdrop-blur-sm pointer-events-auto border-white dark:border-[#111827]">
          <div className="absolute inset-0 rounded-full border-2 border-red-300 dark:border-[#030712]">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/90 dark:to-pink-900/90 p-4">
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Heart className="h-7 w-7 text-red-600 dark:text-red-400 mb-1" fill="currentColor" />
                <div className="text-sm text-red-700 dark:text-red-300 font-medium leading-tight">Favourites</div>
                <div className="text-2xl font-bold text-red-700 dark:text-red-300">{totalFavourites}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})
