export function normalizeToDataUrl(raw: string | null | undefined): string | null {
  if (!raw) return null
  const s = String(raw).trim()
  if (!s) return null
  // Already a data URL
  if (s.startsWith('data:')) return s

  // If it's an http(s) URL, pass through unchanged
  if (/^https?:\/\//i.test(s)) return s

  // Try JSON { mime, b64 }
  try {
    const parsed = JSON.parse(s) as { mime?: string; b64?: string }
    if (parsed?.b64) {
      const mime = parsed.mime || 'image/jpeg'
      return `data:${mime};base64,${parsed.b64}`
    }
  } catch {
    // not JSON; continue
  }

  // Heuristic: reject likely file paths like './img.jpg', 'folder\\img.png', or strings with an extension
  if (/^(\.|\.\.)\//.test(s) || /[\\/]/.test(s) || /\.(png|jpe?g|gif|webp|svg)$/i.test(s)) {
    return null
  }

  // Accept only plausible base64: no whitespace, only base64 charset
  const base64Like = /^[A-Za-z0-9+/=]+$/
  if (!base64Like.test(s)) return null

  return `data:image/jpeg;base64,${s}`
}
