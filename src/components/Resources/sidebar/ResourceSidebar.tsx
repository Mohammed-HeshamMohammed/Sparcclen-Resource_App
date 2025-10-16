import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui';
import { LogOut, ShieldCheck, Settings as SettingsIconLucide } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { readSave, type SaveData } from '@/lib/system/saveClient';
import { avatarService } from '@/lib/services';
import { LibrarySubmenu } from './LibrarySubmenu';

export const DashboardIcon = () => (
  <svg fill="#000000" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-9 w-9">
    <path d="M22,4V7a2,2,0,0,1-2,2H15a2,2,0,0,1-2-2V4a2,2,0,0,1,2-2h5A2,2,0,0,1,22,4ZM9,15H4a2,2,0,0,0-2,2v3a2,2,0,0,0,2,2H9a2,2,0,0,0,2-2V17A2,2,0,0,0,9,15Z" style={{ fill: '#2ca9bc' }} />
    <path d="M11,4v7a2,2,0,0,1-2,2H4a2,2,0,0,1-2-2V4A2,2,0,0,1,4,2H9A2,2,0,0,1,11,4Zm9,7H15a2,2,0,0,0-2,2v7a2,2,0,0,0,2,2h5a2,2,0,0,0,2-2V13A2,2,0,0,0,20,11Z" style={{ fill: '#000000' }} />
  </svg>
);

export const ProfileIcon = () => (
    <svg viewBox="0 0 24 24" className="h-8  w-8" fill="none">
      <circle cx="12" cy="8.2" r="3.2" fill="#f97316" />
      <path d="M18.5 18.2c0-2.7-2.9-4.9-6.5-4.9s-6.5 2.2-6.5 4.9" fill="#fb7185" />
      <path d="M18.5 18.2c0-2.7-2.9-4.9-6.5-4.9s-6.5 2.2-6.5 4.9" stroke="#f97316" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
);

export const RoleManagementIcon = () => (
    <ShieldCheck className="h-8 w-8 text-[var(--app-sidebar-icon)]" strokeWidth={1.4} />
);

export const ImportIcon = () => (
    <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none">
      <circle cx="12" cy="12" r="9" fill="#22c55e" opacity="0.2" />
      <path d="M12 6v7.2l2.8-2.8M12 13.2L9.2 10.4" stroke="#16a34a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 16h10" stroke="#0ea5e9" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
);

export const SettingsIcon = () => (
  <SettingsIconLucide className="h-8 w-8 text-[var(--app-sidebar-icon)]" strokeWidth={1.4} />
);


export const LibraryIcon = () => (
  <div className="h-8 w-8 flex items-center justify-center sidebar-icon rounded">
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
      icon: <ImportIcon />,
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
        <div className="flex flex-col flex-1 px-1 overflow-y-auto overflow-x-hidden">
          <Logo open={open} />
          
          {/* Navigation Items */}
          <div className="mt-4 flex flex-col gap-0.5">
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
                  <span className="text-sm font-medium truncate text-[var(--app-sidebar-text)]">
                    {user ? profile.displayName : offlineDisplayName}
                  </span>
                  <span className="text-xs truncate sidebar-muted">
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
                    className="p-2 rounded-lg transition-colors sidebar-button"
                    title="Logout"
                  >
                    <LogOut className="h-5 w-5 sidebar-icon" />
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
        <span className="font-bold text-lg text-[var(--app-sidebar-text)]">
          Sparcclen
        </span>
        <span className="text-xs sidebar-muted">
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
