import { useEffect, useState } from 'react';
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui';
import { Clock } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { readSave, type SaveData } from '@/lib/system/saveClient';
import { avatarService } from '@/lib/services';
import { LibrarySubmenu } from './LibrarySubmenu';
import { DashboardIcon, ProfileIcon, RoleManagementIcon, ImportIcon, SettingsIcon, LibraryIcon } from './icons';
import { UserPanel } from './UserPanel';

interface ResourceSidebarProps {
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  onOpenRoles: () => void;
  onOpenDashboard: () => void;
  onOpenLibrary: () => void;
  onOpenImports: () => void;
  onOpenComingSoon: () => void;
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
  onOpenComingSoon,
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
    } else if (label === 'Coming Soon') {
      onOpenComingSoon();
    } else if (label === 'Profile') {
      onOpenProfile();
    } else if (label === 'Settings') {
      onOpenSettings();
    } else if (label === 'Role Management' || label === 'Mangament') {
      onOpenRoles();
    }
  };

  const roleFromMeta = ((user?.user_metadata || {}) as Record<string, unknown>)['role']
  const role = (typeof profile.accountType === 'string' && profile.accountType) || (typeof roleFromMeta === 'string' ? roleFromMeta : undefined)

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
      label: 'Coming Soon',
      href: '/coming-soon',
      icon: <Clock className="h-9 w-9 text-[var(--app-sidebar-icon)]" strokeWidth={1.4} />,
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
      label: 'Mangament',
      href: '/roles',
      icon: <RoleManagementIcon />,
    })
  }

  return (
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody className="justify-between gap-4">
        <div className="flex flex-col flex-1 px-1 overflow-x-hidden">
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
        {(user || offlineActive) && (
          <UserPanel
            open={open}
            sidebarAvatarUrl={sidebarAvatarUrl}
            fallbackInitial={fallbackInitial}
            role={role}
            badgeClass={badgeClass}
            displayName={user ? profile.displayName : offlineDisplayName}
            email={user ? (profile.email as string) : 'Email unavailable in offline mode'}
            userIsPresent={Boolean(user)}
            offlineActive={offlineActive}
            onSignOut={() => signOut()}
          />
        )}
      </SidebarBody>
    </Sidebar>
  );
}
