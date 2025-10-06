"use strict";
const require$$0 = require("electron");
var dist = {};
var hasRequiredDist;
function requireDist() {
  if (hasRequiredDist) return dist;
  hasRequiredDist = 1;
  Object.defineProperty(dist, "__esModule", { value: true });
  var electron = require$$0;
  const electronAPI = {
    ipcRenderer: {
      send(channel, ...args) {
        electron.ipcRenderer.send(channel, ...args);
      },
      sendTo(webContentsId, channel, ...args) {
        electron.ipcRenderer.sendTo(webContentsId, channel, ...args);
      },
      sendSync(channel, ...args) {
        return electron.ipcRenderer.sendSync(channel, ...args);
      },
      sendToHost(channel, ...args) {
        electron.ipcRenderer.sendToHost(channel, ...args);
      },
      postMessage(channel, message, transfer) {
        if (!process.contextIsolated) {
          electron.ipcRenderer.postMessage(channel, message, transfer);
        }
      },
      invoke(channel, ...args) {
        return electron.ipcRenderer.invoke(channel, ...args);
      },
      on(channel, listener) {
        electron.ipcRenderer.on(channel, listener);
        return () => {
          electron.ipcRenderer.removeListener(channel, listener);
        };
      },
      once(channel, listener) {
        electron.ipcRenderer.once(channel, listener);
      },
      removeListener(channel, listener) {
        electron.ipcRenderer.removeListener(channel, listener);
        return this;
      },
      removeAllListeners(channel) {
        electron.ipcRenderer.removeAllListeners(channel);
      }
    },
    webFrame: {
      insertCSS(css) {
        return electron.webFrame.insertCSS(css);
      },
      setZoomFactor(factor) {
        if (typeof factor === "number" && factor > 0) {
          electron.webFrame.setZoomFactor(factor);
        }
      },
      setZoomLevel(level) {
        if (typeof level === "number") {
          electron.webFrame.setZoomLevel(level);
        }
      }
    },
    process: {
      get platform() {
        return process.platform;
      },
      get versions() {
        return process.versions;
      },
      get env() {
        return { ...process.env };
      }
    }
  };
  function exposeElectronAPI() {
    if (process.contextIsolated) {
      try {
        electron.contextBridge.exposeInMainWorld("electron", electronAPI);
      } catch (error) {
        console.error(error);
      }
    } else {
      window.electron = electronAPI;
    }
  }
  dist.electronAPI = electronAPI;
  dist.exposeElectronAPI = exposeElectronAPI;
  return dist;
}
var distExports = requireDist();
const api = {
  // Window controls
  minimize: () => require$$0.ipcRenderer.invoke("win:minimize"),
  maximize: () => require$$0.ipcRenderer.invoke("win:maximize"),
  close: () => require$$0.ipcRenderer.invoke("win:close"),
  // Window dimensions
  getWindowSize: () => require$$0.ipcRenderer.invoke("win:getSize"),
  onWindowResize: (callback) => {
    require$$0.ipcRenderer.on("win:resize", (_, size) => callback(size));
    return () => require$$0.ipcRenderer.removeListener("win:resize", (_, size) => callback(size));
  },
  // Platform info
  platform: process.platform
};
if (process.contextIsolated) {
  try {
    require$$0.contextBridge.exposeInMainWorld("electron", distExports.electronAPI);
    require$$0.contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error(error);
  }
} else {
  window.electron = distExports.electronAPI;
  window.api = api;
}
