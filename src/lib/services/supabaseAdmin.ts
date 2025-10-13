import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Create a Supabase admin client only when a Service Role key is available.
// Never fall back to anon here – admin APIs require service key.

const nodeEnv = typeof process !== 'undefined' ? (process.env as Record<string, string | undefined>) : undefined
const metaEnv: Record<string, string | undefined> =
  typeof import.meta !== 'undefined'
    ? (import.meta as unknown as { env: Record<string, string | undefined> }).env
    : {}

const supabaseUrl = nodeEnv?.SUPABASE_URL || metaEnv.VITE_SUPABASE_URL || metaEnv.SUPABASE_URL || ''
const serviceKey =
  nodeEnv?.SUPABASE_SERVICE_ROLE_KEY ||
  metaEnv.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  metaEnv.SUPABASE_SERVICE_ROLE_KEY ||
  ''

export let supabaseAdmin: SupabaseClient<Database> | null = null

if (supabaseUrl && serviceKey) {
  try {
    supabaseAdmin = createClient<Database>(supabaseUrl, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  } catch (e) {
    console.warn('[supabaseAdmin] Failed to create admin client:', e)
    supabaseAdmin = null
  }
} else {
  // Intentionally silent in production builds; log in dev for clarity
  if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
    console.warn('[supabaseAdmin] Service role key not configured; admin APIs disabled')
  }
}
