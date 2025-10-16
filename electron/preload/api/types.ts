import type { SaveData } from '@/lib/system/saveClient'

export interface WindowApi {
  minimize: () => Promise<boolean>
  maximize: () => Promise<boolean>
  close: () => Promise<boolean>
  getWindowSize: () => Promise<{ width: number; height: number }>
  onWindowResize: (callback: (size: { width: number; height: number }) => void) => () => void
}

export interface CredentialsApi {
  isAvailable: () => Promise<boolean>
  store: (email: string, password: string) => Promise<boolean>
  get: (email: string) => Promise<string | null>
  getEmails: () => Promise<string[]>
  has: (email: string) => Promise<boolean>
  delete: (email: string) => Promise<boolean>
  promptHello: (email: string) => Promise<boolean>
}

export interface UploadsApi {
  begin: () => Promise<number>
  end: () => Promise<number>
}

export interface FileSystemApi {
  writeFile: (path: string, data: string) => Promise<boolean>
  readFile: (path: string) => Promise<string | null>
  exists: (path: string) => Promise<boolean>
  ensureDir: (path: string) => Promise<boolean>
}

export interface ViewsFavsItem {
  title: string
  category: string
  subcategory: string
  favourite: boolean
}

export interface ViewsFavsApi {
  load: () => Promise<ViewsFavsItem[]>
  save: (items: ViewsFavsItem[]) => Promise<boolean>
}

export interface ResourcesApi {
  pickJsonFile: () => Promise<{
    canceled: boolean
    data?: string
    fileName?: string
    filePath?: string
    error?: string
  }>
  saveLibraryBin: (
    segments: string[],
    fileName: string,
    content: string,
  ) => Promise<{
    ok: boolean
    path?: string
    error?: string
  }>
  listLibraryBins: (
    options?: {
      category?: string | null
      subcategory?: string | null
    },
  ) => Promise<{
    ok: boolean
    files: Array<{
      categorySegment: string | null
      subcategorySegment: string | null
      fileName: string
      items: unknown[]
    }>
    error?: string
  }>
  readImageAsBase64: (
    sourceDir: string,
    imagePath: string
  ) => Promise<{
    ok: boolean
    base64Data?: string
    mimeType?: string
    error?: string
  }>
  openExternal: (url: string) => Promise<void>
}

export interface AdminApiUser {
  id: string
  email?: string | null
  user_metadata?: Record<string, unknown>
  app_metadata?: Record<string, unknown>
}

export interface AdminListUsersResult {
  ok: boolean
  users?: AdminApiUser[]
  error?: string
}

export interface AdminUpdateUserRoleResult {
  ok: boolean
  error?: string
}

export interface AdminApi {
  listUsers: () => Promise<AdminListUsersResult>
  updateUserRole: (userId: string, role: string) => Promise<AdminUpdateUserRoleResult>
}

export interface SaveApi {
  readSave: () => Promise<SaveData>
  saveWrite: (patch: Partial<SaveData>) => Promise<SaveData>
}

export interface PreloadApi extends WindowApi {
  platform: string
  readSave: SaveApi['readSave']
  saveWrite: SaveApi['saveWrite']
  window: WindowApi
  save: SaveApi
  credentials: CredentialsApi
  uploads: UploadsApi
  fs: FileSystemApi
  resources: ResourcesApi
  admin: AdminApi
  viewsFavs: ViewsFavsApi
}
