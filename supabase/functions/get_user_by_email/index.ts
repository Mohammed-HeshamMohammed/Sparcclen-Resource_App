// @ts-nocheck
// Supabase Edge Function to fetch a user's auth ID by email using the Admin API
// Deploy with: supabase functions deploy get_user_by_email

// Load local .env when running via `supabase functions serve` (no effect in production)
import { load } from 'https://deno.land/std@0.201.0/dotenv/mod.ts'
import { serve } from 'https://deno.land/std@0.201.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

// Attempt to load .env from project root and function folder for local dev
try { await load({ envPath: '../../.env', export: true }); } catch (_) {}
try { await load({ envPath: '.env', export: true }); } catch (_) {}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  try {
    const { email } = await req.json();
    if (!email || typeof email !== 'string') {
      return new Response(JSON.stringify({ ok: false, error: 'missing email' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    })

    const { data, error } = await supabaseAdmin.auth.admin.listUsers()
    if (error) throw error

    const users = data?.users || []
    const lower = email.toLowerCase()
    const user = users.find((u) => (u.email || '').toLowerCase() === lower)

    if (!user) {
      return new Response(JSON.stringify({ ok: false, error: 'not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      })
    }

    return new Response(
      JSON.stringify({ ok: true, id: user.id, email: user.email, created_at: user.created_at }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 },
    )
  }
})
