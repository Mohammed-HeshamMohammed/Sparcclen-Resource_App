// Standalone production Electron main entry point
// This version doesn't rely on external modules that may not be packaged correctly

const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Environment variables - these should be set at build time or runtime
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://ldklvotqnvpluhmshfjm.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxka2x2b3RxbnZwbHVobXNoZmptIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTYwNjk5MywiZXhwIjoyMDc1MTgyOTkzfQ.0MKQtZH2OEF_VPCp6YvZHTVv2cmUpmpJ8WV7Zbg0HyM';

// Minimal Supabase client for admin operations
let supabaseAdmin = null;
const createSupabaseAdminClient = () => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('[admin] Missing Supabase credentials');
    return null;
  }
  
  try {
    // Simple implementation without full @supabase/supabase-js dependency
    const { net } = require('electron');
    
    return {
      auth: {
        admin: {
          async listUsers({ page = 1, perPage = 200 } = {}) {
            const url = `${SUPABASE_URL}/auth/v1/admin/users?page=${page}&per_page=${perPage}`;
            console.log(`[listUsers] Fetching from: ${url}`);
            console.log(`[listUsers] Using service key: ${SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...`);
            
            const response = await net.fetch(url, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Content-Type': 'application/json'
              }
            });
            
            if (!response.ok) {
              const errorText = await response.text();
              console.error(`[listUsers] HTTP ${response.status}: ${errorText}`);
              return { data: null, error: { message: `HTTP ${response.status}: ${errorText}` } };
            }
            
            const data = await response.json();
            console.log(`[listUsers] Success: ${JSON.stringify(data).substring(0, 200)}...`);
            return { data, error: null };
          },
          
          async updateUserById(userId, updates) {
            const response = await net.fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(updates)
            });
            
            if (!response.ok) {
              const error = await response.text();
              return { data: null, error: { message: error } };
            }
            
            const data = await response.json();
            return { data, error: null };
          }
        }
      }
    };
  } catch (error) {
    console.warn('[admin] Failed to create Supabase client:', error);
    return null;
  }
};

supabaseAdmin = createSupabaseAdminClient();

// Determine if we're in development
const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');

// Set app user model id for Windows
app.setAppUserModelId('com.sparcclen.app');

// Handle single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // Someone tried to run a second instance, focus our window instead
    const allWindows = BrowserWindow.getAllWindows();
    if (allWindows.length > 0) {
      const mainWindow = allWindows[0];
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

let mainWindow = null;

// Basic IPC handlers for window controls
function setupBasicIPC() {
  ipcMain.handle('win:minimize', () => {
    if (mainWindow) mainWindow.minimize();
  });

  ipcMain.handle('win:maximize', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });

  ipcMain.handle('win:close', () => {
    if (mainWindow) {
      mainWindow.close();
      // On Windows, force quit after closing
      if (process.platform === 'win32') {
        setTimeout(() => {
          app.quit();
          process.exit(0);
        }, 50);
      }
    }
  });

  ipcMain.handle('win:getSize', () => {
    if (mainWindow) {
      const [width, height] = mainWindow.getSize();
      return { width, height };
    }
    return { width: 1200, height: 800 };
  });

  ipcMain.handle('win:setBackgroundColor', (_event, color) => {
    try {
      if (mainWindow && typeof color === 'string') {
        mainWindow.setBackgroundColor(color);
        return true;
      }
      return false;
    } catch (e) {
      console.warn('Failed to set background color', e);
      return false;
    }
  });

  // Save file operations - use proper Documents folder
  const getDocumentsPath = () => {
    const userProfile = process.env.USERPROFILE || os.homedir();
    return path.join(userProfile, 'Documents');
  };
  const saveFilePath = path.join(getDocumentsPath(), 'Sparcclen', 'save.json');

  ipcMain.handle('save:read', async () => {
    try {
      // Ensure directory exists
      const saveDir = path.dirname(saveFilePath);
      if (!fs.existsSync(saveDir)) {
        fs.mkdirSync(saveDir, { recursive: true });
      }

      if (fs.existsSync(saveFilePath)) {
        const data = fs.readFileSync(saveFilePath, 'utf8');
        return JSON.parse(data);
      }

      // Default save data
      const defaultSave = {
        firstRun: true,
        theme: 'system',
        loggedInBefore: false,
        lastEmail: null,
        displayName: null,
        offlineSession: false,
        updatedAt: new Date().toISOString(),
      };

      fs.writeFileSync(saveFilePath, JSON.stringify(defaultSave, null, 2));
      return defaultSave;
    } catch (error) {
      console.error('Error reading save file:', error);
      return {
        firstRun: true,
        theme: 'system',
        loggedInBefore: false,
        lastEmail: null,
        displayName: null,
        offlineSession: false,
        updatedAt: new Date().toISOString(),
      };
    }
  });

  ipcMain.handle('save:write', async (event, patch) => {
    try {
      const current = await ipcMain.invoke('save:read');
      const updated = { ...current, ...patch, updatedAt: new Date().toISOString() };
      
      const saveDir = path.dirname(saveFilePath);
      if (!fs.existsSync(saveDir)) {
        fs.mkdirSync(saveDir, { recursive: true });
      }

      fs.writeFileSync(saveFilePath, JSON.stringify(updated, null, 2));
      
      // Notify renderer of save update
      if (mainWindow) {
        mainWindow.webContents.send('save:updated', updated);
      }

      return updated;
    } catch (error) {
      console.error('Error writing save file:', error);
      return patch;
    }
  });

  // External URL handler
  ipcMain.handle('resources:openExternal', async (event, url) => {
    try {
      await shell.openExternal(url);
      return { success: true };
    } catch (error) {
      console.error('Error opening external URL:', error);
      return { success: false, error: error.message };
    }
  });

  // File system handlers - Use proper Windows Documents folder
  const getDocumentsDataPath = (relativePath) => {
    const userProfile = process.env.USERPROFILE || os.homedir();
    return path.join(userProfile, 'Documents', 'Sparcclen', relativePath);
  };

  ipcMain.handle('fs:writeFile', async (event, filePath, data) => {
    try {
      // Convert relative paths to full Documents/Sparcclen paths
      const fullPath = path.isAbsolute(filePath) ? filePath : getDocumentsDataPath(filePath);
      const saveDir = path.dirname(fullPath);
      if (!fs.existsSync(saveDir)) {
        fs.mkdirSync(saveDir, { recursive: true });
      }
      fs.writeFileSync(fullPath, data, 'utf8');
      return true;
    } catch (error) {
      console.error('fs:writeFile error:', error);
      return false;
    }
  });

  ipcMain.handle('fs:readFile', async (event, filePath) => {
    try {
      const fullPath = path.isAbsolute(filePath) ? filePath : getDocumentsDataPath(filePath);
      return fs.readFileSync(fullPath, 'utf8');
    } catch (error) {
      console.error('fs:readFile error:', error);
      return null;
    }
  });

  ipcMain.handle('fs:exists', async (event, filePath) => {
    try {
      const fullPath = path.isAbsolute(filePath) ? filePath : getDocumentsDataPath(filePath);
      return fs.existsSync(fullPath);
    } catch {
      return false;
    }
  });

  ipcMain.handle('fs:ensureDir', async (event, dirPath) => {
    try {
      const fullPath = path.isAbsolute(dirPath) ? dirPath : getDocumentsDataPath(dirPath);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
      return true;
    } catch (error) {
      console.error('fs:ensureDir error:', error);
      return false;
    }
  });

  // Resource handlers  
  ipcMain.handle('resources:pickJsonFile', async () => {
    try {
      const { dialog } = require('electron');
      const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Select JSON file to import',
        filters: [{ name: 'JSON Files', extensions: ['json'] }],
        properties: ['openFile']
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { canceled: true };
      }

      const filePath = result.filePaths[0];
      const fileName = path.basename(filePath);
      const data = fs.readFileSync(filePath, 'utf8');

      return { canceled: false, filePath, fileName, data };
    } catch (error) {
      console.error('resources:pickJsonFile error:', error);
      return { canceled: true, error: error.message };
    }
  });

  ipcMain.handle('resources:saveLibraryBin', async (event, segments, fileName, content) => {
    try {
      // Use proper LocalAppData path like in development
      const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
      const baseDir = path.join(localAppData, 'Sparcclen', 'library');
      const targetDir = path.join(baseDir, ...segments.filter(s => s && s.length > 0));
      
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      const fullPath = path.join(targetDir, fileName);
      fs.writeFileSync(fullPath, content, 'utf8');
      
      return { ok: true, path: fullPath };
    } catch (error) {
      console.error('resources:saveLibraryBin error:', error);
      return { ok: false, error: error.message };
    }
  });

  ipcMain.handle('resources:listLibraryBins', async (event, options) => {
    try {
      // Use proper LocalAppData path like in development
      const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
      const baseDir = path.join(localAppData, 'Sparcclen', 'library');
      
      if (!fs.existsSync(baseDir)) {
        return { ok: true, files: [] };
      }
      
      const results = [];
      
      // Recursively scan all subdirectories for .bin files
      function scanDirectory(dirPath, categoryPath = []) {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          
          if (entry.isDirectory()) {
            // Recursively scan subdirectories
            scanDirectory(fullPath, [...categoryPath, entry.name]);
          } else if (entry.isFile() && entry.name.endsWith('.bin')) {
            try {
              const content = fs.readFileSync(fullPath, 'utf8');
              const items = JSON.parse(content);
              
              // Determine category and subcategory from path
              const categorySegment = categoryPath.length > 0 ? categoryPath[0] : null;
              const subcategorySegment = categoryPath.length > 1 ? categoryPath[1] : null;
              
              results.push({
                categorySegment,
                subcategorySegment,
                fileName: entry.name,
                items: Array.isArray(items) ? items : [items]
              });
            } catch (error) {
              console.error('Error reading library file:', fullPath, error);
            }
          }
        }
      }
      
      scanDirectory(baseDir);
      
      return { ok: true, files: results };
    } catch (error) {
      console.error('resources:listLibraryBins error:', error);
      return { ok: false, files: [], error: error.message };
    }
  });

  ipcMain.handle('resources:readImageAsBase64', async (event, sourceDir, imagePath) => {
    try {
      const fullPath = path.join(sourceDir, imagePath);
      const buffer = fs.readFileSync(fullPath);
      const base64Data = buffer.toString('base64');
      
      const ext = path.extname(imagePath).toLowerCase();
      let mimeType = 'image/jpeg';
      
      switch (ext) {
        case '.png': mimeType = 'image/png'; break;
        case '.gif': mimeType = 'image/gif'; break;
        case '.webp': mimeType = 'image/webp'; break;
        case '.svg': mimeType = 'image/svg+xml'; break;
        case '.bmp': mimeType = 'image/bmp'; break;
      }
      
      return { ok: true, base64Data, mimeType };
    } catch (error) {
      console.error('resources:readImageAsBase64 error:', error);
      return { ok: false, error: error.message };
    }
  });

  // Admin API handlers
  ipcMain.handle('admin:listUsers', async () => {
    console.log('[admin:listUsers] Handler called!');
    console.log('[admin:listUsers] Environment check:', {
      hasUrl: !!SUPABASE_URL,
      hasKey: !!SUPABASE_SERVICE_ROLE_KEY,
      hasClient: !!supabaseAdmin
    });
    
    if (!supabaseAdmin) {
      console.warn('[admin:listUsers] Admin client not configured');
      return { ok: false, error: 'Admin API not configured - client is null' };
    }
    
    try {
      console.log('[admin:listUsers] Fetching users...');
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
      
      if (error) {
        console.error('[admin:listUsers] Error:', error);
        return { ok: false, error: error.message };
      }
      
      const users = (data?.users || []).map(user => ({
        id: user.id,
        email: user.email ?? null,
        user_metadata: user.user_metadata || {},
        app_metadata: user.app_metadata || {},
      }));
      
      console.log(`[admin:listUsers] Retrieved ${users.length} users`);
      return { ok: true, users };
    } catch (error) {
      console.error('[admin:listUsers] Exception:', error);
      return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  ipcMain.handle('admin:updateUserRole', async (_event, userId, role) => {
    console.log(`[admin:updateUserRole] Called for user ${userId} with role ${role}`);
    if (!supabaseAdmin) {
      console.warn('[admin:updateUserRole] Admin client not configured');
      return { ok: false, error: 'Admin API not configured' };
    }
    
    try {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: { role },
        app_metadata: { role }
      });
      
      if (error) {
        console.error('[admin:updateUserRole] Error:', error);
        return { ok: false, error: error.message };
      }
      
      console.log(`[admin:updateUserRole] Successfully updated user ${userId} to role ${role}`);
      return { ok: true };
    } catch (error) {
      console.error('[admin:updateUserRole] Exception:', error);
      return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
  });
}

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 950,
    height: 850,
    minWidth: 850,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    frame: false,
    resizable: true,
    hasShadow: true,
    backgroundColor: '#030712', // Gray-950 for dark theme - enables Windows 11 rounded corners
    icon: path.join(__dirname, '..', '..', 'src', 'public', 'Logo.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'prod-preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true
    }
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle window resize events
  mainWindow.on('resize', () => {
    if (mainWindow) {
      const [width, height] = mainWindow.getSize();
      mainWindow.webContents.send('win:resize', { width, height });
    }
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://127.0.0.1:5175');
    // Open DevTools in development
    if (process.env.ELECTRON_OPEN_DEVTOOLS === 'true') {
      mainWindow.webContents.openDevTools();
    }
  } else {
    const rendererPath = path.join(__dirname, '..', '..', 'Releases', 'index.html');
    console.log('Loading renderer from:', rendererPath);
    mainWindow.loadFile(rendererPath);
  }

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    // Force app quit when main window closes on Windows
    if (process.platform === 'win32') {
      app.quit();
    }
  });
}

// Setup IPC handlers before creating window
setupBasicIPC();

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Force quit to ensure no background processes remain
    app.quit();
    // Additional cleanup for Windows
    setTimeout(() => {
      process.exit(0);
    }, 100);
  }
});

// Security: Prevent navigation to external URLs
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    // Allow navigation to localhost in development
    if (isDev && parsedUrl.hostname === '127.0.0.1') {
      return;
    }
    
    // Block all other navigation
    event.preventDefault();
  });
});

console.log('Sparcclen Electron app starting...', {
  isDev,
  nodeEnv: process.env.NODE_ENV,
  hasSupabaseUrl: !!SUPABASE_URL,
  hasServiceKey: !!SUPABASE_SERVICE_ROLE_KEY,
  supabaseConfigured: !!supabaseAdmin
});
