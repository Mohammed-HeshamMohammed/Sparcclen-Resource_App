import { ipcRenderer } from 'electron'
import type { ResourcesApi } from './types'

export const createResourcesApi = (): ResourcesApi => ({
  pickJsonFile: () => ipcRenderer.invoke('resources:pickJsonFile'),
  saveLibraryBin: (segments, fileName, content) =>
    ipcRenderer.invoke('resources:saveLibraryBin', segments, fileName, content),
  listLibraryBins: (options) => ipcRenderer.invoke('resources:listLibraryBins', options),
  readImageAsBase64: (sourceDir, imagePath) =>
    ipcRenderer.invoke('resources:readImageAsBase64', sourceDir, imagePath),
  openExternal: (url) => ipcRenderer.invoke('resources:openExternal', url),
})
