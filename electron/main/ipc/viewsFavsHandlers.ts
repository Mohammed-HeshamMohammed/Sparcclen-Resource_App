import { ipcMain } from 'electron'
import { loadViewsFavs, saveViewsFavs, type ViewsFavsItem } from '../persistence/viewsFavsStore'

export const registerViewsFavsHandlers = () => {
  ipcMain.handle('vf:load', async () => {
    return await loadViewsFavs()
  })

  ipcMain.handle('vf:save', async (_event, items: ViewsFavsItem[]) => {
    return await saveViewsFavs(items ?? [])
  })
}