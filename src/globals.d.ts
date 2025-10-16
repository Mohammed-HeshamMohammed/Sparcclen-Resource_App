/// <reference types="vite/client" />

declare global {
  interface WindowApi {
    minimize: () => Promise<boolean>
    maximize: () => Promise<boolean>
    close: () => Promise<boolean>
    getWindowSize: () => Promise<{ width: number; height: number }>
    onWindowResize: (callback: (size: { width: number; height: number }) => void) => () => void
  }

  interface CredentialsApi {
    isAvailable: () => Promise<boolean>
    store: (email: string, password: string) => Promise<boolean>
    get: (email: string) => Promise<string | null>
    getEmails: () => Promise<string[]>
    has: (email: string) => Promise<boolean>
    delete: (email: string) => Promise<boolean>
    promptHello: (email: string) => Promise<boolean>
  }

  interface UploadsApi {
    begin: () => Promise<number>
    end: () => Promise<number>
  }

  interface FileSystemApi {
    writeFile: (path: string, data: string) => Promise<boolean>
    readFile: (path: string) => Promise<string | null>
    exists: (path: string) => Promise<boolean>
    ensureDir: (path: string) => Promise<boolean>
  }

  interface ResourcesApi {
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

  interface AdminApi {
    listUsers: () => Promise<{
      ok: boolean
      users?: Array<{
        id: string
        email?: string | null
        user_metadata?: Record<string, unknown>
        app_metadata?: Record<string, unknown>
      }>
      error?: string
    }>
    updateUserRole: (userId: string, role: string) => Promise<{
      ok: boolean
      error?: string
    }>
  }

  interface SaveApi {
    readSave: () => Promise<import('@/lib/system/saveClient').SaveData>
    saveWrite: (patch: Partial<import('@/lib/system/saveClient').SaveData>) => Promise<import('@/lib/system/saveClient').SaveData>
  }

  interface PreloadApi extends WindowApi {
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
  }

  interface Window {
    api?: PreloadApi
  }
}

export {}
