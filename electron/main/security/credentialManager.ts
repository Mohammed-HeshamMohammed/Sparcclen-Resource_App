import { safeStorage, dialog, app } from 'electron'
import { promises as fs } from 'fs'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'

// Windows Credential Manager integration for storing encrypted credentials
export class CredentialManager {
  private readonly CRED_DIR: string
  private readonly CRED_FILE: string

  constructor() {
    this.CRED_DIR = join(app.getPath('documents'), 'Sparcclen')
    this.CRED_FILE = join(this.CRED_DIR, '.credentials.enc')
  }

  private async ensureDir(): Promise<void> {
    if (!existsSync(this.CRED_DIR)) {
      mkdirSync(this.CRED_DIR, { recursive: true })
    }
  }

  /**
   * Check if encryption is available (requires user to be logged in to Windows)
   */
  public isEncryptionAvailable(): boolean {
    return safeStorage.isEncryptionAvailable()
  }

  /**
   * Prompt user confirmation via native Electron dialog
   * Note: DPAPI encryption already provides security - credentials can only be
   * decrypted by the logged-in Windows user. This prompt adds user confirmation.
   */
  public async promptWindowsHello(email: string): Promise<boolean> {
    console.log(`[CredentialManager] Prompting confirmation for ${email}...`)
    try {
      const result = await dialog.showMessageBox({
        type: 'info',
        title: 'Windows Security',
        message: 'Sign in to Sparcclen',
        detail: `Continue as ${email}?\n\nYour Windows login already protects these credentials via Windows Data Protection API (DPAPI).`,
        buttons: ['Continue', 'Cancel'],
        defaultId: 0,
        cancelId: 1,
        noLink: true,
      })

      const confirmed = result.response === 0

      if (confirmed) {
        console.log('[CredentialManager] User confirmed sign-in')
      } else {
        console.log('[CredentialManager] User cancelled sign-in')
      }

      return confirmed
    } catch (error) {
      console.error('[CredentialManager] Failed to show confirmation dialog:', error)
      return false
    }
  }

  /**
   * Store encrypted credentials for a user
   */
  public async storeCredentials(email: string, password: string): Promise<boolean> {
    try {
      if (!this.isEncryptionAvailable()) {
        console.warn('[CredentialManager] Encryption not available')
        return false
      }

      await this.ensureDir()

      const encryptedPassword = safeStorage.encryptString(password)

      let credentials: Record<string, string> = {}
      if (existsSync(this.CRED_FILE)) {
        const data = await fs.readFile(this.CRED_FILE, 'utf-8')
        credentials = JSON.parse(data)
      }

      credentials[email] = encryptedPassword.toString('base64')

      await fs.writeFile(this.CRED_FILE, JSON.stringify(credentials, null, 2), 'utf-8')

      return true
    } catch (error) {
      console.error('[CredentialManager] Failed to store credentials:', error)
      return false
    }
  }

  /**
   * Retrieve and decrypt password for a user
   */
  public async getCredentials(email: string): Promise<string | null> {
    try {
      if (!this.isEncryptionAvailable()) {
        console.warn('[CredentialManager] Encryption not available')
        return null
      }

      if (!existsSync(this.CRED_FILE)) {
        return null
      }

      const data = await fs.readFile(this.CRED_FILE, 'utf-8')
      const credentials: Record<string, string> = JSON.parse(data)

      if (!credentials[email]) {
        return null
      }

      const encryptedBuffer = Buffer.from(credentials[email], 'base64')
      return safeStorage.decryptString(encryptedBuffer)
    } catch (error) {
      console.error('[CredentialManager] Failed to retrieve credentials:', error)
      return null
    }
  }

  /**
   * Get list of stored email addresses
   */
  public async getStoredEmails(): Promise<string[]> {
    try {
      if (!existsSync(this.CRED_FILE)) {
        return []
      }

      const data = await fs.readFile(this.CRED_FILE, 'utf-8')
      const credentials: Record<string, string> = JSON.parse(data)

      return Object.keys(credentials)
    } catch (error) {
      console.error('[CredentialManager] Failed to get stored emails:', error)
      return []
    }
  }

  /**
   * Delete stored credentials for a user
   */
  public async deleteCredentials(email: string): Promise<boolean> {
    try {
      if (!existsSync(this.CRED_FILE)) {
        return true
      }

      const data = await fs.readFile(this.CRED_FILE, 'utf-8')
      const credentials: Record<string, string> = JSON.parse(data)

      delete credentials[email]

      await fs.writeFile(this.CRED_FILE, JSON.stringify(credentials, null, 2), 'utf-8')

      return true
    } catch (error) {
      console.error('[CredentialManager] Failed to delete credentials:', error)
      return false
    }
  }

  /**
   * Check if credentials exist for an email
   */
  public async hasCredentials(email: string): Promise<boolean> {
    try {
      if (!existsSync(this.CRED_FILE)) {
        return false
      }

      const data = await fs.readFile(this.CRED_FILE, 'utf-8')
      const credentials: Record<string, string> = JSON.parse(data)

      return email in credentials
    } catch (error) {
      return false
    }
  }
}
