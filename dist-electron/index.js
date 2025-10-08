"use strict";
const require$$0 = require("electron");
const path = require("path");
const fs = require("fs");
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
if (distExports.is.dev) {
  const devUserData = path.join(require$$0.app.getPath("appData"), "SparcclenDev");
  require$$0.app.setPath("userData", devUserData);
  require$$0.app.setPath("cache", path.join(devUserData, "Cache"));
}
const gotTheLock = require$$0.app.requestSingleInstanceLock();
if (!gotTheLock) {
  require$$0.app.quit();
} else {
  require$$0.app.on("second-instance", () => {
    const win = require$$0.BrowserWindow.getAllWindows()[0];
    if (win) {
      if (win.isMinimized()) win.restore();
      win.show();
      win.focus();
    }
  });
}
function createWindow() {
  const mainWindow = new require$$0.BrowserWindow({
    width: 1200,
    height: 900,
    minWidth: 1e3,
    minHeight: 850,
    show: false,
    autoHideMenuBar: true,
    frame: false,
    // Remove Windows title bar completely
    resizable: true,
    hasShadow: true,
    // backgroundColor removed to allow theme system to control colors
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
  mainWindow.once("ready-to-show", () => {
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
  require$$0.ipcMain.handle("win:getSize", () => {
    const bounds = mainWindow.getBounds();
    return { width: bounds.width, height: bounds.height };
  });
  const SAVE_DIR = path.join(require$$0.app.getPath("documents"), "Sparcclen");
  const SAVE_PATH = path.join(SAVE_DIR, "DID-Data.save");
  const defaultSave = {
    firstRun: true,
    theme: "system",
    loggedInBefore: false,
    lastEmail: null,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  async function ensureSaveDir() {
    if (!fs.existsSync(SAVE_DIR)) {
      fs.mkdirSync(SAVE_DIR, { recursive: true });
    }
  }
  async function readSaveFile() {
    await ensureSaveDir();
    try {
      const txt = await fs.promises.readFile(SAVE_PATH, "utf-8");
      const data = JSON.parse(txt);
      return { ...defaultSave, ...data };
    } catch {
      await fs.promises.writeFile(SAVE_PATH, JSON.stringify(defaultSave, null, 2), "utf-8");
      return { ...defaultSave };
    }
  }
  async function writeSaveFile(patch) {
    const current = await readSaveFile();
    const next = { ...current, ...patch, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
    await fs.promises.writeFile(SAVE_PATH, JSON.stringify(next, null, 2), "utf-8");
    return next;
  }
  require$$0.ipcMain.handle("save:read", async () => {
    return readSaveFile();
  });
  require$$0.ipcMain.handle("save:write", async (_event, patch) => {
    return writeSaveFile(patch || {});
  });
  mainWindow.on("resize", () => {
    const bounds = mainWindow.getBounds();
    mainWindow.webContents.send("win:resize", { width: bounds.width, height: bounds.height });
  });
  (async () => {
    try {
      await readSaveFile();
    } catch (e) {
      console.warn("[save:init] failed", e);
    }
  })();
  if (distExports.is.dev) {
    const devUrl = process.env["VITE_DEV_SERVER_URL"] || "http://127.0.0.1:5173";
    mainWindow.loadURL(devUrl).catch(() => {
      mainWindow.loadFile(path.join(__dirname, "renderer", "index.html"));
    });
    mainWindow.webContents.once("did-fail-load", () => {
      mainWindow.loadFile(path.join(__dirname, "renderer", "index.html"));
    });
    if (process.env["ELECTRON_OPEN_DEVTOOLS"] === "true") {
      mainWindow.webContents.openDevTools({ mode: "detach" });
    }
  } else {
    mainWindow.loadFile(path.join(__dirname, "renderer", "index.html"));
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
