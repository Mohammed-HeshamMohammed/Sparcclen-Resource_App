import { motion } from 'framer-motion'
import { TopBar } from '@/components/Layout/shell/TopBar'
import { FiltersTap } from '@/components/Resources/library/FiltersTap'
import { ResourceGrid } from '@/components/Resources'
import type { Category, Resource } from '@/types'

interface LibraryViewProps {
  categories: Category[]
  resources: Resource[]
  availableClassifications: string[]
  availableTags: string[]
  activeCategory: string | null
  activeSubcategory: string | null
  classificationFilter: string | null
  tagFilter: string | null
  searchQuery: string
  favoritesOnly: boolean
  isLoading: boolean
  onSearchChange: (query: string) => void
  onSelectCategory: (categoryId: string, subcategoryId?: string) => void
  onClearCategorySelection: () => void
  onClassificationChange: (value: string | null) => void
  onTagChange: (value: string | null) => void
  onOpenResource: (resource: Resource) => void
  onToggleFavorite: (resourceId: string) => void
  onToggleFavoritesView: () => void
}

export function LibraryView({
  categories,
  resources,
  availableClassifications,
  availableTags,
  activeCategory,
  activeSubcategory,
  classificationFilter,
  tagFilter,
  searchQuery,
  favoritesOnly,
  isLoading,
  onSearchChange,
  onSelectCategory,
  onClearCategorySelection,
  onClassificationChange,
  onTagChange,
  onOpenResource,
  onToggleFavorite,
  onToggleFavoritesView,
}: LibraryViewProps) {
  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide">
      {/* Sticky, centered TopBar with vertical padding */}
      <div className="sticky top-0 z-50 bg-transparent py-4 px-6">
        <div className="flex justify-center">
          <TopBar
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            onToggleFavoritesView={onToggleFavoritesView}
            favoritesOnly={favoritesOnly}
          />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="px-6 py-4"
      >
        <FiltersTap
          categories={categories}
          activeCategory={activeCategory}
          activeSubcategory={activeSubcategory}
          onSelectCategory={onSelectCategory}
          onClearCategoryFilter={onClearCategorySelection}
          classificationOptions={availableClassifications}
          activeClassification={classificationFilter}
          onClassificationChange={onClassificationChange}
          tagOptions={availableTags}
          activeTag={tagFilter}
          onTagChange={onTagChange}
          isLoading={isLoading}
        />
      </motion.div>

      <div className="pb-6">
        <ResourceGrid
          resources={resources}
          onOpenResource={onOpenResource}
          onToggleFavorite={onToggleFavorite}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
