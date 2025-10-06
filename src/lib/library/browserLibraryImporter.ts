// Browser-compatible library data importer
// This version works in the browser environment

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

// Simple UUID generator (browser-compatible)
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Function to process JSON data from fetch requests
export function processJsonData(jsonData: any, category: string, subcategory?: string): LibraryItem[] {
  const items: LibraryItem[] = [];
  
  // Handle different JSON structures
  let itemsArray: any[] = [];
  
  if (Array.isArray(jsonData)) {
    itemsArray = jsonData;
  } else if (jsonData.items && Array.isArray(jsonData.items)) {
    itemsArray = jsonData.items;
  } else if (jsonData.data && Array.isArray(jsonData.data)) {
    itemsArray = jsonData.data;
  }
  
  itemsArray.forEach((item: any) => {
    const libraryItem: LibraryItem = {
      id: item.id || generateUUID(),
      title: item.title || item.name || 'Untitled',
      description: item.description || item.desc || '',
      url: item.url || item.link || '',
      category,
      subcategory,
      tags: item.tags || item.categories || [],
      image: item.image || item.thumbnail || '',
      favorite: item.favorite || false,
      created_at: item.created_at || new Date().toISOString(),
      updated_at: item.updated_at || new Date().toISOString()
    };
    items.push(libraryItem);
  });
  
  return items;
}

// Function to create categories from folder structure
export function createCategoriesFromStructure(folderStructure: any[]): LibraryCategory[] {
  const categories: LibraryCategory[] = [];
  
  folderStructure.forEach(folder => {
    const category: LibraryCategory = {
      id: generateUUID(),
      name: folder.name,
      description: `Resources for ${folder.name}`,
      subcategories: folder.subcategories?.map((sub: any) => ({
        id: generateUUID(),
        name: sub.name,
        description: `Resources for ${sub.name}`,
        parent_category: folder.name
      })) || []
    };
    categories.push(category);
  });
  
  return categories;
}

// Function to organize Colors.json data into categories
export function organizeColorsData(colorsData: any[]): { [key: string]: any[] } {
  const groupedColors: { [key: string]: any[] } = {};
  
  colorsData.forEach((color: any) => {
    const category = color.category || 'General';
    if (!groupedColors[category]) {
      groupedColors[category] = [];
    }
    groupedColors[category].push(color);
  });
  
  return groupedColors;
}

// Function to create library data structure
export function createLibraryData(
  categories: LibraryCategory[],
  items: LibraryItem[]
): LibraryData {
  return {
    categories,
    items
  };
}

// Function to fetch and process JSON data from URLs
export async function fetchAndProcessJson(url: string, category: string, subcategory?: string): Promise<LibraryItem[]> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const jsonData = await response.json();
    return processJsonData(jsonData, category, subcategory);
  } catch (error) {
    console.error(`Error fetching data from ${url}:`, error);
    return [];
  }
}

// Function to process multiple JSON files
export async function processMultipleJsonFiles(
  fileUrls: { url: string; category: string; subcategory?: string }[]
): Promise<LibraryItem[]> {
  const allItems: LibraryItem[] = [];
  
  for (const file of fileUrls) {
    try {
      const items = await fetchAndProcessJson(file.url, file.category, file.subcategory);
      allItems.push(...items);
    } catch (error) {
      console.error(`Error processing ${file.url}:`, error);
    }
  }
  
  return allItems;
}

// Function to create sample library structure
export function createSampleLibraryStructure(): LibraryCategory[] {
  return [
    {
      id: generateUUID(),
      name: 'Colors',
      description: 'Color palettes and combinations',
      subcategories: [
        { id: generateUUID(), name: '2-Color Combo', description: 'Two color combinations', parent_category: 'Colors' },
        { id: generateUUID(), name: '3-Color Combo', description: 'Three color combinations', parent_category: 'Colors' },
        { id: generateUUID(), name: '4-Color Palette', description: 'Four color palettes', parent_category: 'Colors' },
        { id: generateUUID(), name: '5-Color Palette', description: 'Five color palettes', parent_category: 'Colors' },
        { id: generateUUID(), name: '6-Color Palette', description: 'Six color palettes', parent_category: 'Colors' },
        { id: generateUUID(), name: 'Gradient', description: 'Color gradients', parent_category: 'Colors' }
      ]
    },
    {
      id: generateUUID(),
      name: 'Fonts',
      description: 'Typography and font resources',
      subcategories: [
        { id: generateUUID(), name: '3D', description: '3D fonts', parent_category: 'Fonts' },
        { id: generateUUID(), name: 'Display', description: 'Display fonts', parent_category: 'Fonts' },
        { id: generateUUID(), name: 'Sans-Serif', description: 'Sans-serif fonts', parent_category: 'Fonts' },
        { id: generateUUID(), name: 'Serif', description: 'Serif fonts', parent_category: 'Fonts' },
        { id: generateUUID(), name: 'Script', description: 'Script fonts', parent_category: 'Fonts' }
      ]
    },
    {
      id: generateUUID(),
      name: 'Links',
      description: 'Useful links and resources',
      subcategories: [
        { id: generateUUID(), name: 'AI Tools', description: 'AI-powered tools', parent_category: 'Links' },
        { id: generateUUID(), name: 'Design Resources', description: 'Design tools and resources', parent_category: 'Links' },
        { id: generateUUID(), name: 'Developer Tools', description: 'Development tools', parent_category: 'Links' }
      ]
    },
    {
      id: generateUUID(),
      name: 'Plugins',
      description: 'Plugin resources',
      subcategories: [
        { id: generateUUID(), name: 'Figma', description: 'Figma plugins', parent_category: 'Plugins' },
        { id: generateUUID(), name: 'Framer', description: 'Framer plugins', parent_category: 'Plugins' }
      ]
    }
  ];
}
