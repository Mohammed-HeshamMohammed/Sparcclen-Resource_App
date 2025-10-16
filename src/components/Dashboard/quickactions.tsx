import { LibraryIcon as SidebarLibraryIcon, ImportIcon as SidebarImportIcon, ProfileIcon as SidebarProfileIcon, SettingsIcon as SidebarSettingsIcon, RoleManagementIcon as SidebarRoleIcon } from '@/components/Resources/sidebar/ResourceSidebar'

interface Props {
  onOpenLibrary: () => void
  onOpenImports: () => void
  onOpenProfile: () => void
  onOpenSettings: () => void
  onOpenRoles: () => void
}

export function QuickActions({ onOpenLibrary, onOpenImports, onOpenProfile, onOpenSettings, onOpenRoles }: Props) {
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true
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
        {isOnline && (
          <button onClick={onOpenRoles} className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--app-sidebar-bg)] text-[var(--app-sidebar-text)] hover:brightness-105 transition-all shadow-sm">
            <SidebarRoleIcon />
            <span className="font-medium">Role Management</span>
          </button>
        )}
      </div>
    </div>
  )
}