import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Users, Library, Heart } from 'lucide-react';
import { TopResource } from './topresource'
import { QuickActions } from './quickactions'
import { ViewsSparkline } from './viewsSparkline'
import { TopCategories } from './topCategories'
import { TopSubcategories } from './topSubcategories'
// Simple in-module caches to avoid refetching when navigating back to Dashboard
const USERS_CACHE: { users: User[]; avatars: Record<string, string>; ts: number } = { users: [], avatars: {}, ts: 0 }
const DASH_CACHE: {
  viewCounts: Database['public']['Views']['view_counts']['Row'][]
  favCatAgg: Array<{ name: string; count: number; favourites: number }>
  favSubAgg: Array<{ category: string; subcategory: string; count: number; favourites: number }>
  topResources: Resource[]
  ts: number
} = { viewCounts: [], favCatAgg: [], favSubAgg: [], topResources: [], ts: 0 }
import { ResourceCard } from '@/components/Resources/grid/ResourceCard';
import type { Category, Resource } from '@/types';
import { useAuth } from '@/lib/auth';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { supabase } from '@/lib/services';
import * as viewsFavs from '@/lib/services/viewsFavs';
import type { Database } from '@/types/database';

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

interface ProfileData {
  picture_enc: string | null;
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
}: DashboardProps) {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [users, setUsers] = useState<User[]>([]);
  const [userAvatars, setUserAvatars] = useState<Record<string, string>>({});
  const [viewCounts, setViewCounts] = useState<Database['public']['Views']['view_counts']['Row'][]>([]);
  const [, setIsLoadingViews] = useState(false);
  const [favCatAgg, setFavCatAgg] = useState<Array<{ name: string; count: number; favourites: number }>>([]);
  const [favSubAgg, setFavSubAgg] = useState<Array<{ category: string; subcategory: string; count: number; favourites: number }>>([]);
  const [totalFavourites, setTotalFavourites] = useState(0);
  const [recentItems, setRecentItems] = useState<Array<{ id: string; title: string; url?: string | null; ts: number }>>([]);
  const [allResources, setAllResources] = useState<Resource[]>(resources);
  // moved to TopResource component

  // Load users for user circles section
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const now = Date.now()
        if (USERS_CACHE.users.length > 0 && now - USERS_CACHE.ts < 5 * 60 * 1000) {
          setUsers(USERS_CACHE.users)
          setUserAvatars(USERS_CACHE.avatars)
          return
        }
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
            USERS_CACHE.users = userList
            USERS_CACHE.ts = now
            
            // If we already have avatars cached, use them and skip network
            if (Object.keys(USERS_CACHE.avatars).length > 0) {
              setUserAvatars(USERS_CACHE.avatars)
              return
            }
            // Fetch profile pictures from profiles table
            const avatarPromises = userList.map(async (usr: User) => {
              console.log(`Fetching avatar for user: ${usr.id}`);
              try {
                const { data: profileData }: { data: ProfileData | null } = await supabase
                  .from('profiles')
                  .select('picture_enc')
                  .eq('user_id', usr.id)
                  .maybeSingle();

                if (profileData?.picture_enc) {
                  const pictureEnc = profileData.picture_enc;
                  let mime = 'image/jpeg';
                  let b64: string;
                  try {
                    const parsed = JSON.parse(pictureEnc);
                    b64 = parsed.b64;
                    if (parsed.mime) mime = parsed.mime;
                  } catch {
                    b64 = pictureEnc;
                  }
                  const dataUrl = `data:${mime};base64,${b64}`;
                  console.log(`Avatar data URL created for user ${usr.id}:`, dataUrl.substring(0, 50) + '...');
                  return { id: usr.id, url: dataUrl };
                } else {
                  console.log(`No profile picture found for user ${usr.id}, falling back to avatarUrlMeta:`, usr.avatarUrlMeta);
                  return { id: usr.id, url: usr.avatarUrlMeta || null };
                }
              } catch (error) {
                console.error(`Error fetching avatar for user ${usr.id}:`, error);
                return { id: usr.id, url: usr.avatarUrlMeta || null };
              }
            });

            const avatars = await Promise.all(avatarPromises);
            const avatarMap = avatars.reduce((acc, { id, url }) => {
              if (url) {
                acc[id] = url;
                console.log(`Avatar set for user ${id}:`, url.substring(0, 50) + '...');
              } else {
                console.log(`No avatar available for user ${id}`);
              }
              return acc;
            }, {} as Record<string, string>);
            USERS_CACHE.avatars = avatarMap
            setUserAvatars(avatarMap);
          }
        }
      } catch {}
    };
    void loadUsers();
  }, [user?.id]); // Re-run when user changes to update avatars

  // Seed from cache immediately to avoid empty flashes
  useEffect(() => {
    if (DASH_CACHE.viewCounts.length) setViewCounts(DASH_CACHE.viewCounts)
    if (DASH_CACHE.favCatAgg.length) setFavCatAgg(DASH_CACHE.favCatAgg)
    if (DASH_CACHE.favSubAgg.length) setFavSubAgg(DASH_CACHE.favSubAgg)
  }, [])

  // Load aggregated view counts from Supabase + favourite category/subcategory aggregates from views_favs (online/offline)
  useEffect(() => {
    (async () => {
      try {
        setIsLoadingViews(true);
        const data = await viewsFavs.fetchViewCounts().catch(() => []);
        if (data && data.length) {
          setViewCounts(data);
          DASH_CACHE.viewCounts = data;
          DASH_CACHE.ts = Date.now();
        }
      } catch (e) {
        console.warn('Failed to fetch view counts:', e);
        // keep previous state to avoid flash
      } finally {
        setIsLoadingViews(false);
      }
      try {
        const merged = await viewsFavs.getMergedItems();
        const cat = viewsFavs.aggregateCategories(merged)
        const sub = viewsFavs.aggregateSubcategories(merged)
        setFavCatAgg(cat);
        setFavSubAgg(sub);
        setTotalFavourites(merged.filter(i => i.favourite).length);
        DASH_CACHE.favCatAgg = cat;
        DASH_CACHE.favSubAgg = sub;
        DASH_CACHE.ts = Date.now();
      } catch (e) {
        console.warn('Failed to compute favourites aggregates:', e);
        // keep previous state
      }
    })();
  }, [user?.id]);

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

  // Load recent items from local storage (Library opens) and refresh periodically
  useEffect(() => {
    // refresh timer
    const load = async () => {
      try {
        const { getRecents } = await import('@/lib/services/recent');
        setRecentItems(getRecents(user?.id, 20));
      } catch {
        setRecentItems([]);
      }
    }
    void load()
    const t = window.setInterval(load, 5000)
    return () => { if (t) window.clearInterval(t) }
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

  const handleOpenResource = async (r: Resource) => {
    try { await viewsFavs.recordViewFromResource(r) } catch {}
    try {
      const recent = await import('@/lib/services/recent')
      recent.addRecent(user?.id ?? null, { id: r.id, title: r.title, url: r.url })
      setRecentItems(recent.getRecents(user?.id, 20))
    } catch {}
    onOpenResource(r)
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-2 mb-2">
            <Library className="h-5 w-5 text-blue-500" />
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Resources</div>
          </div>
          <div className="text-2xl font-semibold text-gray-900 dark:text-white">{resources.length}</div>
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
      </div>
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Resources */}
        <TopResource
          resources={allResources}
          viewCounts={viewCounts}
          onOpenResource={handleOpenResource}
          onOpenLibrary={onOpenLibrary}
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
              const res = resources.find(r => r.id === item.id);
              if (res) {
                return (
                  <div key={item.id} className="h-32">
                    <ResourceCard
                      resource={res}
                      onOpen={handleOpenResource}
                      onToggleFavorite={() => { /* handled in card */ }}
                      variant="small"
                    />
                  </div>
                );
              }
              return (
                <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors" onClick={() => {}}>
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
                    <div className="relative w-16 h-16 mx-auto mb-2 flex-shrink-0">
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
                    <div className="relative w-16 h-16 mx-auto mb-2 flex-shrink-0">
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
    </motion.div>
  );
}
