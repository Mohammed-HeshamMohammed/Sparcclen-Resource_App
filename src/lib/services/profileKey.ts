import { generateEncryptionKey } from '@/lib/utils/crypto'

// Types for preload API (Electron)
type CredentialsAPI = {
  get(email: string): Promise<string | null>
  store(email: string, passphrase: string): Promise<boolean>
}

type PreloadAPI = {
  credentials: CredentialsAPI
}

function getPreloadApi(): PreloadAPI | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as { api?: PreloadAPI }
  return w.api ?? null
}

function isElectron(): boolean {
  return getPreloadApi() !== null
}

export async function getOrCreateProfileKey(userEmail: string): Promise<string> {
  try {
    const api = getPreloadApi()
    if (isElectron() && api) {
      const existing = await api.credentials.get(userEmail)
      if (existing) return existing
      const fresh = generateEncryptionKey()
      await api.credentials.store(userEmail, fresh)
      return fresh
    }
    // Web fallback: persist in localStorage
    const keyName = `profile_enc_key:${userEmail}`
    const existingWeb = typeof localStorage !== 'undefined' ? localStorage.getItem(keyName) : null
    if (existingWeb) return existingWeb
    const fresh = generateEncryptionKey()
    if (typeof localStorage !== 'undefined') localStorage.setItem(keyName, fresh)
    return fresh
  } catch {
    // Last resort for dev
    return 'DEV_ONLY_WEAK_KEY'
  }
}
