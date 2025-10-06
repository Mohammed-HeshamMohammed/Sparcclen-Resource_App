// Encryption utilities for local storage (browser)
const KEY_LENGTH = 256; // bits
const SALT_LENGTH = 16; // bytes
const IV_LENGTH = 12; // bytes

function toBase64(array: Uint8Array): string {
  // btoa requires binary string
  let binary = '';
  const len = array.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(array[i]);
  }
  return btoa(binary);
}

function fromBase64(base64: string): Uint8Array {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function getKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits', 'deriveKey']);

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      // cast to ArrayBuffer to satisfy TS WebCrypto types
      salt: salt.buffer as ArrayBuffer,
      iterations: 100000,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encrypt(data: string, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await getKey(password, salt);

  const enc = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv.buffer as ArrayBuffer }, key, enc.encode(data));

  const out = new Uint8Array(salt.byteLength + iv.byteLength + ciphertext.byteLength);
  out.set(salt, 0);
  out.set(iv, salt.byteLength);
  out.set(new Uint8Array(ciphertext), salt.byteLength + iv.byteLength);

  return toBase64(out);
}

export async function decrypt(encryptedData: string, password: string): Promise<string> {
  const data = fromBase64(encryptedData);
  const salt = data.slice(0, SALT_LENGTH);
  const iv = data.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const ciphertext = data.slice(SALT_LENGTH + IV_LENGTH);

  const key = await getKey(password, salt);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv.buffer as ArrayBuffer }, key, ciphertext.buffer as ArrayBuffer);
  const dec = new TextDecoder();
  return dec.decode(decrypted);
}

export function generateEncryptionKey(): string {
  const array = crypto.getRandomValues(new Uint8Array(32));
  return toBase64(array);
}

// Password hashing utilities using Web Crypto API
/**
 * Hash a password using SHA-256 (for client-side hashing before sending to server)
 * Note: This is not as secure as bcrypt/scrypt but provides basic protection
 * @param password - The plain text password to hash
 * @returns Promise<string> - The hashed password as hex string
 */
export async function hashPasswordClient(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a secure random salt
 * @param length - Length of salt in bytes (default: 16)
 * @returns string - Hex string representation of the salt
 */
export function generateSalt(length: number = 16): string {
  const array = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash password with salt using PBKDF2 (more secure than simple SHA-256)
 * @param password - The plain text password
 * @param salt - Optional salt (will generate if not provided)
 * @returns Promise<{hash: string, salt: string}> - Object containing hash and salt
 */
export async function hashPasswordSecure(password: string, salt?: string): Promise<{hash: string, salt: string}> {
  const actualSalt = salt || generateSalt(16);
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);
  const saltData = encoder.encode(actualSalt);

  // Import the password as a key for PBKDF2
  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordData,
    'PBKDF2',
    false,
    ['deriveBits']
  );

  // Derive key using PBKDF2
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltData,
      iterations: 100000,
      hash: 'SHA-256'
    },
    baseKey,
    256 // 256 bits = 32 bytes
  );

  const hashArray = Array.from(new Uint8Array(derivedBits));
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return { hash, salt: actualSalt };
}