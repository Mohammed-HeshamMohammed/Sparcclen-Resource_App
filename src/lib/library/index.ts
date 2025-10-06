// Library management utilities
export {
  LibraryItem,
  LibraryCategory,
  LibrarySubcategory,
  LibraryData,
  processJsonData,
  createCategoriesFromStructure,
  organizeColorsData,
  createLibraryData,
  fetchAndProcessJson,
  processMultipleJsonFiles,
  createSampleLibraryStructure
} from './browserLibraryImporter';

export {
  importLibraryData,
  importCategoryData,
  importFromJsonFile,
  organizeColorsJson,
  exampleUsage
} from './libraryImporter';

export {
  migrateAllLibraryData,
  migrateCategoryData,
  migrateFromJsonData,
  getMigrationStatus,
  runMigrationExample
} from './migrateLibraryData';
