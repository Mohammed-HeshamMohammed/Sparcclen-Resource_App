import { supabase } from './supabase';
import type { Category, Resource, Tag, SearchFilters } from '../../types';
import { encryptedDatabase } from '../../lib/database/encryptedDatabase';
import type { Resource as EncryptedResource, Tag as EncryptedTag } from '../../types/database/encryptedDatabase';

function mapEncryptedToAppResource(er: EncryptedResource, tags: EncryptedTag[] = [], is_favorite = false): Resource {
  return {
    id: er.id,
    slug: er.slug,
    title: er.title,
    description: er.description,
    url: er.url,
    category_id: er.category_id,
    subcategory_id: er.subcategory_id,
    resource_type: er.resource_type,
    thumbnail_url: er.thumbnail_url,
    thumbnail_type: er.thumbnail_type,
    colors: er.colors,
    metadata: er.metadata,
    view_count: er.view_count,
    date_added: er.date_added,
    created_at: er.created_at,
    updated_at: er.updated_at,
    tags: tags.map(t => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      usage_count: t.usage_count,
      created_at: t.created_at
    })),
    is_favorite,
  };
}

export async function getCategories(): Promise<Category[]> {
  // Read categories from encrypted database
  const categories = await encryptedDatabase.getCategories();
  return categories.map(cat => ({
    id: cat.id,
    slug: cat.slug,
    title: cat.title,
    description: cat.description,
    parent_id: cat.parent_id,
    sort_order: cat.sort_order,
    item_count: cat.item_count,
    created_at: cat.created_at,
    updated_at: cat.updated_at
  }));
}

export async function getResources(
  categoryId?: string,
  subcategoryId?: string
): Promise<Resource[]> {
  // Read resources from encrypted database and filter by category/subcategory
  let resources: EncryptedResource[];
  if (subcategoryId) {
    resources = await encryptedDatabase.getResourcesBySubcategory(subcategoryId);
  } else if (categoryId) {
    resources = await encryptedDatabase.getResourcesByCategory(categoryId);
  } else {
    resources = await encryptedDatabase.getResources();
  }

  const allResourceTags = await encryptedDatabase.getResourceTags();
  const allTags = await encryptedDatabase.getTags();

  return resources.map((r) => {
    const tagIds = allResourceTags.filter((rt) => rt.resource_id === r.id).map((rt) => rt.tag_id);
    const tags = allTags.filter((t) => tagIds.includes(t.id));
    return mapEncryptedToAppResource(r, tags);
  });
}

export async function searchResources(
  filters: SearchFilters,
  userId?: string
): Promise<Resource[]> {
  // Search is done against the encrypted database
  let resources = await encryptedDatabase.getResources();

  if (filters.query) {
    const q = filters.query.toLowerCase();
    resources = resources.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        (r.description || '').toLowerCase().includes(q) ||
        (r.url || '').toLowerCase().includes(q)
    );
  }

  if (filters.categoryId) resources = resources.filter((r) => r.category_id === filters.categoryId);
  if (filters.subcategoryId) resources = resources.filter((r) => r.subcategory_id === filters.subcategoryId);
  if (filters.resourceType) resources = resources.filter((r) => r.resource_type === filters.resourceType);

  // Fetch user's favorites from Supabase to mark is_favorite where needed
  let favoriteIds = new Set<string>();
  if (userId) {
    const { data } = await (supabase as any)
      .from('favorites')
      .select('resource_id')
      .eq('user_id', userId);
    (data || []).forEach((f: any) => favoriteIds.add(f.resource_id));
  }

  const allResourceTags = await encryptedDatabase.getResourceTags();
  const allTags = await encryptedDatabase.getTags();

  let results = resources.map((r) => {
    const tagIds = allResourceTags.filter((rt) => rt.resource_id === r.id).map((rt) => rt.tag_id);
    const tags = allTags.filter((t) => tagIds.includes(t.id));
    return mapEncryptedToAppResource(r, tags, favoriteIds.has(r.id));
  });

  if (filters.tags.length > 0) {
    // Filter by tags
    results = results.filter((r) => 
      filters.tags.some(tagId => (r.tags || []).some(tag => tag.id === tagId))
    );
  }

  if (filters.favoritesOnly && userId) {
    results = results.filter((r) => r.is_favorite);
  }

  return results;
}

export async function getResourceById(id: string, userId?: string): Promise<Resource | null> {
  const resources = await encryptedDatabase.getResources();
  const resource = resources.find((r) => r.id === id) || null;
  if (!resource) return null;
  
  const allResourceTags = await encryptedDatabase.getResourceTags();
  const allTags = await encryptedDatabase.getTags();
  const tagIds = allResourceTags.filter((rt) => rt.resource_id === id).map((rt) => rt.tag_id);
  const tags = allTags.filter((t) => tagIds.includes(t.id));

  if (userId) {
    const { data } = await (supabase as any)
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('resource_id', id)
      .maybeSingle();
    return mapEncryptedToAppResource(resource, tags, !!data);
  }

  return mapEncryptedToAppResource(resource, tags, false);
}

export async function incrementViewCount(resourceId: string): Promise<void> {
  const { error } = await (supabase as any).rpc('increment_view_count', {
    resource_id: resourceId,
  });

  if (error) {
    const { data: resource } = await (supabase as any)
      .from('resources')
      .select('view_count')
      .eq('id', resourceId)
      .maybeSingle();

    if (resource) {
      await (supabase as any)
        .from('resources')
        .update({ view_count: resource.view_count + 1 })
        .eq('id', resourceId);
    }
  }
}

export async function toggleFavorite(
  resourceId: string,
  userId: string
): Promise<{ favorite: boolean }> {
  const { data: existing } = await (supabase as any)
    .from('favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('resource_id', resourceId)
    .maybeSingle();

  if (existing) {
    const { error } = await (supabase as any)
      .from('favorites')
      .delete()
      .eq('id', existing.id);

    if (error) throw error;
    return { favorite: false };
  } else {
    const { error } = await (supabase as any)
      .from('favorites')
      .insert({ user_id: userId, resource_id: resourceId });

    if (error) throw error;
    return { favorite: true };
  }
}

export async function getFavoritedResources(userId: string): Promise<Resource[]> {
  const { data, error } = await (supabase as any)
    .from('favorites')
    .select(`
      resource:resources(
        *,
        tags:resource_tags(tag:tags(*))
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || [])
    .map((item: any) => ({
      ...item.resource,
      tags: item.resource?.tags?.map((rt: any) => rt.tag) || [],
      is_favorite: true,
    }))
    .filter((item: any) => item.id) as Resource[];
}

export async function getTags(limit?: number): Promise<Tag[]> {
  // Tags are stored in encrypted database
  const tags = await encryptedDatabase.getTags();
  if (limit) return tags.slice(0, limit);
  return tags;
}

export async function getTagsByCategory(categoryId: string): Promise<Tag[]> {
  // Collect tags for resources in the category from encrypted database
  const resources = await encryptedDatabase.getResources();
  const resourceIds = new Set(resources.filter((r) => r.category_id === categoryId).map((r) => r.id));
  const resourceTags = await encryptedDatabase.getResourceTags();
  const tagIds = new Set(resourceTags.filter((rt) => resourceIds.has(rt.resource_id)).map((rt) => rt.tag_id));
  const tags = await encryptedDatabase.getTags();
  return tags.filter((t) => tagIds.has(t.id));
}
