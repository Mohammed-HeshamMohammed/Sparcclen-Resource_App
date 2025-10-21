import { config as loadEnv } from 'dotenv'
import { app, BrowserWindow } from 'electron'
import { join, resolve } from 'path'

// Replace @electron-toolkit/utils functionality
const is = {
  dev: process.env.NODE_ENV === 'development' || process.argv.includes('--dev')
}

import { CredentialManager } from './security/credentialManager'
import { UploadTracker } from './state/uploadTracker'
import { registerWindowControlHandlers } from './ipc/windowControls'
import { registerSaveHandlers } from './ipc/saveHandlers'
import { registerCredentialHandlers } from './ipc/credentialHandlers'
import { registerFileSystemHandlers } from './ipc/fileSystemHandlers'
import { registerResourceHandlers } from './ipc/resourceHandlers'
import { registerAdminHandlers } from './ipc/adminHandlers'
import { registerViewsFavsHandlers } from './ipc/viewsFavsHandlers'
import { ensureInitialSaveFile } from './persistence/saveStore'
import { createMainWindow } from './windows/createMainWindow'

loadEnv({ path: resolve(process.cwd(), '.env') })

// Maintain shared singletons
const credentialManager = new CredentialManager()
const uploadTracker = new UploadTracker()

let mainWindow: BrowserWindow | null = null

const DEEP_LINK_SCHEME = 'sparcclen'
let pendingDeepLinkUrl: string | null = null

const getMainWindow = () => mainWindow

const setupEnvironment = () => {
  if (is.dev) {
    const devUserData = join(app.getPath('appData'), 'SparcclenDev')
    app.setPath('cache', join(devUserData, 'Cache'))
    process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'
  }
}

const setupAppIcon = () => {
  // Set proper App User Model ID for Windows
  const appId = is.dev ? 'com.sparcclen.dev' : 'com.sparcclen.app'
  app.setAppUserModelId(appId)

  // Note: Windows Task Manager icon is set during build process via electron-builder
  // The icon file should be specified in package.json build configuration
  // For dev mode, the icon is handled by the window icon setting in createMainWindow.ts
}

const setupSingleInstanceLock = () => {
  const gotTheLock = app.requestSingleInstanceLock()
  if (!gotTheLock) {
    app.quit()
    return false
  }

  app.on('second-instance', (_event, argv) => {
    const existing = BrowserWindow.getAllWindows()[0]
    if (existing) {
      if (existing.isMinimized()) existing.restore()
      existing.show()
      existing.focus()
    }
    if (process.platform === 'win32' && Array.isArray(argv)) {
      const urlArg = argv.find((a) => typeof a === 'string' && a.startsWith(`${DEEP_LINK_SCHEME}://`)) as string | undefined
      if (urlArg) {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('auth:deeplink', urlArg)
        } else {
          pendingDeepLinkUrl = urlArg
        }
      }
    }
  })

  return true
}

const registerGlobalIpcHandlers = () => {
  registerWindowControlHandlers(getMainWindow, uploadTracker)
  registerSaveHandlers()
  registerCredentialHandlers(credentialManager)
  registerFileSystemHandlers()
  registerResourceHandlers(getMainWindow)
  registerAdminHandlers()
  registerViewsFavsHandlers()
}

const createMainProcessWindow = () => {
  mainWindow = createMainWindow()
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  if (pendingDeepLinkUrl && mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.once('did-finish-load', () => {
      if (pendingDeepLinkUrl) {
        mainWindow?.webContents.send('auth:deeplink', pendingDeepLinkUrl as string)
        pendingDeepLinkUrl = null
      }
    })
  }
}


const bootstrap = async () => {
  setupEnvironment()
  setupAppIcon()
  if (!setupSingleInstanceLock()) return

  registerGlobalIpcHandlers()

  app.whenReady().then(async () => {
    if (!app.isDefaultProtocolClient(DEEP_LINK_SCHEME)) {
      try { app.setAsDefaultProtocolClient(DEEP_LINK_SCHEME) } catch {}
    }

    createMainProcessWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainProcessWindow()
      }
    })

    await ensureInitialSaveFile()

  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      if (!uploadTracker.hasPending()) {
        app.quit()
      }
    }
  })

  if (process.platform === 'darwin') {
    app.on('open-url', (event, url) => {
      event.preventDefault()
      if (url && url.startsWith(`${DEEP_LINK_SCHEME}://`)) {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('auth:deeplink', url)
        } else {
          pendingDeepLinkUrl = url
        }
      }
    })
  }

  if (process.platform === 'win32') {
    const urlArg = process.argv.find((a) => typeof a === 'string' && a.startsWith(`${DEEP_LINK_SCHEME}://`)) as string | undefined
    if (urlArg) {
      pendingDeepLinkUrl = urlArg
    }
  }

}

bootstrap()
