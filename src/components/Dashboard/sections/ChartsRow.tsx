import { memo } from 'react'
import { SubcategoryChart } from '../charts/SubcategoryChart'
import { TopCategories } from '../lists/topCategories'

interface Props {
  subcategories: Array<{ category: string; subcategory: string; count: number; favourites: number }>
  categoriesAgg: Array<{ name: string; count: number; favourites: number }>
  isLoadingViews: boolean
}

export const ChartsRow = memo(function ChartsRow({ subcategories, categoriesAgg, isLoadingViews }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <SubcategoryChart subcategories={subcategories} isLoading={isLoadingViews} />
      <TopCategories items={categoriesAgg} />
    </div>
  )
})
