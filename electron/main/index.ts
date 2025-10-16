import { config as loadEnv } from 'dotenv'
import { app, BrowserWindow } from 'electron'
import { join, resolve } from 'path'
import { electronApp, is } from '@electron-toolkit/utils'

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

const getMainWindow = () => mainWindow

const setupEnvironment = () => {
  if (is.dev) {
    const devUserData = join(app.getPath('appData'), 'SparcclenDev')
    app.setPath('cache', join(devUserData, 'Cache'))
    process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'
  }
}

const setupSingleInstanceLock = () => {
  const gotTheLock = app.requestSingleInstanceLock()
  if (!gotTheLock) {
    app.quit()
    return false
  }

  app.on('second-instance', () => {
    const existing = BrowserWindow.getAllWindows()[0]
    if (existing) {
      if (existing.isMinimized()) existing.restore()
      existing.show()
      existing.focus()
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
}

const bootstrap = async () => {
  setupEnvironment()
  if (!setupSingleInstanceLock()) return

  registerGlobalIpcHandlers()

  app.whenReady().then(async () => {
    electronApp.setAppUserModelId('com.electron')

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
}

bootstrap()
