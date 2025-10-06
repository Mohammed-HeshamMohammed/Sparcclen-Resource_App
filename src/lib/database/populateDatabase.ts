import { encryptedDatabase } from './encryptedDatabase';
import type { Category, Resource, Tag } from '../types';

// Directory structure mapping based on the provided structure
const DIRECTORY_CATEGORIES = {
  'Colors': {
    title: 'Colors',
    description: 'Color palettes and combinations for design',
    subcategories: {
      '3-color-combos': '3 Color Combinations',
      '4-color': '4 Color Palettes',
      '5-color': '5 Color Palettes',
      '6-color': '6 Color Palettes',
      'gradients': 'Gradient Collections'
    }
  },
  'Fonts': {
    title: 'Fonts',
    description: 'Typography and font collections',
    subcategories: {
      '3D': '3D Fonts',
      'Display': 'Display Fonts',
      'Sans-Serif': 'Sans-Serif Fonts',
      'Script': 'Script Fonts',
      'Serif': 'Serif Fonts',
      'Slab-Serif': 'Slab-Serif Fonts',
      'Textured': 'Textured Fonts',
      'Vintage': 'Vintage Fonts',
      'Other': 'Other Fonts'
    }
  },
  'Links': {
    title: 'Links',
    description: 'Useful design and development resources',
    subcategories: {
      'AI-Agents': 'AI Agents',
      'AI-Chatbots': 'AI Chatbots',
      'AI-Integration': 'AI Integration Tools',
      'AI_Tools_General': 'General AI Tools',
      'Automation': 'Automation Tools',
      'Browser-Extensions': 'Browser Extensions',
      'Color-Tools': 'Color Tools',
      'Data-Visualization': 'Data Visualization',
      'Design_Resources': 'Design Resources',
      'Developer_Tools': 'Developer Tools',
      'Game-Development': 'Game Development',
      'Image-Generation': 'Image Generation',
      'Inspiration': 'Design Inspiration',
      'Marketing_and_Social': 'Marketing & Social Tools',
      'Mockups_and_Templates': 'Mockups & Templates',
      'No-Code': 'No-Code Tools',
      'Presentation-Tools': 'Presentation Tools',
      'Productivity_and_Collaboration': 'Productivity Tools',
      'Spreadsheet-Tools': 'Spreadsheet Tools',
      'Stock_Assets': 'Stock Assets',
      'UI_Libraries_and_Systems': 'UI Libraries & Systems',
      'Video_and_Motion': 'Video & Motion Tools',
      'Writing-Tools': 'Writing Tools'
    }
  },
  'Plugins': {
    title: 'Plugins',
    description: 'Design tool plugins and extensions',
    subcategories: {
      'Figma': 'Figma Plugins',
      'Framer': 'Framer Plugins'
    }
  }
};

export async function populateDatabaseFromDirectories(sourceType: 'directory' | 'json' = 'directory', sourcePath?: string): Promise<{
  success: boolean;
  categoriesCreated: number;
  resourcesCreated: number;
  tagsCreated: number;
  errors: string[];
}> {
  try {
    console.log(`🚀 Starting database population from ${sourceType}...`);

    // Clear existing data first
    await encryptedDatabase.clearDatabase();
    console.log('✅ Cleared existing database');

    if (sourceType === 'directory') {
      // Use existing directory-based population logic
      return await populateFromDirectoryStructure();
    } else if (sourceType === 'json') {
      // Populate from JSON file
      if (!sourcePath) {
        throw new Error('JSON file path is required for JSON source type');
      }
      return await populateFromJsonFile(sourcePath);
    } else {
      throw new Error(`Unsupported source type: ${sourceType}`);
    }

  } catch (error: any) {
    console.error('❌ Database population failed:', error);
    return {
      success: false,
      categoriesCreated: 0,
      resourcesCreated: 0,
      tagsCreated: 0,
      errors: [`Critical error: ${error.message || error}`],
    };
  }
}

async function populateFromDirectoryStructure(): Promise<{
  success: boolean;
  categoriesCreated: number;
  resourcesCreated: number;
  tagsCreated: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let categoriesCreated = 0;
  let resourcesCreated = 0;
  let tagsCreated = 0;

  // Create main categories and their subcategories
  for (const [dirName, categoryInfo] of Object.entries(DIRECTORY_CATEGORIES)) {
    try {
      // Create main category
      const mainCategoryId = encryptedDatabase.generateId();
      const mainCategory: Category = {
        id: mainCategoryId,
        slug: dirName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        title: categoryInfo.title,
        description: categoryInfo.description,
        parent_id: null,
        sort_order: Object.keys(DIRECTORY_CATEGORIES).indexOf(dirName),
        item_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      try {
        await encryptedDatabase.saveCategory(mainCategory);
        categoriesCreated++;
        console.log(`✅ Created category: ${mainCategory.title}`);
      } catch (error: any) {
        if (error.name === 'QuotaExceededError' || error.message?.includes('quota')) {
          errors.push(`Storage quota exceeded while creating main category ${categoryInfo.title}. Successfully created ${categoriesCreated} categories.`);
          break; // Stop creating more categories
        } else {
          errors.push(`Failed to create category ${categoryInfo.title}: ${error}`);
        }
      }

      // Create subcategories
      for (const [subDirName, subTitle] of Object.entries(categoryInfo.subcategories)) {
        try {
          const subCategoryId = encryptedDatabase.generateId();
          const subCategory: Category = {
            id: subCategoryId,
            slug: subDirName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            title: subTitle,
            description: `Resources for ${subTitle}`,
            parent_id: mainCategoryId,
            sort_order: Object.keys(categoryInfo.subcategories).indexOf(subDirName),
            item_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          try {
            await encryptedDatabase.saveCategory(subCategory);
            categoriesCreated++;
            console.log(`  ✅ Created subcategory: ${subCategory.title}`);
          } catch (error: any) {
            if (error.name === 'QuotaExceededError' || error.message?.includes('quota')) {
              errors.push(`Storage quota exceeded while creating subcategory ${subTitle}. Successfully created ${categoriesCreated} categories.`);
              break; // Stop creating more subcategories for this category
            } else {
              errors.push(`Failed to create subcategory ${subTitle}: ${error}`);
            }
          }

          // Create sample resources for each subcategory
          const sampleResources = generateSampleResources(subCategoryId, subTitle);
          for (const resource of sampleResources) {
            try {
              await encryptedDatabase.saveResource(resource);
              resourcesCreated++;
            } catch (error: any) {
              if (error.name === 'QuotaExceededError' || error.message?.includes('quota')) {
                errors.push(`Storage quota exceeded. Successfully created ${resourcesCreated} resources before hitting the limit.`);
                break; // Stop creating more resources for this subcategory
              } else {
                errors.push(`Failed to create resource ${resource.title}: ${error}`);
              }
            }
          }

          // Update item count for subcategory
          subCategory.item_count = sampleResources.length;
          try {
            await encryptedDatabase.saveCategory(subCategory);
          } catch (error: any) {
            if (error.name === 'QuotaExceededError' || error.message?.includes('quota')) {
              errors.push(`Storage quota exceeded while updating subcategory ${subTitle}.`);
              break;
            }
          }

        } catch (error) {
          errors.push(`Failed to create subcategory ${subTitle}: ${error}`);
        }
      }

      // Update item count for main category
      mainCategory.item_count = Object.keys(categoryInfo.subcategories).length;
      try {
        await encryptedDatabase.saveCategory(mainCategory);
      } catch (error: any) {
        if (error.name === 'QuotaExceededError' || error.message?.includes('quota')) {
          errors.push(`Storage quota exceeded while updating main category ${categoryInfo.title}.`);
        }
      }

    } catch (error) {
      errors.push(`Failed to create category ${categoryInfo.title}: ${error}`);
    }
  }

  // Create some common tags
  const commonTags = [
    'design', 'development', 'tools', 'resources', 'free', 'premium',
    'web', 'mobile', 'ui', 'ux', 'color', 'typography', 'icons', 'templates'
  ];

  for (const tagName of commonTags) {
    try {
      const tag: Tag = {
        id: encryptedDatabase.generateId(),
        name: tagName,
        slug: tagName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        usage_count: Math.floor(Math.random() * 20) + 1,
        created_at: new Date().toISOString(),
      };

      try {
        await encryptedDatabase.saveTag(tag);
        tagsCreated++;
      } catch (error: any) {
        if (error.name === 'QuotaExceededError' || error.message?.includes('quota')) {
          errors.push(`Storage quota exceeded while creating tags. Successfully created ${tagsCreated} tags before hitting the limit.`);
          break; // Stop creating more tags
        } else {
          errors.push(`Failed to create tag ${tagName}: ${error}`);
        }
      }
    } catch (error) {
      errors.push(`Failed to create tag ${tagName}: ${error}`);
    }
  }

  console.log('🎉 Directory-based database population completed!');

  // Log summary even if there were quota errors
  console.log(`📊 Final Summary:`);
  console.log(`  - Categories: ${categoriesCreated}`);
  console.log(`  - Resources: ${resourcesCreated}`);
  console.log(`  - Tags: ${tagsCreated}`);

  if (errors.length > 0) {
    console.warn(`⚠️ ${errors.length} errors occurred during population`);
  }

  return {
    success: errors.length === 0,
    categoriesCreated,
    resourcesCreated,
    tagsCreated,
    errors,
  };
}

async function populateFromJsonFile(jsonFilePath: string): Promise<{
  success: boolean;
  categoriesCreated: number;
  resourcesCreated: number;
  tagsCreated: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let categoriesCreated = 0;
  let resourcesCreated = 0;
  let tagsCreated = 0;

  try {
    console.log(`📂 Reading JSON file: ${jsonFilePath}`);

    // In a real implementation, this would read from the file system
    // For now, we'll simulate reading a JSON structure
    const jsonData = await readJsonFile(jsonFilePath);
    const result = await processJsonData(jsonData);
    return result;
  } catch (error: any) {
    console.error('❌ JSON file population failed:', error);
    return {
      success: false,
      categoriesCreated,
      resourcesCreated,
      tagsCreated,
      errors: [`Failed to read or parse JSON file: ${error.message || error}`],
    };
  }
}

// New: process a JSON string directly (from a File input)
export async function populateDatabaseFromJsonString(jsonString: string): Promise<{
  success: boolean;
  categoriesCreated: number;
  resourcesCreated: number;
  tagsCreated: number;
  errors: string[];
}> {
  try {
    const jsonData = JSON.parse(jsonString);
    const result = await processJsonData(jsonData);
    return result;
  } catch (error: any) {
    return {
      success: false,
      categoriesCreated: 0,
      resourcesCreated: 0,
      tagsCreated: 0,
      errors: [
        `Failed to parse provided JSON: ${error?.message || error}`,
      ],
    };
  }
}

// Extract common JSON processing logic
async function processJsonData(jsonData: any): Promise<{
  success: boolean;
  categoriesCreated: number;
  resourcesCreated: number;
  tagsCreated: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let categoriesCreated = 0;
  let resourcesCreated = 0;
  let tagsCreated = 0;

  if (!jsonData || typeof jsonData !== 'object') {
    return {
      success: false,
      categoriesCreated,
      resourcesCreated,
      tagsCreated,
      errors: ['Invalid JSON file format'],
    };
  }

  if (jsonData.categories && Array.isArray(jsonData.categories)) {
    for (const categoryData of jsonData.categories) {
      try {
        const category: Category = {
          id: categoryData.id || encryptedDatabase.generateId(),
          slug: categoryData.slug || categoryData.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          title: categoryData.title,
          description: categoryData.description,
          parent_id: categoryData.parent_id,
          sort_order: categoryData.sort_order || 0,
          item_count: categoryData.item_count || 0,
          created_at: categoryData.created_at || new Date().toISOString(),
          updated_at: categoryData.updated_at || new Date().toISOString(),
        };

        try {
          await encryptedDatabase.saveCategory(category);
          categoriesCreated++;
          console.log(`✅ Created category: ${category.title}`);
        } catch (error: any) {
          if (error.name === 'QuotaExceededError' || error.message?.includes('quota')) {
            errors.push(`Storage quota exceeded while creating category ${category.title}. Successfully created ${categoriesCreated} categories.`);
            break;
          } else {
            errors.push(`Failed to create category ${category.title}: ${error}`);
          }
        }
      } catch (error) {
        errors.push(`Failed to process category: ${error}`);
      }
    }
  }

  if (jsonData.resources && Array.isArray(jsonData.resources)) {
    for (const resourceData of jsonData.resources) {
      try {
        const resource: Resource = {
          id: resourceData.id || encryptedDatabase.generateId(),
          slug: resourceData.slug || resourceData.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          title: resourceData.title,
          description: resourceData.description,
          url: resourceData.url,
          category_id: resourceData.category_id,
          subcategory_id: resourceData.subcategory_id,
          resource_type: resourceData.resource_type || 'resource',
          thumbnail_url: resourceData.thumbnail_url,
          thumbnail_type: resourceData.thumbnail_type,
          colors: resourceData.colors,
          metadata: resourceData.metadata || {},
          view_count: resourceData.view_count || 0,
          date_added: resourceData.date_added || new Date().toISOString(),
          created_at: resourceData.created_at || new Date().toISOString(),
          updated_at: resourceData.updated_at || new Date().toISOString(),
        };

        try {
          await encryptedDatabase.saveResource(resource);
          resourcesCreated++;
        } catch (error: any) {
          if (error.name === 'QuotaExceededError' || error.message?.includes('quota')) {
            errors.push(`Storage quota exceeded while creating resources. Successfully created ${resourcesCreated} resources before hitting the limit.`);
            break;
          } else {
            errors.push(`Failed to create resource ${resource.title}: ${error}`);
          }
        }
      } catch (error) {
        errors.push(`Failed to process resource: ${error}`);
      }
    }
  }

  if (jsonData.tags && Array.isArray(jsonData.tags)) {
    for (const tagData of jsonData.tags) {
      try {
        const tag: Tag = {
          id: tagData.id || encryptedDatabase.generateId(),
          name: tagData.name,
          slug: tagData.slug || tagData.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          usage_count: tagData.usage_count || 0,
          created_at: tagData.created_at || new Date().toISOString(),
        };

        try {
          await encryptedDatabase.saveTag(tag);
          tagsCreated++;
        } catch (error: any) {
          if (error.name === 'QuotaExceededError' || error.message?.includes('quota')) {
            errors.push(`Storage quota exceeded while creating tags. Successfully created ${tagsCreated} tags before hitting the limit.`);
            break;
          } else {
            errors.push(`Failed to create tag ${tag.name}: ${error}`);
          }
        }
      } catch (error) {
        errors.push(`Failed to process tag: ${error}`);
      }
    }
  }

  console.log('🎉 JSON-based database population completed!');

  console.log(`📊 Final Summary:`);
  console.log(`  - Categories: ${categoriesCreated}`);
  console.log(`  - Resources: ${resourcesCreated}`);
  console.log(`  - Tags: ${tagsCreated}`);

  if (errors.length > 0) {
    console.warn(`⚠️ ${errors.length} errors occurred during population`);
  }

  return {
    success: errors.length === 0,
    categoriesCreated,
    resourcesCreated,
    tagsCreated,
    errors,
  };
}

function generateSampleResources(subcategoryId: string, subcategoryTitle: string): Resource[] {
  const resources: Resource[] = [];
  const sampleUrls = [
    'https://example.com/resource1',
    'https://example.com/resource2',
    'https://example.com/resource3',
    'https://example.com/resource4',
    'https://example.com/resource5',
  ];

  const sampleTitles = [
    `Best ${subcategoryTitle} Collection`,
    `${subcategoryTitle} - Premium Resources`,
    `Free ${subcategoryTitle} Tools`,
    `${subcategoryTitle} Inspiration Gallery`,
    `Top ${subcategoryTitle} Resources 2024`,
  ];

  const sampleDescriptions = [
    `A curated collection of the best ${subcategoryTitle.toLowerCase()} for designers and developers.`,
    `Premium ${subcategoryTitle.toLowerCase()} resources to enhance your projects.`,
    `Free ${subcategoryTitle.toLowerCase()} tools and assets for your creative work.`,
    `Get inspired with this amazing ${subcategoryTitle.toLowerCase()} gallery.`,
    `The most popular ${subcategoryTitle.toLowerCase()} resources of the year.`,
  ];

  for (let i = 0; i < 2; i++) { // Reduced from 5 to 2 resources per subcategory
    const resource: Resource = {
      id: encryptedDatabase.generateId(),
      slug: `sample-${subcategoryTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${i + 1}`,
      title: sampleTitles[i] || `${subcategoryTitle} Resource ${i + 1}`,
      description: sampleDescriptions[i] || `Sample resource for ${subcategoryTitle.toLowerCase()}`,
      url: sampleUrls[i] || `https://example.com/sample-${i + 1}`,
      category_id: '', // Will be filled based on parent category
      subcategory_id: subcategoryId,
      resource_type: getResourceTypeFromCategory(subcategoryTitle),
      thumbnail_url: `https://picsum.photos/400/300?random=${Math.floor(Math.random() * 1000)}`,
      thumbnail_type: 'image',
      colors: subcategoryTitle.toLowerCase().includes('color') ? ['#FF6B6B', '#4ECDC4', '#45B7D1'] : null,
      metadata: {
        featured: Math.random() > 0.7,
        difficulty: ['Beginner', 'Intermediate', 'Advanced'][Math.floor(Math.random() * 3)],
        file_size: `${Math.floor(Math.random() * 100) + 10}MB`,
      },
      view_count: Math.floor(Math.random() * 1000),
      date_added: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    resources.push(resource);
  }

  return resources;
}

function getResourceTypeFromCategory(categoryTitle: string): string {
  if (categoryTitle.toLowerCase().includes('color')) return 'color-palette';
  if (categoryTitle.toLowerCase().includes('font')) return 'font';
  if (categoryTitle.toLowerCase().includes('icon')) return 'icon';
  if (categoryTitle.toLowerCase().includes('template')) return 'template';
  if (categoryTitle.toLowerCase().includes('tool')) return 'tool';
  if (categoryTitle.toLowerCase().includes('plugin')) return 'plugin';
  return 'resource';
}

// Utility function to read JSON file (simplified for demo)
async function readJsonFile(filePath: string): Promise<any> {
  // In a real implementation, this would read from the file system
  // For now, return a sample structure based on the file path
  if (filePath.includes('sample-data.json')) {
    return {
      categories: [
        {
          id: 'cat-1',
          title: 'Sample Category',
          description: 'A sample category for testing',
          slug: 'sample-category',
          sort_order: 0,
          item_count: 2,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ],
      resources: [
        {
          id: 'res-1',
          title: 'Sample Resource 1',
          description: 'First sample resource',
          slug: 'sample-resource-1',
          url: 'https://example.com/1',
          category_id: 'cat-1',
          resource_type: 'resource',
          view_count: 10,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'res-2',
          title: 'Sample Resource 2',
          description: 'Second sample resource',
          slug: 'sample-resource-2',
          url: 'https://example.com/2',
          category_id: 'cat-1',
          resource_type: 'resource',
          view_count: 5,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ],
      tags: [
        {
          id: 'tag-1',
          name: 'sample',
          slug: 'sample',
          usage_count: 2,
          created_at: new Date().toISOString(),
        }
      ]
    };
  }

  throw new Error(`JSON file not found or not supported: ${filePath}`);
}

// Export the function for use
