import { supabase } from './supabase';
import type { Category, Resource, Tag, SearchFilters } from '../../types';

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getResources(
  categoryId?: string,
  subcategoryId?: string
): Promise<Resource[]> {
  let query = supabase
    .from('resources')
    .select(`
      *,
      tags:resource_tags(tag:tags(*))
    `);

  if (subcategoryId) {
    query = query.eq('subcategory_id', subcategoryId);
  } else if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((item: any) => ({
    ...item,
    tags: item.tags?.map((rt: any) => rt.tag) || [],
    is_favorite: false, // Will be set by searchResources if needed
  })) as Resource[];
}

export async function searchResources(
  filters: SearchFilters,
  userId?: string
): Promise<Resource[]> {
  let query = supabase
    .from('resources')
    .select(`
      *,
      tags:resource_tags(tag:tags(*))
    `);

  if (filters.categoryId) {
    query = query.eq('category_id', filters.categoryId);
  }
  if (filters.subcategoryId) {
    query = query.eq('subcategory_id', filters.subcategoryId);
  }
  if (filters.resourceType) {
    query = query.eq('resource_type', filters.resourceType);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;

  let resources = (data || []).map((item: any) => ({
    ...item,
    tags: item.tags?.map((rt: any) => rt.tag) || [],
    is_favorite: false,
  })) as Resource[];

  // Apply text search filter
  if (filters.query) {
    const q = filters.query.toLowerCase();
    resources = resources.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        (r.description || '').toLowerCase().includes(q) ||
        (r.url || '').toLowerCase().includes(q)
    );
  }

  // Apply tag filter
  if (filters.tags.length > 0) {
    resources = resources.filter((r) => 
      filters.tags.some(tagId => (r.tags || []).some(tag => tag.id === tagId))
    );
  }

  // Fetch user's favorites if userId is provided
  if (userId) {
    const { data: favorites } = await supabase
      .from('favorites')
      .select('resource_id')
      .eq('user_id', userId);

    const favoriteIds = new Set((favorites || []).map((f: any) => f.resource_id));
    
    resources = resources.map(r => ({
      ...r,
      is_favorite: favoriteIds.has(r.id)
    }));

    // Apply favorites filter
    if (filters.favoritesOnly) {
      resources = resources.filter((r) => r.is_favorite);
    }
  }

  return resources;
}

export async function getResourceById(id: string, userId?: string): Promise<Resource | null> {
  const { data, error } = await supabase
    .from('resources')
    .select(`
      *,
      tags:resource_tags(tag:tags(*))
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  let is_favorite = false;
  if (userId) {
    const { data: favorite } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('resource_id', id)
      .maybeSingle();
    is_favorite = !!favorite;
  }

  return {
    ...data,
    tags: data.tags?.map((rt: any) => rt.tag) || [],
    is_favorite,
  } as Resource;
}

export async function incrementViewCount(resourceId: string): Promise<void> {
  const { error } = await supabase.rpc('increment_view_count', {
    resource_id: resourceId,
  });

  if (error) {
    const { data: resource } = await supabase
      .from('resources')
      .select('view_count')
      .eq('id', resourceId)
      .maybeSingle();

    if (resource) {
      await supabase
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
  const { data: existing } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('resource_id', resourceId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('id', existing.id);

    if (error) throw error;
    return { favorite: false };
  } else {
    const { error } = await supabase
      .from('favorites')
      .insert({ user_id: userId, resource_id: resourceId });

    if (error) throw error;
    return { favorite: true };
  }
}

export async function getFavoritedResources(userId: string): Promise<Resource[]> {
  const { data, error } = await supabase
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
  let query = supabase
    .from('tags')
    .select('*')
    .order('usage_count', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function getTagsByCategory(categoryId: string): Promise<Tag[]> {
  const { data, error } = await supabase
    .from('resources')
    .select(`
      tags:resource_tags(tag:tags(*))
    `)
    .eq('category_id', categoryId);

  if (error) throw error;

  const tagMap = new Map();
  (data || []).forEach((resource: any) => {
    (resource.tags || []).forEach((rt: any) => {
      if (rt.tag) {
        tagMap.set(rt.tag.id, rt.tag);
      }
    });
  });

  return Array.from(tagMap.values());
}