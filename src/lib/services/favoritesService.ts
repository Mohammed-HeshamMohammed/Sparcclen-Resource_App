import { supabase } from './supabase';
import { encrypt, decrypt } from '@/lib/utils/crypto';


interface LocalFavoritesData {
  favorites: Record<string, string[]>; // user_id -> favorites array
  lastSync: string;
}

class FavoritesService {
  private localFilePath = 'favorites.enc';

  // Supabase operations
  async syncFavoritesToSupabase(userId: string, email: string, favorites: string[]): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_favorites')
        .upsert({
          user_id: userId,
          email: email,
          favorites: favorites,
          updated_at: new Date().toISOString()
        } as any);

      if (error) {
        // If the table doesn't exist in the project, fall back to local-only save
        const code = (error as any)?.code;
        if (code === 'PGRST205') {
          console.warn('[favorites] user_favorites table missing; saving locally only');
          await this.saveFavoritesLocally(userId, favorites);
          return true;
        }
        console.error('Error syncing favorites to Supabase:', error);
        return false;
      }

      // Also save locally
      await this.saveFavoritesLocally(userId, favorites);
      return true;
    } catch (error) {
      console.error('Error in syncFavoritesToSupabase:', error);
      return false;
    }
  }

  async getFavoritesFromSupabase(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .select('favorites')
        .eq('user_id', userId)
        .maybeSingle();

      if (error || !data) {
        const code = (error as any)?.code;
        if (code === 'PGRST205') {
          // Table missing in the project; operate offline-only
          console.warn('[favorites] user_favorites table not found; using local favorites');
          return [];
        }
        if (error) console.error('Error fetching favorites from Supabase:', error);
        return [];
      }

      return (data as any).favorites || [];
    } catch (error) {
      console.error('Error in getFavoritesFromSupabase:', error);
      return [];
    }
  }

  // Local encrypted storage operations
  async saveFavoritesLocally(userId: string, favorites: string[]): Promise<void> {
    try {
      // Read existing local data
      const existingData = await this.readLocalFavorites();
      
      // Update with new favorites
      existingData.favorites[userId] = favorites;
      existingData.lastSync = new Date().toISOString();

      // Encrypt and save (using a simple key for now)
      const encryptedData = await encrypt(JSON.stringify(existingData), 'favorites-key-2024');
      
      if (typeof window !== 'undefined' && (window as any).api?.fs) {
        const api = (window as any).api;
        const favoritesDir = `favorites`;
        await api.fs.ensureDir(favoritesDir);
        await api.fs.writeFile(`${favoritesDir}/${this.localFilePath}`, encryptedData);
      } else {
        localStorage.setItem('sparcclen_favorites', encryptedData);
      }
    } catch (error) {
      console.error('Error saving favorites locally:', error);
    }
  }

  async readLocalFavorites(): Promise<LocalFavoritesData> {
    try {
      let encryptedData: string | null = null;

      if (typeof window !== 'undefined' && (window as any).api?.fs) {
        const api = (window as any).api;
        const favoritesPath = `favorites/${this.localFilePath}`;
        if (await api.fs.exists(favoritesPath)) {
          encryptedData = await api.fs.readFile(favoritesPath);
        }
      } else {
        encryptedData = localStorage.getItem('sparcclen_favorites');
      }

      if (!encryptedData) {
        return { favorites: {}, lastSync: '' };
      }

      // Decrypt and parse
      const decryptedData = await decrypt(encryptedData, 'favorites-key-2024');
      return JSON.parse(decryptedData);
    } catch (error) {
      console.error('Error reading local favorites:', error);
      return { favorites: {}, lastSync: '' };
    }
  }

  async getFavoritesLocally(userId: string): Promise<string[]> {
    try {
      const localData = await this.readLocalFavorites();
      return localData.favorites[userId] || [];
    } catch (error) {
      console.error('Error getting local favorites:', error);
      return [];
    }
  }

  // Main public methods
  async getFavorites(userId: string, _email: string, prioritizeOffline: boolean = false): Promise<string[]> {
    if (prioritizeOffline) {
      // Try local first, then online
      const localFavorites = await this.getFavoritesLocally(userId);
      if (localFavorites.length > 0) {
        return localFavorites;
      }
      return await this.getFavoritesFromSupabase(userId);
    } else {
      // Try online first, then local
      try {
        const onlineFavorites = await this.getFavoritesFromSupabase(userId);
        if (onlineFavorites.length > 0) {
          // Save locally for offline access
          await this.saveFavoritesLocally(userId, onlineFavorites);
          return onlineFavorites;
        }
      } catch (error) {
        console.error('Online favorites fetch failed, trying local:', error);
      }
      
      return await this.getFavoritesLocally(userId);
    }
  }

  async addFavorite(userId: string, email: string, resourceId: string): Promise<boolean> {
    try {
      const currentFavorites = await this.getFavorites(userId, email);
      if (currentFavorites.includes(resourceId)) {
        return true; // Already favorited
      }

      const newFavorites = [...currentFavorites, resourceId];
      return await this.syncFavoritesToSupabase(userId, email, newFavorites);
    } catch (error) {
      console.error('Error adding favorite:', error);
      return false;
    }
  }

  async removeFavorite(userId: string, email: string, resourceId: string): Promise<boolean> {
    try {
      const currentFavorites = await this.getFavorites(userId, email);
      const newFavorites = currentFavorites.filter(id => id !== resourceId);
      return await this.syncFavoritesToSupabase(userId, email, newFavorites);
    } catch (error) {
      console.error('Error removing favorite:', error);
      return false;
    }
  }

  async isFavorite(userId: string, email: string, resourceId: string): Promise<boolean> {
    try {
      const favorites = await this.getFavorites(userId, email, true); // Prioritize offline for quick check
      return favorites.includes(resourceId);
    } catch (error) {
      console.error('Error checking if favorite:', error);
      return false;
    }
  }

  // Sync method for when user comes online
  async syncWithOnline(userId: string, _email: string): Promise<void> {
    try {
      const localFavorites = await this.getFavoritesLocally(userId);
      const onlineFavorites = await this.getFavoritesFromSupabase(userId);

      // Simple merge strategy: combine both and remove duplicates
      const mergedFavorites = [...new Set([...localFavorites, ...onlineFavorites])];
      
      if (mergedFavorites.length > Math.max(localFavorites.length, onlineFavorites.length)) {
        // There were differences, sync the merged version
        await this.syncFavoritesToSupabase(userId, _email, mergedFavorites);
      }
    } catch (error) {
      console.error('Error syncing favorites:', error);
    }
  }
}

export const favoritesService = new FavoritesService();
