import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui';
import { Database, LayoutDashboard, Settings, User, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { readSave, type SaveData } from '@/lib/system/saveClient';

interface ResourceSidebarProps {
  onSelectCategory: (categoryId: string, subcategoryId?: string) => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
}

export function ResourceSidebar({
  onSelectCategory,
  onOpenSettings,
  onOpenProfile,
}: ResourceSidebarProps) {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [save, setSave] = useState<SaveData | null>(null);

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

  const handleNavigation = (label: string) => {
    if (label === 'Dashboard') {
      // Clear category selection to show all resources
      onSelectCategory('');
    } else if (label === 'Profile') {
      // Open profile as content replacement
      onOpenProfile();
    } else if (label === 'Settings') {
      // Open settings modal
      onOpenSettings();
    }
  };

  const navigationItems = [
    {
      label: 'Dashboard',
      href: '/shell',
      icon: <LayoutDashboard className="h-8 w-8 text-gray-300" />,
    },
    {
      label: 'Profile',
      href: '/profile',
      icon: <User className="h-8 w-8 text-gray-300" />,
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: <Settings className="h-8 w-8 text-gray-300" />,
    },
  ];

  return (
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody className="justify-between gap-4">
        <div className="flex flex-col flex-1 px-1 overflow-y-auto overflow-x-hidden">
          <Logo open={open} />
          
          {/* Navigation Items */}
          <div className="mt-8 flex flex-col gap-0.5">
            {navigationItems.map((item) => (
              <SidebarLink
                key={item.label}
                link={item}
                onClick={() => handleNavigation(item.label)}
              />
            ))}
          </div>
        </div>

        {/* User Avatar with Name and Logout (online or offline) */}
        {(user || offlineActive) && (
          <div className="relative flex items-center justify-left">
            {/* Fixed avatar position */}
            <div className="w-14 h-14 rounded-full flex items-center justify-Left flex-shrink-0 overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 relative z-20">
              {user && profile.avatarUrl ? (
                <img 
                  src={profile.avatarUrl} 
                  alt="Profile" 
                  className="w-full h-full object-cover object-center rounded-full" 
                />
              ) : (
                <span className="text-white text-xl font-semibold">
                  {user ? (profile.displayName?.charAt(0).toUpperCase() || profile.email?.charAt(0).toUpperCase() || 'U') : offlineDisplayName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            
            {/* Animated background that grows from behind the avatar */}
            <motion.div
              className="absolute inset-0 flex items-center justify-between rounded-full"
              animate={{
                backgroundColor: "transparent",
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
                    className="p-1 rounded hover:bg-gray-700 transition-colors"
                    title="Logout"
                  >
                    <LogOut className="h-4 w-4 text-gray-400 hover:text-white" />
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
        <Database className="h-6 w-6 text-white" />
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
        <Database className="h-5 w-5 text-white" />
      </div>
    </div>
  );
};