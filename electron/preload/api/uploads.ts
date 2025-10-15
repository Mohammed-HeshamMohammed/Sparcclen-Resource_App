import { ipcRenderer } from 'electron'
import type { UploadsApi } from './types'

export const createUploadsApi = (): UploadsApi => ({
  begin: () => ipcRenderer.invoke('uploads:begin'),
  end: () => ipcRenderer.invoke('uploads:end'),
})
