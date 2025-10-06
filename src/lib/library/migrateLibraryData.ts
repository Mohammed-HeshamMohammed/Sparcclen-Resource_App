import { processJsonData, createSampleLibraryStructure } from './browserLibraryImporter';
import { encryptedDatabase } from './encryptedDatabase';

// Function to migrate all library data to the encrypted database
export async function migrateAllLibraryData(): Promise<void> {
  console.log('🚀 Starting library data migration...');
  
  try {
    // Create sample library structure
    const categories = createSampleLibraryStructure();
    
    console.log(`📊 Found ${categories.length} categories`);
    
    // Initialize encrypted database
    const db = encryptedDatabase;
    
    // Migrate categories
    console.log('📁 Migrating categories...');
    for (const category of categories) {
      await db.saveCategory({
        id: category.id,
        slug: category.name.toLowerCase().replace(/\s+/g, '-'),
        title: category.name,
        description: category.description,
        parent_id: null,
        sort_order: 0,
        item_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      // Note: Subcategories are not directly supported in the current database schema
      // They would need to be implemented as separate categories or tags
    }
    
    // Save the database
    await db.saveDatabase();
    
    console.log('✅ Library data migration completed successfully!');
    console.log(`   - ${categories.length} categories migrated`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Function to migrate specific category
export async function migrateCategoryData(categoryName: string, items: any[]): Promise<void> {
  console.log(`📁 Migrating category: ${categoryName}`);
  
  try {
    const db = encryptedDatabase;
    
    // Create category if it doesn't exist
    const categoryId = `category-${categoryName.toLowerCase().replace(/\s+/g, '-')}`;
    await db.saveCategory({
      id: categoryId,
      slug: categoryName.toLowerCase().replace(/\s+/g, '-'),
      title: categoryName,
      description: `Resources for ${categoryName}`,
      parent_id: null,
      sort_order: 0,
      item_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    // Process and migrate items
    const processedItems = processJsonData(items, categoryName);
    
    for (const item of processedItems) {
      await db.saveResource({
        id: item.id,
        slug: item.title.toLowerCase().replace(/\s+/g, '-'),
        title: item.title,
        description: item.description,
        url: item.url,
        category_id: categoryName,
        subcategory_id: null,
        resource_type: 'link',
        thumbnail_url: item.image || null,
        thumbnail_type: 'image',
        colors: null,
        metadata: {},
        view_count: 0,
        date_added: item.created_at,
        created_at: item.created_at,
        updated_at: item.updated_at
      });
    }
    
    await db.saveDatabase();
    console.log(`✅ Category ${categoryName} migrated with ${processedItems.length} items`);
    
  } catch (error) {
    console.error(`❌ Failed to migrate category ${categoryName}:`, error);
    throw error;
  }
}

// Function to migrate from specific JSON data
export async function migrateFromJsonData(
  jsonData: any, 
  category: string, 
  subcategory?: string
): Promise<void> {
  console.log(`📄 Migrating JSON data for category: ${category}`);
  
  try {
    const items = processJsonData(jsonData, category, subcategory);
    const db = encryptedDatabase;
    
    // Create category if it doesn't exist
    const categoryId = `category-${category.toLowerCase().replace(/\s+/g, '-')}`;
    await db.saveCategory({
      id: categoryId,
      slug: category.toLowerCase().replace(/\s+/g, '-'),
      title: category,
      description: `Resources for ${category}`,
      parent_id: null,
      sort_order: 0,
      item_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    // Migrate items
    for (const item of items) {
      await db.saveResource({
        id: item.id,
        slug: item.title.toLowerCase().replace(/\s+/g, '-'),
        title: item.title,
        description: item.description,
        url: item.url,
        category_id: category,
        subcategory_id: null,
        resource_type: 'link',
        thumbnail_url: item.image || null,
        thumbnail_type: 'image',
        colors: null,
        metadata: {},
        view_count: 0,
        date_added: item.created_at,
        created_at: item.created_at,
        updated_at: item.updated_at
      });
    }
    
    await db.saveDatabase();
    console.log(`✅ Category ${category} migrated with ${items.length} items`);
    
  } catch (error) {
    console.error(`❌ Failed to migrate category ${category}:`, error);
    throw error;
  }
}

// Function to get migration status
export async function getMigrationStatus(): Promise<{
  categories: number;
  items: number;
  lastMigration: string | null;
}> {
  try {
    const db = encryptedDatabase;
    await db.loadDatabase();
    
    const categories = await db.getCategories();
    const items = await db.getResources();
    
    return {
      categories: categories.length,
      items: items.length,
      lastMigration: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Failed to get migration status:', error);
    return {
      categories: 0,
      items: 0,
      lastMigration: null
    };
  }
}

// Example usage and testing
export async function runMigrationExample() {
  try {
    console.log('🚀 Running migration example...');
    
    // Check current status
    const status = await getMigrationStatus();
    console.log('📊 Current status:', status);
    
    // Migrate all data
    await migrateAllLibraryData();
    
    // Check new status
    const newStatus = await getMigrationStatus();
    console.log('📊 New status:', newStatus);
    
  } catch (error) {
    console.error('❌ Migration example failed:', error);
  }
}
