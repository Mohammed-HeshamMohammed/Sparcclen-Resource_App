import { ipcRenderer } from 'electron'
import type { ViewsFavsApi, ViewsFavsItem } from './types'

export const createViewsFavsApi = (): ViewsFavsApi => ({
  load: () => ipcRenderer.invoke('vf:load') as Promise<ViewsFavsItem[]>,
  save: (items) => ipcRenderer.invoke('vf:save', items ?? []) as Promise<boolean>,
})