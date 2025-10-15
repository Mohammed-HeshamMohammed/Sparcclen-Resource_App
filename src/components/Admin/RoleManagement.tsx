import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { useProfile } from '@/lib/contexts/ProfileContext'
import { notify } from '@/lib/toast'
import { avatarService } from '@/lib/services'

// Define types locally since we removed the preload types file
interface AdminApiUser {
  id: string
  email?: string | null
  user_metadata?: Record<string, unknown>
  app_metadata?: Record<string, unknown>
}

interface AdminListUsersResult {
  ok: boolean
  users?: AdminApiUser[]
  error?: string
}

interface AdminUpdateUserRoleResult {
  ok: boolean
  error?: string
}

interface AdminApi {
  listUsers: () => Promise<AdminListUsersResult>
  updateUserRole: (userId: string, role: string) => Promise<AdminUpdateUserRoleResult>
}

type Role = 'Free' | 'Premium' | 'Admin' | 'CEO'

interface AdminUserRow {
  id: string
  email: string | null
  role: Role | string
  name?: string | null
  avatarUrlMeta?: string | null
}

const ROLE_VALUES: readonly Role[] = ['Free', 'Premium', 'Admin', 'CEO'] as const

const readString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const readRole = (value: unknown): Role | null => {
  const roleCandidate = readString(value)
  return roleCandidate && ROLE_VALUES.includes(roleCandidate as Role) ? (roleCandidate as Role) : null
}

const mapAdminUserToRow = (user: AdminApiUser): AdminUserRow => {
  const userMeta = user.user_metadata as Record<string, unknown> | undefined
  const appMeta = user.app_metadata as Record<string, unknown> | undefined

  const role =
    readRole(userMeta?.['role']) ??
    readRole(appMeta?.['role']) ??
    'Free'

  const name =
    readString(userMeta?.['display_name']) ??
    readString(userMeta?.['full_name']) ??
    readString(userMeta?.['name']) ??
    (user.email ? user.email.split('@')[0] : null)

  const avatarUrlMeta = readString(userMeta?.['avatar_url'])

  return {
    id: user.id,
    email: user.email ?? null,
    role,
    name,
    avatarUrlMeta,
  }
}

const getAdminApi = (): AdminApi | null => {
  if (typeof window === 'undefined') return null
  return (window.api?.admin ?? null) as AdminApi | null
}

export function RoleManagement() {
  const { user } = useAuth()
  const { profile, updateAccountType } = useProfile()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [busyIds, setBusyIds] = useState<Record<string, boolean>>({})
  const [avatarUrls, setAvatarUrls] = useState<Record<string, string | null>>({})
  const [online, setOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true)

  const userMeta = user?.user_metadata as Record<string, unknown> | undefined
  const appMeta = user?.app_metadata as Record<string, unknown> | undefined

  const myRole: Role | 'User' =
    readRole(profile.accountType) ??
    readRole(userMeta?.['role']) ??
    readRole(appMeta?.['role']) ??
    'User'

  useEffect(() => {
    const setOnlineStatus = () => setOnline(true)
    const setOfflineStatus = () => setOnline(false)

    window.addEventListener('online', setOnlineStatus)
    window.addEventListener('offline', setOfflineStatus)

    return () => {
      window.removeEventListener('online', setOnlineStatus)
      window.removeEventListener('offline', setOfflineStatus)
    }
  }, [])

  useEffect(() => {
    let mounted = true

    const loadUsers = async () => {
      const admin = getAdminApi()
      if (!admin?.listUsers) {
        if (mounted) setLoading(false)
        return
      }

      setLoading(true)
      try {
        const response: AdminListUsersResult = await admin.listUsers()
        if (!response.ok) throw new Error(response.error ?? 'Admin API error')

        const mappedUsers = (response.users ?? []).map(mapAdminUserToRow)
        if (mounted) setUsers(mappedUsers)

        await Promise.all(
          mappedUsers.map(async (entry: AdminUserRow) => {
            if (!entry.email) return
            try {
              const cached = await avatarService.getAvatarUrl(entry.email, true)
              if (cached && mounted) {
                setAvatarUrls(prev => ({ ...prev, [entry.id]: cached }))
              }
            } catch (error) {
              console.warn('Failed to load avatar for user', entry.id, error)
            }
          })
        )
      } catch (error) {
        console.error('Failed to list users:', error)
        notify.error('Failed to load users')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void loadUsers()

    return () => {
      mounted = false
    }
  }, [])

  const setBusy = (id: string, value: boolean) => {
    setBusyIds(prev => ({ ...prev, [id]: value }))
  }

  const refreshUsers = async () => {
    const admin = getAdminApi()
    if (!admin?.listUsers) return

    const response: AdminListUsersResult = await admin.listUsers()
    if (!response.ok) throw new Error(response.error ?? 'Admin API error')
    const mappedUsers = (response.users ?? []).map(mapAdminUserToRow)
    setUsers(mappedUsers)
    return mappedUsers
  }

  async function updateRole(userId: string, newRole: Role) {
    const admin = getAdminApi()
    if (!admin?.updateUserRole) {
      notify.error('Admin API not configured')
      return
    }

    setBusy(userId, true)
    try {
      const response: AdminUpdateUserRoleResult = await admin.updateUserRole(userId, newRole)
      if (!response.ok) throw new Error(response.error ?? 'Failed to update role')

      const updatedList = await refreshUsers()
      const changed = updatedList?.find((entry: AdminUserRow) => entry.id === userId)
      if (!changed || changed.role !== newRole) {
        throw new Error('Verification failed: role did not persist')
      }

      if (user?.id && user.id === userId) {
        try {
          await updateAccountType(String(newRole))
        } catch (error) {
          console.warn('Failed to update local account type:', error)
        }
      }

      notify.success('Role updated successfully')
    } catch (error) {
      console.error('Failed to update role:', error)
      notify.error(error instanceof Error ? error.message : 'Failed to update role')
    } finally {
      setBusy(userId, false)
    }
  }

  const hasAdminApi = typeof window !== 'undefined' && Boolean(window.api?.admin)

  if (!hasAdminApi) {
    return (
      <div className="p-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Role Management</h2>
        <p className="text-yellow-600 dark:text-yellow-400">
          Admin API is not configured. Set SUPABASE_SERVICE_ROLE_KEY in the environment to enable this page.
        </p>
      </div>
    )
  }

  if (!['CEO', 'Admin'].includes(String(myRole))) {
    return (
      <div className="p-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Role Management</h2>
        <p className="text-gray-600 dark:text-gray-400">
          You need Admin or CEO role to access Role Management.
        </p>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Role Management</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage user access levels across Sparcclen.
          </p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${online ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
          {online ? 'Online' : 'Offline'}
        </div>
      </div>

      {loading ? (
        <div className="text-gray-600 dark:text-gray-400">Loading users...</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Current Role</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-950 divide-y divide-gray-200 dark:divide-gray-800">
              {users.map(userRow => {
                const isMe = !!(userRow.email && userRow.email === user?.email)
                const displayRole = isMe && profile.accountType ? String(profile.accountType) : String(userRow.role)
                const isCEO = displayRole === 'CEO'
                const avatarUrl = avatarUrls[userRow.id] ?? userRow.avatarUrlMeta ?? null
                const fallbackInitial = (userRow.name || userRow.email || 'U').charAt(0).toUpperCase()

                const ringClass =
                  displayRole === 'Admin'
                    ? 'ring-2 ring-amber-500 ring-offset-1 ring-offset-white dark:ring-offset-gray-950'
                    : displayRole === 'Premium'
                      ? 'ring-2 ring-emerald-500 ring-offset-1 ring-offset-white dark:ring-offset-gray-950'
                      : 'ring-2 ring-gray-400 ring-offset-1 ring-offset-white dark:ring-offset-gray-950'

                return (
                  <tr key={userRow.id}>
                    <td className="px-4 py-3 text-gray-900 dark:text-white">
                      <div className="flex items-center gap-3">
                        {isCEO ? (
                          <div className="relative w-8 h-8">
                            <div className="absolute inset-0 rounded-full">
                              <div className="absolute inset-0 rounded-full bg-[conic-gradient(#ff005e,#ffbe0b,#00f5d4,#00bbf9,#9b5de5,#ff005e)] animate-rotate-slow"></div>
                              <div className="absolute -inset-[2px] rounded-full bg-[conic-gradient(#ff005e,#ffbe0b,#00f5d4,#00bbf9,#9b5de5,#ff005e)] blur-sm opacity-40 animate-rotate-slow"></div>
                            </div>
                            <div className="absolute inset-[2px] rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                              {avatarUrl ? (
                                <img src={avatarUrl} alt="avatar" className="w-full h-full rounded-full object-cover" />
                              ) : (
                                <span className="text-white text-sm font-semibold leading-none">{fallbackInitial}</span>
                              )}
                            </div>
                          </div>
                        ) : avatarUrl ? (
                          <img src={avatarUrl} alt="avatar" className={`w-8 h-8 rounded-full object-cover ${ringClass}`} />
                        ) : (
                          <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold ${ringClass}`}>
                            {fallbackInitial}
                          </div>
                        )}
                        <span>{userRow.name ?? '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{userRow.email ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
                        {displayRole}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          disabled={busyIds[userRow.id]}
                          onClick={() => updateRole(userRow.id, 'Free')}
                          className="px-3 py-1 rounded bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-60"
                        >
                          Free
                        </button>
                        <button
                          disabled={busyIds[userRow.id]}
                          onClick={() => updateRole(userRow.id, 'Premium')}
                          className="px-3 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                        >
                          Premium
                        </button>
                        <button
                          disabled={busyIds[userRow.id]}
                          onClick={() => updateRole(userRow.id, 'Admin')}
                          className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                        >
                          Admin
                        </button>
                        <button
                          disabled={busyIds[userRow.id]}
                          onClick={() => updateRole(userRow.id, 'CEO')}
                          className="px-3 py-1 rounded bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60"
                        >
                          CEO
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="text-xs text-gray-500 dark:text-gray-400">
        Notes: Avatars for other users are end-to-end encrypted and not accessible to admins; a placeholder is shown. Ensure SUPABASE_SERVICE_ROLE_KEY is set in Electron main.
      </div>
    </div>
  )
}