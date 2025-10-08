// External services
export {
  getCategories,
  getResources,
  searchResources,
  getResourceById,
  incrementViewCount,
  toggleFavorite,
  getFavoritedResources,
  getTags,
  getTagsByCategory
} from './localApi';

export { supabase } from './supabase';
