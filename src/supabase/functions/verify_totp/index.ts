// Supabase Edge Function (Deno) to verify a user's TOTP code server-side.
// Deploy with `supabase functions deploy verify_totp` and set the
// SUPABASE_SERVICE_ROLE_KEY env var in the function config.

import { serve } from 'https://deno.land/std@0.201.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { authenticator } from 'https://esm.sh/otplib@12.0.1';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
}

const supabase = createClient(SUPABASE_URL || '', SUPABASE_SERVICE_ROLE_KEY || '', { auth: { persistSession: false } });

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  try {
    const body = await req.json();
    const { user_id, code } = body || {};
    if (!user_id || !code) return new Response(JSON.stringify({ ok: false, error: 'missing user_id or code' }), { status: 400 });

    const { data, error } = await supabase.from('app_settings').select('totp_secret').eq('user_id', user_id).maybeSingle();
    if (error) {
      return new Response(JSON.stringify({ ok: false, error: error.message || String(error) }), { status: 500 });
    }

    const secret = data?.totp_secret || null;
    if (!secret) {
      return new Response(JSON.stringify({ ok: false, error: 'no totp secret' }), { status: 404 });
    }

    const valid = authenticator.check(String(code), String(secret));
    return new Response(JSON.stringify({ ok: valid }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err?.message ?? String(err) }), { status: 500 });
  }
});
