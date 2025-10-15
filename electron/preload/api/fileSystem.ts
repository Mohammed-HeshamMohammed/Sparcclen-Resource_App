import { ipcRenderer } from 'electron'
import type { FileSystemApi } from './types'

export const createFileSystemApi = (): FileSystemApi => ({
  writeFile: (path, data) => ipcRenderer.invoke('fs:writeFile', path, data),
  readFile: (path) => ipcRenderer.invoke('fs:readFile', path),
  exists: (path) => ipcRenderer.invoke('fs:exists', path),
  ensureDir: (path) => ipcRenderer.invoke('fs:ensureDir', path),
})
