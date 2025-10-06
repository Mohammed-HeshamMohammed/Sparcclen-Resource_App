# Encrypted Database System

This document describes the new heavily encrypted SQL database system that replaces the previous local data storage.

## Overview

The new system provides:
- **Heavy Encryption**: All data is encrypted using AES-256 encryption
- **Binary File Storage**: Data is stored in `.bin` files for better performance
- **Compression**: Data is compressed before encryption to save space
- **UUID Generation**: All items get unique UUIDs instead of sequential numbers
- **Category/Subcategory Support**: Hierarchical organization of resources

## Architecture

### Core Components

1. **EncryptedDatabase** (`src/lib/encryptedDatabase.ts`)
   - Main database class with encryption/decryption
   - Handles binary file storage
   - Provides CRUD operations for all data types

2. **Data Migration** (`src/lib/dataMigration.ts`)
   - Migrates JSON data from the library directory
   - Generates UUIDs for all items
   - Creates proper category/subcategory structure

3. **API Layer** (`src/lib/api.ts`)
   - Updated to work with encrypted database
   - Maintains same interface for components

### Database Schema

```typescript
interface EncryptedDatabaseSchema {
  categories: Category[];
  resources: Resource[];
  tags: Tag[];
  resourceTags: ResourceTag[];
  metadata: DatabaseMetadata;
}
```

### Encryption Features

- **AES-256 Encryption**: Military-grade encryption
- **Compression**: GZIP compression before encryption
- **Checksums**: Data integrity verification
- **Key Management**: Secure key storage
- **Binary Format**: Efficient `.bin` file storage

## Usage

### Initialization

The database is automatically initialized when the app starts:

```typescript
import './lib/databaseInit'; // Auto-initializes database
```

### Manual Migration

To manually run the data migration:

```typescript
import { migrateLibraryData } from './lib/migrationRunner';

// Run migration
await migrateLibraryData();
```

### Database Operations

```typescript
import { encryptedDatabase } from './lib/encryptedDatabase';

// Get all resources
const resources = await encryptedDatabase.getResources();

// Get resources by category
const categoryResources = await encryptedDatabase.getResourcesByCategory('colors');

// Save a new resource
await encryptedDatabase.saveResource(newResource);

// Get all categories
const categories = await encryptedDatabase.getCategories();
```

## Data Migration Process

The migration process:

1. **Clears existing database** - Removes old data
2. **Creates root categories** - Colors, Fonts, Links, Plugins
3. **Processes JSON files** - Reads from library directory
4. **Generates UUIDs** - Replaces sequential IDs
5. **Creates subcategories** - Based on directory structure
6. **Links tags** - Associates tags with resources
7. **Encrypts and stores** - Saves to binary files

## File Structure

```
src/
├── lib/
│   ├── encryptedDatabase.ts      # Main database class
│   ├── dataMigration.ts         # JSON to database migration
│   ├── migrationRunner.ts       # Migration execution
│   └── databaseInit.ts          # Auto-initialization
├── types/
│   └── encryptedDatabase.ts     # Type definitions
└── App.tsx                      # Updated with database init
```

## Security Features

- **Heavy Encryption**: All data encrypted with AES-256
- **Key Management**: Secure encryption key storage
- **Data Integrity**: Checksum verification
- **Compression**: Reduces storage footprint
- **Binary Storage**: Efficient file format

## Performance Benefits

- **Faster Loading**: Binary format is more efficient
- **Smaller Files**: Compression reduces storage needs
- **Better Organization**: Hierarchical category structure
- **UUID Support**: Better for distributed systems

## Migration from JSON

The system automatically migrates data from the JSON files in the library directory:

- **Colors**: Color palettes and combinations
- **Fonts**: Typography resources with categories
- **Links**: Web resources and tools
- **Plugins**: Design and development plugins

Each item gets:
- Unique UUID identifier
- Proper category assignment
- Tag associations
- Metadata preservation

## API Compatibility

The new system maintains full API compatibility with the previous system. All existing components will work without changes.

## Error Handling

The system includes comprehensive error handling:
- Database corruption detection
- Encryption/decryption failures
- File system errors
- Data integrity verification

## Future Enhancements

Potential improvements:
- **Cloud Sync**: Sync encrypted data across devices
- **Backup/Restore**: Automated backup system
- **Version Control**: Database versioning
- **Performance**: Query optimization
- **Security**: Additional encryption layers
