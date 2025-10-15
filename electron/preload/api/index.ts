import { createWindowApi } from './window'
import { createSaveApi } from './save'
import { createCredentialsApi } from './credentials'
import { createUploadsApi } from './uploads'
import { createFileSystemApi } from './fileSystem'
import { createResourcesApi } from './resources'
import { createAdminApi } from './admin'
import type { PreloadApi } from './types'

export const createPreloadApi = (): PreloadApi => {
  const windowApi = createWindowApi()
  const saveApi = createSaveApi()

  return {
    platform: process.platform,
    window: windowApi,
    ...windowApi,
    readSave: saveApi.readSave,
    saveWrite: saveApi.saveWrite,
    save: saveApi,
    credentials: createCredentialsApi(),
    uploads: createUploadsApi(),
    fs: createFileSystemApi(),
    resources: createResourcesApi(),
    admin: createAdminApi(),
  }
}

export type { PreloadApi }
