import { supabase } from './supabase'
import type { Database } from '@/types/database'
import { encrypt, decrypt } from '@/lib/utils/crypto'

// Plain profile shape used by the UI
export type ProfileData = {
  displayName: string
  email: string
  memberSince: string // ISO string
  accountType: string
  importedResources: number
  lastActive: string // ISO string
}

// Helpers
function ensureSupabaseConfigured() {
  // At runtime, our mock client (when not configured) lacks `from()`.
  // We avoid using `any` and rely on a duck-typed check.
  const maybe: unknown = supabase as unknown
  const hasFrom = typeof (maybe as { from?: unknown }).from === 'function'
  if (!hasFrom) {
    throw new Error('Supabase is not configured. Set SUPABASE_URL and SUPABASE_KEY (or VITE_*) environment variables.')
  }
}

async function getUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user?.id) {
    throw new Error('Not authenticated with Supabase. Cannot load/save profiles.')
  }
  return data.user.id
}

async function enc(value: unknown, password: string): Promise<string> {
  return encrypt(JSON.stringify(value), password)
}

async function dec<T>(cipherText: string, password: string): Promise<T> {
  const txt = await decrypt(cipherText, password)
  return JSON.parse(txt) as T
}

// Map plain -> encrypted row
async function toEncryptedRow(userId: string, profile: ProfileData, password: string, preservePicture?: boolean): Promise<Database['public']['Tables']['profiles']['Insert']> {
  // Intentionally omit picture_path here to avoid resetting it during profile saves.
  return {
    user_id: userId,
    display_name_enc: await enc(profile.displayName, password),
    email_enc: await enc(profile.email, password),
    account_type_enc: await enc(profile.accountType, password),
    imported_resources_enc: await enc(profile.importedResources, password),
    member_since_enc: await enc(profile.memberSince, password),
    last_active_enc: await enc(profile.lastActive, password),
    ...(preservePicture ? {} : { picture_enc: undefined }), // Only set to undefined if not preserving
  }
}

// Map encrypted row -> plain
async function fromEncryptedRow(row: Database['public']['Tables']['profiles']['Row'], password: string): Promise<ProfileData> {
  return {
    displayName: await dec<string>(row.display_name_enc, password),
    email: await dec<string>(row.email_enc, password),
    accountType: await dec<string>(row.account_type_enc, password),
    importedResources: await dec<number>(row.imported_resources_enc, password),
    memberSince: await dec<string>(row.member_since_enc, password),
    lastActive: await dec<string>(row.last_active_enc, password),
  }
}

// Public API
export async function saveProfileEncrypted(profile: ProfileData, password: string, preservePicture: boolean = false): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    ensureSupabaseConfigured()
    const userId = await getUserId()
    const row = await toEncryptedRow(userId, profile, password, preservePicture)
    // TS struggles to infer typed Insert here in some tooling; runtime is correct.
    // @ts-expect-error Supabase type inference returns never for Insert in some setups
    const { error } = await supabase.from('profiles').upsert(row, { onConflict: 'user_id' })
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

export async function fetchProfileDecrypted(password: string): Promise<{ ok: true; data: ProfileData } | { ok: false; error: string }> {
  try {
    ensureSupabaseConfigured()
    const userId = await getUserId()
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) return { ok: false, error: error.message }
    if (!data) return { ok: false, error: 'Profile not found' }

    const plain = await fromEncryptedRow(data, password)
    return { ok: true, data: plain }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

// Encrypted profile picture inline (picture_enc) helpers
function toBase64(bytes: Uint8Array): string {
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin)
}

function fromBase64(b64: string): Uint8Array {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

export async function uploadProfilePicture(file: Blob | ArrayBuffer | Uint8Array): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    ensureSupabaseConfigured()
    const userId = await getUserId()

    let buf: ArrayBuffer
    let mime: string | undefined
    if (file instanceof Blob) { buf = await file.arrayBuffer(); mime = file.type || undefined }
    else if (file instanceof Uint8Array) buf = file.buffer
    else buf = file

    const bytes = new Uint8Array(buf)
    const b64 = toBase64(bytes)
    const payload = JSON.stringify({ mime: mime || 'image/jpeg', b64 })

    // Ensure a profile row exists to satisfy NOT NULL columns
    const { data: existsRow, error: existsErr } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle()

    if (existsErr) return { ok: false, error: existsErr.message }

    if (!existsRow) {
      const { data: userData } = await supabase.auth.getUser()
      const u = userData?.user
      const mail = u?.email || ''
      const meta = (u?.user_metadata || {}) as Record<string, unknown>
      const pickStr = (obj: Record<string, unknown>, key: string): string | undefined =>
        typeof obj[key] === 'string' ? (obj[key] as string) : undefined
      const baseName = pickStr(meta, 'display_name') || pickStr(meta, 'full_name') || pickStr(meta, 'name') || (mail.split('@')[0] || 'User')
      const profile: ProfileData = {
        displayName: baseName,
        email: mail,
        memberSince: u?.created_at || new Date().toISOString(),
        accountType: 'free',
        importedResources: 0,
        lastActive: new Date().toISOString(),
      }
      const initRow = await toEncryptedRow(userId, profile, 'dummy') // Password not needed for picture
      // @ts-expect-error See note above about inference for upsert
      const { error: initErr } = await supabase.from('profiles').insert(initRow)
      if (initErr) return { ok: false, error: initErr.message }
    }

    // Store plain base64 directly in the profile row
    const updatePayload = { picture_enc: payload }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateErr } = await (supabase as any)
      .from('profiles')
      .update(updatePayload)
      .eq('user_id', userId)
    if (updateErr) return { ok: false, error: updateErr.message }

    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

export async function downloadProfilePicture(): Promise<{ ok: true; blob: Blob } | { ok: false; error: string }> {
  try {
    ensureSupabaseConfigured()
    const userId = await getUserId()
    const { data: row, error: selErr } = await supabase
      .from('profiles')
      .select('picture_enc')
      .eq('user_id', userId)
      .maybeSingle<{ picture_enc: string | null }>()

    if (selErr) return { ok: false, error: selErr.message }
    const payload = row?.picture_enc
    if (!payload) return { ok: false, error: 'No profile picture set' }

    let mime = 'image/jpeg'
    let b64: string
    try {
      const parsed = JSON.parse(payload) as { mime?: string; b64: string }
      b64 = parsed.b64
      if (parsed.mime) mime = parsed.mime
    } catch {
      // Backward compatibility: if not JSON, treat as raw base64
      b64 = payload
    }
    const bytes = fromBase64(b64)
    const blob = new Blob([bytes], { type: mime })
    return { ok: true, blob }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}
