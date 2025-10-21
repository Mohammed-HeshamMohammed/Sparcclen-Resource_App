import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/auth'
import { useProfile } from '@/lib/contexts/ProfileContext'
import { notify } from '@/lib/toast'
import { avatarService, supabase } from '@/lib/services'

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

  const refreshUsers = useCallback(
    async (shouldUpdate?: () => boolean) => {
      const admin = getAdminApi()
      if (!admin?.listUsers) {
        throw new Error('Admin API not configured')
      }

      const response: AdminListUsersResult = await admin.listUsers()
      if (!response.ok) throw new Error(response.error ?? 'Admin API error')

      let mappedUsers = (response.users ?? []).map(mapAdminUserToRow)

      // Filter to only users who have an existing profile row
      try {
        const ids = mappedUsers.map(entry => entry.id)
        if (ids.length) {
          const { data: profRows, error: profErr } = await supabase
            .from('profiles')
            .select('user_id')
            .in('user_id', ids)
          if (!profErr && profRows) {
            const hasProfile = new Set((profRows as Array<{ user_id: string | null }>).filter(r => !!r.user_id).map(r => String(r.user_id)))
            mappedUsers = mappedUsers.filter(u => hasProfile.has(u.id))
          }
        }
      } catch {}

      if (!shouldUpdate || shouldUpdate()) {
        setUsers(mappedUsers)
      }

      if (mappedUsers.length === 0) {
        if (!shouldUpdate || shouldUpdate()) {
          setAvatarUrls({})
        }
        return mappedUsers
      }

      const userIds = mappedUsers.map(entry => entry.id)

      const resolvedAvatars: Record<string, string | null> = {}

      if (online && userIds.length > 0) {
        try {
          const { data, error } = await supabase
            .from('profiles')
.select('user_id,picture_public')
            .in('user_id', userIds)

          if (error) throw error

          for (const row of (data as Array<{ user_id: string | null; picture_public: string | null }> | null | undefined) ?? []) {
            if (!row.user_id || !row.picture_public) continue
            const raw = row.picture_public as unknown as string
            let mime = 'image/jpeg'

            try {
              const parsed = JSON.parse(raw) as { b64?: string; mime?: string }
              if (typeof parsed?.b64 === 'string') {
                if (parsed?.mime) mime = parsed.mime
                resolvedAvatars[row.user_id] = `data:${mime};base64,${parsed.b64}`
                continue
              }
            } catch {}

            if ((raw || '').startsWith('data:')) {
              resolvedAvatars[row.user_id] = raw
            } else if (raw) {
              resolvedAvatars[row.user_id] = `data:${mime};base64,${raw}`
            }
          }
        } catch (error) {
          console.warn('Failed to fetch encrypted profile pictures for role management:', error)
        }
      }

      await Promise.all(
        mappedUsers.map(async entry => {
          if (resolvedAvatars[entry.id]) return
          if (entry.avatarUrlMeta) {
            resolvedAvatars[entry.id] = entry.avatarUrlMeta
            return
          }
          if (!entry.email) {
            resolvedAvatars[entry.id] = null
            return
          }
          try {
            const cached = await avatarService.getAvatarUrl(entry.email, true)
            resolvedAvatars[entry.id] = cached ?? null
          } catch (error) {
            console.warn('Failed to load fallback avatar for user', entry.id, error)
            resolvedAvatars[entry.id] = null
          }
        })
      )

      if (!shouldUpdate || shouldUpdate()) {
        setAvatarUrls(resolvedAvatars)
      }

      return mappedUsers
    },
    [online]
  )

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
        await refreshUsers(() => mounted)
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
  }, [refreshUsers])

  const setBusy = (id: string, value: boolean) => {
    setBusyIds(prev => ({ ...prev, [id]: value }))
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
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Mangament</h2>
        <p className="text-yellow-600 dark:text-yellow-400">
          Admin API is not configured. Set SUPABASE_SERVICE_ROLE_KEY in the environment to enable this page.
        </p>
      </div>
    )
  }

  if (!['CEO', 'Admin'].includes(String(myRole))) {
    return (
      <div className="p-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Mangament</h2>
        <p className="text-gray-600 dark:text-gray-400">
          You need Admin or CEO role to access Role Management.
        </p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="p-6 lg:p-8 space-y-4 min-w-0 max-w-full"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Mangament</h2>
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
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-950">
          <div className="px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Role Management</div>
          <div className="hidden md:grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(240px,1fr)] items-center gap-4 px-6 py-3 bg-gray-50 dark:bg-gray-900/50 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            <span className="text-left">User</span>
            <span className="text-left">Email</span>
            <span className="text-center">Current Role</span>
            <span className="text-center">Actions</span>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {users.map(userRow => {
              const isMe = !!(userRow.email && userRow.email === user?.email)
              const displayRole = isMe && profile.accountType ? String(profile.accountType) : String(userRow.role)
              const isCEO = displayRole === 'CEO'
              const avatarUrl = avatarUrls[userRow.id] ?? userRow.avatarUrlMeta ?? null
              const fallbackInitial = (userRow.name || userRow.email || 'U').charAt(0).toUpperCase()

              const ringClass =
                displayRole === 'Admin'
                  ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-950'
                  : displayRole === 'Premium'
                    ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-950'
                    : 'ring-2 ring-gray-400 ring-offset-2 ring-offset-white dark:ring-offset-gray-950'
              const avatarSizeClass = 'w-[67px] h-[67px]'

              return (
                <div
                  key={userRow.id}
                  className="grid grid-cols-1 gap-4 px-6 py-5 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(240px,1fr)] md:items-center"
                >
                  <div>
                    <span className="md:hidden block text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                      User
                    </span>
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="flex-shrink-0 w-[88px] flex justify-center">
                      {isCEO ? (
                        <div className={`relative ${avatarSizeClass}`}>
                          <div className="absolute inset-0 rounded-full">
                            <div className="absolute inset-0 rounded-full bg-[conic-gradient(#ff005e,#ffbe0b,#00f5d4,#00bbf9,#9b5de5,#ff005e)] animate-rotate-slow"></div>
                            <div className="absolute -inset-[1px] rounded-full bg-[conic-gradient(#ff005e,#ffbe0b,#00f5d4,#00bbf9,#9b5de5,#ff005e)] blur-md opacity-35 animate-rotate-slow"></div>
                          </div>
                          <div className="absolute inset-[2px] rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            {avatarUrl ? (
                              <img src={avatarUrl} alt={`${userRow.name ?? 'User'} avatar`} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <span className="text-white text-lg font-semibold leading-none">{fallbackInitial}</span>
                            )}
                          </div>
                        </div>
                      ) : avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={`${userRow.name ?? 'User'} avatar`}
                          className={`${avatarSizeClass} rounded-full object-cover ${ringClass}`}
                        />
                      ) : (
                        <div className={`${avatarSizeClass} rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-semibold ${ringClass}`}>
                          {fallbackInitial}
                        </div>
                      )}
                      </div>
                      <div className="min-w-0">
                        <span className="block truncate font-medium text-base">{userRow.name ?? 'Unknown user'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="w-full">
                    <span className="md:hidden block text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                      Email
                    </span>
                    <span className="block truncate text-sm text-gray-700 dark:text-gray-300 max-w-full sm:max-w-[24ch] md:max-w-[18ch] lg:max-w-none">
                      {userRow.email ?? 'Unknown email'}
                    </span>
                  </div>

                  <div className="w-full text-center md:text-center">
                    <span className="md:hidden block text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                      Current Role
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 mx-auto">
                      {displayRole}
                    </span>
                  </div>

                  <div className="w-full md:justify-self-center">
                    <span className="md:hidden block text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                      Actions
                    </span>
                    <div className="grid grid-cols-2 gap-2 w-full md:w-[220px] md:mx-auto">
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
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-950">
        <div className="px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Data Managemnt</div>
        <div className="px-6 py-5 text-sm text-gray-600 dark:text-gray-400">Coming soon</div>
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-400">
        Notes: Avatars for other users are end-to-end encrypted and not accessible to admins; a placeholder is shown. Ensure SUPABASE_SERVICE_ROLE_KEY is set in Electron main.
      </div>
    </motion.div>
  )
}



