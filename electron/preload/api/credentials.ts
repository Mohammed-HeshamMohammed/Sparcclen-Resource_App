import { ipcRenderer } from 'electron'
import type { CredentialsApi } from './types'

export const createCredentialsApi = (): CredentialsApi => ({
  isAvailable: () => ipcRenderer.invoke('credentials:isAvailable'),
  store: (email, password) => ipcRenderer.invoke('credentials:store', email, password),
  get: (email) => ipcRenderer.invoke('credentials:get', email),
  getEmails: () => ipcRenderer.invoke('credentials:getEmails'),
  has: (email) => ipcRenderer.invoke('credentials:has', email),
  delete: (email) => ipcRenderer.invoke('credentials:delete', email),
  promptHello: (email) => ipcRenderer.invoke('credentials:promptHello', email),
})
