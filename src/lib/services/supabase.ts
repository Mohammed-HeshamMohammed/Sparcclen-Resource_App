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

function createMockSupabaseClient(): SupabaseClient<Database> {
  // Minimal mock implementing the auth surface we use in the app
  const mockAuth: any = {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: (_cb: any) => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signOut: async () => ({ error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
  };
  // eslint-disable-next-line no-console
  console.warn('[supabase] Missing configuration. Using mock auth client for development.');
  return { auth: mockAuth } as unknown as SupabaseClient<Database>;
}

export const supabase: SupabaseClient<Database> =
  supabaseUrl && supabaseAnonKey
    ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      })
    : createMockSupabaseClient();
