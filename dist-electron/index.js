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
class CredentialManager {
  CRED_DIR;
  CRED_FILE;
  constructor() {
    this.CRED_DIR = path.join(require$$0.app.getPath("documents"), "Sparcclen");
    this.CRED_FILE = path.join(this.CRED_DIR, ".credentials.enc");
  }
  async ensureDir() {
    if (!fs.existsSync(this.CRED_DIR)) {
      fs.mkdirSync(this.CRED_DIR, { recursive: true });
    }
  }
  /**
   * Check if encryption is available (requires user to be logged in to Windows)
   */
  isEncryptionAvailable() {
    return require$$0.safeStorage.isEncryptionAvailable();
  }
  /**
   * Prompt user confirmation via native Electron dialog
   * Note: DPAPI encryption already provides security - credentials can only be 
   * decrypted by the logged-in Windows user. This prompt adds user confirmation.
   */
  async promptWindowsHello(email) {
    console.log(`[CredentialManager] Prompting confirmation for ${email}...`);
    try {
      const result = await require$$0.dialog.showMessageBox({
        type: "info",
        title: "Windows Security",
        message: `Sign in to Sparcclen`,
        detail: `Continue as ${email}?

Your Windows login already protects these credentials via Windows Data Protection API (DPAPI).`,
        buttons: ["Continue", "Cancel"],
        defaultId: 0,
        cancelId: 1,
        noLink: true,
        icon: void 0
      });
      const confirmed = result.response === 0;
      if (confirmed) {
        console.log("[CredentialManager] User confirmed sign-in");
      } else {
        console.log("[CredentialManager] User cancelled sign-in");
      }
      return confirmed;
    } catch (error) {
      console.error("[CredentialManager] Failed to show confirmation dialog:", error);
      return false;
    }
  }
  /**
   * Store encrypted credentials for a user
   * @param email User's email
   * @param password User's password (will be encrypted)
   */
  async storeCredentials(email, password) {
    try {
      if (!this.isEncryptionAvailable()) {
        console.warn("[CredentialManager] Encryption not available");
        return false;
      }
      await this.ensureDir();
      const encryptedPassword = require$$0.safeStorage.encryptString(password);
      let credentials = {};
      if (fs.existsSync(this.CRED_FILE)) {
        const data = await fs.promises.readFile(this.CRED_FILE, "utf-8");
        credentials = JSON.parse(data);
      }
      credentials[email] = encryptedPassword.toString("base64");
      await fs.promises.writeFile(this.CRED_FILE, JSON.stringify(credentials, null, 2), "utf-8");
      return true;
    } catch (error) {
      console.error("[CredentialManager] Failed to store credentials:", error);
      return false;
    }
  }
  /**
   * Retrieve and decrypt password for a user
   * @param email User's email
   * @returns Decrypted password or null if not found
   */
  async getCredentials(email) {
    try {
      if (!this.isEncryptionAvailable()) {
        console.warn("[CredentialManager] Encryption not available");
        return null;
      }
      if (!fs.existsSync(this.CRED_FILE)) {
        return null;
      }
      const data = await fs.promises.readFile(this.CRED_FILE, "utf-8");
      const credentials = JSON.parse(data);
      if (!credentials[email]) {
        return null;
      }
      const encryptedBuffer = Buffer.from(credentials[email], "base64");
      const decryptedPassword = require$$0.safeStorage.decryptString(encryptedBuffer);
      return decryptedPassword;
    } catch (error) {
      console.error("[CredentialManager] Failed to retrieve credentials:", error);
      return null;
    }
  }
  /**
   * Get list of stored email addresses
   */
  async getStoredEmails() {
    try {
      if (!fs.existsSync(this.CRED_FILE)) {
        return [];
      }
      const data = await fs.promises.readFile(this.CRED_FILE, "utf-8");
      const credentials = JSON.parse(data);
      return Object.keys(credentials);
    } catch (error) {
      console.error("[CredentialManager] Failed to get stored emails:", error);
      return [];
    }
  }
  /**
   * Delete stored credentials for a user
   * @param email User's email
   */
  async deleteCredentials(email) {
    try {
      if (!fs.existsSync(this.CRED_FILE)) {
        return true;
      }
      const data = await fs.promises.readFile(this.CRED_FILE, "utf-8");
      const credentials = JSON.parse(data);
      delete credentials[email];
      await fs.promises.writeFile(this.CRED_FILE, JSON.stringify(credentials, null, 2), "utf-8");
      return true;
    } catch (error) {
      console.error("[CredentialManager] Failed to delete credentials:", error);
      return false;
    }
  }
  /**
   * Check if credentials exist for an email
   */
  async hasCredentials(email) {
    try {
      if (!fs.existsSync(this.CRED_FILE)) {
        return false;
      }
      const data = await fs.promises.readFile(this.CRED_FILE, "utf-8");
      const credentials = JSON.parse(data);
      return email in credentials;
    } catch (error) {
      return false;
    }
  }
}
const credentialManager = new CredentialManager();
if (distExports.is.dev) {
  const devUserData = path.join(require$$0.app.getPath("appData"), "SparcclenDev");
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
  if (distExports.is.dev) {
    require$$0.session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          "Content-Security-Policy": [
            "default-src 'self' data: blob:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; worker-src 'self' blob:; child-src 'self' blob:; connect-src 'self' https://*.supabase.co wss://*.supabase.co http://127.0.0.1:* http://localhost:* ws://127.0.0.1:* ws://localhost:*; frame-src 'none';"
          ]
        }
      });
    });
  }
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
    displayName: null,
    offlineSession: false,
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
  require$$0.ipcMain.handle("credentials:isAvailable", () => {
    return credentialManager.isEncryptionAvailable();
  });
  require$$0.ipcMain.handle("credentials:store", async (_event, email, password) => {
    return credentialManager.storeCredentials(email, password);
  });
  require$$0.ipcMain.handle("credentials:get", async (_event, email) => {
    return credentialManager.getCredentials(email);
  });
  require$$0.ipcMain.handle("credentials:getEmails", async () => {
    return credentialManager.getStoredEmails();
  });
  require$$0.ipcMain.handle("credentials:has", async (_event, email) => {
    return credentialManager.hasCredentials(email);
  });
  require$$0.ipcMain.handle("credentials:delete", async (_event, email) => {
    return credentialManager.deleteCredentials(email);
  });
  require$$0.ipcMain.handle("credentials:promptHello", async (_event, email) => {
    return credentialManager.promptWindowsHello(email);
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
