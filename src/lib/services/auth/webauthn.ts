import {
  startAuthentication,
  browserSupportsWebAuthn,
} from '@simplewebauthn/browser';

// Online WebAuthn (server verify) has been removed by request.
// We retain only an offline Windows Hello gate using WebAuthn APIs locally.

/**
 * Offline authentication using Windows Hello UI (WebAuthn) without server verify.
 * This shows the OS Windows Security dialog and treats a successful assertion
 * as a passed check for offline gating purposes only.
 */
export async function authenticateWithPasskeyOffline(): Promise<{ success: boolean; error?: string }>{
  try {
    // Generate a local random challenge (base64url)
    const random = new Uint8Array(32)
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(random)
    } else {
      for (let i = 0; i < random.length; i++) random[i] = Math.floor(Math.random() * 256)
    }
    const challenge = btoa(String.fromCharCode(...Array.from(random)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')

    // rpId must match current host; fallback to 127.0.0.1 used in dev setup
    const rpId = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1'

    const options = {
      challenge,
      rpId,
      timeout: 60_000,
      userVerification: 'preferred',
      // No allowCredentials to allow discoverable resident credentials
    }
    await startAuthentication(options as Parameters<typeof startAuthentication>[0])

    return { success: true }
  } catch (error: unknown) {
    const errorObj = error as { name?: string; message?: string }
    if (errorObj?.name === 'NotAllowedError') {
      return { success: false, error: 'Authentication cancelled' }
    }
    return { success: false, error: errorObj?.message || 'Offline authentication failed' }
  }
}

/**
 * Check if WebAuthn (Windows Hello) is supported
 */
export function isWebAuthnSupported(): boolean {
  return browserSupportsWebAuthn();
}

// Online register/authenticate/lookup were removed.
