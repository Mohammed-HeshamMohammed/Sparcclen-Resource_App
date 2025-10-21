import { memo, useMemo } from 'react'
import { TopSubcategories } from '../lists/topSubcategories'

interface Props {
  items: Array<{ category: string; subcategory: string; count: number; favourites: number; totalViews?: number }>
}

export const TopSubcategoriesRow = memo(function TopSubcategoriesRow({ items }: Props) {
  const toShow = useMemo(() => {
    const engaged = items.filter(i => (i.totalViews ?? 0) > 0 || i.favourites > 0)
    return engaged.length > 0 ? engaged : items
  }, [items])
  return <TopSubcategories items={toShow} />
})
