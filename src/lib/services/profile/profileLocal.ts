import { encrypt } from '@/lib/utils/crypto'

// Minimal local encrypted profile persistence using Electron preload fs API when available
// Falls back to localStorage on the web
export type LocalProfileData = {
  displayName: string
  email: string
  memberSince: string
  accountType: string
  cover: string | null
  bio: string | null
}

function getPreloadFs(): { writeFile: (p: string, d: string) => Promise<boolean>; readFile: (p: string) => Promise<string | null>; ensureDir: (p: string) => Promise<boolean> } | null {
  try {
    const w = window as unknown as { api?: { fs?: { writeFile: (p: string, d: string) => Promise<boolean>; readFile: (p: string) => Promise<string | null>; ensureDir: (p: string) => Promise<boolean> } } }
    return w.api?.fs ?? null
  } catch {
    return null
  }
}

function sanitize(segment: string): string {
  return segment.replace(/[^a-zA-Z0-9]/g, '_')
}

function storageKey(email: string): string {
  return `profile_enc:${email}`
}

export async function saveEncryptedProfileLocal(profile: LocalProfileData, email: string, password: string): Promise<boolean> {
  try {
    const payload = JSON.stringify(profile)
    const cipher = await encrypt(payload, password)

    const fs = getPreloadFs()
    if (fs) {
      await fs.ensureDir('Profiles')
      const fileName = `${sanitize(email || 'user')}.enc`
      return await fs.writeFile(`Profiles/${fileName}`, cipher)
    }

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(storageKey(email), cipher)
      return true
    }

    return false
  } catch (e) {
    console.warn('Failed to save local encrypted profile:', e)
    return false
  }
}