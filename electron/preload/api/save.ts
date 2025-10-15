import { ipcRenderer } from 'electron'
import type { SaveApi } from './types'

export const createSaveApi = (): SaveApi => ({
  readSave: () => ipcRenderer.invoke('save:read'),
  saveWrite: (patch) => ipcRenderer.invoke('save:write', patch ?? {}),
})
