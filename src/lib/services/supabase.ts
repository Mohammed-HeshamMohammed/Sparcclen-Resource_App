import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';
import type { SupabaseClient } from '@supabase/supabase-js';

// Export typed client for use in other files
export type TypedSupabaseClient = SupabaseClient<Database>;

// Prefer environment variables for scripts (process.env) but fall back to
// `import.meta.env` for browser builds. Guard `process` so the bundled code
// running in the browser doesn't access `process` (which is undefined).
const nodeEnv = typeof process !== 'undefined' ? (process.env as Record<string, string | undefined>) : undefined;
const metaEnv: Record<string, any> = typeof import.meta !== 'undefined' ? (import.meta as any).env : {};

// Accept multiple common env var names so local .env files (SUPABASE_KEY) or Vite (VITE_*) work.
const supabaseUrl = nodeEnv?.SUPABASE_URL || metaEnv.VITE_SUPABASE_URL || metaEnv.SUPABASE_URL || '';
const supabaseAnonKey = nodeEnv?.SUPABASE_KEY || metaEnv.VITE_SUPABASE_ANON_KEY || metaEnv.VITE_SUPABASE_KEY || metaEnv.SUPABASE_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  // Provide a clearer runtime hint in the browser console instead of a confusing crash.
  // If you're developing locally, add a VITE_SUPABASE_ANON_KEY to your .env or export SUPABASE_KEY before starting the dev server.
  // Note: Vite only exposes variables prefixed with VITE_ to the client.
  // eslint-disable-next-line no-console
  console.error('Missing Supabase configuration. Set VITE_SUPABASE_ANON_KEY or SUPABASE_KEY in your environment.');
  throw new Error('Missing Supabase configuration');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
