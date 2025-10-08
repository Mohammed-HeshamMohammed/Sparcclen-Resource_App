declare global {
  interface Window {
    api: {
      minimize: () => Promise<void>
      maximize: () => Promise<void>
      close: () => Promise<void>
      getWindowSize: () => Promise<{ width: number; height: number }>
      onWindowResize: (callback: (size: { width: number; height: number }) => void) => () => void
      platform: string
      readSave: () => Promise<{
        firstRun: boolean
        theme: 'system' | 'light' | 'dark'
        loggedInBefore: boolean
        lastEmail: string | null
        updatedAt: string
      }>
      saveWrite: (patch: Partial<{
        firstRun: boolean
        theme: 'system' | 'light' | 'dark'
        loggedInBefore: boolean
        lastEmail: string | null
      }>) => Promise<{
        firstRun: boolean
        theme: 'system' | 'light' | 'dark'
        loggedInBefore: boolean
        lastEmail: string | null
        updatedAt: string
      }>
    }
  }
}

export {}