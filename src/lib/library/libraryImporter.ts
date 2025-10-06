// Note: This file is for Node.js/server-side use only
// For browser usage, use the browser-compatible version

import fs from 'fs';
import path from 'path';

// Simple UUID v4 generator for Node.js
function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Types for the library data structure
export interface LibraryItem {
  id: string;
  title: string;
  description: string;
  url: string;
  category: string;
  subcategory?: string;
  tags: string[];
  image?: string;
  favorite?: boolean;
  created_at: string;
  updated_at: string;
}

export interface LibraryCategory {
  id: string;
  name: string;
  description: string;
  subcategories: LibrarySubcategory[];
}

export interface LibrarySubcategory {
  id: string;
  name: string;
  description: string;
  parent_category: string;
}

export interface LibraryData {
  categories: LibraryCategory[];
  items: LibraryItem[];
}

// Function to recursively read JSON files from a directory
function readJsonFiles(dirPath: string, basePath: string = ''): LibraryItem[] {
  const items: LibraryItem[] = [];
  
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.relative(basePath, fullPath);
      
      if (entry.isDirectory()) {
        // Recursively read subdirectories
        const subItems = readJsonFiles(fullPath, basePath);
        items.push(...subItems);
      } else if (entry.name === 'items.json') {
        // Read the JSON file
        try {
          const jsonContent = fs.readFileSync(fullPath, 'utf-8');
          const jsonData = JSON.parse(jsonContent);
          
          // Handle different JSON structures
          if (Array.isArray(jsonData)) {
            // If it's an array of items
            jsonData.forEach((item: any) => {
              const libraryItem: LibraryItem = {
                id: uuidv4(),
                title: item.title || item.name || 'Untitled',
                description: item.description || item.desc || '',
                url: item.url || item.link || '',
                category: extractCategoryFromPath(relativePath),
                subcategory: extractSubcategoryFromPath(relativePath),
                tags: item.tags || item.categories || [],
                image: item.image || item.thumbnail || '',
                favorite: item.favorite || false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
              items.push(libraryItem);
            });
          } else if (jsonData.items && Array.isArray(jsonData.items)) {
            // If it's an object with an items array
            jsonData.items.forEach((item: any) => {
              const libraryItem: LibraryItem = {
                id: uuidv4(),
                title: item.title || item.name || 'Untitled',
                description: item.description || item.desc || '',
                url: item.url || item.link || '',
                category: extractCategoryFromPath(relativePath),
                subcategory: extractSubcategoryFromPath(relativePath),
                tags: item.tags || item.categories || [],
                image: item.image || item.thumbnail || '',
                favorite: item.favorite || false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
              items.push(libraryItem);
            });
          }
        } catch (error) {
          console.error(`Error reading JSON file ${fullPath}:`, error);
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
  }
  
  return items;
}

// Function to extract category from file path
function extractCategoryFromPath(relativePath: string): string {
  const pathParts = relativePath.split(path.sep);
  
  // Handle different folder structures
  if (pathParts[0] === 'Colors') {
    return 'Colors';
  } else if (pathParts[0] === 'Fonts') {
    return 'Fonts';
  } else if (pathParts[0] === 'Links') {
    return 'Links';
  } else if (pathParts[0] === 'Plugins') {
    return 'Plugins';
  }
  
  // For nested structures, use the first meaningful directory
  return pathParts[0] || 'General';
}

// Function to extract subcategory from file path
function extractSubcategoryFromPath(relativePath: string): string | undefined {
  const pathParts = relativePath.split(path.sep);
  
  // Skip the first part (main category) and find the first subdirectory
  for (let i = 1; i < pathParts.length; i++) {
    if (pathParts[i] !== 'screens' && pathParts[i] !== 'items.json') {
      return pathParts[i];
    }
  }
  
  return undefined;
}

// Function to generate categories and subcategories from the folder structure
function generateCategoriesFromStructure(basePath: string): LibraryCategory[] {
  const categories: LibraryCategory[] = [];
  
  try {
    const entries = fs.readdirSync(basePath, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const categoryPath = path.join(basePath, entry.name);
        const subcategories: LibrarySubcategory[] = [];
        
        // Read subcategories
        try {
          const subEntries = fs.readdirSync(categoryPath, { withFileTypes: true });
          
          for (const subEntry of subEntries) {
            if (subEntry.isDirectory() && subEntry.name !== 'screens') {
              subcategories.push({
                id: uuidv4(),
                name: subEntry.name,
                description: `Resources for ${subEntry.name}`,
                parent_category: entry.name
              });
            }
          }
        } catch (error) {
          console.error(`Error reading subcategories for ${entry.name}:`, error);
        }
        
        categories.push({
          id: uuidv4(),
          name: entry.name,
          description: `Resources for ${entry.name}`,
          subcategories
        });
      }
    }
  } catch (error) {
    console.error(`Error reading base directory ${basePath}:`, error);
  }
  
  return categories;
}

// Main function to import all library data
export function importLibraryData(libraryPath: string): LibraryData {
  console.log(`Starting library import from: ${libraryPath}`);
  
  // Generate categories from folder structure
  const categories = generateCategoriesFromStructure(libraryPath);
  
  // Read all JSON files and convert to library items
  const items = readJsonFiles(libraryPath);
  
  console.log(`Imported ${categories.length} categories and ${items.length} items`);
  
  return {
    categories,
    items
  };
}

// Function to import specific category
export function importCategoryData(libraryPath: string, categoryName: string): LibraryItem[] {
  const categoryPath = path.join(libraryPath, categoryName);
  
  if (!fs.existsSync(categoryPath)) {
    console.error(`Category path does not exist: ${categoryPath}`);
    return [];
  }
  
  return readJsonFiles(categoryPath);
}

// Function to import from specific JSON file
export function importFromJsonFile(filePath: string, category: string, subcategory?: string): LibraryItem[] {
  const items: LibraryItem[] = [];
  
  try {
    if (!fs.existsSync(filePath)) {
      console.error(`File does not exist: ${filePath}`);
      return items;
    }
    
    const jsonContent = fs.readFileSync(filePath, 'utf-8');
    const jsonData = JSON.parse(jsonContent);
    
    // Handle different JSON structures
    const itemsArray = Array.isArray(jsonData) ? jsonData : (jsonData.items || []);
    
    itemsArray.forEach((item: any) => {
      const libraryItem: LibraryItem = {
        id: uuidv4(),
        title: item.title || item.name || 'Untitled',
        description: item.description || item.desc || '',
        url: item.url || item.link || '',
        category,
        subcategory,
        tags: item.tags || item.categories || [],
        image: item.image || item.thumbnail || '',
        favorite: item.favorite || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      items.push(libraryItem);
    });
    
    console.log(`Imported ${items.length} items from ${filePath}`);
  } catch (error) {
    console.error(`Error importing from ${filePath}:`, error);
  }
  
  return items;
}

// Function to organize Colors.json into proper folder structure
export function organizeColorsJson(colorsJsonPath: string, outputPath: string): void {
  try {
    const colorsData = JSON.parse(fs.readFileSync(colorsJsonPath, 'utf-8'));
    
    // Create output directory structure
    const colorsDir = path.join(outputPath, 'Colors');
    fs.mkdirSync(colorsDir, { recursive: true });
    
    // Group colors by category
    const groupedColors: { [key: string]: any[] } = {};
    
    colorsData.forEach((color: any) => {
      const category = color.category || 'General';
      if (!groupedColors[category]) {
        groupedColors[category] = [];
      }
      groupedColors[category].push(color);
    });
    
    // Create category folders and files
    Object.entries(groupedColors).forEach(([category, items]) => {
      const categoryDir = path.join(colorsDir, category.replace(/\s+/g, '-').toLowerCase());
      fs.mkdirSync(categoryDir, { recursive: true });
      
      // Write items.json file
      const itemsPath = path.join(categoryDir, 'items.json');
      fs.writeFileSync(itemsPath, JSON.stringify(items, null, 2));
      
      // Create screens directory
      const screensDir = path.join(categoryDir, 'screens');
      fs.mkdirSync(screensDir, { recursive: true });
      fs.writeFileSync(path.join(screensDir, '.gitkeep'), '');
      
      console.log(`Created ${category} with ${items.length} items`);
    });
    
    console.log(`Successfully organized Colors.json into folder structure at ${outputPath}`);
  } catch (error) {
    console.error('Error organizing Colors.json:', error);
  }
}

// Example usage function
export function exampleUsage() {
  const libraryPath = 'D:/Work/Startup/library';
  
  // Import all library data
  const libraryData = importLibraryData(libraryPath);
  console.log('Library Data:', libraryData);
  
  // Import specific category
  const colorsItems = importCategoryData(libraryPath, 'Colors');
  console.log('Colors Items:', colorsItems);
  
  // Import from specific file
  const specificItems = importFromJsonFile(
    path.join(libraryPath, 'Colors', '2-color-combos', 'items.json'),
    'Colors',
    '2-color-combos'
  );
  console.log('Specific Items:', specificItems);
  
  // Organize Colors.json
  organizeColorsJson('D:/Work/Startup/Colors.json', libraryPath);
}
