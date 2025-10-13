import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { useProfile } from '@/lib/contexts/ProfileContext'
import { notify } from '@/lib/toast'
import { avatarService } from '@/lib/services/avatarService'

type Role = 'Free' | 'Premium' | 'Admin' | 'CEO'

interface AdminUserRow {
  id: string
  email: string | null
  role: Role | string
  name?: string | null
  avatarUrlMeta?: string | null
}

export function RoleManagement() {
  const { user } = useAuth()
  const { profile, updateAccountType } = useProfile()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [busyIds, setBusyIds] = useState<Record<string, boolean>>({})
  const [avatarUrls, setAvatarUrls] = useState<Record<string, string | null>>({})
  const [online, setOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const myRole = useMemo(() => profile.accountType || (user?.user_metadata as any)?.role || 'User', [profile.accountType, user?.user_metadata])

  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
        const api = (window as any).api
        if (!api?.admin?.listUsers) {
          if (mounted) setLoading(false)
          return
        }
        const res = await api.admin.listUsers()
        if (!res?.ok) throw new Error(res?.error || 'Admin API error')
        const list: AdminUserRow[] = (res.users || []).map((u: any) => {
          const meta = u.user_metadata || {}
          const app = u.app_metadata || {}
          const role = (meta.role || app.role || 'Free') as Role
          return {
            id: u.id,
            email: u.email ?? null,
            role,
            name: meta.display_name || meta.full_name || meta.name || ((u.email || '').split('@')[0] || null),
            avatarUrlMeta: meta.avatar_url || null,
          }
        })
        if (mounted) setUsers(list)
        // Prefetch avatars for all users if accessible; fall back to metadata avatar or initial
        try {
          await Promise.all(
            list.map(async (entry) => {
              if (!entry.email) return
              try {
                const url = await avatarService.getAvatarUrl(entry.email, true)
                if (url && mounted) {
                  setAvatarUrls(prev => ({ ...prev, [entry.id]: url }))
                }
              } catch {}
            })
          )
        } catch {}
      } catch (e) {
        console.error('Failed to list users:', e)
        notify.error('Failed to load users')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const setBusy = (id: string, v: boolean) => setBusyIds(prev => ({ ...prev, [id]: v }))

  async function updateRole(userId: string, newRole: Role) {
    const api = (window as any).api
    if (!api?.admin?.updateUserRole) {
      notify.error('Admin API not configured')
      return
    }
    setBusy(userId, true)
    try {
      const res = await api.admin.updateUserRole(userId, newRole)
      if (!res?.ok) throw new Error(res?.error || 'Failed')
      // Verify by reloading from Admin API
      try {
        const verify = await api.admin.listUsers()
        if (verify?.ok) {
          const list: AdminUserRow[] = (verify.users || []).map((u: any) => {
            const meta = u.user_metadata || {}
            const app = u.app_metadata || {}
            const role = (meta.role || app.role || 'Free') as Role
            return {
              id: u.id,
              email: u.email ?? null,
              role,
              name: meta.display_name || meta.full_name || meta.name || ((u.email || '').split('@')[0] || null),
              avatarUrlMeta: meta.avatar_url || null,
            }
          })
          setUsers(list)
          const changed = list.find(u => u.id === userId)
          if (!changed || String(changed.role) !== String(newRole)) {
            throw new Error('Verification failed: role did not persist')
          }
        }
      } catch (e) {
        throw e instanceof Error ? e : new Error(String(e))
      }

      // If I updated my own role, also update my encrypted profile locally for consistency
      if (user?.id && user.id === userId) {
        try { await updateAccountType(String(newRole)) } catch {}
      }

      notify.success(`Role updated to ${newRole}`)
    } catch (e) {
      console.error('Failed to update role:', e)
      notify.error('Failed to update role')
    } finally {
      setBusy(userId, false)
    }
  }

  if (!['CEO', 'Admin'].includes(String(myRole))) {
    return (
      <div className="p-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Not authorized</h2>
        <p className="text-gray-600 dark:text-gray-400">You need Admin or CEO role to access Role Management.</p>
      </div>
    )
  }

  const hasAdminApi = !!(window as any)?.api?.admin
  if (!hasAdminApi) {
    return (
      <div className="p-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Role Management</h2>
        <p className="text-yellow-600 dark:text-yellow-400">Admin API is not configured. Set SUPABASE_SERVICE_ROLE_KEY in environment to enable this page.</p>
      </div>
    )
  }

  if (!online) {
    return (
      <div className="p-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Role Management</h2>
        <p className="text-gray-600 dark:text-gray-400">This page is unavailable while offline.</p>
      </div>
    )
  }

  return (
    <div className="w-full h-full min-h-0 flex-1 overflow-y-auto scrollbar-hide p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Role Management</h2>
          <p className="text-gray-600 dark:text-gray-400">Grant or revoke roles for users. Changes take effect immediately.</p>
        </div>
        <div>
          <button
            onClick={() => {
              // Reload users: re-run the listUsers call inline
              ;(async () => {
                try {
                  setLoading(true)
                  const api = (window as any).api
                  const res = await api.admin.listUsers()
                  if (!res?.ok) throw new Error(res?.error || 'Admin API error')
                  const list: AdminUserRow[] = (res.users || []).map((u: any) => {
                    const meta = u.user_metadata || {}
                    const app = u.app_metadata || {}
                    const role = (meta.role || app.role || 'Free') as Role
                    return {
                      id: u.id,
                      email: u.email ?? null,
                      role,
                      name: meta.display_name || meta.full_name || meta.name || ((u.email || '').split('@')[0] || null),
                      avatarUrlMeta: meta.avatar_url || null,
                    }
                  })
                  setUsers(list)
                } catch (e) {
                  notify.error('Failed to refresh users')
                } finally {
                  setLoading(false)
                }
              })()
            }}
            className="px-3 py-2 rounded bg-gray-700 text-white hover:bg-gray-800 disabled:opacity-60"
            disabled={loading}
            title="Refresh"
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-gray-600 dark:text-gray-300">Loading users…</div>
      ) : (
        <div className="overflow-auto scrollbar-hide border border-gray-200 dark:border-gray-800 rounded-lg max-h-[calc(100vh-220px)] min-h-0">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-100 dark:bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-950 divide-y divide-gray-200 dark:divide-gray-800">
              {users.map(u => {
                const isMe = !!(u.email && u.email === user?.email)
                const displayRole = isMe && profile.accountType ? String(profile.accountType) : String(u.role)
                const metaAvatar = u.avatarUrlMeta
                const isCEO = displayRole === 'CEO'
                const ringClass =
                  displayRole === 'Admin' ? 'ring-2 ring-amber-500 ring-offset-1 ring-offset-white dark:ring-offset-gray-950' :
                  displayRole === 'Premium' ? 'ring-2 ring-emerald-500 ring-offset-1 ring-offset-white dark:ring-offset-gray-950' :
                  'ring-2 ring-gray-400 ring-offset-1 ring-offset-white dark:ring-offset-gray-950'
                return (
                <tr key={u.id}>
                  <td className="px-4 py-3 text-gray-900 dark:text-white">
                    <div className="flex items-center gap-3">
                      {isCEO ? (
                        <div className="relative w-8 h-8">
                          {/* Rotating color ring */}
                          <div className="absolute inset-0 rounded-full">
                            <div className="absolute inset-0 rounded-full bg-[conic-gradient(#ff005e,#ffbe0b,#00f5d4,#00bbf9,#9b5de5,#ff005e)] animate-rotate-slow"></div>
                            {/* Rotating glow */}
                            <div className="absolute -inset-[2px] rounded-full bg-[conic-gradient(#ff005e,#ffbe0b,#00f5d4,#00bbf9,#9b5de5,#ff005e)] blur-sm opacity-40 animate-rotate-slow"></div>
                          </div>
                          {/* Inner circle (static) */}
                          <div className="absolute inset-[2px] rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            {avatarUrls[u.id] ? (
                              <img src={avatarUrls[u.id] as string} alt="avatar" className="w-full h-full rounded-full object-cover" />
                            ) : metaAvatar ? (
                              <img src={metaAvatar as string} alt="avatar" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <span className="text-white text-sm font-semibold leading-none">
                                {(u.name || u.email || 'U').charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : avatarUrls[u.id] ? (
                        <img src={avatarUrls[u.id] as string} alt="avatar" className={`w-8 h-8 rounded-full object-cover ${ringClass}`} />
                      ) : metaAvatar ? (
                        <img src={metaAvatar as string} alt="avatar" className={`w-8 h-8 rounded-full object-cover ${ringClass}`} />
                      ) : (
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold ${ringClass}`}>
                          {(u.name || u.email || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span>{u.name || '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{u.email || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
                      {String(displayRole)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button disabled={busyIds[u.id]} onClick={() => updateRole(u.id, 'Free')} className="px-3 py-1 rounded bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-60">Free</button>
                      <button disabled={busyIds[u.id]} onClick={() => updateRole(u.id, 'Premium')} className="px-3 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60">Premium</button>
                      <button disabled={busyIds[u.id]} onClick={() => updateRole(u.id, 'Admin')} className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">Admin</button>
                      <button disabled={busyIds[u.id]} onClick={() => updateRole(u.id, 'CEO')} className="px-3 py-1 rounded bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60">CEO</button>
                    </div>
                  </td>
                </tr>
              )})}
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
