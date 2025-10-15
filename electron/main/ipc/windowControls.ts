import { ipcMain } from 'electron'
import type { BrowserWindow } from 'electron'
import type { UploadTracker } from '../state/uploadTracker'

export const registerWindowControlHandlers = (
  getWindow: () => BrowserWindow | null,
  uploads: UploadTracker,
) => {
  ipcMain.handle('win:minimize', () => {
    const window = getWindow()
    if (!window) return false
    window.minimize()
    return true
  })

  ipcMain.handle('win:maximize', () => {
    const window = getWindow()
    if (!window) return false
    if (window.isMaximized()) {
      window.unmaximize()
    } else {
      window.maximize()
    }
    return true
  })

  ipcMain.handle('uploads:begin', () => uploads.begin())
  ipcMain.handle('uploads:end', () => uploads.end())

  ipcMain.handle('win:close', () => {
    const window = getWindow()
    if (!window) return false
    if (uploads.hasPending()) {
      window.hide()
      return false
    }
    window.close()
    return true
  })

  ipcMain.handle('win:getSize', () => {
    const window = getWindow()
    const [width, height] = window?.getSize() ?? [0, 0]
    return { width, height }
  })
}
