import { supabase } from './supabase';

/**
 * Cleanup service for removing unconfirmed users after 48 hours
 * 
 * Note: This requires Supabase Admin API access. For production use:
 * 1. Set up a Supabase Edge Function or backend service with admin privileges
 * 2. Call it from this service
 * 3. Or use Supabase Database Webhooks/Triggers
 * 
 * For now, this uses the client SDK which has limited access.
 */

const CLEANUP_INTERVAL = 1000 * 60 * 60; // Run every 1 hour
const UNCONFIRMED_USER_TIMEOUT = 1000 * 60 * 60 * 48; // 48 hours

interface CleanupStats {
  lastRun: Date | null;
  totalCleaned: number;
  lastCleanedCount: number;
  errors: string[];
}

class AuthCleanupService {
  private intervalId: NodeJS.Timeout | null = null;
  private stats: CleanupStats = {
    lastRun: null,
    totalCleaned: 0,
    lastCleanedCount: 0,
    errors: []
  };

  /**
   * Start the cleanup service
   * Runs immediately on start, then every hour
   */
  start() {
    if (this.intervalId) {
      console.log('[AuthCleanup] Service already running');
      return;
    }

    console.log('[AuthCleanup] Starting cleanup service...');
    
    // Run immediately on start
    this.runCleanup();

    // Then run every hour
    this.intervalId = setInterval(() => {
      this.runCleanup();
    }, CLEANUP_INTERVAL);
  }

  /**
   * Stop the cleanup service
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[AuthCleanup] Service stopped');
    }
  }

  /**
   * Get cleanup statistics
   */
  getStats(): CleanupStats {
    return { ...this.stats };
  }

  /**
   * Main cleanup logic
   * 
   * IMPORTANT: This implementation uses a workaround since Supabase client SDK
   * doesn't provide admin access to list all users. 
   * 
   * For production, you should:
   * 1. Create a Supabase Edge Function with admin access
   * 2. Use the Admin API to list and delete unconfirmed users
   * 3. Call that function from here
   */
  private async runCleanup() {
    console.log('[AuthCleanup] Running cleanup check...');
    
    try {
      // Since we can't access admin API from client, we'll use a different approach:
      // Create a database table to track signup timestamps and use that for cleanup
      
      // For now, log a warning that this needs backend implementation
      console.warn('[AuthCleanup] Client-side cleanup is limited. Consider implementing server-side cleanup.');
      console.warn('[AuthCleanup] Recommended: Use Supabase Edge Functions or Database Triggers for production.');
      
      // Attempt to clean up using available client methods
      const cleanedCount = await this.cleanupUnconfirmedUsers();
      
      this.stats.lastRun = new Date();
      this.stats.lastCleanedCount = cleanedCount;
      this.stats.totalCleaned += cleanedCount;
      
      if (cleanedCount > 0) {
        console.log(`[AuthCleanup] Cleaned up ${cleanedCount} unconfirmed user(s)`);
      } else {
        console.log('[AuthCleanup] No unconfirmed users to clean up');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('[AuthCleanup] Error during cleanup:', errorMsg);
      this.stats.errors.push(`${new Date().toISOString()}: ${errorMsg}`);
      
      // Keep only last 10 errors
      if (this.stats.errors.length > 10) {
        this.stats.errors = this.stats.errors.slice(-10);
      }
    }
  }

  /**
   * Clean up unconfirmed users by calling the Supabase Edge Function
   */
  private async cleanupUnconfirmedUsers(): Promise<number> {
    try {
      // Call the Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('cleanup-unconfirmed-users', {
        body: {}
      });

      if (error) {
        console.error('[AuthCleanup] Edge function error:', error);
        return 0;
      }

      if (data && data.success) {
        console.log('[AuthCleanup] Cleanup results:', {
          totalChecked: data.totalChecked,
          totalUnconfirmed: data.totalUnconfirmed,
          totalDeleted: data.totalDeleted,
          cutoffTime: data.cutoffTime
        });

        if (data.errors && data.errors.length > 0) {
          console.warn('[AuthCleanup] Some deletions failed:', data.errors);
        }

        return data.totalDeleted || 0;
      }

      return 0;
    } catch (error) {
      console.error('[AuthCleanup] Failed to call cleanup function:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const authCleanupService = new AuthCleanupService();

/**
 * Initialize the auth cleanup service
 * Call this when your app starts
 */
export function initAuthCleanup() {
  authCleanupService.start();
  
  // Return cleanup function for app shutdown
  return () => {
    authCleanupService.stop();
  };
}
