import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { createPreloadApi } from './api'

// Lazily create the bridge API so we only touch ipcRenderer when needed
const api = createPreloadApi()

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
