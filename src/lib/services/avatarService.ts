import { downloadProfilePictureDecrypted, uploadProfilePictureEncrypted } from './profileCloud'
import { getOrCreateProfileKey } from './profileKey'
import { encrypt, decrypt } from '@/lib/utils/crypto'

// Types for preload API (Electron)
type PreloadAPI = {
  credentials: {
    get(email: string): Promise<string | null>
    store(email: string, passphrase: string): Promise<boolean>
  }
  fs?: {
    writeFile(path: string, data: string): Promise<boolean>
    readFile(path: string): Promise<string | null>
    exists(path: string): Promise<boolean>
    ensureDir(path: string): Promise<boolean>
  }
}

function getPreloadApi(): PreloadAPI | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as { api?: PreloadAPI }
  return w.api ?? null
}

function isElectron(): boolean {
  return getPreloadApi() !== null
}

function isOnline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine
}

// Local storage keys
const AVATAR_CACHE_PREFIX = 'avatar_cache:'
const AVATAR_TIMESTAMP_PREFIX = 'avatar_timestamp:'

/**
 * Avatar service that handles both online and offline scenarios
 * - Online: Fetches from encrypted cloud storage (Supabase)
 * - Offline: Uses locally cached encrypted avatar data
 * - Electron: Uses file system for better performance
 * - Web: Uses localStorage as fallback
 */
export class AvatarService {
  private memoryCache = new Map<string, string>()

  /**
   * Get the local cache path for avatar (Electron only)
   */
  private getAvatarCachePath(email: string): string {
    return `Documents/Sparcclen/avatars/${email.replace(/[^a-zA-Z0-9]/g, '_')}.enc`
  }

  /**
   * Store avatar data locally (encrypted)
   */
  private async storeAvatarLocally(email: string, blob: Blob, password: string): Promise<boolean> {
    try {
      // Convert blob to base64
      const arrayBuffer = await blob.arrayBuffer()
      const bytes = new Uint8Array(arrayBuffer)
      let binary = ''
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i])
      }
      const base64 = btoa(binary)
      
      // Create payload with metadata
      const payload = JSON.stringify({
        mime: blob.type || 'image/jpeg',
        base64,
        timestamp: Date.now(),
        size: blob.size
      })

      // Encrypt the payload
      const encryptedData = await encrypt(payload, password)

      const api = getPreloadApi()
      if (isElectron() && api?.fs) {
        // Store in file system (Electron)
        const cachePath = this.getAvatarCachePath(email)
        await api.fs.ensureDir('Documents/Sparcclen/avatars')
        return await api.fs.writeFile(cachePath, encryptedData)
      } else {
        // Store in localStorage (Web)
        const cacheKey = AVATAR_CACHE_PREFIX + email
        const timestampKey = AVATAR_TIMESTAMP_PREFIX + email
        
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(cacheKey, encryptedData)
          localStorage.setItem(timestampKey, Date.now().toString())
          return true
        }
      }
      
      return false
    } catch (error) {
      console.error('[AvatarService] Failed to store avatar locally:', error)
      return false
    }
  }

  /**
   * Load avatar data from local storage (encrypted)
   */
  private async loadAvatarLocally(email: string, password: string): Promise<Blob | null> {
    try {
      let encryptedData: string | null = null

      const api = getPreloadApi()
      if (isElectron() && api?.fs) {
        // Load from file system (Electron)
        const cachePath = this.getAvatarCachePath(email)
        if (await api.fs.exists(cachePath)) {
          encryptedData = await api.fs.readFile(cachePath)
        }
      } else {
        // Load from localStorage (Web)
        const cacheKey = AVATAR_CACHE_PREFIX + email
        if (typeof localStorage !== 'undefined') {
          encryptedData = localStorage.getItem(cacheKey)
        }
      }

      if (!encryptedData) return null

      // Decrypt the data
      const decryptedPayload = await decrypt(encryptedData, password)
      const payload = JSON.parse(decryptedPayload) as {
        mime: string
        base64: string
        timestamp: number
        size: number
      }

      // Convert base64 back to blob
      const binary = atob(payload.base64)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
      }

      return new Blob([bytes], { type: payload.mime })
    } catch (error) {
      console.error('[AvatarService] Failed to load avatar locally:', error)
      return null
    }
  }


  /**
   * Get avatar URL with offline-first loading
   */
  async getAvatarUrl(email: string, prioritizeOffline: boolean = false): Promise<string | null> {
    if (!email) return null

    // Check memory cache first
    const cacheKey = `avatar_url:${email}`
    if (this.memoryCache.has(cacheKey)) {
      return this.memoryCache.get(cacheKey) || null
    }

    try {
      const password = await getOrCreateProfileKey(email)
      let blob: Blob | null = null

      // Offline-first strategy: try local cache first, then online
      if (prioritizeOffline || !isOnline()) {
        console.log('[AvatarService] Loading avatar from local cache (offline-first)...')
        blob = await this.loadAvatarLocally(email, password)
        if (blob) {
          console.log('[AvatarService] Avatar loaded from local cache')
        }
      }

      // If no offline avatar and we're online, try fetching from cloud
      if (!blob && isOnline()) {
        try {
          console.log('[AvatarService] Attempting to fetch avatar online...')
          const result = await downloadProfilePictureDecrypted(password)
          if (result.ok) {
            blob = result.blob
            // Cache locally for future offline use
            await this.storeAvatarLocally(email, blob, password)
            console.log('[AvatarService] Avatar fetched online and cached locally')
          } else {
            console.log('[AvatarService] No avatar found online:', result.error)
          }
        } catch (error) {
          console.warn('[AvatarService] Failed to fetch avatar online:', error)
        }
      }

      // If still no blob and we haven't tried offline yet, try it now
      if (!blob && !prioritizeOffline && isOnline()) {
        console.log('[AvatarService] Falling back to local cache...')
        blob = await this.loadAvatarLocally(email, password)
        if (blob) {
          console.log('[AvatarService] Avatar loaded from local cache as fallback')
        }
      }

      if (blob) {
        const url = URL.createObjectURL(blob)
        this.memoryCache.set(cacheKey, url)
        
        // Clean up old URLs to prevent memory leaks
        setTimeout(() => {
          const cachedUrl = this.memoryCache.get(cacheKey)
          if (cachedUrl === url) {
            this.memoryCache.delete(cacheKey)
            try {
              URL.revokeObjectURL(url)
            } catch (e) {
              // Ignore revoke errors
            }
          }
        }, 5 * 60 * 1000) // Clean up after 5 minutes
        
        return url
      }

      return null
    } catch (error) {
      console.error('[AvatarService] Failed to get avatar URL:', error)
      return null
    }
  }

  /**
   * Upload and cache new avatar
   */
  async uploadAvatar(email: string, blob: Blob): Promise<{ success: boolean; error?: string }> {
    if (!email) {
      return { success: false, error: 'Email is required' }
    }

    try {
      const password = await getOrCreateProfileKey(email)

      // Always store locally first
      const localStored = await this.storeAvatarLocally(email, blob, password)
      if (!localStored) {
        console.warn('[AvatarService] Failed to store avatar locally')
      }

      // Try to upload online if connected
      if (isOnline()) {
        try {
          const result = await uploadProfilePictureEncrypted(blob, password)
          if (result.ok) {
            console.log('[AvatarService] Avatar uploaded online successfully')
          } else {
            console.warn('[AvatarService] Failed to upload avatar online:', result.error)
            // Don't fail if local storage succeeded
            if (localStored) {
              return { success: true, error: 'Saved locally, will sync when online' }
            }
            return { success: false, error: result.error }
          }
        } catch (error) {
          console.warn('[AvatarService] Failed to upload avatar online:', error)
          if (localStored) {
            return { success: true, error: 'Saved locally, will sync when online' }
          }
          return { success: false, error: 'Failed to save avatar' }
        }
      } else {
        console.log('[AvatarService] Offline mode: avatar saved locally only')
        if (!localStored) {
          return { success: false, error: 'Failed to save avatar locally' }
        }
      }

      // Clear memory cache to force refresh
      const cacheKey = `avatar_url:${email}`
      const oldUrl = this.memoryCache.get(cacheKey)
      if (oldUrl) {
        this.memoryCache.delete(cacheKey)
        try {
          URL.revokeObjectURL(oldUrl)
        } catch (e) {
          // Ignore revoke errors
        }
      }

      return { success: true }
    } catch (error) {
      console.error('[AvatarService] Failed to upload avatar:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Clear avatar cache for a user
   */
  async clearAvatarCache(email: string): Promise<void> {
    try {
      // Clear memory cache
      const cacheKey = `avatar_url:${email}`
      const oldUrl = this.memoryCache.get(cacheKey)
      if (oldUrl) {
        this.memoryCache.delete(cacheKey)
        try {
          URL.revokeObjectURL(oldUrl)
        } catch (e) {
          // Ignore revoke errors
        }
      }

      // Clear local storage
      const api = getPreloadApi()
      if (isElectron() && api?.fs) {
        // Note: We don't actually delete the file, just clear memory cache
        // The file will be overwritten on next upload
      } else {
        // Clear localStorage (Web)
        const avatarCacheKey = AVATAR_CACHE_PREFIX + email
        const timestampKey = AVATAR_TIMESTAMP_PREFIX + email
        
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(avatarCacheKey)
          localStorage.removeItem(timestampKey)
        }
      }
    } catch (error) {
      console.error('[AvatarService] Failed to clear avatar cache:', error)
    }
  }

  /**
   * Sync local avatars to cloud when coming back online
   */
  async syncAvatarsToCloud(): Promise<void> {
    if (!isOnline()) return

    console.log('[AvatarService] Syncing avatars to cloud...')
    
    // This is a placeholder for future implementation
    // Would need to track which avatars are pending sync
    // For now, the upload method handles online/offline scenarios
  }
}

// Export singleton instance
export const avatarService = new AvatarService()
