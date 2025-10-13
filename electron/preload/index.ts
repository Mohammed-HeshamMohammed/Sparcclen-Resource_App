import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  // Window controls
  minimize: () => ipcRenderer.invoke('win:minimize'),
  maximize: () => ipcRenderer.invoke('win:maximize'),
  close: () => ipcRenderer.invoke('win:close'),

  // Window dimensions
  getWindowSize: () => ipcRenderer.invoke('win:getSize'),
  onWindowResize: (callback: (size: { width: number; height: number }) => void) => {
    ipcRenderer.on('win:resize', (_, size) => callback(size))
    return () => ipcRenderer.removeListener('win:resize', (_, size) => callback(size))
  },

  // Platform info
  platform: process.platform,

  // Persistent save access
  readSave: () => ipcRenderer.invoke('save:read'),
  saveWrite: (patch: Record<string, unknown>) => ipcRenderer.invoke('save:write', patch),

  // Windows Credential Manager
  credentials: {
    isAvailable: () => ipcRenderer.invoke('credentials:isAvailable'),
    store: (email: string, password: string) => ipcRenderer.invoke('credentials:store', email, password),
    get: (email: string) => ipcRenderer.invoke('credentials:get', email),
    getEmails: () => ipcRenderer.invoke('credentials:getEmails'),
    has: (email: string) => ipcRenderer.invoke('credentials:has', email),
    delete: (email: string) => ipcRenderer.invoke('credentials:delete', email),
    promptHello: (email: string) => ipcRenderer.invoke('credentials:promptHello', email),
  },
  // Upload lifecycle notifications
  uploads: {
    begin: () => ipcRenderer.invoke('uploads:begin'),
    end: () => ipcRenderer.invoke('uploads:end'),
  },

  // File system operations for avatar caching
  fs: {
    writeFile: (path: string, data: string) => ipcRenderer.invoke('fs:writeFile', path, data),
    readFile: (path: string) => ipcRenderer.invoke('fs:readFile', path),
    exists: (path: string) => ipcRenderer.invoke('fs:exists', path),
    ensureDir: (path: string) => ipcRenderer.invoke('fs:ensureDir', path),
  },

  // Admin (role management) operations via main process (service role key lives in main only)
  admin: {
    listUsers: () => ipcRenderer.invoke('admin:listUsers'),
    updateUserRole: (userId: string, role: string) => ipcRenderer.invoke('admin:updateUserRole', userId, role),
  },
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-expect-error (define in global dts for non-isolated context)
  window.electron = electronAPI
  // @ts-expect-error (define in global dts for non-isolated context)
  window.api = api
}
