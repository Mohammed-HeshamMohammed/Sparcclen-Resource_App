import { useCallback, useEffect, useRef, useState } from 'react'
import type { Category, Resource } from '@/types'
import {
  getCategories,
  getResources,
  listLibraryBinFiles,
  buildLibraryCategories,
  buildLibraryResources,
} from '@/lib/services'
import * as viewsFavs from '@/lib/services/viewsFavs'

const readFavoriteSet = (userId?: string | null) => {
  if (!userId || typeof window === 'undefined') return new Set<string>()
  try {
    const raw = window.localStorage.getItem(`favorites_${userId}`)
    if (!raw) return new Set<string>()
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return new Set<string>()
    return new Set<string>(parsed.filter((v: unknown): v is string => typeof v === 'string'))
  } catch {
    return new Set<string>()
  }
}

export function useDashboardData(userId?: string | null) {
  const [categories, setCategories] = useState<Category[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const selectedResourceRef = useRef<Resource | null>(null)

  const loadCategories = useCallback(async () => {
    try {
      setIsLoadingCategories(true)
      const canUseLibraryApi = typeof window !== 'undefined' && window.api?.resources?.listLibraryBins
      if (canUseLibraryApi) {
        const files = await listLibraryBinFiles()
        const { categories: derivedCategories } = buildLibraryCategories(files)
        setCategories(derivedCategories)
      } else {
        const data = await getCategories()
        setCategories(data)
      }
    } catch (e) {
      console.error('[dashboard] Failed to load categories:', e)
      setCategories([])
    } finally {
      setIsLoadingCategories(false)
    }
  }, [])

  const loadResources = useCallback(async () => {
    setIsLoading(true)
    try {
      const canUseLibraryApi = typeof window !== 'undefined' && window.api?.resources?.listLibraryBins
      let data: Resource[]
      if (canUseLibraryApi) {
        const files = await listLibraryBinFiles()
        data = buildLibraryResources(files)
      } else {
        data = await getResources(undefined, undefined)
      }
      try {
        const merged = await viewsFavs.getMergedItems()
        const favKeys = new Set(merged.filter(i => i.favourite).map(i => `${i.title}|${i.category}|${i.subcategory}`))
        data = data.map(r => {
          const item = viewsFavs.toItem(r, false)
          const k = `${item.title}|${item.category}|${item.subcategory}`
          return { ...r, is_favorite: favKeys.has(k) }
        })
      } catch {
        const favoritesSet = readFavoriteSet(userId)
        data = data.map(r => ({ ...r, is_favorite: favoritesSet.has(r.id) }))
      }
      setResources(data)
      const curr = selectedResourceRef.current?.id
      if (curr) {
        const next = data.find(r => r.id === curr) || null
        selectedResourceRef.current = next
      }
    } catch (e) {
      console.error('[dashboard] Failed to load resources:', e)
      setResources([])
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => { loadCategories() }, [loadCategories])
  useEffect(() => { loadResources() }, [loadResources])

  const patchResourceLocally = useCallback((resourceId: string, patch: Partial<Resource>) => {
    setResources(prev => prev.map(r => (r.id === resourceId ? { ...r, ...patch } : r)))
    if (selectedResourceRef.current?.id === resourceId) {
      selectedResourceRef.current = { ...selectedResourceRef.current, ...patch }
    }
  }, [])

  const updateFavoriteLocally = useCallback((resourceId: string, isFavorite: boolean) => {
    patchResourceLocally(resourceId, { is_favorite: isFavorite })
  }, [patchResourceLocally])

  return {
    categories,
    resources,
    isLoading,
    isLoadingCategories,
    patchResourceLocally,
    updateFavoriteLocally,
  }
}
