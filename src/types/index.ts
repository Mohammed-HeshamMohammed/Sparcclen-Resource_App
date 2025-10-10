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
  subcategories?: Category[];
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
  metadata: Record<string, unknown>;
  view_count: number;
  date_added: string;
  created_at: string;
  updated_at: string;
  tags?: Tag[];
  is_favorite?: boolean;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  usage_count: number;
  created_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  resource_id: string;
  created_at: string;
}

export interface AppSettings {
  id: string;
  user_id: string;
  passkey_hash: string | null;
  theme: 'light' | 'dark';
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type ViewMode = 'grid' | 'list';

export interface SearchFilters {
  query: string;
  categoryId: string | null;
  subcategoryId: string | null;
  tags: string[];
  favoritesOnly: boolean;
  resourceType: string | null;
}
