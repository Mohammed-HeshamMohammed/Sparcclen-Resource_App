import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Resource } from '@/types'
import type { Database } from '@/types/database'
import { ResourceCard } from '@/components/Resources/grid/ResourceCard'
import { useAuth } from '@/lib/auth'
import { searchResources } from '@/lib/services'

interface Props {
  resources: Resource[]
  viewCounts: Database['public']['Views']['view_counts']['Row'][]
  onOpenResource: (r: Resource) => void
  onOpenLibrary: () => void
  onToggleFavorite: (resourceId: string) => void
  isLoading: boolean
}

export function TopResource({ resources, viewCounts, onOpenResource, onOpenLibrary, onToggleFavorite, isLoading }: Props) {
  const { user } = useAuth()
  const [topResources, setTopResources] = useState<Resource[]>([])
  const [hasHydrated, setHasHydrated] = useState(false)
  const prevViewSignature = useRef<string | null>(null)
  const prevResourceSignature = useRef<string | null>(null)

  const viewSignature = useMemo(() => viewCounts.map(vc => `${vc.title ?? ''}|${vc.views ?? 0}`).join('::'), [viewCounts])
  const resourceSignature = useMemo(() => resources.map(r => r.id).join('::'), [resources])

  useEffect(() => {
    let cancelled = false
    const needsRefresh = !hasHydrated || viewSignature !== prevViewSignature.current || resourceSignature !== prevResourceSignature.current
    if (isLoading || !needsRefresh) return () => { cancelled = true }

    prevViewSignature.current = viewSignature
    prevResourceSignature.current = resourceSignature

    ;(async () => {
      let produced = 0
      try {
        const sorted = [...viewCounts].sort((a, b) => (Number(b.views) || 0) - (Number(a.views) || 0))
        const titles = sorted.map(v => v.title).slice(0, 30)
        const norm = (s: string) => (s || '').toLowerCase().replace(/\s+/g, ' ').trim()
        const byNormTitle = new Map<string, Resource>()
        for (const r of resources) {
          const nt = norm(r.title)
          if (nt && !byNormTitle.has(nt)) byNormTitle.set(nt, r)
        }
        const picked: Resource[] = []
        const triedTitles = new Set<string>()
        for (const title of titles) {
          if (picked.length >= 6) break
          if (!title) continue
          const nt = norm(title)
          if (triedTitles.has(nt)) continue
          triedTitles.add(nt)

          let res = byNormTitle.get(nt)
          if (!res) {
            try {
              const filters = { query: title, categoryId: null, subcategoryId: null, tags: [], favoritesOnly: false, resourceType: null }
              const results: Resource[] = await searchResources(filters, user?.id || undefined)
              if (results && results.length > 0) {
                const scored = results.map(r => {
                  const nrt = norm(r.title)
                  let score = 0
                  if (nrt === nt) score = 3
                  else if (nrt.includes(nt) || nt.includes(nrt)) score = 2
                  else score = 1
                  score += Math.min(1, (r.view_count || 0) / 1000)
                  return { r, score }
                })
                scored.sort((a, b) => b.score - a.score)
                res = scored[0].r
              }
            } catch {}
          }
          if (res) {
            if (!picked.some(p => p.id === res!.id)) picked.push(res)
          }
        }
        if (picked.length < 6) {
          const filler = [...resources]
            .filter(r => !picked.some(p => p.id === r.id))
            .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
            .slice(0, 6 - picked.length)
          picked.push(...filler)
        }
        produced = picked.length
        if (!cancelled) setTopResources(picked)
      } catch {}
      finally {
        if (!cancelled) {
          const hasSources = (resources?.length ?? 0) > 0 && (viewCounts?.length ?? 0) > 0
          if (produced > 0 || hasSources) setHasHydrated(true)
        }
      }
    })()
    return () => { cancelled = true }
  }, [hasHydrated, isLoading, resourceSignature, viewSignature, viewCounts, resources, user?.id])

  const showSkeleton = isLoading || !hasHydrated
  const hasData = topResources.length > 0
  const showEmptyState = !showSkeleton && !hasData

  return (
    <div className="lg:col-span-2 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white">Top Resources</h3>
        <button onClick={onOpenLibrary} className="text-sm px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700">View All</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {showSkeleton
          ? Array.from({ length: 4 }).map((_, idx) => (
              <DashboardCardSkeleton key={`top-resource-skel-${idx}`} />
            ))
          : (
              <AnimatePresence initial={false} mode="popLayout">
                {topResources.map(resource => (
                  <motion.div
                    key={resource.id}
                    layout
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25 }}
                    className="h-36 max-w-[420px] w-full mx-auto"
                  >
                    <ResourceCard
                      resource={resource}
                      onOpen={onOpenResource}
                      onToggleFavorite={onToggleFavorite}
                      variant="small"
                      className="rounded-2xl shadow-2xl border-0"
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
      </div>
      {showEmptyState && (
        <div className="text-sm text-gray-500 dark:text-gray-400">No top resources yet</div>
      )}
    </div>
  )
}

export function DashboardCardSkeleton({ className }: { className?: string } = {}) {
  return (
    <div className={`h-36 max-w-[420px] w-full mx-auto ${className ?? ''}`}>
      <div className="h-full w-full rounded-2xl border border-white/10 bg-gradient-to-br from-gray-100/80 via-gray-200/60 to-gray-100/80 dark:from-gray-800/70 dark:via-gray-700/60 dark:to-gray-800/70 shadow-inner animate-pulse" />
    </div>
  )
}