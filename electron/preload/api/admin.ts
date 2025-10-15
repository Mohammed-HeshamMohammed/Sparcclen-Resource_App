import { ipcRenderer } from 'electron'
import type { AdminApi } from './types'

export const createAdminApi = (): AdminApi => ({
  listUsers: () => ipcRenderer.invoke('admin:listUsers'),
  updateUserRole: (userId, role) => ipcRenderer.invoke('admin:updateUserRole', userId, role),
})
