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
  saveWrite: (patch: any) => ipcRenderer.invoke('save:write', patch),

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
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
