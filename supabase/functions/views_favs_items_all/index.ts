// @ts-nocheck
import { load } from 'https://deno.land/std@0.201.0/dotenv/mod.ts'
import { serve } from 'https://deno.land/std@0.201.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

try { await load({ envPath: '../../.env', export: true }) } catch (_) {}
try { await load({ envPath: '.env', export: true }) } catch (_) {}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  try {
    // Use secrets that do NOT start with SUPABASE_ (Supabase blocks those for functions secrets)
    const SUPABASE_URL = Deno.env.get('SB_URL') ?? Deno.env.get('SUPABASE_URL') ?? ''
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SB_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ ok: false, error: 'missing service env' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

    // Read only the items column from all rows
    // deno-lint-ignore no-explicit-any
    const { data, error } = await (admin as any)
      .from('views_favs')
      .select('items')

    if (error) throw error

    const rows = (data ?? []) as Array<{ items?: unknown }>

    function normalizeItems(raw: unknown): Array<{ title: string; category: string; subcategory: string; favourite: boolean }> {
      try {
        let arr: unknown = raw
        if (typeof raw === 'string') {
          try { arr = JSON.parse(raw) } catch {
            const trimmed = raw.trim()
            const withoutOuter = (trimmed.startsWith('"') && trimmed.endsWith('"')) ? trimmed.slice(1, -1) : trimmed
            const unescaped = withoutOuter.replace(/""/g, '"')
            try { arr = JSON.parse(unescaped) } catch { return [] }
          }
        }
        if (!Array.isArray(arr)) return []
        return (arr as unknown[])
          .map((it) => {
            const o = (it ?? {}) as Record<string, unknown>
            const favRaw = o['favourite']
            const favourite = typeof favRaw === 'boolean' ? favRaw : typeof favRaw === 'string' ? favRaw.trim().toLowerCase() === 'true' : Boolean(favRaw)
            return {
              title: String(o['title'] ?? ''),
              category: String(o['category'] ?? ''),
              subcategory: String(o['subcategory'] ?? ''),
              favourite,
            }
          })
          .filter(i => i.title)
      } catch { return [] }
    }

    const items: Array<{ title: string; category: string; subcategory: string; favourite: boolean }> = []
    for (const row of rows) {
      const arr = normalizeItems(row.items ?? [])
      if (arr.length) items.push(...arr)
    }

    return new Response(
      JSON.stringify({ ok: true, items }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 },
    )
  }
})
