declare global {
  interface Window {
    api: {
      minimize: () => Promise<void>
      maximize: () => Promise<void>
      close: () => Promise<void>
      getWindowSize: () => Promise<{ width: number; height: number }>
      onWindowResize: (callback: (size: { width: number; height: number }) => void) => () => void
      platform: string
    }
  }
}

export {}