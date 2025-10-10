// TypeScript declarations for Electron API exposed via preload
import type { SaveData } from "../lib/system/saveClient";

export interface ElectronAPI {
  minimize: () => Promise<boolean>
  maximize: () => Promise<boolean>
  close: () => Promise<boolean>
  getWindowSize: () => Promise<{ width: number; height: number }>
  onWindowResize: (callback: (size: { width: number; height: number }) => void) => () => void
  platform: string
  readSave: () => Promise<SaveData>
  saveWrite: (patch: Partial<SaveData>) => Promise<SaveData>
  credentials: {
    isAvailable: () => Promise<boolean>
    store: (email: string, password: string) => Promise<boolean>
    get: (email: string) => Promise<string | null>
    getEmails: () => Promise<string[]>
    has: (email: string) => Promise<boolean>
    delete: (email: string) => Promise<boolean>
    promptHello: (email: string) => Promise<boolean>
  }
}

declare global {
  interface Window {
    api: ElectronAPI
    electron: unknown
  }
}

export {}
