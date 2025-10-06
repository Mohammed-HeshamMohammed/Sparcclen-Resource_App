"use strict";
const require$$0 = require("electron");
const path = require("path");
var dist = {};
var hasRequiredDist;
function requireDist() {
  if (hasRequiredDist) return dist;
  hasRequiredDist = 1;
  Object.defineProperty(dist, "__esModule", { value: true });
  var electron = require$$0;
  const is = {
    dev: !electron.app.isPackaged
  };
  const platform = {
    isWindows: process.platform === "win32",
    isMacOS: process.platform === "darwin",
    isLinux: process.platform === "linux"
  };
  const electronApp = {
    setAppUserModelId(id) {
      if (platform.isWindows)
        electron.app.setAppUserModelId(is.dev ? process.execPath : id);
    },
    setAutoLaunch(auto) {
      if (platform.isLinux)
        return false;
      const isOpenAtLogin = () => {
        return electron.app.getLoginItemSettings().openAtLogin;
      };
      if (isOpenAtLogin() !== auto) {
        electron.app.setLoginItemSettings({
          openAtLogin: auto,
          path: process.execPath
        });
        return isOpenAtLogin() === auto;
      } else {
        return true;
      }
    },
    skipProxy() {
      return electron.session.defaultSession.setProxy({ mode: "direct" });
    }
  };
  let listeners = [];
  let handlers = [];
  const ipcHelper = {
    handle(channel, listener) {
      handlers.push(channel);
      electron.ipcMain.handle(channel, listener);
    },
    on(channel, listener) {
      listeners.push(channel);
      electron.ipcMain.on(channel, listener);
      return this;
    },
    removeAllListeners() {
      listeners.forEach((c) => electron.ipcMain.removeAllListeners(c));
      listeners = [];
      return this;
    },
    removeAllHandlers() {
      handlers.forEach((c) => electron.ipcMain.removeHandler(c));
      handlers = [];
    },
    removeListeners(channels) {
      channels.forEach((c) => electron.ipcMain.removeAllListeners(c));
      return this;
    },
    removeHandlers(channels) {
      channels.forEach((c) => electron.ipcMain.removeHandler(c));
    }
  };
  const optimizer = {
    watchWindowShortcuts(window, shortcutOptions) {
      if (!window)
        return;
      const { webContents } = window;
      const { escToCloseWindow = false, zoom = false } = shortcutOptions || {};
      webContents.on("before-input-event", (event, input) => {
        if (input.type === "keyDown") {
          if (!is.dev) {
            if (input.key === "r" && (input.control || input.meta))
              event.preventDefault();
          } else {
            if (input.code === "F12") {
              if (webContents.isDevToolsOpened()) {
                webContents.closeDevTools();
              } else {
                webContents.openDevTools({ mode: "undocked" });
                console.log("Open dev tool...");
              }
            }
          }
          if (escToCloseWindow) {
            if (input.code === "Escape" && input.key !== "Process") {
              window.close();
              event.preventDefault();
            }
          }
          if (!zoom) {
            if (input.code === "Minus" && (input.control || input.meta))
              event.preventDefault();
            if (input.code === "Equal" && input.shift && (input.control || input.meta))
              event.preventDefault();
          }
        }
      });
    },
    registerFramelessWindowIpc() {
      electron.ipcMain.on("win:invoke", (event, action) => {
        const win = electron.BrowserWindow.fromWebContents(event.sender);
        if (win) {
          if (action === "show") {
            win.show();
          } else if (action === "showInactive") {
            win.showInactive();
          } else if (action === "min") {
            win.minimize();
          } else if (action === "max") {
            const isMaximized = win.isMaximized();
            if (isMaximized) {
              win.unmaximize();
            } else {
              win.maximize();
            }
          } else if (action === "close") {
            win.close();
          }
        }
      });
    }
  };
  dist.electronApp = electronApp;
  dist.ipcHelper = ipcHelper;
  dist.is = is;
  dist.optimizer = optimizer;
  dist.platform = platform;
  return dist;
}
var distExports = requireDist();
function createWindow() {
  const mainWindow = new require$$0.BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 850,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    frame: false,
    // Frameless window for custom styling
    titleBarStyle: "hidden",
    titleBarOverlay: false,
    thickFrame: false,
    transparent: true,
    // Enable transparency for rounded corners effect
    resizable: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false
    }
  });
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: https: blob:",
          "font-src 'self' data:",
          "connect-src 'self' https://*.supabase.co https://*.supabase.com ws://localhost:* http://localhost:*",
          "frame-src 'none'",
          "object-src 'none'",
          "base-uri 'self'",
          "worker-src 'self' blob:"
        ].join("; "),
        "X-Content-Type-Options": ["nosniff"],
        "X-Frame-Options": ["DENY"],
        "X-XSS-Protection": ["1; mode=block"],
        "Referrer-Policy": ["strict-origin-when-cross-origin"]
      }
    });
  });
  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });
  mainWindow.webContents.setWindowOpenHandler((details) => {
    require$$0.shell.openExternal(details.url);
    return { action: "deny" };
  });
  require$$0.ipcMain.handle("win:minimize", () => {
    mainWindow.minimize();
    return true;
  });
  require$$0.ipcMain.handle("win:maximize", () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
    return true;
  });
  require$$0.ipcMain.handle("win:close", () => {
    mainWindow.close();
    return true;
  });
  if (distExports.is.dev && process.env["VITE_DEV_SERVER_URL"]) {
    mainWindow.loadURL(process.env["VITE_DEV_SERVER_URL"]);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}
require$$0.app.whenReady().then(() => {
  distExports.electronApp.setAppUserModelId("com.electron");
  require$$0.app.on("browser-window-created", (_, window) => {
  });
  createWindow();
  require$$0.app.on("activate", function() {
    if (require$$0.BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
require$$0.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    require$$0.app.quit();
  }
});
