import { supabase } from './auth/supabase'
import type { Database } from '@/types/database'

export type Item = { title: string; category: string; subcategory: string; favourite: boolean }

export async function loadRemoteItems(): Promise<Item[]> {
  const { data: { user }, error: aerr } = await supabase.auth.getUser()
  if (aerr || !user) throw aerr ?? new Error('No user')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('views_favs')
    .select('items')
    .eq('user_id', user.id)
    .maybeSingle()
  if (error) throw error
  // items is Json in DB types; ensure array of our Item
  const items = (data?.items ?? []) as unknown[]
  return Array.isArray(items) ? (items as Item[]) : []
}

export async function saveRemoteItems(items: Item[]): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No user')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('views_favs')
    .upsert({ user_id: user.id, items })
  if (error) throw error
}

export async function fetchViewCounts(): Promise<Database['public']['Views']['view_counts']['Row'][]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('view_counts')
    .select('*')
  if (error) throw error
  return (data ?? []) as Database['public']['Views']['view_counts']['Row'][]
}

function keyOf(i: Item): string {
  return `${i.title}|${i.category}|${i.subcategory}`
}

export function mergeItems(remote: Item[], local: Item[]): Item[] {
  const key = (i: Item) => `${i.title}|${i.category}|${i.subcategory}`
  const map = new Map<string, Item>()
  ;[...remote, ...local].forEach(i => {
    const k = key(i)
    if (!map.has(k)) map.set(k, i)
    else {
      const prev = map.get(k)!
      map.set(k, { ...prev, ...i, favourite: !!(prev.favourite || i.favourite) })
    }
  })
  return [...map.values()]
}

export const filterFavourites = (items: Item[]) => items.filter(i => i.favourite)
export const filterNonFavourites = (items: Item[]) => items.filter(i => !i.favourite)

export async function loadLocalItems(): Promise<Item[]> {
  const api = window.api?.viewsFavs
  if (!api) return []
  return api.load()
}

export async function saveLocalItems(items: Item[]): Promise<boolean> {
  const api = window.api?.viewsFavs
  if (!api) return false
  return api.save(items)
}

export async function syncLocalAndRemote(): Promise<Item[]> {
  const [local, remote] = await Promise.all([loadLocalItems(), loadRemoteItems()])
  const merged = mergeItems(remote, local)
  await saveLocalItems(merged)
  await saveRemoteItems(merged)
  return merged
}

// Get merged items without writing back (for read-only aggregation)
export async function getMergedItems(): Promise<Item[]> {
  try {
    const [local, remote] = await Promise.all([
      loadLocalItems().catch(() => [] as Item[]),
      loadRemoteItems().catch(() => [] as Item[]),
    ])
    return mergeItems(remote, local)
  } catch {
    return []
  }
}

// Enhanced aggregation that considers view counts from view_counts table
export function aggregateCategoriesWithViews(items: Item[], viewCounts: Database['public']['Views']['view_counts']['Row'][] = []): { name: string; count: number; favourites: number; totalViews: number }[] {
  
  // Create a map of title -> views for quick lookup
  const viewsMap = new Map<string, number>();
  viewCounts.forEach(vc => {
    if (vc.title) {
      viewsMap.set(vc.title.toLowerCase().trim(), Number(vc.views) || 0);
    }
  });
  
  const map = new Map<string, { name: string; count: number; favourites: number; totalViews: number }>()
  let _filteredCount = 0;
  
  for (const it of items) {
    const rawKey = it.category || 'General'
    // Filter out placeholder or synthetic categories like 'top'
    if (typeof rawKey === 'string' && (rawKey.trim().toLowerCase() === 'top' || rawKey.trim() === '')) {
      _filteredCount++;
      continue;
    }
    
    const key = rawKey
    const curr = map.get(key) || { name: key, count: 0, favourites: 0, totalViews: 0 }
    curr.count += 1
    if (it.favourite) curr.favourites += 1
    
    // Add view count for this specific title
    const titleViews = viewsMap.get(it.title.toLowerCase().trim()) || 0;
    curr.totalViews += titleViews;
    
    map.set(key, curr)
  }
  
  // Sort by total views first, then by favourites, then by count
  const result = Array.from(map.values()).sort((a, b) => b.totalViews - a.totalViews || b.favourites - a.favourites || b.count - a.count);
  return result;
}

// Keep original function for backward compatibility
export function aggregateCategories(items: Item[]): { name: string; count: number; favourites: number }[] {
  return aggregateCategoriesWithViews(items, []).map(({ totalViews: _totalViews, ...rest }) => rest);
}

// Enhanced subcategory aggregation that considers view counts
export function aggregateSubcategoriesWithViews(items: Item[], viewCounts: Database['public']['Views']['view_counts']['Row'][] = []): { category: string; subcategory: string; count: number; favourites: number; totalViews: number }[] {
  
  // Create a map of title -> views for quick lookup
  const viewsMap = new Map<string, number>();
  viewCounts.forEach(vc => {
    if (vc.title) {
      viewsMap.set(vc.title.toLowerCase().trim(), Number(vc.views) || 0);
    }
  });
  
  type Stat = { category: string; subcategory: string; count: number; favourites: number; totalViews: number }
  const map = new Map<string, Stat>()
  let _filteredCount = 0;
  
  for (const it of items) {
    const rawCat = it.category || 'General'
    // Filter out placeholder or synthetic categories like 'top'
    if (typeof rawCat === 'string' && (rawCat.trim().toLowerCase() === 'top' || rawCat.trim() === '')) {
      _filteredCount++;
      continue;
    }
    
    const cat = rawCat
    const sub = it.subcategory || '—'
    const key = `${cat}|||${sub}`
    const curr = map.get(key) || { category: cat, subcategory: sub, count: 0, favourites: 0, totalViews: 0 }
    curr.count += 1
    if (it.favourite) curr.favourites += 1
    
    // Add view count for this specific title
    const titleViews = viewsMap.get(it.title.toLowerCase().trim()) || 0;
    curr.totalViews += titleViews;
    
    map.set(key, curr)
  }
  
  // Sort by total views first, then by favourites, then by count
  const result = Array.from(map.values()).sort((a, b) => b.totalViews - a.totalViews || b.favourites - a.favourites || b.count - a.count);
  return result;
}

// Keep original function for backward compatibility
export function aggregateSubcategories(items: Item[]): { category: string; subcategory: string; count: number; favourites: number }[] {
  return aggregateSubcategoriesWithViews(items, []).map(({ totalViews: _totalViews, ...rest }) => rest);
}

// Helpers to update from a Resource object
import type { Resource } from '@/types'

export function toItem(resource: Resource, favourite: boolean): Item {
  const meta = (resource.metadata ?? {}) as { [k: string]: unknown }
  const category = (typeof meta['categorySegment'] === 'string' && meta['categorySegment']) || resource.category_id
  const subcategory = (typeof meta['subcategorySegment'] === 'string' && meta['subcategorySegment']) || resource.subcategory_id || ''
  return {
    title: resource.title,
    category,
    subcategory,
    favourite,
  }
}

export async function upsertFromResource(resource: Resource, favourite: boolean): Promise<Item[]> {
  const item = toItem(resource, favourite)
  return upsertItem(item)
}

export async function recordViewFromResource(resource: Resource): Promise<Item[]> {
  const current = await getMergedItems()
  const meta = (resource.metadata ?? {}) as { [k: string]: unknown }
  const cat = (typeof meta['categorySegment'] === 'string' && meta['categorySegment']) || resource.category_id
  const sub = (typeof meta['subcategorySegment'] === 'string' && meta['subcategorySegment']) || resource.subcategory_id || ''
  const key = `${resource.title}|${cat}|${sub}`
  const exists = current.find(it => `${it.title}|${it.category}|${it.subcategory}` === key)
  if (exists) {
    // already recorded view
    return current
  }
  const item = toItem(resource, false)
  return upsertItem(item)
}

// Upsert a single item into views_favs by key
export async function upsertItem(item: Item): Promise<Item[]> {
  const [local, remote] = await Promise.all([
    loadLocalItems().catch(() => [] as Item[]),
    loadRemoteItems().catch(() => [] as Item[]),
  ])
  const base = mergeItems(remote, local)
  const map = new Map<string, Item>(base.map(it => [keyOf(it), it]))
  const k = keyOf(item)
  map.set(k, { ...(map.get(k) ?? item), ...item })
  const next = Array.from(map.values())
  await saveLocalItems(next)
  await saveRemoteItems(next)
  return next
}
