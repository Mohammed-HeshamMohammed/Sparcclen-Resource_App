/**
 * Hybrid storage utility that uses file system in Electron environments
 * and localStorage as fallback for browser development
 */
import type { BinFileInfo } from '../types/encryptedDatabase';

export interface StorageResult {
  success: boolean;
  data?: any;
  error?: string;
}

export class HybridStorage {
  private isElectron: boolean;
  private dataDir: string;

  constructor() {
    this.isElectron = this.detectElectron();
    this.dataDir = this.getDataDirectory();
  }

  private detectElectron(): boolean {
    // Check if we're running in Electron
    return !!(typeof window !== 'undefined' &&
           window.process &&
           (window.process as any).type === 'renderer' &&
           window.require);
  }

  private getDataDirectory(): string {
    if (this.isElectron) {
      // In Electron, use the user data directory
      try {
        const { app } = window.require('electron');
        return app.getPath('userData');
      } catch (error) {
        console.warn('Failed to get Electron userData path, using fallback:', error);
        return './data';
      }
    }
    return './data'; // Browser fallback
  }

  private async ensureDataDirectory(): Promise<void> {
    if (!this.isElectron) return; // No need for browser

    try {
      const fs = window.require('fs');

      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
    } catch (error) {
      console.error('Failed to create data directory:', error);
    }
  }

  private getFilePath(filename: string): string {
    if (this.isElectron) {
      const path = window.require('path');
      return path.join(this.dataDir, filename);
    }
    return filename; // For localStorage keys
  }

  async saveFile(filename: string, data: Uint8Array, fileInfo: BinFileInfo): Promise<StorageResult> {
    try {
      await this.ensureDataDirectory();

      if (this.isElectron) {
        return await this.saveToFileSystem(filename, data, fileInfo);
      } else {
        return await this.saveToLocalStorage(filename, data, fileInfo);
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to save file: ${error}`
      };
    }
  }

  async loadFile(filename: string): Promise<StorageResult> {
    try {
      if (this.isElectron) {
        return await this.loadFromFileSystem(filename);
      } else {
        return await this.loadFromLocalStorage(filename);
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to load file: ${error}`
      };
    }
  }

  async deleteFile(filename: string): Promise<StorageResult> {
    try {
      if (this.isElectron) {
        return await this.deleteFromFileSystem(filename);
      } else {
        return await this.deleteFromLocalStorage(filename);
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to delete file: ${error}`
      };
    }
  }

  async listFiles(prefix: string = ''): Promise<string[]> {
    try {
      if (this.isElectron) {
        return await this.listFilesFromFileSystem(prefix);
      } else {
        return await this.listFilesFromLocalStorage(prefix);
      }
    } catch (error) {
      console.error('Failed to list files:', error);
      return [];
    }
  }

  private async saveToFileSystem(filename: string, data: Uint8Array, fileInfo: BinFileInfo): Promise<StorageResult> {
    const fs = window.require('fs');

    const filePath = this.getFilePath(filename);

    try {
      // Save the encrypted data
      fs.writeFileSync(filePath, data);

      // Save metadata separately for easier retrieval
      const metadataPath = filePath + '.meta';
      fs.writeFileSync(metadataPath, JSON.stringify(fileInfo));

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `File system write failed: ${error}`
      };
    }
  }

  private async loadFromFileSystem(filename: string): Promise<StorageResult> {
    const fs = window.require('fs');

    const filePath = this.getFilePath(filename);

    try {
      if (!fs.existsSync(filePath)) {
        return {
          success: false,
          error: 'File not found'
        };
      }

      const data = fs.readFileSync(filePath);
      const metadataPath = filePath + '.meta';

      let fileInfo: BinFileInfo | null = null;
      if (fs.existsSync(metadataPath)) {
        const metadata = fs.readFileSync(metadataPath, 'utf8');
        fileInfo = JSON.parse(metadata);
      }

      return {
        success: true,
        data: {
          data: Array.from(data),
          info: fileInfo
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `File system read failed: ${error}`
      };
    }
  }

  private async deleteFromFileSystem(filename: string): Promise<StorageResult> {
    const fs = window.require('fs');

    const filePath = this.getFilePath(filename);
    const metadataPath = filePath + '.meta';

    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      if (fs.existsSync(metadataPath)) {
        fs.unlinkSync(metadataPath);
      }
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `File system delete failed: ${error}`
      };
    }
  }

  private async listFilesFromFileSystem(prefix: string): Promise<string[]> {
    const fs = window.require('fs');

    try {
      const files = fs.readdirSync(this.dataDir);
      return files
        .filter((file: string) => file.startsWith(prefix) && file.endsWith('.bin'))
        .map((file: string) => file);
    } catch (error) {
      console.error('Failed to list files from file system:', error);
      return [];
    }
  }

  private async saveToLocalStorage(filename: string, data: Uint8Array, fileInfo: BinFileInfo): Promise<StorageResult> {
    try {
      const storageKey = `encrypted_db_${filename}`;
      const storageData = {
        data: Array.from(data),
        info: fileInfo
      };

      localStorage.setItem(storageKey, JSON.stringify(storageData));
      return { success: true };
    } catch (error: unknown) {
      // Check if it's a quota exceeded error (safely narrow unknown)
      if (this.isQuotaExceededError(error)) {
        return {
          success: false,
          error: 'Storage quota exceeded. Try clearing browser data or use a smaller dataset.'
        };
      }
      return {
        success: false,
        error: `localStorage save failed: ${error}`
      };
    }
  }

  private isQuotaExceededError(error: unknown): boolean {
    if (typeof error !== 'object' || error === null) return false;
    const err = error as { name?: string; code?: number };
    // Common identifiers across browsers
    // - name: 'QuotaExceededError' (Chromium/Safari), 'NS_ERROR_DOM_QUOTA_REACHED' (Firefox)
    // - code: 22 (WebKit), 1014 (Firefox)
    return (
      err.name === 'QuotaExceededError' ||
      err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      err.code === 22 ||
      err.code === 1014
    );
  }

  private async loadFromLocalStorage(filename: string): Promise<StorageResult> {
    try {
      const storageKey = `encrypted_db_${filename}`;
      const stored = localStorage.getItem(storageKey);

      if (!stored) {
        return {
          success: false,
          error: 'File not found'
        };
      }

      return {
        success: true,
        data: JSON.parse(stored)
      };
    } catch (error) {
      return {
        success: false,
        error: `localStorage load failed: ${error}`
      };
    }
  }

  private async deleteFromLocalStorage(filename: string): Promise<StorageResult> {
    try {
      const storageKey = `encrypted_db_${filename}`;
      localStorage.removeItem(storageKey);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `localStorage delete failed: ${error}`
      };
    }
  }

  private async listFilesFromLocalStorage(prefix: string): Promise<string[]> {
    try {
      const storagePrefix = `encrypted_db_${prefix}`;
      const keys = Object.keys(localStorage);

      return keys
        .filter(key => key.startsWith(storagePrefix))
        .map(key => key.replace('encrypted_db_', ''));
    } catch (error) {
      console.error('Failed to list files from localStorage:', error);
      return [];
    }
  }

  // Utility method to clear all data
  async clearAllData(): Promise<StorageResult> {
    try {
      if (this.isElectron) {
        return await this.clearAllFromFileSystem();
      } else {
        return await this.clearAllFromLocalStorage();
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to clear all data: ${error}`
      };
    }
  }

  private async clearAllFromFileSystem(): Promise<StorageResult> {
    const fs = window.require('fs');
    const path = window.require('path');

    try {
      const files = fs.readdirSync(this.dataDir);
      for (const file of files) {
        if (file.startsWith('encrypted_db_') || file.endsWith('.bin') || file.endsWith('.bin.meta')) {
          const filePath = path.join(this.dataDir, file);
          if (fs.statSync(filePath).isFile()) {
            fs.unlinkSync(filePath);
          }
        }
      }
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `File system clear failed: ${error}`
      };
    }
  }

  private async clearAllFromLocalStorage(): Promise<StorageResult> {
    try {
      const keys = Object.keys(localStorage);
      const keysToRemove = keys.filter(key => key.startsWith('encrypted_db_'));

      keysToRemove.forEach(key => localStorage.removeItem(key));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `localStorage clear failed: ${error}`
      };
    }
  }

  // Get storage info for debugging
  getStorageInfo(): { type: string; isElectron: boolean; dataDir?: string } {
    return {
      type: this.isElectron ? 'file-system' : 'localStorage',
      isElectron: this.isElectron,
      dataDir: this.isElectron ? this.dataDir : undefined
    };
  }
}

// Export singleton instance
export const hybridStorage = new HybridStorage();
