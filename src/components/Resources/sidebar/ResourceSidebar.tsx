import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui';
import { LogOut, Import } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { readSave, type SaveData } from '@/lib/system/saveClient';
import { avatarService } from '@/lib/services';
import { LibrarySubmenu } from './LibrarySubmenu';

const DashboardIcon = () => (
  <div className="h-8 w-8 flex items-center justify-center text-gray-300 rounded">
    <svg fill="#000000" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-8 w-8">
      <path d="M22,4V7a2,2,0,0,1-2,2H15a2,2,0,0,1-2-2V4a2,2,0,0,1,2-2h5A2,2,0,0,1,22,4ZM9,15H4a2,2,0,0,0-2,2v3a2,2,0,0,0,2,2H9a2,2,0,0,0,2-2V17A2,2,0,0,0,9,15Z" style={{fill: "#2ca9bc"}} />
      <path d="M11,4v7a2,2,0,0,1-2,2H4a2,2,0,0,1-2-2V4A2,2,0,0,1,4,2H9A2,2,0,0,1,11,4Zm9,7H15a2,2,0,0,0-2,2v7a2,2,0,0,0,2,2h5a2,2,0,0,0,2-2V13A2,2,0,0,0,20,11Z" style={{fill: "#000000"}} />
    </svg>
  </div>
);

const ProfileIcon = () => (
  <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 394.662 394.662" className="h-8 w-8">
    <g>
      <path style={{fill:"#F4C8C1"}} d="M258.211,96.97c-15.3-16.09-36.92-26.12-60.88-26.12c-23.97,0-45.59,10.04-60.9,26.13 c6.96-27.14,31.58-47.2,60.9-47.2C226.631,49.78,251.261,69.84,258.211,96.97z"></path>
      <path style={{fill:"#FFDED7"}} d="M260.181,112.63c0,34.72-28.14,79.4-62.85,79.4c-34.72,0-62.86-44.68-62.86-79.4 c0-5.4,0.68-10.65,1.96-15.65c15.31-16.09,36.93-26.13,60.9-26.13c23.96,0,45.58,10.03,60.88,26.12 C259.501,101.98,260.181,107.22,260.181,112.63z"></path>
      <path style={{fill:"#999999"}} d="M300.531,279.47v0.01c-27.75,23.75-63.8,38.1-103.2,38.1c-19.26,0-37.73-3.43-54.81-9.72 c-17.87-6.56-34.22-16.25-48.41-28.4c0.08-0.87,0.17-1.73,0.27-2.6c0.09-0.76,0.18-1.52,0.29-2.27c0.03-0.21,0.06-0.41,0.09-0.62 c0.1-0.75,0.22-1.5,0.35-2.24c0.06-0.38,0.13-0.77,0.2-1.16c0.06-0.38,0.14-0.76,0.21-1.15c0.08-0.41,0.16-0.83,0.25-1.25 c0.08-0.42,0.17-0.83,0.26-1.24s0.18-0.82,0.28-1.23c0.04-0.18,0.08-0.36,0.12-0.53c0.04-0.18,0.08-0.36,0.13-0.54 c0.13-0.55,0.26-1.1,0.41-1.65c0-0.04,0.01-0.08,0.03-0.11c15.75,12.86,34.01,22.75,53.93,28.82c14.67,4.48,30.26,6.89,46.4,6.89 c38.05,0,72.98-13.38,100.32-35.7c0.03,0.12,0.06,0.24,0.09,0.37c0.01,0.04,0.02,0.07,0.03,0.11c0.13,0.5,0.25,0.99,0.37,1.49v0.01 c0.01,0.04,0.02,0.09,0.03,0.14c0.02,0.07,0.04,0.15,0.05,0.22c0.14,0.57,0.27,1.15,0.39,1.72c0.11,0.51,0.22,1.02,0.32,1.54 c0.09,0.41,0.17,0.81,0.24,1.22c0.13,0.65,0.24,1.3,0.35,1.96c0.01,0.07,0.03,0.15,0.03,0.23c0.11,0.63,0.21,1.26,0.3,1.9 c0.05,0.3,0.09,0.6,0.13,0.91c0.11,0.72,0.2,1.44,0.28,2.17C300.361,277.73,300.451,278.6,300.531,279.47z"></path>
      <path style={{fill:"#CCCCCC"}} d="M297.651,262.88c-27.34,22.32-62.27,35.7-100.32,35.7c-38.06,0-72.98-13.38-100.33-35.71 c5.43-20.95,17.26-39.33,33.27-52.93c11.16-9.48,27.12-10.27,39.64-2.68c0.65,0.4,1.31,0.78,1.98,1.15c0.37,0.21,0.74,0.41,1.11,0.6c1.05,0.57,2.12,1.1,3.2,1.59 c0.22,0.11,0.45,0.21,0.68,0.31c0.39,0.18,0.79,0.35,1.18,0.51c0.49,0.2,0.98,0.4,1.47,0.59c1.29,0.49,2.6,0.94,3.92,1.33 c0.47,0.14,0.95,0.28,1.43,0.4c0.51,0.14,1.02,0.27,1.54,0.39c0.58,0.13,1.15,0.25,1.73,0.37c0.44,0.09,0.88,0.17,1.32,0.24h0.03 c0.43,0.07,0.85,0.14,1.28,0.2c0.03,0,0.05,0.01,0.08,0.01h0.01c0.05,0.01,0.11,0.01,0.16,0.02c0.39,0.06,0.79,0.1,1.18,0.15 c0.41,0.05,0.82,0.09,1.23,0.11c0.12,0.02,0.23,0.03,0.35,0.04c0.32,0.02,0.63,0.04,0.95,0.05c0.32,0.03,0.64,0.04,0.96,0.05 c0.54,0.02,1.09,0.03,1.63,0.03c9.7,0,18.95-3.01,27.41-8.14c12.49-7.56,28.42-6.83,39.56,2.61c0.51,0.43,1.02,0.87,1.52,1.31 c0.38,0.34,0.75,0.67,1.12,1.01c0.98,0.89,1.95,1.8,2.9,2.73c0.57,0.55,1.12,1.11,1.67,1.67c0.61,0.62,1.2,1.25,1.8,1.89 c0.53,0.57,1.06,1.15,1.57,1.74c0.35,0.4,0.7,0.79,1.04,1.19c0.3,0.34,0.59,0.68,0.88,1.03c0.65,0.77,1.28,1.56,1.9,2.35 c0.6,0.76,1.19,1.52,1.77,2.3c0.02,0.03,0.04,0.07,0.07,0.1c0.03,0.04,0.06,0.07,0.08,0.11c0.35,0.45,0.69,0.92,1.01,1.38 c0.39,0.53,0.77,1.07,1.14,1.62c0.38,0.54,0.75,1.09,1.11,1.64c0.33,0.5,0.66,1,0.98,1.51c0.04,0.07,0.08,0.14,0.13,0.21 c0.22,0.34,0.43,0.67,0.63,1.02c0.3,0.47,0.59,0.95,0.87,1.44c0.06,0.09,0.12,0.19,0.17,0.28c0.27,0.44,0.53,0.89,0.77,1.34 c0.2,0.32,0.38,0.65,0.56,0.98c0.45,0.81,0.89,1.63,1.32,2.46c0.14,0.27,0.29,0.55,0.43,0.83c0.15,0.28,0.29,0.56,0.42,0.84 c0.01,0.02,0.02,0.03,0.03,0.05s0.02,0.04,0.03,0.06c0.26,0.53,0.52,1.06,0.77,1.6c0.16,0.32,0.31,0.64,0.45,0.96 c0.33,0.71,0.65,1.42,0.96,2.13c0.3,0.68,0.59,1.37,0.87,2.07c0.29,0.69,0.57,1.39,0.84,2.1c0.07,0.19,0.14,0.38,0.21,0.58 c0.18,0.48,0.36,0.95,0.53,1.43c0.02,0.04,0.03,0.09,0.05,0.13c0.11,0.3,0.22,0.61,0.32,0.92c0.25,0.71,0.49,1.43,0.73,2.16 s0.47,1.47,0.69,2.21c0.18,0.62,0.36,1.23,0.53,1.86c0.13,0.46,0.26,0.92,0.38,1.39c0.04,0.12,0.07,0.25,0.1,0.38 c0.03,0.12,0.06,0.24,0.09,0.37c0.01,0.04,0.02,0.07,0.03,0.11c0.13,0.49,0.26,0.99,0.37,1.49v0.01c0.01,0.04,0.02,0.09,0.03,0.14 c0.02,0.07,0.04,0.15,0.05,0.22c0.14,0.57,0.27,1.14,0.39,1.72c0.11,0.51,0.22,1.02,0.32,1.54c0.09,0.41,0.17,0.81,0.24,1.22 c0.13,0.65,0.24,1.3,0.35,1.96c0.01,0.07,0.03,0.15,0.03,0.23c0.11,0.63,0.21,1.26,0.3,1.9c0.05,0.3,0.09,0.6,0.13,0.91 c0.11,0.72,0.2,1.44,0.28,2.17c0.1,0.86,0.19,1.73,0.27,2.6c34.03-29.12,55.59-72.38,55.59-120.68 C356.121,104.78,329.151,57.06,287.951,28.38z M203.011,191.62h-0.01c-1.87,0.27-3.76,0.41-5.67,0.41 c-34.72,0-62.86-44.68-62.86-79.4c0-34.71,28.14-62.85,62.86-62.85c26.69,0,49.5,16.64,58.61,40.11 c2.74,7.05,4.24,14.72,4.24,22.74C260.181,145.44,235.061,187.13,203.011,191.62z"></path>
      <rect x="88.102" y="344.873" style={{fill:"#666666"}} width="218.452" height="15"></rect>
      <rect x="88.102" y="379.662" style={{fill:"#666666"}} width="218.452" height="15"></rect>
      <path style={{opacity:0.23, fill:"#F2F2F2"}} d="M126.161,16.8l-11.09,21.31l-11.83,22.74l-25.96,49.88 l-12.39,23.82l-23.94,46l-0.73,1.41c-1.11-7.56-1.68-15.3-1.68-23.17C38.541,96.68,74.201,42.9,126.161,16.8z"></path>
      <path style={{opacity:0.23, fill:"#F2F2F2"}} d="M356.121,158.79c0,48.3-21.56,91.56-55.59,120.68v0.01 c-27.75,23.75-63.8,38.1-103.2,38.1c-19.26,0-37.73-3.43-54.81-9.72l8.41-16.17l39.93-76.74h0.01l12.13-23.33h0.01l52.93-101.73 l32.01-61.51C329.151,57.06,356.121,104.78,356.121,158.79z"></path>
    </g>
  </svg>
);

const RoleManagementIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-8 w-8">
    <path opacity="0.5" d="M3 10.4167C3 7.21907 3 5.62028 3.37752 5.08241C3.75503 4.54454 5.25832 4.02996 8.26491 3.00079L8.83772 2.80472C10.405 2.26824 11.1886 2 12 2C12.8114 2 13.595 2.26824 15.1623 2.80472L15.7351 3.00079C18.7417 4.02996 20.245 4.54454 20.6225 5.08241C21 5.62028 21 7.21907 21 10.4167V11.9914C21 17.6294 16.761 20.3655 14.1014 21.5273C13.38 21.8424 13.0193 22 12 22C10.9807 22 10.62 21.8424 9.89856 21.5273C7.23896 20.3655 3 17.6294 3 11.9914V10.4167Z" fill="#003cff"></path>
    <path d="M14 9C14 10.1046 13.1046 11 12 11C10.8954 11 10 10.1046 10 9C10 7.89543 10.8954 7 12 7C13.1046 7 14 7.89543 14 9Z" fill="#003cff"></path>
    <path d="M12 17C16 17 16 16.1046 16 15C16 13.8954 14.2091 13 12 13C9.79086 13 8 13.8954 8 15C8 16.1046 8 17 12 17Z" fill="#1C274C"></path>
  </svg>
);
const SettingsIcon = () => (
  <div className="h-8 w-8 flex items-center justify-center text-gray-300 rounded">
    <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30" className="h-8 w-8">
      <path d="M26.7,12.3c-2.1,0.4-4,0-4.7-1.3c-0.7-1.3-0.2-3.1,1.3-4.7c-1.3-1.3-3-2.2-4.8-2.8C17.8,5.6,16.5,7,15,7 s-2.8-1.4-3.5-3.5C9.7,4.1,8.1,5,6.8,6.3c1.5,1.6,2,3.5,1.3,4.7c-0.7,1.3-2.6,1.7-4.7,1.3C3.1,13.1,3,14.1,3,15s0.1,1.9,0.3,2.7 c2.1-0.4,4,0,4.7,1.3c0.7,1.3,0.2,3.1-1.3,4.7c1.3,1.3,3,2.2,4.8,2.8c0.7-2.1,2-3.5,3.5-3.5s2.8,1.4,3.5,3.5 c1.8-0.5,3.4-1.5,4.8-2.8c-1.5-1.6-2-3.5-1.3-4.7c0.7-1.3,2.6-1.7,4.7-1.3c0.2-0.9,0.3-1.8,0.3-2.7S26.9,13.1,26.7,12.3z" fill="#8A8AFF" />
      <circle cx="15" cy="15" r="3" fill="#E3FAFF" />
    </svg>
  </div>
);


const LibraryIcon = () => (
  <div className="h-8 w-8 flex items-center justify-center text-gray-300 rounded">
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" className="h-8 w-8">
      <path d="M54.9 39.7l7.3 7.6l-32.1 16.1s-4.2 2.1-6.2-1.2c-8-13 31-22.5 31-22.5" fill="#256382" />
      <path d="M29.2 53.9s-6.1 2.3-5 6.6c1.2 4.5 6.1 1.8 6.1 1.8l30.5-15s-1.7-4.8 1.4-8l-33 14.6" fill="#d9e3e8" />
      <path fill="#42ade2" d="M34.4 8.9L63.6 39L29.1 53.3L7 16.7z" />
      <g fill="#94989b">
        <path d="M60.7 42.6l-20.4 8.8l20-9.7z" />
        <path d="M60.4 45.2l-21.7 9.5L60 44.3z" />
        <path d="M60.6 46.7L32.9 59.4l27.3-13.6z" />
      </g>
      <path d="M23.8 62.1c-3.4-7.5 5.3-8.8 5.3-8.8L7 16.7s-5-.1-5 5.4c0 2.3 1 4 1 4l20.8 36" fill="#428bc1" />
      <path d="M8.7 32.2l-7.3 7.6l32.1 16.1s4.2 2.1 6.2-1.2c8-13-31-22.5-31-22.5" fill="#547725" />
      <path d="M34.3 46.4s6.1 2.3 5 6.6c-1.2 4.5-6 1.8-6 1.8l-30.5-15s1.7-4.8-1.4-8l32.9 14.6" fill="#d9e3e8" />
      <path fill="#83bf4f" d="M29.2 1.4L0 31.5l34.5 14.3L56.6 9.2z" />
      <g fill="#94989b">
        <path d="M3.2 34.2l20 9.7l-20.4-8.8z" />
        <path d="M3.6 36.8l21.2 10.4l-21.7-9.5z" />
        <path d="M3.4 38.3l27.2 13.6L2.9 39.2z" />
      </g>
      <path d="M39.8 54.6c3.4-7.5-5.3-8.8-5.3-8.8L56.6 9.2s5-.1 5 5.4c0 2.3-1 4-1 4l-20.8 36" fill="#699635" />
      <path d="M56.7 26l6.1 6.4l-27.1 13.5s-3.6 1.7-5.3-1C23.8 34 56.7 26 56.7 26z" fill="#962c2c" />
      <path d="M35 38s-5.2 1.9-4.2 5.6c1 3.8 5.1 1.5 5.1 1.5l25.7-12.7s-1.4-4 1.2-6.7L35 38z" fill="#d9e3e8" />
      <path fill="#ed4c5c" d="M39.4 0L64 25.4L34.9 37.5L16.2 6.6z" />
      <path fill="#ffffff" d="M40.1 5.8l4.8 5.3l-17.7 6.7L23 11z" />
      <g fill="#94989b">
        <path d="M61.6 28.5l-17.2 7.3l16.8-8.2z" />
        <path d="M61.4 30.7L43 38.6l18-8.8z" />
        <path d="M61.6 31.9L38.2 42.6L61.1 31z" />
      </g>
      <path d="M30.5 44.9c-2.8-6.3 4.5-7.4 4.5-7.4L16.2 6.6s-4.3-.1-4.3 4.5c0 1.9.8 3.4.8 3.4l17.8 30.4" fill="#c94747" />
    </svg>
  </div>
);

interface ResourceSidebarProps {
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  onOpenRoles: () => void;
  onOpenDashboard: () => void;
  onOpenLibrary: () => void;
  onOpenImports: () => void;
  onOpenLibraryCategory: (slug: string) => void;
  isLibraryActive: boolean;
}

export function ResourceSidebar({
  onOpenSettings,
  onOpenProfile,
  onOpenRoles,
  onOpenDashboard,
  onOpenLibrary,
  onOpenImports,
  onOpenLibraryCategory,
  isLibraryActive,
}: ResourceSidebarProps) {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [save, setSave] = useState<SaveData | null>(null);
  const [resolvedAvatarUrl, setResolvedAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const updateOnline = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOnline);
    setIsOnline(navigator.onLine);
    (async () => {
      try { setSave(await readSave()); } catch {}
    })();
    const onSaveUpdated = (e: CustomEvent) => {
      try { if (e?.detail) setSave(e.detail as SaveData); } catch {}
    };
    window.addEventListener('save:updated', onSaveUpdated as EventListener);
    return () => {
      window.removeEventListener('online', updateOnline);
      window.removeEventListener('offline', updateOnline);
      window.removeEventListener('save:updated', onSaveUpdated as EventListener);
    };
  }, []);

  const offlineActive = !isOnline && !!save?.offlineSession;
  const offlineDisplayName = (save?.displayName && save.displayName.trim()) || 'offline user';

  useEffect(() => {
    let active = true;

    const resolveAvatar = async () => {
      if (profile.avatarUrl) {
        setResolvedAvatarUrl(profile.avatarUrl);
        return;
      }

      const candidateEmail =
        (typeof profile.email === 'string' && profile.email) ||
        user?.email ||
        save?.lastEmail ||
        null;

      if (!candidateEmail) {
        setResolvedAvatarUrl(null);
        return;
      }

      try {
        const url = await avatarService.getAvatarUrl(candidateEmail, true);
        if (active) setResolvedAvatarUrl(url ?? null);
      } catch {
        if (active) setResolvedAvatarUrl(null);
      }
    };

    resolveAvatar();

    return () => {
      active = false;
    };
  }, [profile.avatarUrl, profile.email, user?.email, save?.lastEmail]);

  const handleNavigation = (label: string) => {
    if (label === 'Dashboard') {
      onOpenDashboard();
    } else if (label === 'Library') {
      onOpenLibrary();
    } else if (label === 'Imports') {
      onOpenImports();
    } else if (label === 'Profile') {
      // Open profile as content replacement
      onOpenProfile();
    } else if (label === 'Settings') {
      // Open settings modal
      onOpenSettings();
    } else if (label === 'Role Management') {
      onOpenRoles();
    }
  };

  const roleFromMeta = ((user?.user_metadata || {}) as Record<string, unknown>)['role']
  const role = (typeof profile.accountType === 'string' && profile.accountType) || (typeof roleFromMeta === 'string' ? roleFromMeta : undefined)

  // Role badge styles

  const badgeClass = (() => {
    switch (role) {
      case 'CEO':
        return 'bg-purple-600 text-white'
      case 'Admin':
        return 'bg-amber-500 text-white'
      case 'Premium':
        return 'bg-emerald-500 text-white'
      case 'Free':
      default:
        return 'bg-gray-500 text-white'
    }
  })()

  const sidebarAvatarUrl = resolvedAvatarUrl ?? profile.avatarUrl ?? null
  const fallbackInitial = (() => {
    const source =
      (profile.displayName && profile.displayName.trim()) ||
      (typeof profile.email === 'string' && profile.email) ||
      (user?.email ?? '') ||
      offlineDisplayName
    return source ? source.charAt(0).toUpperCase() : 'U'
  })()

  const navigationItems = [
    {
      label: 'Dashboard',
      href: '/shell',
      icon: <DashboardIcon />,
    },
    {
      label: 'Library',
      href: '/library',
      icon: <LibraryIcon />,
    },
    {
      label: 'Imports',
      href: '/imports',
      icon: <Import className="h-8 w-8 text-gray-300" />,
    },
    {
      label: 'Profile',
      href: '/profile',
      icon: <ProfileIcon />,
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: <SettingsIcon />,
    },
  ] as Array<{ label: string; href: string; icon: JSX.Element }>;

  

  // Conditionally add Role Management for CEO/Admin and only when online
  if (isOnline && role && ['CEO', 'Admin'].includes(role)) {
    navigationItems.splice(2, 0, {
      label: 'Role Management',
      href: '/roles',
      icon: <RoleManagementIcon />,
    })
  }

  return (
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody className="justify-between gap-4">
        <div className="flex flex-col flex-1 px-2 overflow-y-auto overflow-x-hidden">
          <Logo open={open} />
          
          {/* Navigation Items */}
          <div className="mt-8 flex flex-col gap-0.5">
            {navigationItems.map((item) => (
              <div key={item.label}>
                <SidebarLink
                  link={item}
                  onClick={() => handleNavigation(item.label)}
                />
                {item.label === 'Library' && (
                  <LibrarySubmenu
                    isOpen={isLibraryActive}
                    sidebarOpen={open}
                    onSelect={(slug) => {
                      handleNavigation('Library');
                      onOpenLibraryCategory(slug);
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* User Avatar with Name and Logout (online or offline) */}
        {(user || offlineActive) && (
          <div className="relative flex items-center justify-start">
            {/* Avatar with role-based ring (CEO: rotating conic ring + glow; others: static colored ring) */}
            {role === 'CEO' ? (
              <div className="relative z-20 w-14 h-14 flex-shrink-0">
                {/* Rotating color ring */}
                <div className="absolute inset-0 rounded-full">
                  <div className="absolute inset-0 rounded-full bg-[conic-gradient(#ff005e,#ffbe0b,#00f5d4,#00bbf9,#9b5de5,#ff005e)] animate-rotate-slow"></div>
                  {/* Rotating glow */}
                  <div className="absolute -inset-1 rounded-full bg-[conic-gradient(#ff005e,#ffbe0b,#00f5d4,#00bbf9,#9b5de5,#ff005e)] blur-md opacity-40 animate-rotate-slow"></div>
                </div>
                {/* Inner circle (static) */}
                <div className="absolute inset-[3px] rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  {sidebarAvatarUrl ? (
                    <img
                      src={sidebarAvatarUrl}
                      alt="Profile"
                      className="w-full h-full object-cover object-center rounded-full"
                    />
                  ) : (
                    <span className="text-white text-xl font-semibold leading-none">
                      {fallbackInitial}
                    </span>
                  )}
                </div>
                {role && (
                  <span className={`absolute -top-1 -right-1 px-1.5 py-0.5 text-[10px] leading-none rounded-full font-semibold shadow ${badgeClass}`}>
                    {role}
                  </span>
                )}
              </div>
            ) : (
              <div className="relative z-20 w-14 h-14 rounded-full flex-shrink-0">
                <div className="absolute inset-0 rounded-full"></div>
                <div className={`w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center ring-2 ring-offset-2 dark:ring-offset-gray-950 ring-offset-white ${
                  role === 'Admin' ? 'ring-amber-500 shadow-[0_0_12px_#f59e0b40]' : role === 'Premium' ? 'ring-emerald-500 shadow-[0_0_12px_#10b98140]' : 'ring-gray-400 shadow-[0_0_10px_#9ca3af40]'
                }`}>
                  {sidebarAvatarUrl ? (
                    <img
                      src={sidebarAvatarUrl}
                      alt="Profile"
                      className="w-full h-full object-cover object-center rounded-full"
                    />
                  ) : (
                    <span className="text-white text-xl font-semibold leading-none">
                      {fallbackInitial}
                    </span>
                  )}
                </div>
                {role && (
                  <span className={`absolute -top-1 -right-1 px-1.5 py-0.5 text-[10px] leading-none rounded-full font-semibold shadow ${badgeClass}`}>
                    {role}
                  </span>
                )}
              </div>
            )}
            
            {/* Animated background that grows from behind the avatar */}
            <motion.div
              className="absolute inset-0 flex items-center justify-between rounded-full"
              animate={{
                paddingLeft: open ? "12px" : "0px",
                paddingRight: open ? "12px" : "0px",
                paddingTop: open ? "6px" : "0px",
                paddingBottom: open ? "6px" : "0px",
                marginLeft: open ? "-8px" : "0px",
                marginRight: open ? "-8px" : "0px",
              }}
              transition={{
                duration: 0.15,
                ease: "easeInOut"
              }}
            >
              {/* Text content that slides in from the right of avatar */}
              <div className="flex items-center w-full">
                <div className="w-14 h-14 flex-shrink-0" /> {/* Spacer for avatar */}
                <motion.div
                  animate={{
                    opacity: open ? 1 : 0,
                    width: open ? "auto" : 0,
                    marginLeft: open ? "8px" : "0px"
                  }}
                  transition={{
                    duration: 0.15,
                    ease: "easeInOut"
                  }}
                  className="flex flex-col overflow-hidden whitespace-nowrap min-w-0 flex-1"
                >
                  <span className="text-white text-sm font-medium truncate">
                    {user ? profile.displayName : offlineDisplayName}
                  </span>
                  <span className="text-gray-400 text-xs truncate">
                    {user ? profile.email : "Email unavailable in offline mode"}
                  </span>
                </motion.div>
                
                {/* Logout button */}
                <motion.div
                  animate={{
                    opacity: open ? 1 : 0,
                    width: open ? "auto" : 0,
                  }}
                  transition={{
                    duration: 0.15,
                    ease: "easeInOut"
                  }}
                  className="overflow-hidden flex-shrink-0"
                >
                  <button
                    onClick={() => signOut()}
                    className="p-2 rounded transition-colors"
                    title="Logout"
                  >
                    <LogOut className="h-5 w-5 text-gray-400" />
                  </button>
                </motion.div>
              </div>
            </motion.div>
          </div>
        )}
      </SidebarBody>
    </Sidebar>
  );
}

export const Logo = ({ open }: { open: boolean }) => {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
        <LibraryIcon />
      </div>
      <motion.div
        animate={{
          opacity: open ? 1 : 0,
          width: open ? "auto" : 0,
        }}
        transition={{
          duration: 0.15,
          ease: "easeInOut"
        }}
        className="flex flex-col overflow-hidden whitespace-nowrap"
      >
        <span className="font-bold text-white text-lg">
          Sparcclen
        </span>
        <span className="text-xs text-gray-400">
          Initiate the impossible
        </span>
      </motion.div>
    </div>
  );
};

export const LogoIcon = () => {
  return (
    <div className="flex items-center justify-center py-2">
      <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
        <LibraryIcon />
      </div>
    </div>
  );
};
