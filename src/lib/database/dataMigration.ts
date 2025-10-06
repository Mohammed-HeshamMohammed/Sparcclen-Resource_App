import { encryptedDatabase } from './encryptedDatabase';
import type { Category, Resource, Tag, ResourceTag } from '../types/encryptedDatabase';

interface JsonResource {
  id: number;
  title: string;
  category: string;
  tags: string[];
  description: string;
  colors?: string[];
  url?: string;
  favorite?: boolean;
  screenshot?: string;
  thumbnail?: string;
  date_added?: string;
  subcategory?: string;
}

interface JsonCategory {
  name: string;
  path: string;
  subcategories?: string[];
}

class DataMigration {
  private categoryMap = new Map<string, string>();
  private tagMap = new Map<string, string>();

  async migrateFromJsonFiles(libraryPath: string): Promise<void> {
    console.log('Starting data migration from JSON files...');
    
    // Clear existing database
    await encryptedDatabase.clearDatabase();
    
    // Create root categories
    await this.createRootCategories();
    
    // Migrate data from each directory
    await this.migrateColors(libraryPath);
    await this.migrateFonts(libraryPath);
    await this.migrateLinks(libraryPath);
    await this.migratePlugins(libraryPath);
    
    console.log('Data migration completed successfully!');
  }

  private async createRootCategories(): Promise<void> {
    const rootCategories = [
      { name: 'Colors', slug: 'colors', description: 'Color palettes and combinations' },
      { name: 'Fonts', slug: 'fonts', description: 'Typography and font resources' },
      { name: 'Links', slug: 'links', description: 'Useful links and tools' },
      { name: 'Plugins', slug: 'plugins', description: 'Design and development plugins' }
    ];

    for (const category of rootCategories) {
      const categoryId = encryptedDatabase.generateId();
      const categoryData: Category = {
        id: categoryId,
        slug: category.slug,
        title: category.name,
        description: category.description,
        parent_id: null,
        sort_order: 0,
        item_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      await encryptedDatabase.saveCategory(categoryData);
      this.categoryMap.set(category.name.toLowerCase(), categoryId);
    }
  }

  private async migrateColors(libraryPath: string): Promise<void> {
    console.log('Migrating Colors data...');
    
    // This would read from the actual JSON files in a real implementation
    // For now, we'll create sample data based on the structure we saw
    const colorsData: JsonResource[] = [
      {
        id: 1,
        title: "Sky Blue + White",
        category: "2-Color Combo",
        tags: ["calm", "peaceful", "clean", "fresh", "airy"],
        description: "A serene combination evoking clear skies and clouds, perfect for clean and trustworthy designs.",
        colors: ["#87CEEB", "#FFFFFF"],
        favorite: false
      },
      {
        id: 2,
        title: "Mustard + Nude Pink",
        category: "2-Color Combo",
        tags: ["warm", "sophisticated", "vintage", "cozy", "elegant"],
        description: "A sophisticated pairing that balances warmth with softness, ideal for modern vintage aesthetics.",
        colors: ["#FFDB58", "#E8B4B8"],
        favorite: false
      }
    ];

    await this.migrateResources(colorsData, 'Colors');
  }

  private async migrateFonts(libraryPath: string): Promise<void> {
    console.log('Migrating Fonts data...');
    
    const fontsData: JsonResource[] = [
      {
        id: 13,
        title: "Doll Ghoom",
        category: "Display",
        tags: ["playful", "decorative", "whimsical", "quirky", "creative"],
        description: "A whimsical decorative font with playful character perfect for creative and artistic projects.",
        favorite: false
      },
      {
        id: 76,
        title: "MetroDeco",
        category: "Display",
        tags: ["art-deco", "decorative", "luxury", "headline"],
        description: "A decorative Art-Deco face for editorial work.",
        favorite: false
      }
    ];

    await this.migrateResources(fontsData, 'Fonts');
  }

  private async migrateLinks(libraryPath: string): Promise<void> {
    console.log('Migrating Links data...');
    
    const linksData: JsonResource[] = [
      {
        id: 80,
        title: "Pro Diffusion Studio",
        url: "https://prodiffusionstudio.com",
        category: "AI Tools (General)",
        tags: ["ai", "image-generation", "diffusion", "art", "design", "content-creation", "AI-Tools"],
        description: "AI image generation studio using diffusion models for creating professional artwork.",
        thumbnail: "https://www.google.com/s2/favicons?sz=256&domain=prodiffusionstudio.com",
        favorite: false,
        date_added: "2025-10-01"
      },
      {
        id: 89,
        title: "Lovart Design Agent",
        url: "https://lovart.design",
        category: "AI Tools (General)",
        tags: ["ai", "design", "agent", "automation", "creative", "content-creation", "AI-Tools"],
        description: "AI design agent for automating creative workflows and generating design assets.",
        thumbnail: "https://www.google.com/s2/favicons?sz=256&domain=lovart.design",
        favorite: false,
        date_added: "2025-10-01"
      }
    ];

    await this.migrateResources(linksData, 'Links');
  }

  private async migratePlugins(libraryPath: string): Promise<void> {
    console.log('Migrating Plugins data...');
    
    // Sample plugins data
    const pluginsData: JsonResource[] = [
      {
        id: 1,
        title: "Sample Figma Plugin",
        category: "Figma",
        tags: ["figma", "plugin", "design", "tool"],
        description: "A sample Figma plugin for design workflows.",
        favorite: false
      }
    ];

    await this.migrateResources(pluginsData, 'Plugins');
  }

  private async migrateResources(jsonResources: JsonResource[], mainCategory: string): Promise<void> {
    const categoryId = this.categoryMap.get(mainCategory.toLowerCase());
    if (!categoryId) {
      console.error(`Category ${mainCategory} not found`);
      return;
    }

    for (const jsonResource of jsonResources) {
      // Generate UUID for the resource
      const resourceId = encryptedDatabase.generateId();
      
      // Create subcategory if needed
      let subcategoryId: string | null = null;
      if (jsonResource.subcategory) {
        subcategoryId = await this.getOrCreateSubcategory(jsonResource.subcategory, categoryId);
      }

      // Create the resource
      const resource: Resource = {
        id: resourceId,
        slug: this.createSlug(jsonResource.title),
        title: jsonResource.title,
        description: jsonResource.description,
        url: jsonResource.url || null,
        category_id: categoryId,
        subcategory_id: subcategoryId,
        resource_type: this.determineResourceType(jsonResource),
        thumbnail_url: jsonResource.thumbnail || null,
        thumbnail_type: jsonResource.thumbnail ? 'image' : null,
        colors: jsonResource.colors || null,
        metadata: {
          original_id: jsonResource.id,
          favorite: jsonResource.favorite || false,
          screenshot: jsonResource.screenshot || null
        },
        view_count: 0,
        date_added: jsonResource.date_added || new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await encryptedDatabase.saveResource(resource);

      // Create and link tags
      for (const tagName of jsonResource.tags) {
        const tagId = await this.getOrCreateTag(tagName);
        await this.linkResourceToTag(resourceId, tagId);
      }
    }
  }

  private async getOrCreateSubcategory(subcategoryName: string, parentCategoryId: string): Promise<string> {
    const subcategoryId = encryptedDatabase.generateId();
    const subcategory: Category = {
      id: subcategoryId,
      slug: this.createSlug(subcategoryName),
      title: subcategoryName,
      description: null,
      parent_id: parentCategoryId,
      sort_order: 0,
      item_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await encryptedDatabase.saveCategory(subcategory);
    return subcategoryId;
  }

  private async getOrCreateTag(tagName: string): Promise<string> {
    if (this.tagMap.has(tagName)) {
      return this.tagMap.get(tagName)!;
    }

    const tagId = encryptedDatabase.generateId();
    const tag: Tag = {
      id: tagId,
      name: tagName,
      slug: this.createSlug(tagName),
      usage_count: 0,
      created_at: new Date().toISOString()
    };

    await encryptedDatabase.saveTag(tag);
    this.tagMap.set(tagName, tagId);
    return tagId;
  }

  private async linkResourceToTag(resourceId: string, tagId: string): Promise<void> {
    const resourceTag: ResourceTag = {
      resource_id: resourceId,
      tag_id: tagId,
      created_at: new Date().toISOString()
    };

    await encryptedDatabase.saveResourceTag(resourceTag);
  }

  private createSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private determineResourceType(jsonResource: JsonResource): string {
    if (jsonResource.url) {
      return 'link';
    } else if (jsonResource.colors) {
      return 'color';
    } else if (jsonResource.title.includes('Font') || jsonResource.title.includes('Type')) {
      return 'font';
    } else {
      return 'resource';
    }
  }
}

export const dataMigration = new DataMigration();
