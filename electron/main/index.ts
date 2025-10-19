import { config as loadEnv } from 'dotenv'
import { app, BrowserWindow } from 'electron'
import { join, resolve } from 'path'
import { createServer, Server } from 'http'

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
let trampolineServer: Server | null = null

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

const startTrampolineServer = () => {
  try {
    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="Cache-Control" content="no-store" />
    <title>Opening Sparcclen…</title>
    <style>body{font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; margin: 2rem; color:#111} a{color:#2563eb}</style>
  </head>
  <body>
    <h1>Opening Sparcclen…</h1>
    <p>If you are not redirected automatically, click the link below.</p>
    <div id="link"></div>
    <script>
      (function() {
        var h = window.location.hash || '';
        var s = window.location.search || '';
        var target = 'sparcclen://auth/confirm' + (s ? s : '') + (h ? h : '');
        try { window.location.replace(target); } catch (e) {}
        var a = document.createElement('a');
        a.href = target;
        a.textContent = 'Open Sparcclen';
        document.getElementById('link').appendChild(a);
      })();
    </script>
  </body>
</html>`

    trampolineServer = createServer((_req, res) => {
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      })
      res.end(html)
    })
    trampolineServer.listen(3000)
    trampolineServer.on('error', () => {
      // Port in use or other error; continue without trampoline
    })
  } catch {
    // Ignore server start errors
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

    // Start local trampoline to capture http://localhost:3000/#... and forward to sparcclen://
    startTrampolineServer()
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

  app.on('before-quit', () => {
    try { trampolineServer?.close() } catch {}
    trampolineServer = null
  })
}

bootstrap()
