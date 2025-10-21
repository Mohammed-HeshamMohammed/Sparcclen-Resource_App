import { memo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Resource } from '@/types'
import { ResourceCard } from '@/components/Resources/grid/ResourceCard'
import { RecentActivityCardSkeleton } from '../skeletons/RecentActivitySkeleton'

interface Props {
  recentResources: Resource[]
  showSkeleton: boolean
  onOpenResource: (r: Resource) => void
  onToggleFavorite: (id: string) => void
}

export const RecentActivity = memo(function RecentActivity({ recentResources, showSkeleton, onOpenResource, onToggleFavorite }: Props) {
  const showEmptyState = !showSkeleton && recentResources.length === 0

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {showSkeleton
          ? Array.from({ length: 4 }).map((_, idx) => (
              <RecentActivityCardSkeleton key={`recent-activity-skel-${idx}`} />
            ))
          : (
              <AnimatePresence initial={false} mode="popLayout">
                {recentResources.map(resource => (
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
        {showEmptyState && (
          <div className="text-sm text-gray-500 dark:text-gray-400">No recent activity yet</div>
        )}
      </div>
    </div>
  )
})
