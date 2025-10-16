"use strict";

// electron/preload/index.ts
var import_electron8 = require("electron");
var import_preload = require("@electron-toolkit/preload");

// electron/preload/api/window.ts
var import_electron = require("electron");
var resizeChannel = "win:resize";
var createWindowApi = () => ({
  minimize: () => import_electron.ipcRenderer.invoke("win:minimize"),
  maximize: () => import_electron.ipcRenderer.invoke("win:maximize"),
  close: () => import_electron.ipcRenderer.invoke("win:close"),
  getWindowSize: async () => await import_electron.ipcRenderer.invoke("win:getSize"),
  onWindowResize: (callback) => {
    const handler = (_event, size) => callback(size);
    import_electron.ipcRenderer.on(resizeChannel, handler);
    return () => import_electron.ipcRenderer.removeListener(resizeChannel, handler);
  }
});

// electron/preload/api/save.ts
var import_electron2 = require("electron");
var createSaveApi = () => ({
  readSave: () => import_electron2.ipcRenderer.invoke("save:read"),
  saveWrite: (patch) => import_electron2.ipcRenderer.invoke("save:write", patch ?? {})
});

// electron/preload/api/credentials.ts
var import_electron3 = require("electron");
var createCredentialsApi = () => ({
  isAvailable: () => import_electron3.ipcRenderer.invoke("credentials:isAvailable"),
  store: (email, password) => import_electron3.ipcRenderer.invoke("credentials:store", email, password),
  get: (email) => import_electron3.ipcRenderer.invoke("credentials:get", email),
  getEmails: () => import_electron3.ipcRenderer.invoke("credentials:getEmails"),
  has: (email) => import_electron3.ipcRenderer.invoke("credentials:has", email),
  delete: (email) => import_electron3.ipcRenderer.invoke("credentials:delete", email),
  promptHello: (email) => import_electron3.ipcRenderer.invoke("credentials:promptHello", email)
});

// electron/preload/api/uploads.ts
var import_electron4 = require("electron");
var createUploadsApi = () => ({
  begin: () => import_electron4.ipcRenderer.invoke("uploads:begin"),
  end: () => import_electron4.ipcRenderer.invoke("uploads:end")
});

// electron/preload/api/fileSystem.ts
var import_electron5 = require("electron");
var createFileSystemApi = () => ({
  writeFile: (path, data) => import_electron5.ipcRenderer.invoke("fs:writeFile", path, data),
  readFile: (path) => import_electron5.ipcRenderer.invoke("fs:readFile", path),
  exists: (path) => import_electron5.ipcRenderer.invoke("fs:exists", path),
  ensureDir: (path) => import_electron5.ipcRenderer.invoke("fs:ensureDir", path)
});

// electron/preload/api/resources.ts
var import_electron6 = require("electron");
var createResourcesApi = () => ({
  pickJsonFile: () => import_electron6.ipcRenderer.invoke("resources:pickJsonFile"),
  saveLibraryBin: (segments, fileName, content) => import_electron6.ipcRenderer.invoke("resources:saveLibraryBin", segments, fileName, content),
  listLibraryBins: (options) => import_electron6.ipcRenderer.invoke("resources:listLibraryBins", options),
  readImageAsBase64: (sourceDir, imagePath) => import_electron6.ipcRenderer.invoke("resources:readImageAsBase64", sourceDir, imagePath),
  openExternal: (url) => import_electron6.ipcRenderer.invoke("resources:openExternal", url)
});

// electron/preload/api/admin.ts
var import_electron7 = require("electron");
var createAdminApi = () => ({
  listUsers: () => import_electron7.ipcRenderer.invoke("admin:listUsers"),
  updateUserRole: (userId, role) => import_electron7.ipcRenderer.invoke("admin:updateUserRole", userId, role)
});

// electron/preload/api/index.ts
var createPreloadApi = () => {
  const windowApi = createWindowApi();
  const saveApi = createSaveApi();
  return {
    platform: process.platform,
    window: windowApi,
    ...windowApi,
    readSave: saveApi.readSave,
    saveWrite: saveApi.saveWrite,
    save: saveApi,
    credentials: createCredentialsApi(),
    uploads: createUploadsApi(),
    fs: createFileSystemApi(),
    resources: createResourcesApi(),
    admin: createAdminApi()
  };
};

// electron/preload/index.ts
var api = createPreloadApi();
if (process.contextIsolated) {
  try {
    import_electron8.contextBridge.exposeInMainWorld("electron", import_preload.electronAPI);
    import_electron8.contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error(error);
  }
} else {
  window.electron = import_preload.electronAPI;
  window.api = api;
}
//# sourceMappingURL=preload.js.map
