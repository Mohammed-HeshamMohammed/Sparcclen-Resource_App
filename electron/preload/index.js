// Preload script (JavaScript) for development and production
// Avoids ts-node/vm in renderer. Mirrors electron/preload/index.ts functionality.

const { contextBridge, ipcRenderer } = require('electron')

let electronAPI
try {
  // Optional: provided by @electron-toolkit/preload if available
  electronAPI = require('@electron-toolkit/preload').electronAPI
} catch {
  electronAPI = undefined
}

// Custom APIs for renderer
const api = {
  // Window controls
  minimize: () => ipcRenderer.invoke('win:minimize'),
  maximize: () => ipcRenderer.invoke('win:maximize'),
  close: () => ipcRenderer.invoke('win:close'),

  // Window dimensions
  getWindowSize: () => ipcRenderer.invoke('win:getSize'),
  onWindowResize: (callback) => {
    const listener = (_, size) => callback(size)
    ipcRenderer.on('win:resize', listener)
    return () => ipcRenderer.removeListener('win:resize', listener)
  },

  // Platform info
  platform: process.platform,

  // Persistent save access
  readSave: () => ipcRenderer.invoke('save:read'),
  saveWrite: (patch) => ipcRenderer.invoke('save:write', patch),

  // Windows Credential Manager
  credentials: {
    isAvailable: () => ipcRenderer.invoke('credentials:isAvailable'),
    store: (email, password) => ipcRenderer.invoke('credentials:store', email, password),
    get: (email) => ipcRenderer.invoke('credentials:get', email),
    getEmails: () => ipcRenderer.invoke('credentials:getEmails'),
    has: (email) => ipcRenderer.invoke('credentials:has', email),
    delete: (email) => ipcRenderer.invoke('credentials:delete', email),
    promptHello: (email) => ipcRenderer.invoke('credentials:promptHello', email),
  },
}

if (process.contextIsolated) {
  try {
    if (electronAPI) contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error('[preload] Failed to expose APIs:', error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
