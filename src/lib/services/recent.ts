export type RecentItem = {
  id: string
  title: string
  url?: string | null
  ts: number
}

const keyFor = (userId?: string | null) => `recent_${userId ?? 'anon'}`

export function getRecents(userId?: string | null, max = 20): RecentItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(keyFor(userId))
    if (!raw) return []
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return []
    const items = arr.filter(v => v && typeof v === 'object') as RecentItem[]
    items.sort((a, b) => (b?.ts ?? 0) - (a?.ts ?? 0))
    return items.slice(0, max)
  } catch {
    return []
  }
}

export function addRecent(userId: string | null | undefined, item: { id: string, title: string, url?: string | null }): void {
  if (typeof window === 'undefined') return
  try {
    const key = keyFor(userId)
    const now = Date.now()
    const existing = getRecents(userId, 100)
    const deduped = existing.filter(r => r.id !== item.id)
    const next: RecentItem[] = [{ id: item.id, title: item.title, url: item.url ?? null, ts: now }, ...deduped]
    window.localStorage.setItem(key, JSON.stringify(next.slice(0, 50)))
  } catch {
    // ignore
  }
}
