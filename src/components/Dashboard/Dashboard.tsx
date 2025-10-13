import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Library, Settings as SettingsIcon, Shield, User as UserIcon } from 'lucide-react';
import { ResourceCard } from '@/components/Resources/grid/ResourceCard';
import type { Category, Resource } from '@/types';
import { useAuth } from '@/lib/auth';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { supabase } from '@/lib/services';

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

  // Load users for user circles section
  useEffect(() => {
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
            setUserAvatars(avatarMap);
          }
        }
      } catch {}
    };
    loadUsers();
  }, [user?.id]); // Re-run when user changes to update avatars

  // Generate mock chart data
  const generateSparklineData = () => {
    const days = 7;
    return Array.from({ length: days }, (_, i) => ({
      day: i + 1,
      views: Math.floor(Math.random() * 50) + 10
    }));
  };

  const sparklineData = generateSparklineData();
  const categoryData = categories.map(cat => ({
    id: cat.id || String(cat.title || 'unknown'),
    name: cat.title || 'Unnamed Category',
    count: resources.filter(r => r.category_id === cat.id).length
  })).filter(c => c.count > 0);

  // Recent activity (mock data based on view_count and created_at)
  const recentActivity = [...resources]
    .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
    .slice(0, 6);

  const topResources = [...resources].sort((a,b) => (b.view_count || 0) - (a.view_count || 0)).slice(0, 6);

  // Sort users by role priority: CEO > Admin > Premium > Free
  const sortedUsers = users.slice().sort((a, b) => {
    const rolePriority = { 'CEO': 4, 'Admin': 3, 'Premium': 2, 'Free': 1 };
    const aPriority = rolePriority[a.role as keyof typeof rolePriority] || 0;
    const bPriority = rolePriority[b.role as keyof typeof rolePriority] || 0;
    return bPriority - aPriority;
  });

  return (
    <div className="p-6 md:p-8 space-y-6 overflow-y-auto scrollbar-hide" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
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
            <h3 className="font-semibold text-gray-900 dark:text-white">Views This Week</h3>
          </div>
          <div className="flex items-end gap-1 h-16">
            {sparklineData.map((data, i) => (
              <div key={i} className="flex-1 bg-blue-500 rounded-t opacity-70 hover:opacity-100 transition-opacity" 
                   style={{ height: `${(data.views / 60) * 100}%` }}
                   title={`Day ${data.day}: ${data.views} views`}
              />
            ))}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">Last 7 days</div>
        </div>
        
        {/* Categories Pie Chart */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-5 w-5 text-emerald-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Categories</h3>
          </div>
          <div className="space-y-2">
            {categoryData.slice(0, 4).map((cat, i) => {
              const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-orange-500'];
              const percentage = (cat.count / resources.length) * 100;
              return (
                <div key={String(cat.id ?? `${cat.name}-${i}`)} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${colors[i]}`} />
                  <div className="flex-1 text-sm text-gray-700 dark:text-gray-300">{cat.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{cat.count} ({percentage.toFixed(0)}%)</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
          <div className="text-2xl font-semibold text-gray-900 dark:text-white">{resources.reduce((sum, r) => sum + (r.view_count || 0), 0)}</div>
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
          <div className="grid grid-cols-2 gap-3">
            {topResources.map(resource => (
              <div key={resource.id} className="h-32">
                <ResourceCard
                  resource={resource}
                  onOpen={onOpenResource}
                  onToggleFavorite={() => {}}
                  variant="small"
                />
              </div>
            ))}
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
          <div className="space-y-3">
            {recentActivity.slice(0, 4).map(resource => {
              const thumbnailUrl = resource.url ? `https://api.thumbnail.ws/api/thumbnail?url=${encodeURIComponent(resource.url)}&width=64&height=64` : null;
              return (
                <div key={resource.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors" onClick={() => onOpenResource(resource)}>
                  <div className="w-12 h-12 rounded bg-gray-100 dark:bg-gray-800 flex-shrink-0 overflow-hidden">
                    {thumbnailUrl ? (
                      <img src={thumbnailUrl} alt={resource.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Library className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{resource.title}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{resource.view_count || 0} views</div>
                  </div>
                </div>
              );
            })}
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
    </div>
  );
}
