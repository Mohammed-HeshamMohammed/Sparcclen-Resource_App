import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Users, Library, Heart, Tag } from 'lucide-react';
import { TopResource } from './topresource'
import { QuickActions } from './quickactions'
import { ViewsSparkline } from './viewsSparkline'
import { TopCategories } from './topCategories'
import { TopSubcategories } from './topSubcategories'
import { UserProfileModal } from './UserProfileModal'
import { ResourceCard } from '@/components/Resources/grid/ResourceCard';
import type { Category, Resource } from '@/types';
import { useAuth } from '@/lib/auth';
import { useProfile } from '@/lib/contexts/ProfileContext';
import * as viewsFavs from '@/lib/services/viewsFavs';
import type { Database } from '@/types/database';
import { loadDashboardCache, saveDashboardCache } from '@/lib/services/dashboardCache';

interface SupabaseUser {
  id: string;
  email?: string;
  user_metadata?: {
    display_name?: string;
    full_name?: string;
    name?: string;
    avatar_url?: string;
    role?: string;
  };
  app_metadata?: {
    role?: string;
  };
}

interface WindowApi {
  admin?: {
    listUsers: () => Promise<{ ok: boolean; users: SupabaseUser[] }>;
  };
  onWindowResize?: (callback: (size: { width: number; height: number }) => void) => () => void;
  getWindowSize?: () => Promise<{ width: number; height: number }>;
}

interface User {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrlMeta: string | null;
  role: string;
}

interface DashboardProps {
  resources: Resource[];
  categories: Category[];
  onOpenResource: (resource: Resource) => void;
  onOpenLibrary: () => void;
  onOpenImports: () => void;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onOpenRoles: () => void;
  onToggleFavorite?: (resourceId: string) => void;
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
  const { user } = useAuth();
  const { profile } = useProfile();
  const [users, setUsers] = useState<User[]>([]);
  const [userAvatars, setUserAvatars] = useState<Record<string, string>>({});
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [viewCounts, setViewCounts] = useState<Database['public']['Views']['view_counts']['Row'][]>([]);
  const [, setIsLoadingViews] = useState(false);
  const [favCatAgg, setFavCatAgg] = useState<Array<{ name: string; count: number; favourites: number }>>([]);
  const [favSubAgg, setFavSubAgg] = useState<Array<{ category: string; subcategory: string; count: number; favourites: number }>>([]);
  const [totalFavourites, setTotalFavourites] = useState(0);
  const [recentItems, setRecentItems] = useState<Array<{ id: string; title: string; url?: string | null; ts: number }>>([]);
  const [allResources, setAllResources] = useState<Resource[]>(resources);
  const [isLoadingCache, setIsLoadingCache] = useState(true);
  const [, setLastCacheRefresh] = useState<number>(0);

  // Load cached data per-user when user is known
  useEffect(() => {
    const loadCachedData = async () => {
      if (!user?.id) return;
      try {
        const cachedData = await loadDashboardCache(user.id);
        if (cachedData) {
          setUsers(cachedData.users);
          setUserAvatars(cachedData.userAvatars);
          setViewCounts(cachedData.viewCounts);
          setFavCatAgg(cachedData.favCatAgg);
          setFavSubAgg(cachedData.favSubAgg);
          setTotalFavourites(cachedData.totalFavourites);
          setLastCacheRefresh(cachedData.timestamp);
          setIsLoadingCache(false);
          return;
        }
      } catch {}
      setIsLoadingCache(false);
    };
    loadCachedData();
  }, [user?.id]);

  // Background refresh: re-fetch view_counts and favourites every minute regardless of cache
  useEffect(() => {
    let cancelled = false
    const fetchOnce = async () => {
      try {
        setIsLoadingViews(true)
        const latest = await viewsFavs.fetchViewCounts().catch(() => [])
        if (!cancelled && latest && latest.length) setViewCounts(latest)
      } catch (e) {
        console.warn('Refresh view_counts failed:', e)
      } finally {
        setIsLoadingViews(false)
      }
      try {
        const merged = await viewsFavs.getMergedItems()
        if (cancelled) return
        const cat = viewsFavs.aggregateCategoriesWithViews(merged, viewCounts)
        const sub = viewsFavs.aggregateSubcategoriesWithViews(merged, viewCounts)
        setFavCatAgg(cat)
        setFavSubAgg(sub)
        setTotalFavourites(merged.filter(i => i.favourite).length)
        if (user?.id) setLastCacheRefresh(Date.now())
      } catch (e) {
        console.warn('Refresh favourites aggregates failed:', e)
      }
    }
    void fetchOnce()
    const t = window.setInterval(fetchOnce, 60000)
    return () => { cancelled = true; if (t) window.clearInterval(t) }
  }, [user?.id])

  // Load users for user circles section (only if not already cached)
  useEffect(() => {
    if (!isLoadingCache && users.length === 0) {
      const loadUsers = async () => {
        try {
          const api = (window as unknown as { api: WindowApi }).api;
          if (api?.admin?.listUsers) {
            const res = await api.admin.listUsers();
            if (res?.ok) {
              const userList = (res.users || []).map((u: SupabaseUser) => {
                const meta = u.user_metadata || {};
                const app = u.app_metadata || {};
                const role = meta.role || app.role || 'Free';
                return {
                  id: u.id,
                  email: u.email ?? null,
                  name: meta.display_name || meta.full_name || meta.name || ((u.email || '').split('@')[0] || null),
                  avatarUrlMeta: meta.avatar_url || null,
                  role,
                };
              });
              setUsers(userList);
              
              // Fetch encrypted profile pictures from Supabase (same approach as Role Management)
              const avatarMap: Record<string, string> = {};
              const userIds = userList.map(u => u.id);
              
              if (userIds.length > 0) {
                try {
                  const { supabase } = await import('@/lib/services');
                  const { data, error } = await supabase
                    .from('profiles')
                    .select('user_id,picture_enc')
                    .in('user_id', userIds);

                  if (error) {
                    console.warn('Failed to fetch encrypted profile pictures:', error);
                  } else {
                    // Decrypt and process the profile pictures
                    const rows = (data ?? []) as Array<{ user_id: string | null; picture_enc: string | null }>;
                    for (const row of rows) {
                      if (!row?.user_id || !row?.picture_enc) continue;
                      const pictureEnc = row.picture_enc as string;
                      let mime = 'image/jpeg';
                      let base64: string | null = null;

                      try {
                        // Try to parse as JSON first
                        const parsed = JSON.parse(pictureEnc) as { b64?: string; mime?: string };
                        base64 = typeof parsed?.b64 === 'string' ? parsed.b64 : null;
                        if (parsed?.mime) {
                          mime = parsed.mime;
                        }
                      } catch {
                        // Fallback to treating the entire string as base64
                        base64 = pictureEnc;
                      }

                      if (base64) {
                        avatarMap[row.user_id] = `data:${mime};base64,${base64}`;
                      }
                    }
                  }
                  
                  // Also pre-cache public profile data (cover/bio) for faster modal loading
                  try {
                    const { data: publicData, error: publicError } = await supabase
                      .from('profiles')
                      .select('user_id,cover_public,bio_public')
                      .in('user_id', userIds);
                      
                    if (!publicError && publicData) {
                      const { setUserPublicProfileCached } = await import('@/lib/services/dashboardCache');
                      for (const row of publicData) {
                        if (row?.user_id && user?.id && row.user_id !== user.id) {
                          await setUserPublicProfileCached(user.id, row.user_id, {
                            coverUrl: row.cover_public,
                            bio: row.bio_public
                          });
                        }
                      }
                    }
                  } catch (error) {
                    console.warn('Failed to pre-cache public profile data:', error);
                  }
                } catch (error) {
                  console.warn('Failed to fetch encrypted profile pictures for dashboard:', error);
                }
              }
              
              // Fallback to avatar metadata or avatar service for users without encrypted pictures
              for (const usr of userList) {
                if (avatarMap[usr.id]) continue; // Already have encrypted picture
                
                if (usr.avatarUrlMeta) {
                  avatarMap[usr.id] = usr.avatarUrlMeta;
                } else if (usr.email) {
                  try {
                    const { avatarService } = await import('@/lib/services');
                    const fallbackUrl = await avatarService.getAvatarUrl(usr.email, true);
                    if (fallbackUrl) {
                      avatarMap[usr.id] = fallbackUrl;
                    }
                  } catch (error) {
                    console.warn(`Failed to get fallback avatar for user ${usr.id}:`, error);
                  }
                }
              }
              
              setUserAvatars(avatarMap);
            }
          }
        } catch {}
      };
      void loadUsers();
    }
  }, [user?.id, isLoadingCache, users.length]);


  // Initial load of view_counts and favourites (independent of cache)
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
        const merged = await viewsFavs.getMergedItems()
        if (cancelled) return
        const cat = viewsFavs.aggregateCategoriesWithViews(merged, latestViewCounts.length ? latestViewCounts : viewCounts)
        const sub = viewsFavs.aggregateSubcategoriesWithViews(merged, latestViewCounts.length ? latestViewCounts : viewCounts)
        setFavCatAgg(cat)
        setFavSubAgg(sub)
        setTotalFavourites(merged.filter(i => i.favourite).length)
      } catch (e) {
        console.warn('Failed to compute favourites aggregates:', e)
      }
    })()
    return () => { cancelled = true }
  }, [user?.id])

  // Save dashboard data to cache when all data is loaded (debounced)
  useEffect(() => {
    if (!user?.id) return;
    if (!isLoadingCache && users.length > 0 && viewCounts.length > 0 && favCatAgg.length > 0) {
      const timeoutId = setTimeout(async () => {
        try {
          // Compute top resources from view_counts before caching
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
                    const { searchResources } = await import('@/lib/services')
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
          });
        } catch (error) {
          console.warn('Failed to save dashboard data to cache:', error);
        }
      }, 1000)
      return () => clearTimeout(timeoutId)
    }
  }, [user?.id, users, userAvatars, viewCounts, favCatAgg, favSubAgg, totalFavourites, isLoadingCache, allResources]);

  // Keep a local copy of resources; if empty, fetch a small set as fallback for dashboard display
  useEffect(() => { setAllResources(resources) }, [resources])
  useEffect(() => {
    (async () => {
      if (!resources || resources.length === 0) {
        try {
          const { getResources } = await import('@/lib/services')
          const data = await getResources(undefined, undefined)
          setAllResources(data)
        } catch {}
      }
    })()
  }, [resources])

  // Load recent items from local storage (Library opens) and refresh periodically + on event
  useEffect(() => {
    const load = async () => {
      try {
        const { getRecents } = await import('@/lib/services/recent');
        setRecentItems(getRecents(user?.id, 20));
      } catch {
        setRecentItems([]);
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
  }, [user?.id]);

  // sparkline moved to ViewsSparkline component

  // Top categories from views_favs (merged offline/online)
  // (unused detailed datasets removed to satisfy typecheck)

  // Recent activity now comes from local recentItems (from Library opens)

  // Top resources handled by TopResource component
  /*useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        // 1) Sort global view counts
        const sorted = [...viewCounts].sort((a, b) => (Number(b.views) || 0) - (Number(a.views) || 0))
        const titles = sorted.map(v => v.title).slice(0, 30)
        const norm = (s: string) => (s || '').toLowerCase().replace(/\s+/g, ' ').trim()

        // 2) Index local resources by normalized title
        const byNormTitle = new Map<string, Resource>()
        for (const r of allResources) {
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

          // a) Exact normalized title in local index
          let res = byNormTitle.get(nt) || topCacheRef.current[title]

          // b) If not found, search by query and pick best match
          if (!res) {
            try {
              const { searchResources } = await import('@/lib/services')
              const filters = { query: title, categoryId: null, subcategoryId: null, tags: [], favoritesOnly: false, resourceType: null }
              const results: Resource[] = await searchResources(filters, user?.id || undefined)
              if (results && results.length > 0) {
                // score: exact normalized match > includes normalized substring > highest local view_count
                const scored = results.map(r => {
                  const nrt = norm(r.title)
                  let score = 0
                  if (nrt === nt) score = 3
                  else if (nrt.includes(nt) || nt.includes(nrt)) score = 2
                  else score = 1
                  // small boost by local view_count
                  score += Math.min(1, (r.view_count || 0) / 1000)
                  return { r, score }
                })
                scored.sort((a, b) => b.score - a.score)
                res = scored[0].r
              }
            } catch {}
          }

          if (res) {
            topCacheRef.current[title] = res
            // prevent duplicates by id
            if (!picked.some(p => p.id === res!.id)) picked.push(res)
          }
        }

        // 3) Fallback fill with locally most-viewed resources to ensure up to 6
        if (picked.length < 6) {
          const filler = [...allResources]
            .filter(r => !picked.some(p => p.id === r.id))
            .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
            .slice(0, 6 - picked.length)
          picked.push(...filler)
        }

        if (!cancelled) {
          setTopResources(picked)
          DASH_CACHE.topResources = picked
          DASH_CACHE.ts = Date.now()
        }
      } catch (e) {
        if (!cancelled) {
          // keep previous state
        }
      }
    })()
    return () => { cancelled = true }
  }, [viewCounts, allResources, user?.id])*/

  // Sort users by role priority: CEO > Admin > Premium > Free
  const sortedUsers = users.slice().sort((a, b) => {
    const rolePriority = { 'CEO': 4, 'Admin': 3, 'Premium': 2, 'Free': 1 };
    const aPriority = rolePriority[a.role as keyof typeof rolePriority] || 0;
    const bPriority = rolePriority[b.role as keyof typeof rolePriority] || 0;
    return bPriority - aPriority;
  });

  const subcategoriesCount = categories.reduce((sum, c) => sum + (c.subcategories?.length || 0), 0)

  const handleOpenResource = (r: Resource) => {
    onOpenResource(r)
    void (async () => {
      try { await viewsFavs.recordViewFromResource(r) } catch {}
      try {
        const recent = await import('@/lib/services/recent')
        recent.addRecent(user?.id ?? null, { id: r.id, title: r.title, url: r.url })
        setRecentItems(recent.getRecents(user?.id, 20))
      } catch {}
    })()
  }

  const handleToggleFavorite = async (resourceId: string) => {
    // Also update Library/localStorage if handler provided
    try { onToggleFavorite?.(resourceId) } catch {}
    // Optimistically toggle in local resources used by dashboard cards
    setAllResources(prev => prev.map(r => r.id === resourceId ? { ...r, is_favorite: !r.is_favorite } : r))
    try {
      // Recompute aggregates from views_favs per-user to keep the 5-card stats correct
      const merged = await viewsFavs.getMergedItems()
      const cat = viewsFavs.aggregateCategoriesWithViews(merged, viewCounts)
      const sub = viewsFavs.aggregateSubcategoriesWithViews(merged, viewCounts)
      setFavCatAgg(cat)
      setFavSubAgg(sub)
      setTotalFavourites(merged.filter(i => i.favourite).length)
      // Persist updated dashboard cache for this user
      if (user?.id) {
        await saveDashboardCache(user.id, {
          users,
          userAvatars,
          viewCounts,
          favCatAgg: cat,
          favSubAgg: sub,
          topResources: [],
          totalFavourites: merged.filter(i => i.favourite).length,
        })
      }
    } catch {}
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="p-6 md:p-8 space-y-6 overflow-y-auto scrollbar-hide"
      style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}
    >
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Overview and quick actions</p>
      </div>
      
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Views Sparkline */}
        <ViewsSparkline viewCounts={viewCounts} />
        {/* Categories Overview */}
        <TopCategories items={favCatAgg} />
      </div>

      {/* Top Subcategories */}
      <TopSubcategories items={favSubAgg} />
      
      {/* Stats Cards */}
      {/* Desktop Layout (above 1025px) */}
      <div className="hidden min-[1026px]:block">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-900">
            <div className="flex items-center gap-2 mb-2">
              <Library className="h-5 w-5 text-blue-500" />
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Resources</div>
            </div>
            <div className="text-2xl font-semibold text-gray-900 dark:text-white">{resources.length}</div>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-900">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Views</div>
            </div>
            <div className="text-2xl font-semibold text-gray-900 dark:text-white">{viewCounts.reduce((sum, v) => sum + (Number(v.views) || 0), 0)}</div>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-900">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="h-5 w-5 text-red-500" />
              <div className="text-sm text-gray-500 dark:text-gray-400">Favourites</div>
            </div>
            <div className="text-2xl font-semibold text-gray-900 dark:text-white">{totalFavourites}</div>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-900">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-5 w-5 text-emerald-500" />
              <div className="text-sm text-gray-500 dark:text-gray-400">Categories</div>
            </div>
            <div className="text-2xl font-semibold text-gray-900 dark:text-white">{categories.length}</div>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-900">
            <div className="flex items-center gap-2 mb-2">
              <Tag className="h-5 w-5 text-orange-500" />
              <div className="text-sm text-gray-500 dark:text-gray-400">Subcategories</div>
            </div>
            <div className="text-2xl font-semibold text-gray-900 dark:text-white">{subcategoriesCount}</div>
          </div>
        </div>
      </div>
      
      {/* Mobile Layout (1025px and below) - 2x2 grid with circular overlay */}
      <div className="block min-[1026px]:hidden relative">
        {/* Normal 2x2 grid layout */}
        <div className="grid grid-cols-2 gap-4">
          {/* Top Left - Total Resources */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-900">
            <div className="flex items-center gap-2 mb-2">
              <Library className="h-5 w-5 text-blue-500" />
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Resources</div>
            </div>
            <div className="text-2xl font-semibold text-gray-900 dark:text-white">{resources.length}</div>
          </div>
          
          {/* Top Right - Total Views */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-900">
            <div className="flex items-center gap-2 mb-2 justify-end">
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Views</div>
              <TrendingUp className="h-5 w-5 text-purple-500" />
            </div>
            <div className="text-2xl font-semibold text-gray-900 dark:text-white text-right">{viewCounts.reduce((sum, v) => sum + (Number(v.views) || 0), 0)}</div>
          </div>
          
          {/* Bottom Left - Categories */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-900">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-5 w-5 text-emerald-500" />
              <div className="text-sm text-gray-500 dark:text-gray-400">Categories</div>
            </div>
            <div className="text-2xl font-semibold text-gray-900 dark:text-white">{categories.length}</div>
          </div>
          
          {/* Bottom Right - Subcategories */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-900">
            <div className="flex items-center gap-2 mb-2 justify-end">
              <div className="text-sm text-gray-500 dark:text-gray-400">Subcategories</div>
              <Tag className="h-5 w-5 text-orange-500" />
            </div>
            <div className="text-2xl font-semibold text-gray-900 dark:text-white text-right">{subcategoriesCount}</div>
          </div>
        </div>
        
        {/* Circular Favourites Overlay - positioned on top of the grid */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-36 h-36 rounded-full border-4 backdrop-blur-sm pointer-events-auto border-white dark:border-[#111827]">
            {/* Inner border */}
            <div className="absolute inset-0 rounded-full border-2 border-red-300 dark:border-[#030712]">
              {/* Inner content area */}
              <div className="w-full h-full rounded-full bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/90 dark:to-pink-900/90 p-4">
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Heart className="h-7 w-7 text-red-600 dark:text-red-400 mb-1" fill="currentColor" />
                  <div className="text-sm text-red-700 dark:text-red-300 font-medium leading-tight">Favourites</div>
                  <div className="text-2xl font-bold text-red-700 dark:text-red-300">{totalFavourites}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Resources */}
        <TopResource
          resources={allResources}
          viewCounts={viewCounts}
          onOpenResource={handleOpenResource}
          onOpenLibrary={onOpenLibrary}
          onToggleFavorite={handleToggleFavorite}
        />
        
        {/* Quick Actions */}
        <QuickActions
          onOpenLibrary={onOpenLibrary}
          onOpenImports={onOpenImports}
          onOpenProfile={onOpenProfile}
          onOpenSettings={onOpenSettings}
          onOpenRoles={onOpenRoles}
        />
      </div>
      
      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recentItems.slice(0, 4).map(item => {
              const thumbnailUrl = item.url ? `https://api.thumbnail.ws/api/thumbnail?url=${encodeURIComponent(item.url)}&width=64&height=64` : null;
              const res = allResources.find(r => r.id === item.id);
              if (res) {
                return (
                  <div key={item.id} className="h-32">
                    <ResourceCard
                      resource={res}
                      onOpen={handleOpenResource}
                      onToggleFavorite={handleToggleFavorite}
                      variant="small"
                    />
                  </div>
                );
              }
              return (
                <div key={item.id} className="h-32">
                  <div className="flex h-full items-center gap-3 p-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-default transition-colors">
                    <div className="w-12 h-12 rounded bg-gray-100 dark:bg-gray-800 flex-shrink-0 overflow-hidden">
                      {thumbnailUrl ? (
                        <img src={thumbnailUrl} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Library className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.title}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Recently opened</div>
                    </div>
                  </div>
                </div>
              );
            })}
            {recentItems.length === 0 && (
              <div className="text-sm text-gray-500 dark:text-gray-400">No recent opens yet</div>
            )}
          </div>
        </div>
        
        {/* Users */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Current Users</h3>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {sortedUsers.slice(0, 6).map(usr => {
              const isMe = !!(usr.email && usr.email === user?.email);
              const displayRole = isMe && profile?.accountType ? String(profile.accountType) : String(usr.role || 'Free');
              return (
                <div key={usr.id} className="text-center">
                  {displayRole === 'CEO' ? (
                    <div className="relative w-24 h-24 mx-auto mb-2 flex-shrink-0 cursor-pointer" role="button" onClick={() => setSelectedUser(usr)}>
                      {/* Rotating color ring */}
                      <div className="absolute inset-0 rounded-full">
                        <div className="absolute inset-0 rounded-full bg-[conic-gradient(#ff005e,#ffbe0b,#00f5d4,#00bbf9,#9b5de5,#ff005e)] animate-rotate-slow"></div>
                      {/* Rotating glow */}
                      <div className="absolute -inset-[2px] rounded-full bg-[conic-gradient(#ff005e,#ffbe0b,#00f5d4,#00bbf9,#9b5de5,#ff005e)] blur-sm opacity-40 animate-rotate-slow"></div>
                    </div>
                    {/* Inner circle (static) */}
                    <div className="absolute inset-[2px] rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      {userAvatars[usr.id] ? (
                        <img src={userAvatars[usr.id]} alt={usr.name || 'User'} className="w-full h-full object-cover rounded-full" />
                      ) : usr.avatarUrlMeta ? (
                        <img src={usr.avatarUrlMeta} alt={usr.name || 'User'} className="w-full h-full object-cover rounded-full" />
                      ) : (
                        <span className="text-white text-base font-semibold">
                          {(usr.name || usr.email || 'U').charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                  ) : (
                    <div className="relative w-[5.5rem] h-[5.5rem] mx-auto mb-2 flex-shrink-0 cursor-pointer" role="button" onClick={() => setSelectedUser(usr)}>
                      {userAvatars[usr.id] ? (
                        <img src={userAvatars[usr.id]} alt={usr.name || 'User'} className={`w-full h-full object-cover rounded-full ring-2 ring-offset-1 dark:ring-offset-gray-950 ring-offset-white ${displayRole === 'Admin' ? 'ring-amber-500' : displayRole === 'Premium' ? 'ring-emerald-500' : 'ring-gray-400'}`} />
                      ) : usr.avatarUrlMeta ? (
                        <img src={usr.avatarUrlMeta} alt={usr.name || 'User'} className={`w-full h-full object-cover rounded-full ring-2 ring-offset-1 dark:ring-offset-gray-950 ring-offset-white ${displayRole === 'Admin' ? 'ring-amber-500' : displayRole === 'Premium' ? 'ring-emerald-500' : 'ring-gray-400'}`} />
                      ) : (
                        <div className={`w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-base font-semibold ring-2 ring-offset-1 dark:ring-offset-gray-950 ring-offset-white ${displayRole === 'Admin' ? 'ring-amber-500' : displayRole === 'Premium' ? 'ring-emerald-500' : 'ring-gray-400'}`}>
                          {(usr.name || usr.email || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="text-xs text-gray-700 dark:text-gray-300 break-words text-center">
                    {usr.name || usr.email?.split('@')[0] || 'User'}
                  </div>
                </div>
              );
            })}
          </div>
          {users.length > 6 && (
            <div className="text-center mt-3">
              <span className="text-xs text-gray-500 dark:text-gray-400">+{users.length - 6} more</span>
            </div>
          )}
        </div>
      </div>
      <UserProfileModal
        open={!!selectedUser}
        user={selectedUser ? {
          id: selectedUser.id,
          name: selectedUser.name,
          email: selectedUser.email,
          role: (selectedUser.role || 'Free'),
          avatarUrl: selectedUser ? (userAvatars[selectedUser.id] || selectedUser.avatarUrlMeta || null) : null,
        } : null}
        onClose={() => setSelectedUser(null)}
      />
    </motion.div>
  );
}
