export { avatarService } from './ui/avatarService'; // Avatar service with online/offline support
export {
  fetchProfileDecrypted,
  downloadProfilePicture,
  saveProfileEncrypted,
  uploadProfilePicture,
} from './profile/profileCloud'; // Cloud encrypted profiles API
export { getOrCreateProfileKey } from './profile/profileKey'; // Profile encryption keys
export { saveEncryptedProfileLocal } from './profile/profileLocal'; // Local encrypted profile persistence
export {
  getCategories,
  getResources,
  incrementViewCount,
  searchResources,
} from './filesystem/localApi'; // External services
export {
  listLibraryBinFiles,
  buildLibraryCategories,
  buildLibraryResources,
  type LibrarySegmentsMap,
} from './filesystem/libraryFs'; // Library file system operations
export { supabase } from './auth/supabase';
export * as viewsFavsService from './viewsFavs';
export { authenticateWithPasskeyOffline, isWebAuthnSupported } from './auth/webauthn';
export {
  loadDashboardCache,
  saveDashboardCache,
  getUserPublicProfileCached,
  setUserPublicProfileCached,
  clearDashboardCache,
  clearAllCaches,
} from './dashboardCache';
