import { supabase } from './auth/supabase'
import type { Database } from '@/types/database'

export type Item = { title: string; category: string; subcategory: string; favourite: boolean }

function normalizeItems(raw: unknown): Item[] {
  try {
    let arr: unknown = raw
    if (typeof raw === 'string') {
      // Handle the case where the JSON array is stored as text (e.g. CSV import).
      // Try direct JSON parse first; if it fails, attempt to unescape CSV-style doubled quotes.
      try {
        arr = JSON.parse(raw)
      } catch {
        const trimmed = raw.trim()
        const withoutOuter = (trimmed.startsWith('"') && trimmed.endsWith('"'))
          ? trimmed.slice(1, -1)
          : trimmed
        const unescaped = withoutOuter.replace(/""/g, '"')
        try { arr = JSON.parse(unescaped) } catch { return [] }
      }
    }
    if (!Array.isArray(arr)) return []
    return (arr as unknown[])
      .map((it): Item => {
        const o = (it ?? {}) as Record<string, unknown>
        const favRaw = o['favourite']
        const favourite = typeof favRaw === 'boolean'
          ? favRaw
          : typeof favRaw === 'string'
            ? favRaw.trim().toLowerCase() === 'true'
            : Boolean(favRaw)
        return {
          title: String(o['title'] ?? ''),
          category: String(o['category'] ?? ''),
          subcategory: String(o['subcategory'] ?? ''),
          favourite,
        }
      })
      .filter(i => i.title)
  } catch {
    return []
  }
}

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
  // items is Json in DB types; robustly coerce to Item[]
  return normalizeItems((data as { items?: unknown } | null)?.items ?? [])
}

export async function saveRemoteItems(items: Item[]): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No user')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('views_favs')
    .upsert({ user_id: user.id, items: normalizeItems(items) })
  if (error) throw error
}

export async function loadAllRemoteItems(): Promise<Item[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('views_favs')
    .select('items')
  if (error) throw error
  const rows = (data ?? []) as Array<{ items?: unknown }>
  const all: Item[] = []
  for (const row of rows) {
    const items = normalizeItems(row.items ?? [])
    if (items.length) all.push(...items)
  }
  return all
}
export async function loadAllRemoteItemsViaFunction(): Promise<Item[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).functions.invoke('views_favs_items_all', { body: {} })
  if (error) throw error
  const payload = (data ?? {}) as { ok?: boolean; items?: unknown }
  const arr = Array.isArray(payload.items) ? payload.items : []
  return normalizeItems(arr as unknown)
}

export async function getAllUsersItems(): Promise<Item[]> {
  try {
    const viaFn = await loadAllRemoteItemsViaFunction()
    if (viaFn.length) return viaFn
  } catch {}
  try { return await loadAllRemoteItems() } catch { return [] }
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
  const raw = await api.load()
  return normalizeItems(raw as unknown)
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
    // Items are already normalized; merge will OR favourites across duplicates
    return mergeItems(remote, local)
  } catch {
    return []
  }
}

// Enhanced aggregation that considers view counts from view_counts table
export function aggregateCategoriesWithViews(items: Item[], viewCounts: Database['public']['Views']['view_counts']['Row'][] = []): { name: string; count: number; favourites: number; totalViews: number }[] {
  const viewsMap = new Map<string, number>()
  viewCounts.forEach(vc => { if (vc.title) viewsMap.set(String(vc.title).toLowerCase().trim(), Number(vc.views) || 0) })

  const map = new Map<string, { name: string; count: number; favourites: number; totalViews: number }>()
  const titleFavByCat = new Map<string, Map<string, number>>()

  for (const it of items) {
    const rawKey = it.category || 'General'
    if (typeof rawKey === 'string' && (rawKey.trim().toLowerCase() === 'top' || rawKey.trim() === '')) continue
    const key = rawKey
    const normTitle = it.title.toLowerCase().trim()
    const curr = map.get(key) || { name: key, count: 0, favourites: 0, totalViews: 0 }
    curr.count += 1
    if (it.favourite) curr.favourites += 1
    map.set(key, curr)

    let tmap = titleFavByCat.get(key)
    if (!tmap) { tmap = new Map(); titleFavByCat.set(key, tmap) }
    tmap.set(normTitle, (tmap.get(normTitle) || 0) + (it.favourite ? 1 : 0))
  }

  for (const [key, curr] of map.entries()) {
    const tmap = titleFavByCat.get(key) || new Map<string, number>()
    let sum = 0
    for (const [title, favCount] of tmap.entries()) {
      const actual = viewsMap.get(title) || 0
      sum += Math.max(actual, favCount)
    }
    curr.totalViews = sum
    map.set(key, curr)
  }

  return Array.from(map.values()).sort((a, b) => b.totalViews - a.totalViews || b.favourites - a.favourites || b.count - a.count)
}

// Keep original function for backward compatibility
export function aggregateCategories(items: Item[]): { name: string; count: number; favourites: number }[] {
  return aggregateCategoriesWithViews(items, []).map(({ totalViews: _totalViews, ...rest }) => rest);
}

// Enhanced subcategory aggregation that considers view counts
export function aggregateSubcategoriesWithViews(items: Item[], viewCounts: Database['public']['Views']['view_counts']['Row'][] = []): { category: string; subcategory: string; count: number; favourites: number; totalViews: number }[] {
  const viewsMap = new Map<string, number>()
  viewCounts.forEach(vc => { if (vc.title) viewsMap.set(String(vc.title).toLowerCase().trim(), Number(vc.views) || 0) })

  type Stat = { category: string; subcategory: string; count: number; favourites: number; totalViews: number }
  const map = new Map<string, Stat>()
  const titleFavBySub = new Map<string, Map<string, number>>()

  for (const it of items) {
    const rawCat = it.category || 'General'
    if (typeof rawCat === 'string' && (rawCat.trim().toLowerCase() === 'top' || rawCat.trim() === '')) continue
    const cat = rawCat
    const sub = it.subcategory || '—'
    const key = `${cat}|||${sub}`
    const normTitle = it.title.toLowerCase().trim()
    const curr = map.get(key) || { category: cat, subcategory: sub, count: 0, favourites: 0, totalViews: 0 }
    curr.count += 1
    if (it.favourite) curr.favourites += 1
    map.set(key, curr)

    let tmap = titleFavBySub.get(key)
    if (!tmap) { tmap = new Map(); titleFavBySub.set(key, tmap) }
    tmap.set(normTitle, (tmap.get(normTitle) || 0) + (it.favourite ? 1 : 0))
  }

  for (const [key, curr] of map.entries()) {
    const tmap = titleFavBySub.get(key) || new Map<string, number>()
    let sum = 0
    for (const [title, favCount] of tmap.entries()) {
      const actual = viewsMap.get(title) || 0
      sum += Math.max(actual, favCount)
    }
    curr.totalViews = sum
    map.set(key, curr)
  }

  return Array.from(map.values()).sort((a, b) => b.totalViews - a.totalViews || b.favourites - a.favourites || b.count - a.count)
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
