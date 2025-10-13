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

// Cloud encrypted profiles API
export {
  saveProfileEncrypted,
  fetchProfileDecrypted,
  uploadProfilePictureEncrypted,
  downloadProfilePictureDecrypted,
} from './profileCloud';

// Avatar service with online/offline support
export { avatarService } from './avatarService';
