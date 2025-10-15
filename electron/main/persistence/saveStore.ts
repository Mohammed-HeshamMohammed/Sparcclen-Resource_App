import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import { promises as fs } from 'fs'

export interface SaveData {
  firstRun: boolean
  theme: 'system' | 'light' | 'dark'
  loggedInBefore: boolean
  lastEmail: string | null
  displayName: string | null
  offlineSession?: boolean
  updatedAt: string
}

const SAVE_DIR = join(app.getPath('documents'), 'Sparcclen')
const SAVE_PATH = join(SAVE_DIR, 'DID-Data.save')

const defaultSave: SaveData = {
  firstRun: true,
  theme: 'system',
  loggedInBefore: false,
  lastEmail: null,
  displayName: null,
  offlineSession: false,
  updatedAt: new Date().toISOString(),
}

const ensureSaveDir = async () => {
  if (!existsSync(SAVE_DIR)) {
    mkdirSync(SAVE_DIR, { recursive: true })
  }
}

export const readSaveFile = async (): Promise<SaveData> => {
  await ensureSaveDir()
  try {
    const txt = await fs.readFile(SAVE_PATH, 'utf-8')
    const data = JSON.parse(txt) as Partial<SaveData>
    return { ...defaultSave, ...data }
  } catch {
    await fs.writeFile(SAVE_PATH, JSON.stringify(defaultSave, null, 2), 'utf-8')
    return { ...defaultSave }
  }
}

export const writeSaveFile = async (patch: Partial<SaveData>): Promise<SaveData> => {
  const current = await readSaveFile()
  const next: SaveData = { ...current, ...patch, updatedAt: new Date().toISOString() }
  await fs.writeFile(SAVE_PATH, JSON.stringify(next, null, 2), 'utf-8')
  return next
}

export const ensureInitialSaveFile = async () => {
  await readSaveFile()
}
