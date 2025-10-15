import { ipcRenderer } from 'electron'
import type { WindowApi } from './types'

const resizeChannel = 'win:resize'

export const createWindowApi = (): WindowApi => ({
  minimize: () => ipcRenderer.invoke('win:minimize'),
  maximize: () => ipcRenderer.invoke('win:maximize'),
  close: () => ipcRenderer.invoke('win:close'),
  getWindowSize: async () =>
    (await ipcRenderer.invoke('win:getSize')) as { width: number; height: number },
  onWindowResize: (callback) => {
    const handler = (_event: unknown, size: { width: number; height: number }) => callback(size)
    ipcRenderer.on(resizeChannel, handler)
    return () => ipcRenderer.removeListener(resizeChannel, handler)
  },
})
