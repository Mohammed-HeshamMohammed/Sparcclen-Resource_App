import { dataMigration } from './dataMigration';
import { encryptedDatabase } from './encryptedDatabase';

export async function runDataMigration(libraryPath: string): Promise<void> {
  try {
    console.log('Starting data migration process...');
    
    // Initialize the encrypted database
    await encryptedDatabase.loadDatabase();
    
    // Run the migration
    await dataMigration.migrateFromJsonFiles(libraryPath);
    
    console.log('Data migration completed successfully!');
    console.log('Database metadata:', encryptedDatabase.getMetadata());
    
  } catch (error) {
    console.error('Data migration failed:', error);
    throw error;
  }
}

// Function to run migration from the browser console or a button click
export async function migrateLibraryData(): Promise<void> {
  const libraryPath = 'd:\\Work\\Startup\\library';
  await runDataMigration(libraryPath);
}

// Make it available globally for easy access
if (typeof window !== 'undefined') {
  (window as any).migrateLibraryData = migrateLibraryData;
}
