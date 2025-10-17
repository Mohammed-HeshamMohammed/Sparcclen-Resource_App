import type { Category, Resource, SearchFilters } from '@/types';

// Local in-memory store + localStorage-backed favorites
class LocalStore {
  categories: Category[] = [];
  resources: Resource[] = [];

  constructor() {
    this.hydrate();
  }

  private hydrate() {
    if (typeof window === 'undefined') {
      this.categories = [];
      this.resources = [];
      return;
    }

    try {
      const rawCategories = window.localStorage.getItem('library:categories');
      const rawResources = window.localStorage.getItem('library:resources');

      const parsedCategories = rawCategories ? JSON.parse(rawCategories) : [];
      const parsedResources = rawResources ? JSON.parse(rawResources) : [];

      this.categories = Array.isArray(parsedCategories)
        ? (parsedCategories as Category[])
        : [];
      this.resources = Array.isArray(parsedResources)
        ? (parsedResources as Resource[])
        : [];
    } catch {
      this.categories = [];
      this.resources = [];
    }
  }

  getFavoritesSet(userId?: string): Set<string> {
    if (!userId || typeof window === 'undefined') return new Set<string>();
    try {
      // Primary key used across the app
      let raw = window.localStorage.getItem(`favorites_${userId}`);
      // Backward compatibility fallback (older key format)
      if (!raw) raw = window.localStorage.getItem(`favorites:${userId}`);
      if (!raw) return new Set<string>();
      const parsed = JSON.parse(raw);
      const arr = Array.isArray(parsed)
        ? (parsed as unknown[]).filter((v): v is string => typeof v === 'string')
        : [];
      return new Set(arr);
    } catch {
      return new Set<string>();
    }
  }

}

const store = new LocalStore();

const MAX_METADATA_DEPTH = 4;
const MAX_METADATA_STRINGS = 60;

const collectStringValues = (
  input: unknown,
  visited: WeakSet<object> = new WeakSet(),
  depth = 0,
): string[] => {
  if (typeof input === 'string') {
    return [input];
  }
  if (
    input === null ||
    input === undefined ||
    typeof input !== 'object' ||
    depth >= MAX_METADATA_DEPTH
  ) {
    return [];
  }

  const objectValue = input as object;
  if (visited.has(objectValue)) {
    return [];
  }
  visited.add(objectValue);

  const collected: string[] = [];
  const iteratee = Array.isArray(input)
    ? input
    : Object.values(input as Record<string, unknown>);

  for (const value of iteratee) {
    if (collected.length >= MAX_METADATA_STRINGS) {
      break;
    }
    const nested = collectStringValues(value, visited, depth + 1);
    for (const nestedValue of nested) {
      collected.push(nestedValue);
      if (collected.length >= MAX_METADATA_STRINGS) {
        break;
      }
    }
  }

  return collected;
};

const matchesQuery = (resource: Resource, normalizedQuery: string): boolean => {
  const valueMatches = (value: unknown) =>
    typeof value === 'string' && value.toLowerCase().includes(normalizedQuery);

  if (
    valueMatches(resource.title) ||
    valueMatches(resource.description) ||
    valueMatches(resource.url)
  ) {
    return true;
  }

  if (
    resource.tags?.some(
      (tag) => valueMatches(tag.name) || valueMatches(tag.slug),
    )
  ) {
    return true;
  }

  const classification =
    typeof resource.metadata?.classification === 'string'
      ? resource.metadata.classification
      : null;
  if (valueMatches(classification)) {
    return true;
  }

  const titleValues = (resource.metadata?.titleValues ?? null) as unknown;
  const metadataStrings = [
    ...collectStringValues(titleValues),
    ...collectStringValues(resource.metadata?.original ?? null),
    ...collectStringValues(resource.metadata),
  ];

  return metadataStrings.some((entry) =>
    entry.toLowerCase().includes(normalizedQuery),
  );
};

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
    const normalizedQuery = filters.query.trim().toLowerCase();
    if (normalizedQuery.length > 0) {
      list = list.filter((resource) => matchesQuery(resource, normalizedQuery));
    }
  }

  if (filters.tags.length > 0) {
    list = list.filter((r) => filters.tags.some((t) => (r.tags || []).some((rt) => rt.id === t || rt.slug === t)));
  }

  let result = list.map((r) => ({ ...r, is_favorite: favs.has(r.id) }));
  if (filters.favoritesOnly) result = result.filter((r) => r.is_favorite);
  return result;
}

export async function incrementViewCount(resourceId: string): Promise<void> {
  const idx = store.resources.findIndex((r) => r.id === resourceId);
  if (idx >= 0) {
    store.resources[idx] = { ...store.resources[idx], view_count: (store.resources[idx].view_count || 0) + 1 };
  }
}
