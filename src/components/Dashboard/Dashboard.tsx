import { useState, useEffect, useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BarChart3, TrendingUp, Users, Library, Heart, Settings as SettingsIcon, Shield, User as UserIcon } from 'lucide-react';

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
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onOpenRoles: () => void;
}

export function Dashboard({
  resources,
  categories,
  onOpenResource,
  onOpenLibrary,
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
  const [topResources, setTopResources] = useState<Resource[]>([]);
  const topCacheRef = useRef<Record<string, Resource>>({});

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
    if (DASH_CACHE.topResources.length) setTopResources(DASH_CACHE.topResources)
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

  // Build "sparkline" from top viewed titles (normalize to 7 buckets)
  const sparklineData = useMemo(() => {
    const tops = [...viewCounts].slice(0, 7);
    const max = Math.max(1, ...tops.map(t => Number(t.views) || 0));
    return tops.map((t, idx) => ({ day: idx + 1, views: Math.round(((Number(t.views) || 0) / max) * 60) }));
  }, [viewCounts]);

  // Top categories from views_favs (merged offline/online)
  // (unused detailed datasets removed to satisfy typecheck)

  // Recent activity now comes from local recentItems (from Library opens)

  // Top resources by global views (match by title)
  // Build Top Resources from global view counts; fill missing items via search
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const sorted = [...viewCounts].sort((a, b) => (Number(b.views) || 0) - (Number(a.views) || 0))
        const titles = sorted.map(v => v.title).slice(0, 20)
        const viewMap = new Map(sorted.map(v => [v.title, Number(v.views) || 0]))
        const picked: Resource[] = []
        for (const title of titles) {
          if (picked.length >= 6) break
          let res = allResources.find(r => r.title === title) || topCacheRef.current[title]
          if (!res) {
            try {
              const { searchResources } = await import('@/lib/services')
              const filters = { query: title, categoryId: null, subcategoryId: null, tags: [], favoritesOnly: false, resourceType: null }
              const results = await searchResources(filters, user?.id || undefined)
              res = (results || []).find((r: Resource) => r.title === title) || (results || [])[0]
            } catch {}
          }
          if (res) {
            topCacheRef.current[title] = res
            picked.push(res)
          } else {
            // Create a minimal placeholder resource so the card still shows
            const nowIso = new Date().toISOString()
            const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'item'
            const placeholder: Resource = {
              id: `top::${slug}`,
              slug,
              title,
              description: null,
              url: null,
              category_id: 'top',
              subcategory_id: null,
              resource_type: '',
              thumbnail_url: null,
              thumbnail_type: null,
              colors: null,
              metadata: {},
              view_count: Number(viewMap.get(title)) || 0,
              date_added: nowIso,
              created_at: nowIso,
              updated_at: nowIso,
              tags: [],
              is_favorite: false,
            }
            picked.push(placeholder)
          }
        }
        if (!cancelled) {
          setTopResources(picked)
          DASH_CACHE.topResources = picked
          DASH_CACHE.ts = Date.now()
        }
      } catch {
        if (!cancelled) setTopResources([])
      }
    })()
    return () => { cancelled = true }
  }, [viewCounts, allResources, user?.id])

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
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Top Views</h3>
          </div>
          <div className="flex items-end gap-1 h-16">
            {sparklineData.map((data, i) => (
              <div key={i} className="flex-1 bg-blue-500 rounded-t opacity-70 hover:opacity-100 transition-opacity" 
                   style={{ height: `${(data.views / 60) * 100}%` }}
                   title={`${viewCounts[data.day - 1]?.title ?? '—'}: ${viewCounts[data.day - 1]?.views ?? 0} views`}
              />
            ))}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">Last 7 days</div>
        </div>
        
        {/* Categories Overview from views_favs (offline/online) */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-5 w-5 text-emerald-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Top Categories</h3>
          </div>
          <div className="space-y-2">
            {favCatAgg.slice(0, 4).map((cat, i) => {
              const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-orange-500'];
              const total = favCatAgg.reduce((s, v) => s + v.count, 0) || 1;
              const percentage = (cat.count / total) * 100;
              return (
                <div key={`${i}-${cat.name}`} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${colors[i % colors.length]}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-700 dark:text-gray-300 truncate">{cat.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{cat.count} items • {cat.favourites} favs</div>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded mt-1 overflow-hidden">
                      <div className={`h-full ${colors[i % colors.length]} opacity-80`} style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
            {favCatAgg.length === 0 && (
              <div className="text-sm text-gray-500 dark:text-gray-400">No categories yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Top Subcategories from views_favs (offline/online) */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="h-5 w-5 text-orange-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Top Subcategories</h3>
        </div>
        <div className="space-y-2">
          {favSubAgg.slice(0, 6).map((sc, i) => {
            const colors = ['bg-orange-500', 'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-pink-500', 'bg-cyan-500'];
            const total = favSubAgg.reduce((s, v) => s + v.count, 0) || 1;
            const percentage = (sc.count / total) * 100;
            return (
              <div key={`${i}-${sc.category}-${sc.subcategory}`} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${colors[i % colors.length]}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700 dark:text-gray-300 truncate">{sc.category} / {sc.subcategory}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{sc.count} items • {sc.favourites} favs</div>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded mt-1 overflow-hidden">
                    <div className={`h-full ${colors[i % colors.length]} opacity-80`} style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
          {favSubAgg.length === 0 && (
            <div className="text-sm text-gray-500 dark:text-gray-400">No subcategories yet</div>
          )}
        </div>
      </div>
      
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
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">Top Resources</h3>
            <button onClick={onOpenLibrary} className="text-sm px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700">View All</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AnimatePresence initial={false} mode="popLayout">
              {topResources.map(resource => (
                <motion.div
                  key={resource.id}
                  layout
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.25 }}
                  className="h-32"
                >
                  <ResourceCard
                    resource={resource}
                    onOpen={handleOpenResource}
                    onToggleFavorite={() => { /* ResourceCard already syncs views_favs */ }}
                    variant="small"
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 dark:text-white">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-3">
            <button onClick={onOpenLibrary} className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all">
              <Library className="h-5 w-5" />
              <span className="font-medium">Browse Library</span>
            </button>
            <button onClick={onOpenProfile} className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 transition-all">
              <UserIcon className="h-5 w-5" />
              <span className="font-medium">Profile</span>
            </button>
            <button onClick={onOpenSettings} className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:from-gray-600 hover:to-gray-700 transition-all">
              <SettingsIcon className="h-5 w-5" />
              <span className="font-medium">Settings</span>
            </button>
            <button onClick={onOpenRoles} className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 transition-all">
              <Shield className="h-5 w-5" />
              <span className="font-medium">Roles</span>
            </button>
          </div>
        </div>
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
