import { app, shell, BrowserWindow, ipcMain, session } from 'electron'
import { join } from 'path'
import { promises as fs } from 'fs'
import { existsSync, mkdirSync } from 'fs'

import { electronApp, is } from '@electron-toolkit/utils'
import { CredentialManager } from './credentialManager.ts'

// Initialize credential manager
const credentialManager = new CredentialManager()

// In development, use a dedicated userData directory to avoid cache lock conflicts
// (fixes: Unable to move/create cache: Access is denied (0x5))
if (is.dev) {
  const devUserData = join(app.getPath('appData'), 'SparcclenDev')
  // Also ensure cache dir is unique in dev to avoid lock conflicts
  app.setPath('cache', join(devUserData, 'Cache'))
}

// Ensure only one Electron instance runs; focus existing if re-launched
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const win = BrowserWindow.getAllWindows()[0]
    if (win) {
      if (win.isMinimized()) win.restore()
      win.show()
      win.focus()
    }
  })
}

function createWindow(): void {
  // Create the browser window.
  // Resolve preload path for both production build and ts-node dev.
  const prodPreload = join(__dirname, 'preload.js')
  const devPreloadBuilt = join(__dirname, '..', 'preload', 'index.js')
  const devPreloadRegister = join(__dirname, '..', 'preload', 'register.cjs')
  // Prefer built JS preload first to avoid ts-node/vm in renderer
  const preloadResolved = [prodPreload, devPreloadBuilt, devPreloadRegister].find(p => existsSync(p))
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    minWidth: 1000,
    minHeight: 850,
    show: false,
    autoHideMenuBar: true,
    frame: false, // Remove Windows title bar completely
    resizable: true,
    hasShadow: true,
    // backgroundColor removed to allow theme system to control colors
    webPreferences: {
      ...(preloadResolved ? { preload: preloadResolved } : {}),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false
    }
  })

  // Set Content Security Policy for development
  if (is.dev) {
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: http://127.0.0.1:5175 http://localhost:5175; " +
            "connect-src 'self' http://127.0.0.1:* http://localhost:* ws://127.0.0.1:* ws://localhost:* https://*.supabase.co wss://*.supabase.co;"
          ]
        }
      })
    })
  }

  // Show window only when it's ready to avoid white flashes and "background only" runs
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Basic IPC handlers for frameless window controls
  ipcMain.handle('win:minimize', () => {
    mainWindow.minimize()
    return true
  })

  ipcMain.handle('win:maximize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }
    return true
  })

  ipcMain.handle('win:close', () => {
    mainWindow.close()
    return true
  })

  ipcMain.handle('win:getSize', () => {
    const bounds = mainWindow.getBounds()
    return { width: bounds.width, height: bounds.height }
  })

  // Persistent app save in user's Documents/Sparcclen/DID-Data.save
  type SaveData = {
    firstRun: boolean
    theme: 'system' | 'light' | 'dark'
    loggedInBefore: boolean
    lastEmail: string | null
    displayName: string | null
    offlineSession?: boolean
    updatedAt: string
  }

  const SAVE_DIR = join(app.getPath('documents'), 'Sparcclen')
  const SAVE_PATH = join(SAVE_DIR, 'DID-Data.save')
  const defaultSave: SaveData = {
    firstRun: true,
    theme: 'system',
    loggedInBefore: false,
    lastEmail: null,
    displayName: null,
    offlineSession: false,
    updatedAt: new Date().toISOString()
  }

  async function ensureSaveDir() {
    if (!existsSync(SAVE_DIR)) {
      mkdirSync(SAVE_DIR, { recursive: true })
    }
  }

  async function readSaveFile(): Promise<SaveData> {
    await ensureSaveDir()
    try {
      const txt = await fs.readFile(SAVE_PATH, 'utf-8')
      const data = JSON.parse(txt) as Partial<SaveData>
      return { ...defaultSave, ...data }
    } catch {
      await fs.writeFile(SAVE_PATH, JSON.stringify(defaultSave, null, 2), 'utf-8')
      return { ...defaultSave }
    }
  }

  async function writeSaveFile(patch: Partial<SaveData>): Promise<SaveData> {
    const current = await readSaveFile()
    const next: SaveData = { ...current, ...patch, updatedAt: new Date().toISOString() }
    await fs.writeFile(SAVE_PATH, JSON.stringify(next, null, 2), 'utf-8')
    return next
  }

  ipcMain.handle('save:read', async () => {
    return readSaveFile()
  })

  ipcMain.handle('save:write', async (_event, patch: Partial<SaveData>) => {
    return writeSaveFile(patch || {})
  })

  // Credential Manager IPC handlers
  ipcMain.handle('credentials:isAvailable', () => {
    return credentialManager.isEncryptionAvailable()
  })

  ipcMain.handle('credentials:store', async (_event, email: string, password: string) => {
    return credentialManager.storeCredentials(email, password)
  })

  ipcMain.handle('credentials:get', async (_event, email: string) => {
    return credentialManager.getCredentials(email)
  })

  ipcMain.handle('credentials:getEmails', async () => {
    return credentialManager.getStoredEmails()
  })

  ipcMain.handle('credentials:has', async (_event, email: string) => {
    return credentialManager.hasCredentials(email)
  })

  ipcMain.handle('credentials:delete', async (_event, email: string) => {
    return credentialManager.deleteCredentials(email)
  })

  ipcMain.handle('credentials:promptHello', async (_event, email: string) => {
    return credentialManager.promptWindowsHello(email)
  })

  // Listen for window resize events and notify renderer
  mainWindow.on('resize', () => {
    const bounds = mainWindow.getBounds()
    mainWindow.webContents.send('win:resize', { width: bounds.width, height: bounds.height })
  })

  // Ensure save file exists during startup (splash period)
  ;(async () => {
    try { await readSaveFile() } catch (e) { console.warn('[save:init] failed', e) }
  })()

  // Load the app
  if (is.dev) {
    const devUrl = process.env['VITE_DEV_SERVER_URL'] || 'http://127.0.0.1:5175'
    // Loading dev server URL
    
    // Load dev server and add proper error handling
    mainWindow.loadURL(devUrl).catch((error) => {
      console.error('Failed to load dev server:', error)
      // Don't fall back to local file in development - this usually means dev server isn't ready
    })
    
    // Open DevTools if explicitly requested
    if (process.env['ELECTRON_OPEN_DEVTOOLS'] === 'true') {
      mainWindow.webContents.openDevTools({ mode: 'detach' })
    }
  } else {
    // In production, renderer is bundled under dist-electron/renderer
    mainWindow.loadFile(join(__dirname, 'renderer', 'index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', () => {
    // Additional window setup could go here
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.