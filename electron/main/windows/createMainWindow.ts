import { BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { existsSync } from 'fs'
import { is } from '@electron-toolkit/utils'

const resolvePreloadPath = () => {
  const prodPreload = join(__dirname, '..', 'preload.js')
  const devPreloadBuilt = join(__dirname, '..', 'preload', 'index.js')
  const devPreloadRegister = join(__dirname, '..', 'preload', 'dev-register.cjs')
  return [prodPreload, devPreloadBuilt, devPreloadRegister].find(p => existsSync(p))
}

export const createMainWindow = () => {
  const preloadResolved = resolvePreloadPath()

  // Set custom app icon with proper path resolution
  const getIconPath = () => {
    // In dev mode, __dirname points to the compiled JS location
    // In prod mode, __dirname points to the app root
    const possiblePaths = [
      // Prefer .ico for Windows compatibility (better taskbar display)
      join(__dirname, '..', '..', 'src', 'public', 'Logo.ico'),
      join(__dirname, '..', '..', '..', 'src', 'public', 'Logo.ico'),
      // Fallback to .png if .ico doesn't exist
      join(__dirname, '..', '..', 'src', 'public', 'Logo.png'),
      join(__dirname, '..', '..', '..', 'src', 'public', 'Logo.png'),
      // Final fallback to root level
      join(__dirname, '..', '..', 'Logo.ico'),
      join(__dirname, '..', '..', 'Logo.png')
    ]

    // Return the first path that exists
    for (const path of possiblePaths) {
      if (existsSync(path)) {
        return path
      }
    }

    // If no custom icon found, let Electron use default
    return undefined
  }

  const iconPath = getIconPath()

  const mainWindow = new BrowserWindow({
    width: 1100,
    height: 850,
    minWidth: 1000,
    minHeight: 850,
    show: false,
    autoHideMenuBar: true,
    frame: false,
    resizable: true,
    hasShadow: true,
    ...(iconPath && { icon: iconPath }), // Only set icon if path exists
    webPreferences: {
      ...(preloadResolved ? { preload: preloadResolved } : {}),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
    },
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  mainWindow.on('resize', () => {
    if (mainWindow.isDestroyed()) return
    const [width, height] = mainWindow.getSize()
    mainWindow.webContents.send('win:resize', { width, height })
  })

  if (is.dev) {
    const devUrl = process.env['VITE_DEV_SERVER_URL'] || 'http://127.0.0.1:5175'
    mainWindow.loadURL(devUrl).catch((error) => {
      console.error('Failed to load dev server:', error)
    })
    if (process.env['ELECTRON_OPEN_DEVTOOLS'] === 'true') {
      mainWindow.webContents.openDevTools({ mode: 'detach' })
    }
  } else {
    mainWindow.loadFile(join(__dirname, 'renderer', 'index.html'))
  }

  return mainWindow
}
