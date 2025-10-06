export interface EncryptedDatabaseSchema {
  categories: Category[];
  resources: Resource[];
  tags: Tag[];
  resourceTags: ResourceTag[];
  metadata: DatabaseMetadata;
}

export interface Category {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  parent_id: string | null;
  sort_order: number;
  item_count: number;
  created_at: string;
  updated_at: string;
}

export interface Resource {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  url: string | null;
  category_id: string;
  subcategory_id: string | null;
  resource_type: string;
  thumbnail_url: string | null;
  thumbnail_type: string | null;
  colors: string[] | null;
  metadata: Record<string, any>;
  view_count: number;
  date_added: string;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  usage_count: number;
  created_at: string;
}

export interface ResourceTag {
  resource_id: string;
  tag_id: string;
  created_at: string;
}

export interface DatabaseMetadata {
  version: string;
  created_at: string;
  last_updated: string;
  total_items: number;
  encryption_version: string;
}

export interface BinFileInfo {
  filename: string;
  size: number;
  checksum: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseConfig {
  encryptionKey: string;
  binDirectory: string;
  maxFileSize: number;
  compressionEnabled: boolean;
}
