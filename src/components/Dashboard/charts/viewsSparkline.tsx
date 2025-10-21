import { useMemo } from 'react'
import type { Database } from '@/types/database'
import { TrendingUp } from 'lucide-react'

interface Props {
  viewCounts: Database['public']['Views']['view_counts']['Row'][]
}

export function ViewsSparkline({ viewCounts }: Props) {
  const sparklineData = useMemo(() => {
    const tops = [...viewCounts]
      .sort((a, b) => (Number(b.views) || 0) - (Number(a.views) || 0))
      .slice(0, 7)
    const max = Math.max(1, ...tops.map(t => Number(t.views) || 0))
    return tops.map((t) => ({
      title: t.title ?? '—',
      rawViews: Number(t.views) || 0,
      heightPct: Math.round(((Number(t.views) || 0) / max) * 100),
    }))
  }, [viewCounts])

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-900">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="h-5 w-5 text-blue-500" />
        <h3 className="font-semibold text-gray-900 dark:text-white">Top Views</h3>
      </div>
      <div className="flex items-end gap-1 h-16">
        {sparklineData.map((data, i) => (
          <div
            key={i}
            className="flex-1 bg-blue-500 rounded-t opacity-70 hover:opacity-100 transition-opacity"
            style={{ height: `${data.heightPct}%` }}
            title={`${data.title}: ${data.rawViews} views`}
          />
        ))}
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">Last 7 days</div>
    </div>
  )
}