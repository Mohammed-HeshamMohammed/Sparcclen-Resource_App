import { encryptedDatabase } from './encryptedDatabase';
import { runDataMigration } from './migrationRunner';

export async function initializeDatabase(): Promise<void> {
  try {
    console.log('Initializing encrypted database...');
    
    // Load existing database or create new one
    await encryptedDatabase.loadDatabase();
    
    // Check if database is empty
    const metadata = encryptedDatabase.getMetadata();
    if (metadata.total_items === 0) {
      console.log('Database is empty. Running data migration...');
      await runDataMigration('d:\\Work\\Startup\\library');
    } else {
      console.log(`Database loaded with ${metadata.total_items} items`);
    }
    
    console.log('Database initialization completed');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

// Auto-initialize when the module is imported
if (typeof window !== 'undefined') {
  // Only run in browser environment
  initializeDatabase().catch(console.error);
}
