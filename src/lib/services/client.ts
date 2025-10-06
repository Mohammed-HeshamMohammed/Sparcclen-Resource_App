// This file is no longer needed since we use the single supabase client from supabase.ts
// Keeping for reference but not used in the application

/*
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_ANON_KEY!
  )
}
*/

// Instead, use the single client instance from supabase.ts
export { supabase } from './supabase'
