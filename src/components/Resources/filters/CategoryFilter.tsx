import { X } from 'lucide-react';
import type { Category } from '@/types';
import { cn } from '@/lib/utils';

interface CategoryFilterProps {
  categories: Category[];
  activeCategory: string | null;
  activeSubcategory: string | null;
  onSelectCategory: (categoryId: string, subcategoryId?: string) => void;
  onClearFilter: () => void;
}

export function CategoryFilter({
  categories,
  activeCategory,
  activeSubcategory,
  onSelectCategory,
  onClearFilter,
}: CategoryFilterProps) {
  const activeCategoryData = categories.find(cat => cat.id === activeCategory);
  const activeSubcategoryData = activeCategoryData?.subcategories?.find(sub => sub.id === activeSubcategory);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Active Category/Subcategory Display */}
      {activeCategory && (
        <div className="flex items-center gap-2">
          {activeSubcategory ? (
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {activeCategoryData?.title}
              </span>
              <span className="text-sm text-gray-400">/</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {activeSubcategoryData?.title}
              </span>
            </div>
          ) : (
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {activeCategoryData?.title}
            </span>
          )}
          <button
            onClick={onClearFilter}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      )}

      {/* Category Tags */}
      {!activeCategory && (
        <div className="flex items-center gap-4 flex-wrap mt-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
                'hover:bg-gray-200 dark:hover:bg-gray-700',
                'border border-gray-200 dark:border-gray-700'
              )}
            >
              {category.title}
              {category.item_count > 0 && (
                <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                  ({category.item_count})
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Subcategory Tags (when category is selected) */}
      {activeCategory && activeCategoryData?.subcategories && activeCategoryData.subcategories.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onSelectCategory(activeCategory)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
              !activeSubcategory
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            )}
          >
            All {activeCategoryData.title}
          </button>
          {activeCategoryData.subcategories.map((subcategory) => (
            <button
              key={subcategory.id}
              onClick={() => onSelectCategory(activeCategory, subcategory.id)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                activeSubcategory === subcategory.id
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              )}
            >
              {subcategory.title}
              {subcategory.item_count > 0 && (
                <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                  ({subcategory.item_count})
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
