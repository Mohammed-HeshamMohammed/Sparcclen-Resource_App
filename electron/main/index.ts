import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'

function createWindow(): void {
  // Create the browser window.
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
    backgroundColor: '#1c1917', // Match the root background color
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false
    }
  })

  // Helpful diagnostics for blank window issues
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, _validatedURL, isMainFrame) => {
    console.error('[did-fail-load]', { errorCode, errorDescription, isMainFrame })
  })
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[did-finish-load] URL:', mainWindow.webContents.getURL())
  })
  mainWindow.webContents.on('dom-ready', () => {
    console.log('[dom-ready] URL:', mainWindow.webContents.getURL())
  })
  mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    const levelMap: Record<number, 'log' | 'warn' | 'error'> = { 0: 'log', 1: 'log', 2: 'warn', 3: 'error' }
    const tag = levelMap[level] || 'log'
    const prefix = `[renderer:${tag}]`
    const location = sourceId ? `${sourceId}:${line}` : ''
    // eslint-disable-next-line no-console
    console[tag](`${prefix} ${message} ${location}`)
  })

  // Set security headers for both development and production
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    const isDev = is.dev;
    const devUrl = process.env['VITE_DEV_SERVER_URL'] || 'http://127.0.0.1:5174';
    const devHost = new URL(devUrl).origin;
    
    const csp = isDev ? [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${devHost} blob:`,
      `style-src 'self' 'unsafe-inline' ${devHost}`,
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      `connect-src 'self' ${devHost} https://*.supabase.co https://*.supabase.com ws://localhost:* ws://127.0.0.1:*`,
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "worker-src 'self' blob:"
    ] : [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co https://*.supabase.com",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "worker-src 'self' blob:"
    ];

    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': csp.join('; '),
        'X-Content-Type-Options': ['nosniff'],
        'X-Frame-Options': ['DENY'],
        'X-XSS-Protection': ['1; mode=block'],
        'Referrer-Policy': ['strict-origin-when-cross-origin']
      }
    })
  })

  mainWindow.on('ready-to-show', () => {
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

  // Listen for window resize events and notify renderer
  mainWindow.on('resize', () => {
    const bounds = mainWindow.getBounds()
    mainWindow.webContents.send('win:resize', { width: bounds.width, height: bounds.height })
  })

  // Load the app
  if (is.dev) {
    const devUrl = process.env['VITE_DEV_SERVER_URL'] || 'http://127.0.0.1:5174'
    mainWindow.loadURL(devUrl)
    if (process.env['ELECTRON_OPEN_DEVTOOLS'] === 'true') {
      mainWindow.webContents.openDevTools({ mode: 'detach' })
    }
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    // optimizer.watch(window) // TODO: Check electron-toolkit optimizer API
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