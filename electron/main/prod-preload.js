// Standalone preload script for production
// This version doesn't rely on @electron-toolkit/preload

const { contextBridge, ipcRenderer } = require('electron');

// Create basic API for the renderer process
const api = {
  platform: process.platform,
  
  // Window controls
  minimize: () => ipcRenderer.invoke('win:minimize'),
  maximize: () => ipcRenderer.invoke('win:maximize'),
  close: () => ipcRenderer.invoke('win:close'),
  getWindowSize: () => ipcRenderer.invoke('win:getSize'),
  onWindowResize: (callback) => {
    const handler = (event, size) => callback(size);
    ipcRenderer.on('win:resize', handler);
    return () => ipcRenderer.removeListener('win:resize', handler);
  },
  setBackgroundColor: (color) => ipcRenderer.invoke('win:setBackgroundColor', color),

  // Save operations
  readSave: () => ipcRenderer.invoke('save:read'),
  saveWrite: (patch) => ipcRenderer.invoke('save:write', patch || {}),
  
  // Save API object (for compatibility)
  save: {
    readSave: () => ipcRenderer.invoke('save:read'),
    saveWrite: (patch) => ipcRenderer.invoke('save:write', patch || {})
  },

  // Window API object (for compatibility)
  window: {
    minimize: () => ipcRenderer.invoke('win:minimize'),
    maximize: () => ipcRenderer.invoke('win:maximize'),
    close: () => ipcRenderer.invoke('win:close'),
    getWindowSize: () => ipcRenderer.invoke('win:getSize'),
    onWindowResize: (callback) => {
      const handler = (event, size) => callback(size);
      ipcRenderer.on('win:resize', handler);
      return () => ipcRenderer.removeListener('win:resize', handler);
    },
    setBackgroundColor: (color) => ipcRenderer.invoke('win:setBackgroundColor', color)
  },

  // Resources API
  resources: {
    openExternal: (url) => ipcRenderer.invoke('resources:openExternal', url),
    pickJsonFile: () => ipcRenderer.invoke('resources:pickJsonFile'),
    saveLibraryBin: (segments, fileName, content) => ipcRenderer.invoke('resources:saveLibraryBin', segments, fileName, content),
    listLibraryBins: (options) => ipcRenderer.invoke('resources:listLibraryBins', options),
    readImageAsBase64: (sourceDir, imagePath) => ipcRenderer.invoke('resources:readImageAsBase64', sourceDir, imagePath)
  },

  // Working credentials API using localStorage as fallback
  credentials: {
    isAvailable: () => Promise.resolve(true),
    store: (email, password) => {
      try {
        const key = `credential:${email}`;
        localStorage.setItem(key, password);
        return Promise.resolve(true);
      } catch {
        return Promise.resolve(false);
      }
    },
    get: (email) => {
      try {
        const key = `credential:${email}`;
        const stored = localStorage.getItem(key);
        return Promise.resolve(stored);
      } catch {
        return Promise.resolve(null);
      }
    },
    getEmails: () => {
      try {
        const emails = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('credential:')) {
            emails.push(key.replace('credential:', ''));
          }
        }
        return Promise.resolve(emails);
      } catch {
        return Promise.resolve([]);
      }
    },
    has: (email) => {
      try {
        const key = `credential:${email}`;
        return Promise.resolve(localStorage.getItem(key) !== null);
      } catch {
        return Promise.resolve(false);
      }
    },
    delete: (email) => {
      try {
        const key = `credential:${email}`;
        localStorage.removeItem(key);
        return Promise.resolve(true);
      } catch {
        return Promise.resolve(false);
      }
    },
    promptHello: () => Promise.resolve(true)
  },

  uploads: {
    begin: () => Promise.resolve(0),
    end: () => Promise.resolve(0)
  },

  fs: {
    writeFile: (path, data) => ipcRenderer.invoke('fs:writeFile', path, data),
    readFile: (path) => ipcRenderer.invoke('fs:readFile', path),
    exists: (path) => ipcRenderer.invoke('fs:exists', path),
    ensureDir: (path) => ipcRenderer.invoke('fs:ensureDir', path)
  },

  admin: {
    listUsers: () => ipcRenderer.invoke('admin:listUsers'),
    updateUserRole: (userId, role) => ipcRenderer.invoke('admin:updateUserRole', userId, role)
  },

  viewsFavs: {
    load: () => Promise.resolve([]),
    save: () => Promise.resolve(true)
  }
};

// Basic electronAPI equivalent
const electronAPI = {
  process: {
    platform: process.platform,
    versions: process.versions
  }
};

// Expose APIs to renderer
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI);
    contextBridge.exposeInMainWorld('api', api);
    console.log('Preload: APIs exposed successfully');
  } catch (error) {
    console.error('Preload: Failed to expose APIs:', error);
  }
} else {
  // Fallback for non-isolated context
  window.electron = electronAPI;
  window.api = api;
}