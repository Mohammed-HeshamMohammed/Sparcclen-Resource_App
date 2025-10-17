import type { Database } from '@/types/database';
import type { Resource } from '@/types';

/**
 * Dashboard Cache Service
 *
 * Caches dashboard data PER USER in Documents/Sparcclen, like Profiles/ and avatars/ do (via preload fs API).
 * Never touches Supabase. Falls back to localStorage when fs API is unavailable.
 */

interface DashboardCacheData {
  users: Array<{
    id: string;
    email: string | null;
    name: string | null;
    avatarUrlMeta: string | null;
    role: string;
  }>;
  userAvatars: Record<string, string>;
  viewCounts: Database['public']['Views']['view_counts']['Row'][];
  favCatAgg: Array<{ name: string; count: number; favourites: number; totalViews?: number }>;
  favSubAgg: Array<{ category: string; subcategory: string; count: number; favourites: number; totalViews?: number }>;
  topResources: Resource[];
  totalFavourites: number;
  timestamp: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const hasFs = () => typeof window !== 'undefined' && !!(window as unknown as { api?: { fs?: unknown } }).api?.fs
const getCacheKey = (userId: string) => `dashboard_cache:${userId}`
const getCacheFilePath = (userId: string) => `Dashboards/${userId}.json`

export async function saveDashboardCache(userId: string, data: Omit<DashboardCacheData, 'timestamp'>): Promise<void> {
  const cacheData: DashboardCacheData = { ...data, timestamp: Date.now() }
  try {
    if (hasFs()) {
      const api = (window as unknown as { api: { fs: { ensureDir: (p: string) => Promise<boolean>; writeFile: (p: string, d: string) => Promise<boolean> } } }).api
      await api.fs.ensureDir('Dashboards')
      await api.fs.writeFile(getCacheFilePath(userId), JSON.stringify(cacheData, null, 2))
    } else if (typeof localStorage !== 'undefined') {
      localStorage.setItem(getCacheKey(userId), JSON.stringify(cacheData))
    }
  } catch (error) {
    console.warn('[dashboardCache.save] Failed (fs/localStorage):', error)
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(getCacheKey(userId), JSON.stringify(cacheData))
      }
    } catch {}
  }
}

export async function loadDashboardCache(userId: string): Promise<DashboardCacheData | null> {
  try {
    let cacheData: DashboardCacheData | null = null
    if (hasFs()) {
      const api = (window as unknown as { api: { fs: { readFile: (p: string) => Promise<string | null> } } }).api
      const content = await api.fs.readFile(getCacheFilePath(userId))
      if (content) cacheData = JSON.parse(content)
      else if (typeof localStorage !== 'undefined') {
        const local = localStorage.getItem(getCacheKey(userId))
        if (local) cacheData = JSON.parse(local)
      }
    } else if (typeof localStorage !== 'undefined') {
      const local = localStorage.getItem(getCacheKey(userId))
      if (local) cacheData = JSON.parse(local)
    }
    if (cacheData && Date.now() - cacheData.timestamp < CACHE_DURATION) return cacheData
    return null
  } catch (error) {
    console.warn('[dashboardCache.load] Failed:', error)
    return null
  }
}

export async function clearDashboardCache(userId: string): Promise<void> {
  try {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(getCacheKey(userId))
    // No explicit delete in fs API; overwrite with empty object
    if (hasFs()) {
      const api = (window as unknown as { api: { fs: { ensureDir: (p: string) => Promise<boolean>; writeFile: (p: string, d: string) => Promise<boolean> } } }).api
      await api.fs.ensureDir('Dashboards')
      await api.fs.writeFile(getCacheFilePath(userId), JSON.stringify({}))
    }
  } catch (error) {
    console.warn('[dashboardCache.clear] Failed:', error)
  }
}

export async function clearAllCaches(): Promise<void> {
  try {
    // Clear common auth/cache keys aggressively
    const keys = Object.keys(localStorage)
    for (const key of keys) {
      if (
        key.startsWith('favorites_') ||
        key.startsWith('cache_') ||
        key.includes('supabase') ||
        key.startsWith('sb-') ||
        key.includes('auth-token') ||
        key.includes('session') ||
        key.startsWith('dashboard_') ||
        key.includes('user_') ||
        key.includes('profile_') ||
        key.includes('resources_') ||
        key.includes('library_')
      ) {
        localStorage.removeItem(key)
      }
    }
    // Clear sessionStorage common keys
    const sKeys = Object.keys(sessionStorage)
    for (const k of sKeys) {
      if (k.includes('supabase') || k.startsWith('sb-') || k.includes('auth') || k.includes('cache')) {
        sessionStorage.removeItem(k)
      }
    }
    // Broadcast clear event
    window.dispatchEvent(new CustomEvent('cache:cleared', { detail: { type: 'all' } }))
  } catch (error) {
    console.error('[dashboardCache.clearAll] Failed:', error)
    throw error
  }
}
