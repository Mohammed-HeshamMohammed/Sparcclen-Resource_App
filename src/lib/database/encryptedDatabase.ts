import { encrypt, decrypt } from '../utils/crypto';
import { hybridStorage } from './hybridStorage';
import type { 
  EncryptedDatabaseSchema, 
  Category, 
  Resource, 
  Tag, 
  ResourceTag, 
  DatabaseMetadata,
  BinFileInfo,
  DatabaseConfig 
} from '../../types/database/encryptedDatabase';

const DEFAULT_CONFIG: DatabaseConfig = {
  encryptionKey: '',
  binDirectory: './data',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  compressionEnabled: true
};

class EncryptedDatabase {
  private config: DatabaseConfig;
  private data: EncryptedDatabaseSchema;
  private binFiles: Map<string, BinFileInfo> = new Map();

  constructor(config: Partial<DatabaseConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.data = this.initializeEmptyDatabase();
  }

  // Local helpers to convert between bytes and base64 strings
  private toBase64(array: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < array.byteLength; i++) binary += String.fromCharCode(array[i]);
    return btoa(binary);
  }

  private fromBase64(base64: string): Uint8Array {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  private initializeEmptyDatabase(): EncryptedDatabaseSchema {
    return {
      categories: [],
      resources: [],
      tags: [],
      resourceTags: [],
      metadata: {
        version: '1.0.0',
        created_at: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        total_items: 0,
        encryption_version: '2.0'
      }
    };
  }

  private generateEncryptionKey(): string {
    return crypto.randomUUID() + '-' + crypto.randomUUID();
  }

  private async getEncryptionKey(): Promise<string> {
    if (!this.config.encryptionKey) {
      this.config.encryptionKey = this.generateEncryptionKey();
      // Store the key securely (in a real app, this would be in secure storage)
      localStorage.setItem('encrypted_db_key', this.config.encryptionKey);
    }
    return this.config.encryptionKey;
  }

  private async compressData(data: any): Promise<Uint8Array> {
    if (!this.config.compressionEnabled) {
      return new TextEncoder().encode(JSON.stringify(data));
    }
    
    const jsonString = JSON.stringify(data);
    const stream = new CompressionStream('gzip');
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();
    
    writer.write(new TextEncoder().encode(jsonString));
    writer.close();
    
    const chunks: Uint8Array[] = [];
    let done = false;
    
    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) {
        chunks.push(value);
      }
    }
    
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    
    return result;
  }

  private async decompressData(compressedData: Uint8Array): Promise<any> {
    if (!this.config.compressionEnabled) {
      return JSON.parse(new TextDecoder().decode(compressedData));
    }
    
    const stream = new DecompressionStream('gzip');
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();
    
    writer.write(compressedData);
    writer.close();
    
    const chunks: Uint8Array[] = [];
    let done = false;
    
    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) {
        chunks.push(value);
      }
    }
    
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    
    return JSON.parse(new TextDecoder().decode(result));
  }

  private calculateChecksum(data: Uint8Array): string {
    // Simple checksum calculation (in production, use a proper hash function)
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data[i];
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  private async saveToBinFile(data: EncryptedDatabaseSchema, filename: string): Promise<BinFileInfo> {
    const compressedData = await this.compressData(data);
    const encryptionKey = await this.getEncryptionKey();
    // encrypt() accepts plaintext string; pass base64-encoded compressed bytes
    const compressedBase64 = this.toBase64(compressedData);
    const encryptedBase64 = await encrypt(compressedBase64, encryptionKey);
    const encryptedData = this.fromBase64(encryptedBase64);

    const checksum = this.calculateChecksum(encryptedData);
    const fileInfo: BinFileInfo = {
      filename,
      size: encryptedData.length,
      checksum,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Use hybrid storage (Electron FS or localStorage fallback)
    const res = await hybridStorage.saveFile(filename, encryptedData, fileInfo);
    if (!res.success) {
      throw new Error(res.error || 'Unknown storage error');
    }

    this.binFiles.set(filename, fileInfo);
    return fileInfo;
  }

  private async loadFromBinFile(filename: string): Promise<EncryptedDatabaseSchema> {
    const res = await hybridStorage.loadFile(filename);

    if (!res.success || !res.data) {
      throw new Error(res.error || `Database file ${filename} not found`);
    }

    const { data: encryptedData, info } = res.data;
    const encryptionKey = await this.getEncryptionKey();

    // Verify checksum when available
    const currentChecksum = this.calculateChecksum(new Uint8Array(encryptedData));
    if (info?.checksum && currentChecksum !== info.checksum) {
      throw new Error('Database file corruption detected');
    }

    // decrypt() expects base64 string of ciphertext
    const encryptedBase64 = this.toBase64(new Uint8Array(encryptedData));
    const decryptedBase64 = await decrypt(encryptedBase64, encryptionKey);
    const decompressedInput = this.fromBase64(decryptedBase64);
    return await this.decompressData(decompressedInput);
  }

  async saveDatabase(): Promise<void> {
    this.data.metadata.last_updated = new Date().toISOString();
    this.data.metadata.total_items = this.data.resources.length;
    
    const filename = `database_${Date.now()}.bin`;
    await this.saveToBinFile(this.data, filename);
  }

  async loadDatabase(): Promise<void> {
    // Try to find the most recent database file via hybrid storage
    const files = await hybridStorage.listFiles('database_');
    if (!files || files.length === 0) {
      return; // No database files found, use empty database
    }

    // Sort to get the most recent by filename (timestamp included)
    const filename = files.sort().pop()!;

    try {
      this.data = await this.loadFromBinFile(filename);
    } catch (error) {
      console.error('Failed to load database:', error);
      this.data = this.initializeEmptyDatabase();
    }
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    return [...this.data.categories];
  }

  async saveCategory(category: Category): Promise<void> {
    const index = this.data.categories.findIndex(c => c.id === category.id);
    if (index >= 0) {
      this.data.categories[index] = category;
    } else {
      this.data.categories.push(category);
    }
    await this.saveDatabase();
  }

  async deleteCategory(id: string): Promise<void> {
    this.data.categories = this.data.categories.filter(c => c.id !== id);
    this.data.resources = this.data.resources.filter(r => r.category_id !== id && r.subcategory_id !== id);
    await this.saveDatabase();
  }

  // Resource methods
  async getResources(): Promise<Resource[]> {
    return [...this.data.resources];
  }

  async getResourcesByCategory(categoryId: string): Promise<Resource[]> {
    return this.data.resources.filter(r => r.category_id === categoryId);
  }

  async getResourcesBySubcategory(subcategoryId: string): Promise<Resource[]> {
    return this.data.resources.filter(r => r.subcategory_id === subcategoryId);
  }

  async saveResource(resource: Resource): Promise<void> {
    const index = this.data.resources.findIndex(r => r.id === resource.id);
    if (index >= 0) {
      this.data.resources[index] = resource;
    } else {
      this.data.resources.push(resource);
    }
    await this.saveDatabase();
  }

  async deleteResource(id: string): Promise<void> {
    this.data.resources = this.data.resources.filter(r => r.id !== id);
    this.data.resourceTags = this.data.resourceTags.filter(rt => rt.resource_id !== id);
    await this.saveDatabase();
  }

  // Tag methods
  async getTags(): Promise<Tag[]> {
    return [...this.data.tags];
  }

  async saveTag(tag: Tag): Promise<void> {
    const index = this.data.tags.findIndex(t => t.id === tag.id);
    if (index >= 0) {
      this.data.tags[index] = tag;
    } else {
      this.data.tags.push(tag);
    }
    await this.saveDatabase();
  }

  async deleteTag(id: string): Promise<void> {
    this.data.tags = this.data.tags.filter(t => t.id !== id);
    this.data.resourceTags = this.data.resourceTags.filter(rt => rt.tag_id !== id);
    await this.saveDatabase();
  }

  // ResourceTag methods
  async getResourceTags(): Promise<ResourceTag[]> {
    return [...this.data.resourceTags];
  }

  async saveResourceTag(resourceTag: ResourceTag): Promise<void> {
    const index = this.data.resourceTags.findIndex(
      rt => rt.resource_id === resourceTag.resource_id && rt.tag_id === resourceTag.tag_id
    );
    if (index >= 0) {
      this.data.resourceTags[index] = resourceTag;
    } else {
      this.data.resourceTags.push(resourceTag);
    }
    await this.saveDatabase();
  }

  async deleteResourceTag(resourceId: string, tagId: string): Promise<void> {
    this.data.resourceTags = this.data.resourceTags.filter(
      rt => !(rt.resource_id === resourceId && rt.tag_id === tagId)
    );
    await this.saveDatabase();
  }

  // Utility methods
  generateId(): string {
    return crypto.randomUUID();
  }

  async clearDatabase(): Promise<void> {
    this.data = this.initializeEmptyDatabase();
    // Clear all bin files using hybrid storage
    await hybridStorage.clearAllData();
    this.binFiles.clear();
  }

  async exportDatabase(): Promise<string> {
    return JSON.stringify(this.data, null, 2);
  }

  async importDatabase(jsonData: string): Promise<void> {
    const importedData = JSON.parse(jsonData) as EncryptedDatabaseSchema;
    this.data = importedData;
    await this.saveDatabase();
  }

  getMetadata(): DatabaseMetadata {
    return { ...this.data.metadata };
  }
}

// Export singleton instance
export const encryptedDatabase = new EncryptedDatabase();
