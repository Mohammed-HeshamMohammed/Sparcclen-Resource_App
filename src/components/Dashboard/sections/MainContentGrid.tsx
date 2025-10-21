import { memo } from 'react'
import type { Resource } from '@/types'
import type { Database } from '@/types/database'
import { TopResource } from '../widgets/topresource'
import { QuickActions } from '../widgets/quickactions'

interface Props {
  resources: Resource[]
  viewCounts: Database['public']['Views']['view_counts']['Row'][]
  isLoadingTopResources: boolean
  onOpenResource: (r: Resource) => void
  onOpenLibrary: () => void
  onOpenImports: () => void
  onOpenProfile: () => void
  onOpenSettings: () => void
  onOpenRoles: () => void
  onToggleFavorite: (id: string) => void
}

export const MainContentGrid = memo(function MainContentGrid({
  resources,
  viewCounts,
  isLoadingTopResources,
  onOpenResource,
  onOpenLibrary,
  onOpenImports,
  onOpenProfile,
  onOpenSettings,
  onOpenRoles,
  onToggleFavorite,
}: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <TopResource
        resources={resources}
        viewCounts={viewCounts}
        onOpenResource={onOpenResource}
        onOpenLibrary={onOpenLibrary}
        onToggleFavorite={onToggleFavorite}
        isLoading={isLoadingTopResources}
      />

      <QuickActions
        onOpenLibrary={onOpenLibrary}
        onOpenImports={onOpenImports}
        onOpenProfile={onOpenProfile}
        onOpenSettings={onOpenSettings}
        onOpenRoles={onOpenRoles}
      />
    </div>
  )
})
