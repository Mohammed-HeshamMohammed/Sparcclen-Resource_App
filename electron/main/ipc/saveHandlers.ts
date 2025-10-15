import { ipcMain } from 'electron'
import { readSaveFile, writeSaveFile, type SaveData } from '../persistence/saveStore'

export const registerSaveHandlers = () => {
  ipcMain.handle('save:read', async () => readSaveFile())
  ipcMain.handle('save:write', async (_event, patch: Partial<SaveData> | undefined) => {
    return writeSaveFile(patch ?? {})
  })
}
