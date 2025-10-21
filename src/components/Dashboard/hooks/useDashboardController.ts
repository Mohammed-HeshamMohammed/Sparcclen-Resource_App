import { useEffect, useMemo, useState, useCallback } from 'react'
import type { Resource } from '@/types'
import type { Database } from '@/types/database'
import { useAuth } from '@/lib/auth'
import { getRecents, addRecent } from '@/lib/services/recent'
import { supabase, avatarService, searchResources, getResources } from '@/lib/services'
import { normalizeToDataUrl } from '@/lib/utils/dataUrl'
import { loadDashboardCacheStale, saveDashboardCache, setUserPublicProfileCached } from '@/lib/services/dashboardCache'
import * as viewsFavs from '@/lib/services/viewsFavs'

interface SupabaseUser {
  id: string;
  email?: string;
  user_metadata?: { display_name?: string; full_name?: string; name?: string; avatar_url?: string; role?: string };
  app_metadata?: { role?: string };
}

interface WindowApi {
  admin?: { listUsers: () => Promise<{ ok: boolean; users: SupabaseUser[] }> };
}

interface UserLite {
  id: string
  email: string | null
  name: string | null
  avatarUrlMeta: string | null
  role: string
}

export function useDashboardController({
  resources: initialResources,
  onOpenResource,
  onToggleFavoriteExternal,
}: {
  resources: Resource[]
  onOpenResource: (r: Resource) => void
  onToggleFavoriteExternal?: (id: string) => void
}) {
  const { user } = useAuth()

  const [users, setUsers] = useState<UserLite[]>([])
  const [userAvatars, setUserAvatars] = useState<Record<string, string>>({})
  const [selectedUser, setSelectedUser] = useState<UserLite | null>(null)

  const [viewCounts, setViewCounts] = useState<Database['public']['Views']['view_counts']['Row'][]>([])
  const [isLoadingViews, setIsLoadingViews] = useState(false)

  const [favCatAgg, setFavCatAgg] = useState<Array<{ name: string; count: number; favourites: number }>>([])
  const [favSubAgg, setFavSubAgg] = useState<Array<{ category: string; subcategory: string; count: number; favourites: number }>>([])
  const [totalFavourites, setTotalFavourites] = useState(0)
  const [myFavouritesCount, setMyFavouritesCount] = useState(0)

  const [recentItems, setRecentItems] = useState<Array<{ id: string; title: string; url?: string | null; ts: number }>>([])
  const [allResources, setAllResources] = useState<Resource[]>(initialResources ?? [])

  const [isLoadingCache, setIsLoadingCache] = useState(true)
  const [, setLastCacheRefresh] = useState<number>(0)
  const [isLoadingRecent, setIsLoadingRecent] = useState(true)
  const [recentHydrated, setRecentHydrated] = useState(false)

  useEffect(() => {
    const loadCachedData = async () => {
      if (!user?.id) return
      try {
        const cachedData = await loadDashboardCacheStale(user.id)
        if (cachedData) {
          setUsers(Array.isArray(cachedData.users) ? cachedData.users as unknown as UserLite[] : [])
          setUserAvatars(cachedData.userAvatars || {})
          setViewCounts(Array.isArray(cachedData.viewCounts) ? cachedData.viewCounts : [])
          setFavCatAgg(Array.isArray(cachedData.favCatAgg) ? cachedData.favCatAgg : [])
          setFavSubAgg(Array.isArray(cachedData.favSubAgg) ? cachedData.favSubAgg : [])
          setTotalFavourites(Number.isFinite((cachedData as unknown as { totalFavourites?: number })?.totalFavourites ?? NaN) ? (cachedData as unknown as { totalFavourites: number }).totalFavourites : 0)
          setLastCacheRefresh((cachedData as unknown as { timestamp?: number })?.timestamp || Date.now())
          setIsLoadingCache(false)
          return
        }
      } catch {}
      setIsLoadingCache(false)
    }
    loadCachedData()
  }, [user?.id, recentHydrated])

  useEffect(() => {
    setMyFavouritesCount(allResources.filter(r => Boolean(r.is_favorite)).length)
  }, [allResources])

  useEffect(() => {
    let cancelled = false
    const fetchOnce = async () => {
      let latest: Database['public']['Views']['view_counts']['Row'][] = []
      try {
        setIsLoadingViews(true)
        latest = await viewsFavs.fetchViewCounts().catch(() => [])
        if (!cancelled && latest && latest.length) setViewCounts(latest)
      } catch (e) {
        console.warn('Refresh view_counts failed:', e)
      } finally {
        setIsLoadingViews(false)
      }
      try {
        const merged = await viewsFavs.getAllUsersItems()
        if (cancelled) return
        const itemsForAgg = merged.length
          ? merged
          : allResources.map(r => viewsFavs.toItem(r, Boolean(r.is_favorite)))
        const currentViewCounts = latest && latest.length ? latest : viewCounts
        const cat = viewsFavs.aggregateCategoriesWithViews(itemsForAgg, currentViewCounts)
        const sub = viewsFavs.aggregateSubcategoriesWithViews(itemsForAgg, currentViewCounts)
        setFavCatAgg(cat)
        setFavSubAgg(sub)
        setTotalFavourites(itemsForAgg.filter(i => i.favourite).length)
        setMyFavouritesCount(allResources.filter(r => Boolean(r.is_favorite)).length)
        if (user?.id) setLastCacheRefresh(Date.now())
      } catch (e) {
        console.warn('Refresh favourites aggregates failed:', e)
      }
    }
    void fetchOnce()
    const t = window.setInterval(fetchOnce, 60000)
    return () => { cancelled = true; if (t) window.clearInterval(t) }
  }, [user?.id, viewCounts, allResources])

  useEffect(() => {
    if (!isLoadingCache && users.length === 0) {
      const loadUsers = async () => {
        try {
          const api = (window as unknown as { api?: WindowApi }).api
          if (api?.admin?.listUsers) {
            const res = await api.admin.listUsers()
            if (res?.ok) {
              const userListAll = (res.users || []).map((u: SupabaseUser) => {
                const meta = u.user_metadata || {}
                const app = u.app_metadata || {}
                const role = (meta.role || app.role || 'Free') as string
                return {
                  id: u.id,
                  email: u.email ?? null,
                  name: meta.display_name || meta.full_name || meta.name || ((u.email || '').split('@')[0] || null),
                  avatarUrlMeta: meta.avatar_url || null,
                  role,
                } as UserLite
              })

              let userList = userListAll
              try {
                const ids = userListAll.map(u => u.id)
                if (ids.length) {
                  const { data: profRows, error: profErr } = await supabase
                    .from('profiles')
                    .select('user_id')
                    .in('user_id', ids)
                  if (!profErr && profRows) {
                    const hasProfile = new Set((profRows as Array<{ user_id: string | null }>)
                      .filter(r => !!r.user_id)
                      .map(r => String(r.user_id)))
                    userList = userListAll.filter(u => hasProfile.has(u.id))
                  }
                }
              } catch {}

              setUsers(userList)

              const avatarMap: Record<string, string> = {}
              const userIds = userList.map(u => u.id)

              if (userIds.length > 0) {
                try {
                  const { data, error } = await supabase
                    .from('profiles')
                    .select('user_id,picture_public')
                    .in('user_id', userIds)

                  if (error) {
                    console.warn('Failed to fetch public profile pictures:', error)
                  } else {
                    const rows = (data ?? []) as Array<{ user_id: string | null; picture_public: string | null }>
                    for (const row of rows) {
                      if (!row?.user_id || !row?.picture_public) continue
                      const url = normalizeToDataUrl(row.picture_public)
                      if (url) avatarMap[row.user_id] = url
                    }
                  }

                  try {
                    const { data: publicData, error: publicError } = await supabase
                      .from('profiles')
                      .select('user_id,cover_public,bio_public')
                      .in('user_id', userIds)

                    if (!publicError && publicData) {
                      for (const row of publicData as Array<{ user_id: string | null; cover_public: string | null; bio_public: string | null }>) {
                        if (row?.user_id && user?.id && row.user_id !== user.id) {
                          await setUserPublicProfileCached(user.id, row.user_id, {
                            coverUrl: normalizeToDataUrl(row.cover_public),
                            bio: row.bio_public,
                          })
                        }
                      }
                    }
                  } catch (error) {
                    console.warn('Failed to pre-cache public profile data:', error)
                  }
                } catch (error) {
                  console.warn('Failed to fetch encrypted profile pictures for dashboard:', error)
                }
              }

              for (const usr of userList) {
                if (avatarMap[usr.id]) continue
                if (usr.avatarUrlMeta) {
                  avatarMap[usr.id] = usr.avatarUrlMeta
                } else if (usr.email) {
                  try {
                    const fallbackUrl = await avatarService.getAvatarUrl(usr.email, true)
                    if (fallbackUrl) avatarMap[usr.id] = fallbackUrl
                  } catch (error) {
                    console.warn(`Failed to get fallback avatar for user ${usr.id}:`, error)
                  }
                }
              }

              setUserAvatars(avatarMap)
            }
          }
        } catch {}
      }
      void loadUsers()
    }
  }, [user?.id, isLoadingCache, users.length])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      let latestViewCounts: Database['public']['Views']['view_counts']['Row'][] = []
      try {
        setIsLoadingViews(true)
        const data = await viewsFavs.fetchViewCounts().catch(() => [])
        if (!cancelled && data && data.length) {
          setViewCounts(data)
          latestViewCounts = data
        }
      } catch (e) {
        console.warn('Failed to fetch view counts:', e)
      } finally {
        setIsLoadingViews(false)
      }
      try {
        const merged = await viewsFavs.getAllUsersItems()
        if (cancelled) return
        const itemsForAgg = merged.length
          ? merged
          : allResources.map(r => viewsFavs.toItem(r, Boolean(r.is_favorite)))
        const vc = latestViewCounts.length ? latestViewCounts : viewCounts
        const cat = viewsFavs.aggregateCategoriesWithViews(itemsForAgg, vc)
        const sub = viewsFavs.aggregateSubcategoriesWithViews(itemsForAgg, vc)
        setFavCatAgg(cat)
        setFavSubAgg(sub)
        setTotalFavourites(itemsForAgg.filter(i => i.favourite).length)
        try {
          const mine = await viewsFavs.loadRemoteItems().catch(() => [])
          setMyFavouritesCount(mine.filter(i => i.favourite).length)
        } catch {}
      } catch (e) {
        console.warn('Failed to compute favourites aggregates:', e)
      }
    })()
    return () => { cancelled = true }
  }, [user?.id, viewCounts, allResources])

  useEffect(() => {
    if (!user?.id) return
    if (!isLoadingCache && users.length > 0 && viewCounts.length > 0 && favCatAgg.length > 0) {
      const timeoutId = setTimeout(async () => {
        try {
          const computeTop = async (): Promise<Resource[]> => {
            try {
              const sorted = [...viewCounts].sort((a, b) => (Number(b.views) || 0) - (Number(a.views) || 0))
              const titles = sorted.map(v => v.title).slice(0, 30)
              const norm = (s: string) => (s || '').toLowerCase().replace(/\s+/g, ' ').trim()
              const byNormTitle = new Map<string, Resource>()
              for (const r of allResources) {
                const nt = norm(r.title)
                if (nt && !byNormTitle.has(nt)) byNormTitle.set(nt, r)
              }
              const picked: Resource[] = []
              const tried = new Set<string>()
              for (const title of titles) {
                if (picked.length >= 6) break
                if (!title) continue
                const nt = norm(title)
                if (tried.has(nt)) continue
                tried.add(nt)
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
                if (res && !picked.some(p => p.id === res!.id)) picked.push(res)
              }
              if (picked.length < 6) {
                const filler = [...allResources]
                  .filter(r => !picked.some(p => p.id === r.id))
                  .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
                  .slice(0, 6 - picked.length)
                picked.push(...filler)
              }
              return picked
            } catch { return [] }
          }

          const topResources = await computeTop()
          await saveDashboardCache(user.id, {
            users,
            userAvatars,
            viewCounts,
            favCatAgg,
            favSubAgg,
            topResources,
            totalFavourites,
          })
        } catch (error) {
          console.warn('Failed to save dashboard data to cache:', error)
        }
      }, 1000)
      return () => clearTimeout(timeoutId)
    }
  }, [user?.id, users, userAvatars, viewCounts, favCatAgg, favSubAgg, totalFavourites, isLoadingCache, allResources])

  useEffect(() => { setAllResources(initialResources ?? []) }, [initialResources])
  useEffect(() => {
    (async () => {
      if (!initialResources || initialResources.length === 0) {
        try {
          const data = await getResources(undefined, undefined)
          setAllResources(data)
        } catch {}
      }
    })()
  }, [initialResources])

  useEffect(() => {
    if (!user?.id) return
    ;(async () => {
      try {
        const merged = await viewsFavs.getAllUsersItems()
        const itemsForAgg = merged.length
          ? merged
          : allResources.map(r => viewsFavs.toItem(r, Boolean(r.is_favorite)))
        const cat = viewsFavs.aggregateCategoriesWithViews(itemsForAgg, viewCounts)
        const sub = viewsFavs.aggregateSubcategoriesWithViews(itemsForAgg, viewCounts)
        setFavCatAgg(cat)
        setFavSubAgg(sub)
        setTotalFavourites(itemsForAgg.filter(i => i.favourite).length)
        try {
          const mine = await viewsFavs.loadRemoteItems().catch(() => [])
          setMyFavouritesCount(mine.filter(i => i.favourite).length)
        } catch {}
      } catch {}
    })()
  }, [allResources, viewCounts, user?.id])

  useEffect(() => {
    const load = async () => {
      if (!recentHydrated) setIsLoadingRecent(true)
      try {
        setRecentItems(getRecents(user?.id, 20))
      } catch {
        setRecentItems([])
      } finally {
        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
        setIsLoadingRecent(false)
        if (!recentHydrated) setRecentHydrated(true)
      }
    }
    void load()
    const onRecentUpdated = () => void load()
    window.addEventListener('recent:updated', onRecentUpdated as EventListener)
    const t = window.setInterval(load, 5000)
    return () => {
      window.removeEventListener('recent:updated', onRecentUpdated as EventListener)
      if (t) window.clearInterval(t)
    }
  }, [user?.id, recentHydrated])

  const sortedUsers = useMemo(() => users.slice().sort((a, b) => {
    const rolePriority = { 'CEO': 4, 'Admin': 3, 'Premium': 2, 'Free': 1 } as const
    const aPriority = rolePriority[(a.role as keyof typeof rolePriority)] || 0
    const bPriority = rolePriority[(b.role as keyof typeof rolePriority)] || 0
    return bPriority - aPriority
  }), [users])

  const isLoadingTopResources = isLoadingCache || (!viewCounts.length && !allResources.length)

  const recentResources = useMemo(() => (
    recentItems
      .slice(0, 4)
      .map(item => allResources.find(r => r.id === item.id))
      .filter((res): res is Resource => res !== undefined)
  ), [recentItems, allResources])

  const showRecentSkeleton = !recentHydrated && isLoadingRecent && recentResources.length === 0

  const handleOpenResource = useCallback((r: Resource) => {
    onOpenResource(r)
    void (async () => {
      try { await viewsFavs.recordViewFromResource(r) } catch {}
      try {
        addRecent(user?.id ?? null, { id: r.id, title: r.title, url: r.url })
        setRecentItems(getRecents(user?.id, 20))
      } catch {}
    })()
  }, [onOpenResource, user?.id])

  const handleToggleFavorite = useCallback(async (resourceId: string) => {
    try { onToggleFavoriteExternal?.(resourceId) } catch {}
    setAllResources(prev => prev.map(r => r.id === resourceId ? { ...r, is_favorite: !r.is_favorite } : r))
    try {
      const r = allResources.find(x => x.id === resourceId)
      if (r) {
        const nextFav = !r.is_favorite
        try { await viewsFavs.upsertFromResource(r, nextFav) } catch {}
      }
      const itemsForAgg = await viewsFavs.getAllUsersItems()
      const cat = viewsFavs.aggregateCategoriesWithViews(itemsForAgg, viewCounts)
      const sub = viewsFavs.aggregateSubcategoriesWithViews(itemsForAgg, viewCounts)
      setFavCatAgg(cat)
      setFavSubAgg(sub)
      setTotalFavourites(itemsForAgg.filter(i => i.favourite).length)
      setMyFavouritesCount(allResources.filter(r => Boolean(r.is_favorite)).length)
      if (user?.id) {
        await saveDashboardCache(user.id, {
          users,
          userAvatars,
          viewCounts,
          favCatAgg: cat,
          favSubAgg: sub,
          topResources: [],
          totalFavourites: itemsForAgg.filter(i => i.favourite).length,
        })
      }
    } catch {}
  }, [onToggleFavoriteExternal, allResources, user?.id, viewCounts, users, userAvatars])

  return {
    users: sortedUsers,
    userAvatars,
    selectedUser,
    setSelectedUser,
    viewCounts,
    isLoadingViews,
    favCatAgg,
    favSubAgg,
    totalFavourites,
    myFavouritesCount,
    allResources,
    recentResources,
    showRecentSkeleton,
    isLoadingTopResources,
    handleOpenResource,
    handleToggleFavorite,
  }
}
