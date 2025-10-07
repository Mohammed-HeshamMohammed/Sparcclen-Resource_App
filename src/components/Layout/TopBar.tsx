import { Search, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CategoryFilter } from '../Resources/CategoryFilter';
import type { Category } from '../../types';

interface TopBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onToggleFavoritesView: () => void;
  favoritesOnly: boolean;
  // Category filter props
  categories: Category[];
  activeCategory: string | null;
  activeSubcategory: string | null;
  onSelectCategory: (categoryId: string, subcategoryId?: string) => void;
  onClearCategoryFilter: () => void;
}

export function TopBar({
  searchQuery,
  onSearchChange,
  onToggleFavoritesView,
  favoritesOnly,
  categories,
  activeCategory,
  activeSubcategory,
  onSelectCategory,
  onClearCategoryFilter,
}: TopBarProps) {
  return (
    <div className="w-full">
      {/* Main Content */}
      <div className="w-full max-w-6xl mx-auto px-6 mb-6">
        {/* Search Bar */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border border-gray-200 dark:border-gray-800 rounded-full px-6 py-3 shadow-lg flex items-center gap-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search resources... (Ctrl+K)"
                className="w-full pl-10 pr-4 py-2 rounded-full bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleFavoritesView}
              className={cn(
                'p-2 rounded-full transition-colors',
                favoritesOnly
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
              title="Toggle favorites (Ctrl+F)"
            >
              <Heart
                className={cn('h-5 w-5', favoritesOnly && 'fill-current')}
              />
            </button>

          </div>
        </div>

        {/* Category Filter */}
        <CategoryFilter
          categories={categories}
          activeCategory={activeCategory}
          activeSubcategory={activeSubcategory}
          onSelectCategory={onSelectCategory}
          onClearFilter={onClearCategoryFilter}
        />
      </div>
    </div>
  );
}
