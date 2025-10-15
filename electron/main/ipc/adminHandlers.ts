import { ipcMain } from 'electron'
import { createClient } from '@supabase/supabase-js'

type SupabaseAdminUser = {
  id: string
  email?: string
  user_metadata?: Record<string, unknown>
  app_metadata?: Record<string, unknown>
}

const getAdminClient = () => {
  const url = process.env['SUPABASE_URL'] || process.env['VITE_SUPABASE_URL'] || ''
  const key = process.env['SUPABASE_SERVICE_ROLE_KEY'] || process.env['VITE_SUPABASE_SERVICE_ROLE_KEY'] || ''
  if (!url || !key) return null
  try {
    return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  } catch (error) {
    console.warn('[admin] failed to create client', error)
    return null
  }
}

export const registerAdminHandlers = () => {
  ipcMain.handle('admin:listUsers', async () => {
    const admin = getAdminClient()
    if (!admin) return { ok: false, error: 'Admin API not configured' }
    try {
      const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
      if (error) return { ok: false, error: error.message }
      const users = (data?.users || []).map((user: SupabaseAdminUser) => ({
        id: user.id,
        email: user.email ?? null,
        user_metadata: user.user_metadata || {},
        app_metadata: user.app_metadata || {},
      }))
      return { ok: true, users }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  ipcMain.handle('admin:updateUserRole', async (_event, userId: string, role: string) => {
    const admin = getAdminClient()
    if (!admin) return { ok: false, error: 'Admin API not configured' }
    try {
      const { error } = await admin.auth.admin.updateUserById(userId, { user_metadata: { role }, app_metadata: { role } })
      if (error) return { ok: false, error: error.message }
      return { ok: true }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) }
    }
  })
}
