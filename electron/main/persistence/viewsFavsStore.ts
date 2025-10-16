import { app, safeStorage } from 'electron'
import { join } from 'path'
import { promises as fs } from 'fs'

export type ViewsFavsItem = {
  title: string
  category: string
  subcategory: string
  favourite: boolean
}

const DIR = join(app.getPath('documents'), 'Sparcclen')
const FILE = join(DIR, 'views_favs.enc')

async function ensureDir() {
  await fs.mkdir(DIR, { recursive: true }).catch(() => {})
}

export async function saveViewsFavs(items: ViewsFavsItem[]): Promise<boolean> {
  try {
    await ensureDir()
    const payload = JSON.stringify(items)
    if (safeStorage.isEncryptionAvailable()) {
      const enc = safeStorage.encryptString(payload)
      await fs.writeFile(FILE, enc)
    } else {
      await fs.writeFile(FILE, payload, 'utf-8')
    }
    return true
  } catch (err) {
    console.error('[viewsFavsStore.save] Error:', err)
    return false
  }
}

export async function loadViewsFavs(): Promise<ViewsFavsItem[]> {
  try {
    const buf = await fs.readFile(FILE)
    if (!buf || buf.length === 0) return []

    if (safeStorage.isEncryptionAvailable()) {
      try {
        const clear = safeStorage.decryptString(Buffer.from(buf))
        const parsed = JSON.parse(clear)
        return Array.isArray(parsed) ? (parsed as ViewsFavsItem[]) : []
      } catch {
        // If decrypt fails, attempt to treat as utf8 JSON
        const txt = buf.toString('utf-8')
        const parsed = JSON.parse(txt)
        return Array.isArray(parsed) ? (parsed as ViewsFavsItem[]) : []
      }
    }

    const txt = buf.toString('utf-8')
    const parsed = JSON.parse(txt)
    return Array.isArray(parsed) ? (parsed as ViewsFavsItem[]) : []
  } catch {
    return []
  }
}