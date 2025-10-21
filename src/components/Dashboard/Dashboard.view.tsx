import { motion } from 'framer-motion'
import { useMemo, useCallback } from 'react'
import { DashboardHeader } from './sections/DashboardHeader'
import { ChartsRow } from './sections/ChartsRow'
import { TopSubcategoriesRow } from './sections/TopSubcategoriesRow'
import { StatsCardsDesktop } from './sections/StatsCardsDesktop'
import { StatsCardsMobile } from './sections/StatsCardsMobile'
import { MainContentGrid } from './sections/MainContentGrid'
import { RecentActivity } from './sections/RecentActivity'
import { UsersSection } from './sections/UsersSection'
import { UserProfileModal } from './modals/UserProfileModal'
import type { Category, Resource } from '@/types'
import { useAuth } from '@/lib/auth'
import { useProfile } from '@/lib/contexts/ProfileContext'
import { useDashboardController } from './hooks/useDashboardController'

interface DashboardProps {
  resources: Resource[]
  categories: Category[]
  onOpenResource: (resource: Resource) => void
  onOpenLibrary: () => void
  onOpenImports: () => void
  onOpenProfile: () => void
  onOpenSettings: () => void
  onOpenRoles: () => void
  onToggleFavorite?: (resourceId: string) => void
}

export function Dashboard({
  resources,
  categories,
  onOpenResource,
  onOpenLibrary,
  onOpenImports,
  onOpenProfile,
  onOpenSettings,
  onOpenRoles,
  onToggleFavorite,
}: DashboardProps) {
  const { user } = useAuth()
  const { profile } = useProfile()

  const {
    users,
    userAvatars,
    selectedUser,
    setSelectedUser,
    viewCounts,
    isLoadingViews,
    favCatAgg,
    favSubAgg,
    myFavouritesCount,
    allResources,
    recentResources,
    showRecentSkeleton,
    isLoadingTopResources,
    handleOpenResource,
    handleToggleFavorite,
  } = useDashboardController({
    resources,
    onOpenResource,
    onToggleFavoriteExternal: onToggleFavorite,
  })

  const totalViews = useMemo(() => viewCounts.reduce((sum, v) => sum + (Number(v.views) || 0), 0), [viewCounts])
  const subcategoriesCount = useMemo(() => (categories ?? []).reduce((sum, c) => sum + (c.subcategories?.length || 0), 0), [categories])
  const onSelectUserLocal = useCallback((u: typeof users[number]) => setSelectedUser(u), [setSelectedUser])

  const selectedUserPayload = selectedUser
    ? {
        id: selectedUser.id,
        name: selectedUser.name,
        email: selectedUser.email,
        role: selectedUser.role || 'Free',
        avatarUrl: userAvatars[selectedUser.id] || selectedUser.avatarUrlMeta || null,
      }
    : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="p-6 md:p-8 space-y-6 overflow-y-auto scrollbar-hide"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      <DashboardHeader />

      <ChartsRow subcategories={favSubAgg} categoriesAgg={favCatAgg} isLoadingViews={isLoadingViews && viewCounts.length === 0} />

      <TopSubcategoriesRow items={favSubAgg} />

      <StatsCardsDesktop
        resourcesCount={resources?.length ?? 0}
        totalViews={totalViews}
        totalFavourites={myFavouritesCount}
        categoriesCount={categories?.length ?? 0}
        subcategoriesCount={subcategoriesCount}
      />
      <StatsCardsMobile
        resourcesCount={resources?.length ?? 0}
        totalViews={totalViews}
        categoriesCount={categories?.length ?? 0}
        subcategoriesCount={subcategoriesCount}
        totalFavourites={myFavouritesCount}
      />

      <MainContentGrid
        resources={allResources}
        viewCounts={viewCounts}
        isLoadingTopResources={isLoadingTopResources}
        onOpenResource={handleOpenResource}
        onOpenLibrary={onOpenLibrary}
        onOpenImports={onOpenImports}
        onOpenProfile={onOpenProfile}
        onOpenSettings={onOpenSettings}
        onOpenRoles={onOpenRoles}
        onToggleFavorite={handleToggleFavorite}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity
          recentResources={recentResources}
          showSkeleton={showRecentSkeleton}
          onOpenResource={handleOpenResource}
          onToggleFavorite={handleToggleFavorite}
        />
        <UsersSection
          users={users}
          userAvatars={userAvatars}
          currentUserEmail={user?.email}
          profileAccountType={profile?.accountType as unknown as (string | null | undefined)}
          onSelectUser={onSelectUserLocal}
        />
      </div>
      <UserProfileModal
        open={!!selectedUser}
        user={selectedUserPayload}
        onClose={() => setSelectedUser(null)}
      />
    </motion.div>
  )
}
