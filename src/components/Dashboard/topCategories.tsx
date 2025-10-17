import { BarChart3 } from 'lucide-react'

interface Cat { name: string; count: number; favourites: number; totalViews?: number }

export function TopCategories({ items }: { items: Cat[] }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-900">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="h-5 w-5 text-emerald-500" />
        <h3 className="font-semibold text-gray-900 dark:text-white">Top Categories</h3>
      </div>
      <div className="space-y-2">
        {items.slice(0, 4).map((cat, i) => {
          const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-orange-500']
          const total = items.reduce((s, v) => s + v.count, 0) || 1
          const percentage = (cat.count / total) * 100
          return (
            <div key={`${i}-${cat.name}`} className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${colors[i % colors.length]}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700 dark:text-gray-300 truncate">{cat.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {cat.count} items • {cat.favourites} favs
                    {cat.totalViews !== undefined && ` • ${cat.totalViews} views`}
                  </div>
                </div>
                <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded mt-1 overflow-hidden">
                  <div className={`h-full ${colors[i % colors.length]} opacity-80`} style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }} />
                </div>
              </div>
            </div>
          )
        })}
        {items.length === 0 && (
          <div className="text-sm text-gray-500 dark:text-gray-400">No categories yet</div>
        )}
      </div>
    </div>
  )
}