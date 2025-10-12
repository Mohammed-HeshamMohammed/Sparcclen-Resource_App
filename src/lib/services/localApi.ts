import type { Category, Resource, Tag, SearchFilters } from '@/types';

// Local in-memory store + localStorage-backed favorites
class LocalStore {
  categories: Category[] = [];
  resources: Resource[] = [];

  constructor() {
    this.init();
  }

  private genId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  private now() {
    return new Date().toISOString();
  }

  private slugify(text: string) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }

  private init() {
    // Seed minimal sample categories and resources so UI stays functional without Supabase tables
    const created_at = this.now();
    const updated_at = created_at;

    const catColorsId = this.genId();
    const catFontsId = this.genId();

    const subTwoColorId = this.genId();
    const subDisplayFontsId = this.genId();

    const colors: Category = {
      id: catColorsId,
      slug: this.slugify('Colors'),
      title: 'Colors',
      description: 'Color resources',
      parent_id: null,
      sort_order: 0,
      item_count: 0,
      created_at,
      updated_at,
      subcategories: [
        {
          id: subTwoColorId,
          slug: this.slugify('2-Color Combo'),
          title: '2-Color Combo',
          description: 'Two color combinations',
          parent_id: catColorsId,
          sort_order: 0,
          item_count: 0,
          created_at,
          updated_at,
        },
      ],
    };

    const fonts: Category = {
      id: catFontsId,
      slug: this.slugify('Fonts'),
      title: 'Fonts',
      description: 'Font resources',
      parent_id: null,
      sort_order: 1,
      item_count: 0,
      created_at,
      updated_at,
      subcategories: [
        {
          id: subDisplayFontsId,
          slug: this.slugify('Display'),
          title: 'Display',
          description: 'Display fonts',
          parent_id: catFontsId,
          sort_order: 0,
          item_count: 0,
          created_at,
          updated_at,
        },
      ],
    };

    this.categories = [colors, fonts];

    const makeResource = (
      title: string,
      category_id: string,
      subcategory_id: string | null,
      tags: string[],
      resource_type: string,
      url?: string,
    ): Resource => {
      const id = this.genId();
      const slug = this.slugify(title);
      return {
        id,
        slug,
        title,
        description: null,
        url: url || null,
        category_id,
        subcategory_id,
        resource_type,
        thumbnail_url: null,
        thumbnail_type: null,
        colors: null,
        metadata: {},
        view_count: 0,
        date_added: created_at,
        created_at,
        updated_at,
        tags: tags.map((t) => ({
          id: this.genId(),
          name: t,
          slug: this.slugify(t),
          usage_count: 0,
          created_at,
        })),
        is_favorite: false,
      };
    };

    this.resources = [
      makeResource('Blue/Orange Combo', catColorsId, subTwoColorId, ['colors', 'combo'], 'color'),
      makeResource('Blue/Orange Combo', catColorsId, subTwoColorId, ['colors', 'combo'], 'color'),
      makeResource('Blue/Orange Combo', catColorsId, subTwoColorId, ['colors', 'combo'], 'color'),
      makeResource('Blue/Orange Combo', catColorsId, subTwoColorId, ['colors', 'combo'], 'color'),
      makeResource('Blue/Orange Combo', catColorsId, subTwoColorId, ['colors', 'combo'], 'color'),
      makeResource('Blue/Orange Combo', catColorsId, subTwoColorId, ['colors', 'combo'], 'color'),
      makeResource('High-Contrast Display Font', catFontsId, subDisplayFontsId, ['fonts', 'display'], 'font'),
    ];

    // Update item_count on categories
    const counts: Record<string, number> = {};
    this.resources.forEach((r) => {
      counts[r.category_id] = (counts[r.category_id] || 0) + 1;
      if (r.subcategory_id) counts[r.subcategory_id] = (counts[r.subcategory_id] || 0) + 1;
    });

    this.categories = this.categories.map((c) => ({
      ...c,
      item_count: counts[c.id] || 0,
      subcategories: c.subcategories?.map((s) => ({ ...s, item_count: counts[s.id] || 0 })) || [],
    }));
  }

  getFavoritesSet(userId?: string): Set<string> {
    if (!userId || typeof window === 'undefined') return new Set<string>();
    try {
      const raw = window.localStorage.getItem(`favorites:${userId}`);
      if (!raw) return new Set<string>();
      const arr = JSON.parse(raw) as string[];
      return new Set(arr);
    } catch {
      return new Set<string>();
    }
  }

  saveFavoritesSet(userId: string, set: Set<string>) {
    if (typeof window === 'undefined') return;
    const arr = Array.from(set);
    window.localStorage.setItem(`favorites:${userId}`, JSON.stringify(arr));
  }
}

const store = new LocalStore();

export async function getCategories(): Promise<Category[]> {
  return [...store.categories];
}

export async function getResources(
  categoryId?: string,
  subcategoryId?: string,
): Promise<Resource[]> {
  let items = [...store.resources];
  if (subcategoryId) items = items.filter((r) => r.subcategory_id === subcategoryId);
  else if (categoryId) items = items.filter((r) => r.category_id === categoryId);
  return items.map((r) => ({ ...r }));
}

export async function searchResources(
  filters: SearchFilters,
  userId?: string,
): Promise<Resource[]> {
  const favs = store.getFavoritesSet(userId);
  let list = [...store.resources];

  if (filters.categoryId) list = list.filter((r) => r.category_id === filters.categoryId);
  if (filters.subcategoryId) list = list.filter((r) => r.subcategory_id === filters.subcategoryId);
  if (filters.resourceType) list = list.filter((r) => (r.resource_type || '').toLowerCase() === filters.resourceType?.toLowerCase());

  if (filters.query) {
    const q = filters.query.toLowerCase();
    list = list.filter((r) =>
      r.title.toLowerCase().includes(q) ||
      (r.description || '').toLowerCase().includes(q) ||
      (r.url || '').toLowerCase().includes(q),
    );
  }

  if (filters.tags.length > 0) {
    list = list.filter((r) => filters.tags.some((t) => (r.tags || []).some((rt) => rt.id === t || rt.slug === t)));
  }

  let result = list.map((r) => ({ ...r, is_favorite: favs.has(r.id) }));
  if (filters.favoritesOnly) result = result.filter((r) => r.is_favorite);
  return result;
}

export async function getResourceById(id: string, userId?: string): Promise<Resource | null> {
  const r = store.resources.find((x) => x.id === id);
  if (!r) return null;
  const favs = store.getFavoritesSet(userId);
  return { ...r, is_favorite: favs.has(r.id) };
}

export async function incrementViewCount(resourceId: string): Promise<void> {
  const idx = store.resources.findIndex((r) => r.id === resourceId);
  if (idx >= 0) {
    store.resources[idx] = { ...store.resources[idx], view_count: (store.resources[idx].view_count || 0) + 1 };
  }
}

export async function toggleFavorite(
  resourceId: string,
  userId: string,
): Promise<{ favorite: boolean }> {
  const set = store.getFavoritesSet(userId);
  if (set.has(resourceId)) {
    set.delete(resourceId);
    store.saveFavoritesSet(userId, set);
    return { favorite: false };
  }
  set.add(resourceId);
  store.saveFavoritesSet(userId, set);
  return { favorite: true };
}

export async function getFavoritedResources(userId: string): Promise<Resource[]> {
  const set = store.getFavoritesSet(userId);
  return store.resources.filter((r) => set.has(r.id)).map((r) => ({ ...r, is_favorite: true }));
}

export async function getTags(limit?: number): Promise<Tag[]> {
  const map = new Map<string, Tag>();
  store.resources.forEach((r) => (r.tags || []).forEach((t) => {
    if (!map.has(t.id)) map.set(t.id, t);
  }));
  let tags = Array.from(map.values());
  if (limit) tags = tags.slice(0, limit);
  return tags;
}

export async function getTagsByCategory(categoryId: string): Promise<Tag[]> {
  const map = new Map<string, Tag>();
  store.resources
    .filter((r) => r.category_id === categoryId)
    .forEach((r) => (r.tags || []).forEach((t) => {
      if (!map.has(t.id)) map.set(t.id, t);
    }));
  return Array.from(map.values());
}
