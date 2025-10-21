import { useMemo, useEffect, useRef } from 'react'
import { BarChart3 } from 'lucide-react'

interface SubcategoryData {
  category: string;
  subcategory: string;
  count: number;
  favourites: number;
}

interface Props {
  subcategories: SubcategoryData[]
  isLoading?: boolean
}

type ChartPoint = { x: string; y: number; heightPct: number }
type ChartLine = { label: string; points: ChartPoint[]; color: { line: string; area: string } }
type ChartData = { lines: ChartLine[]; maxValue: number; xAxisLabels: string[] }

function toSmoothPath(points: Array<{ x: number; y: number }>, tension = 0.6) {
  if (!points.length) return ''
  if (points.length === 1) return `M 0 ${points[0].y} L 300 ${points[0].y}`
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] || p2
    const c1x = p1.x + (p2.x - p0.x) * tension / 6
    const c1y = p1.y + (p2.y - p0.y) * tension / 6
    const c2x = p2.x - (p3.x - p1.x) * tension / 6
    const c2y = p2.y - (p3.y - p1.y) * tension / 6
    d += ` C ${c1x} ${c1y} ${c2x} ${c2y} ${p2.x} ${p2.y}`
  }
  return d
}

export function SubcategoryChart({ subcategories, isLoading }: Props) {
  const chartData: ChartData = useMemo(() => {
    if (!subcategories || subcategories.length === 0) return { lines: [], maxValue: 1, xAxisLabels: [] }

    const HEADROOM = 1.25

    const byCat = new Map<string, number>()
    for (const s of subcategories) {
      const score = s.count + s.favourites * 2
      byCat.set(s.category, (byCat.get(s.category) || 0) + score)
    }
    const topCats = Array.from(byCat.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name]) => name)

    if (!topCats.length) return { lines: [], maxValue: 1, xAxisLabels: [] }

    const allSubsInTopCategories = subcategories.filter(s => topCats.includes(s.category))
    const xAxisLabels = [...new Set(allSubsInTopCategories.map(s => s.subcategory))]
      .slice(0, 8)
      .sort()

    const colors = [
      { line: '#3B82F6', area: 'rgba(59, 130, 246, 0.1)' },
      { line: '#10B981', area: 'rgba(16, 185, 129, 0.1)' },
      { line: '#F59E0B', area: 'rgba(245, 158, 11, 0.1)' }
    ]
    let lines: ChartLine[] = []
    if (topCats.length >= 2) {
      lines = topCats.map((cat, idx) => {
        const pointsRaw = xAxisLabels.map(xLabel => {
          const dp = subcategories.find(s => s.category === cat && s.subcategory === xLabel)
          const value = dp ? dp.count + dp.favourites * 2 : 0
          return { x: xLabel, y: value }
        })
        const maxVal = Math.max(1, ...pointsRaw.map(p => p.y))
        const points = pointsRaw.map(p => ({ x: p.x, y: p.y, heightPct: Math.round((p.y / (maxVal * HEADROOM)) * 100) }))
        return { label: cat, points, color: colors[idx] || colors[0] }
      })
    } else {
      const bySub = new Map<string, number>()
      for (const s of subcategories) {
        const sc = s.count + s.favourites * 2
        bySub.set(s.subcategory, (bySub.get(s.subcategory) || 0) + sc)
      }
      const topSubs = Array.from(bySub.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([n]) => n)
      const mainCat = topCats[0]
      const linesRaw = topSubs.map((subName, idx) => {
        const own = subcategories.find(s => s.category === mainCat && s.subcategory === subName)
        const ownVal = own ? own.count + own.favourites * 2 : 0
        const pointsRaw = xAxisLabels.map(xLabel => {
          const dp = subcategories.find(s => s.category === mainCat && s.subcategory === xLabel)
          const base = dp ? dp.count + dp.favourites * 2 : 0
          const boost = xLabel === subName ? Math.round(ownVal * 0.25) : 0
          return { x: xLabel, y: base + boost }
        })
        const maxVal = Math.max(1, ...pointsRaw.map(p => p.y))
        const points = pointsRaw.map(p => ({ x: p.x, y: p.y, heightPct: Math.round((p.y / (maxVal * HEADROOM)) * 100) }))
        return { label: `${mainCat} / ${subName}`, points, color: colors[idx] || colors[0] } as ChartLine
      })
      lines = linesRaw
    }

    const maxValue = Math.max(1, ...lines.flatMap(l => l.points.map(p => p.y)))
    return { lines, maxValue, xAxisLabels }
  }, [subcategories])

  const lastNonEmptyRef = useRef<ChartData | null>(null)
  useEffect(() => {
    if (chartData.lines.length > 0) lastNonEmptyRef.current = chartData
  }, [chartData])

  if (isLoading && !lastNonEmptyRef.current && chartData.lines.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="h-5 w-5 text-purple-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Trends</h3>
        </div>
        <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
      </div>
    )
  }

  if (chartData.lines.length === 0 && !lastNonEmptyRef.current) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="h-5 w-5 text-purple-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Trends</h3>
        </div>
        <div className="h-32 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
          No subcategory data available
        </div>
      </div>
    )
  }

  const renderData: ChartData = chartData.lines.length ? chartData : (lastNonEmptyRef.current as ChartData)

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-900">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="h-5 w-5 text-purple-500" />
        <h3 className="font-semibold text-gray-900 dark:text-white">Trends</h3>
      </div>
      
      <div className="relative h-32 mb-4">
        <div className="absolute inset-0 flex flex-col justify-between">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className="h-px bg-gray-200 dark:bg-gray-700 opacity-30" />
          ))}
        </div>
        
        <div className="relative h-full flex items-end">
          <svg className="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
            {renderData.lines.map((line: ChartLine, lineIndex: number) => {
              const denom = Math.max(line.points.length - 1, 1)
              const coords = line.points.map((point: ChartPoint, i: number) => {
                const x = (i / denom) * 300
                const y = 100 - point.heightPct
                return { x, y }
              })
              const pathData = toSmoothPath(coords)

              const areaData = coords.length > 0 ? `${pathData} L 300 100 L 0 100 Z` : ''

              return (
                <g key={lineIndex}>
                  <path
                    d={areaData}
                    fill={line.color.area}
                    className="opacity-30"
                  />
                  <path
                    d={pathData}
                    stroke={line.color.line}
                    strokeWidth="2"
                    fill="none"
                    className="drop-shadow-sm"
                  />
                  {line.points.map((point: ChartPoint, i: number) => {
                    const denomDots = Math.max(line.points.length - 1, 1)
                    const x = (i / denomDots) * 300
                    const y = 100 - point.heightPct
                    return (
                      <circle
                        key={i}
                        cx={x}
                        cy={y}
                        r="3"
                        fill={line.color.line}
                        className="drop-shadow-sm"
                      >
                        <title>{`${point.x}: ${point.y}`}</title>
                      </circle>
                    )
                  })}
                </g>
              )
            })}
          </svg>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-xs">
        {renderData.lines.map((line, i) => (
          <div key={i} className="flex items-center gap-1">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: line.color.line }}
            />
            <span className="text-gray-600 dark:text-gray-300 truncate max-w-[120px]" title={line.label}>
              {line.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
