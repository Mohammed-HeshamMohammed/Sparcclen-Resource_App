import { LibraryIcon as SidebarLibraryIcon, ImportIcon as SidebarImportIcon, ProfileIcon as SidebarProfileIcon, SettingsIcon as SidebarSettingsIcon, RoleManagementIcon as SidebarRoleIcon } from '@/components/Resources/sidebar/ResourceSidebar'
import { useAuth } from '@/lib/auth'
import { useProfile } from '@/lib/contexts/ProfileContext'

interface Props {
  onOpenLibrary: () => void
  onOpenImports: () => void
  onOpenProfile: () => void
  onOpenSettings: () => void
  onOpenRoles: () => void
}

export function QuickActions({ onOpenLibrary, onOpenImports, onOpenProfile, onOpenSettings, onOpenRoles }: Props) {
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true
  const { user } = useAuth()
  const { profile } = useProfile()
  const roleFromMeta = ((user?.user_metadata || {}) as Record<string, unknown>)['role']
  const role = (typeof profile.accountType === 'string' && profile.accountType) || (typeof roleFromMeta === 'string' ? roleFromMeta : undefined)
  const canManageRoles = isOnline && !!role && ['CEO', 'Admin'].includes(role as string)
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-900 dark:text-white">Quick Actions</h3>
      <div className="grid grid-cols-1 gap-3">
        {/* Dashboard hidden on Dashboard page */}
        {/* <button onClick={onOpenDashboard} className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--app-sidebar-bg)] text-[var(--app-sidebar-text)] hover:brightness-105 transition-all shadow-sm">
          <DashboardIcon />
          <span className="font-medium">Dashboard</span>
        </button> */}
        <button onClick={onOpenLibrary} className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--app-sidebar-bg)] text-[var(--app-sidebar-text)] hover:brightness-105 transition-all shadow-sm">
          <SidebarLibraryIcon />
          <span className="font-medium">Library</span>
        </button>
        <button onClick={onOpenImports} className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--app-sidebar-bg)] text-[var(--app-sidebar-text)] hover:brightness-105 transition-all shadow-sm">
          <SidebarImportIcon />
          <span className="font-medium">Imports</span>
        </button>
        <button onClick={onOpenProfile} className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--app-sidebar-bg)] text-[var(--app-sidebar-text)] hover:brightness-105 transition-all shadow-sm">
          <SidebarProfileIcon />
          <span className="font-medium">Profile</span>
        </button>
        <button onClick={onOpenSettings} className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--app-sidebar-bg)] text-[var(--app-sidebar-text)] hover:brightness-105 transition-all shadow-sm">
          <SidebarSettingsIcon />
          <span className="font-medium">Settings</span>
        </button>
        {canManageRoles && (
          <button onClick={onOpenRoles} className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--app-sidebar-bg)] text-[var(--app-sidebar-text)] hover:brightness-105 transition-all shadow-sm">
            <SidebarRoleIcon />
            <span className="font-medium">Role Management</span>
          </button>
        )}
      </div>
    </div>
  )
}
