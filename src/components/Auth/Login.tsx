import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/services/supabase' // Use the single client instance
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Mail, Lock, Info, Fingerprint, Loader2 } from 'lucide-react'
import { hashPasswordSecure } from '../../lib/utils/crypto'
import FormContentWrapper from './FormContentWrapper'
import BottomSectionWrapper from './BottomSectionWrapper'
import { readSave, saveWrite } from '../../lib/system/saveClient'
import { WindowsHelloModal } from './WindowsHelloModal'
import { isWebAuthnSupported, authenticateWithPasskey, hasRegisteredPasskey, registerPasskey } from '../../lib/services/webauthn'

interface LoginProps {
  onSuccess: () => void
  onSignUp?: () => void
  onForgotPassword?: () => void
  isTransitioning?: boolean
}

export default function Login({ onSuccess, onSignUp, onForgotPassword, isTransitioning = false }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [savedEmail, setSavedEmail] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState<string>('')
  const [storedEmails, setStoredEmails] = useState<string[]>([])
  const [hasStoredCredentials, setHasStoredCredentials] = useState(false)
  const [isWebAuthnAvailable, setIsWebAuthnAvailable] = useState(false)
  const [hasPasskey, setHasPasskey] = useState(false)
  const [showHelloModal, setShowHelloModal] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const passwordRef = useRef<HTMLInputElement | null>(null)

  // Check Windows Credential Manager and load saved emails
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        // Check if WebAuthn (Windows Hello) is supported
        const webAuthnSupported = isWebAuthnSupported()
        if (mounted) setIsWebAuthnAvailable(webAuthnSupported)
        // Check old credential manager for backward compatibility
        if (typeof window !== 'undefined' && (window as any).api?.credentials) {
          const available = await (window as any).api.credentials.isAvailable()
          if (mounted && available) {
            // Old DPAPI method is available
          }
          if (available) {
            // Get stored emails from Windows Credential Manager
            const emails = await (window as any).api.credentials.getEmails()
            if (mounted && emails && emails.length > 0) {
              setStoredEmails(emails)
            }
          }
        }

        // Load last used email from save file
        const s = await readSave()
        if (mounted && s?.lastEmail) {
          setSavedEmail(s.lastEmail)
          if (!email) setEmail(s.lastEmail)

          // Try to get user's display name from Supabase
          const { data } = await supabase.auth.getUser()
          if (data?.user?.user_metadata?.display_name) {
            setDisplayName(data.user.user_metadata.display_name)
          } else {
            // Fallback to email username
            setDisplayName(s.lastEmail.split('@')[0])
          }

          // Check if user has WebAuthn passkey
          if (webAuthnSupported) {
            const hasWebAuthnCred = await hasRegisteredPasskey(s.lastEmail)
            if (mounted) {
              setHasPasskey(hasWebAuthnCred)
              setHasStoredCredentials(hasWebAuthnCred)
            }
          }
        }
      } catch {}
    })()
    return () => { mounted = false }
  }, [])

  // WebAuthn (Windows Hello) authentication
  const handleWindowsHelloLogin = async () => {
    if (!savedEmail) return

    setShowHelloModal(true)
    setIsAuthenticating(false)
    setLoading(true)
    setError('')

    try {
      // Small delay to show the modal before starting authentication
      await new Promise(resolve => setTimeout(resolve, 300))
      
      setIsAuthenticating(true)
      
      // Trigger WebAuthn authentication - THIS SHOWS THE REAL WINDOWS SECURITY DIALOG!
      console.log('[WebAuthn] Starting authentication...')
      const result = await authenticateWithPasskey(savedEmail)

      if (!result.success) {
        setError(result.error || 'Authentication failed. Please try again.')
        setLoading(false)
        setShowHelloModal(false)
        setIsAuthenticating(false)
        return
      }

      console.log('[WebAuthn] Authentication successful!')
      await saveWrite({ loggedInBefore: true, lastEmail: savedEmail })
      setShowHelloModal(false)
      setIsAuthenticating(false)
      onSuccess()
    } catch (err) {
      setError('Failed to authenticate with Windows Hello. Please try again.')
      setShowHelloModal(false)
      setIsAuthenticating(false)
    } finally {
      setLoading(false)
    }
  }

  // Set up a passkey for the current/saved email, then immediately authenticate
  const handleSetupPasskey = async () => {
    const targetEmail = savedEmail || email
    if (!targetEmail) return

    setShowHelloModal(true)
    setIsAuthenticating(false)
    setLoading(true)
    setError('')
    try {
      // Small delay to ensure modal is visible
      await new Promise((r) => setTimeout(r, 250))
      const ok = await registerPasskey(targetEmail)
      if (!ok) {
        setError('Failed to set up Windows Hello. You can still log in with password.')
        setShowHelloModal(false)
        return
      }
      setHasPasskey(true)
      // Immediately try authenticate
      const result = await authenticateWithPasskey(targetEmail)
      if (!result.success) {
        setError(result.error || 'Authentication failed. Please try again.')
        setShowHelloModal(false)
        return
      }
      await saveWrite({ loggedInBefore: true, lastEmail: targetEmail })
      setShowHelloModal(false)
      onSuccess()
    } catch (e) {
      setError('Windows Hello setup failed. Please try again later.')
      setShowHelloModal(false)
    } finally {
      setIsAuthenticating(false)
      setLoading(false)
    }
  }

  // Handle modal cancel
  const handleCancelHello = () => {
    if (!isAuthenticating) {
      setShowHelloModal(false)
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Deterministic client-side hash so the same password yields the same value
      const { hash: hashedPassword } = await hashPasswordSecure(password)

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: hashedPassword,
      })

      if (error) {
        setError(error.message)
      } else {
        try {
          await saveWrite({ loggedInBefore: true, lastEmail: email })

          // Register WebAuthn passkey for future logins (best-effort)
          if (isWebAuthnAvailable) {
            try {
              await registerPasskey(email)
              console.log('✅ WebAuthn passkey registered for future logins')
            } catch (e) {
              console.log('WebAuthn registration failed (continuing):', e)
            }
          }
        } catch (err) {
          console.log('WebAuthn registration skipped:', err)
        }
        onSuccess()
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-[900px] h-[750px] bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-2xl">
      <div className="flex w-full h-full">
        {/* Left side - Login form */}
        <div className="w-1/2 p-12 flex flex-col justify-center">
          <div className="max-w-lg mx-auto w-full h-full flex flex-col">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome to Sparcclen
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Initiate the impossible
              </p>
            </div>

            <div className="flex-1 flex flex-col justify-center">
              <FormContentWrapper isVisible={!isTransitioning}>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {isWebAuthnAvailable && ((savedEmail && savedEmail.length > 0) || email.length > 0) && (
                    <div className="mb-4 p-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-2 border-indigo-200 dark:border-indigo-700 relative overflow-hidden">
                      {/* Fingerprint background pattern */}
                      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
                        <Fingerprint className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 text-indigo-600" />
                      </div>
                      
                      <div className="relative flex items-center justify-between">
                        <div>
                          <div className="text-base font-semibold text-indigo-900 dark:text-indigo-200 mb-1">
                            Welcome back, {displayName || savedEmail}!
                          </div>
                          {hasPasskey ? (
                            <div className="text-xs text-indigo-600 dark:text-indigo-400">
                              Continue with your Windows Hello passkey.
                            </div>
                          ) : (
                            <div className="text-xs text-indigo-600 dark:text-indigo-400">
                              Set up Windows Hello for one‑click sign‑in next time.
                            </div>
                          )}
                        </div>
                        <button
                          type="button" 
                          onClick={hasPasskey ? handleWindowsHelloLogin : handleSetupPasskey}
                          disabled={loading}
                          className="ml-4 flex-shrink-0 w-14 h-14 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95"
                          title={hasPasskey ? 'Continue with Windows Hello' : 'Set up Windows Hello'}
                        >
                          {loading ? (
                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                          ) : (
                            <Fingerprint className="w-6 h-6 text-white" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</Label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                        placeholder="youremail@gmail.com"
                        required
                        list="stored-emails"
                        className="pl-10 pr-4 py-3 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white bg-white dark:bg-gray-800 transition-colors"
                      />
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      {storedEmails.length > 0 && (
                        <datalist id="stored-emails">
                          {storedEmails.map((storedEmail) => (
                            <option key={storedEmail} value={storedEmail} />
                          ))}
                        </datalist>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type="password"
                        ref={passwordRef}
                        value={password}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                        placeholder="********"
                        required
                        className="pl-10 pr-4 py-3 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white bg-white dark:bg-gray-800 transition-colors"
                      />
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3 rounded-lg flex items-center text-sm">
                      <Info className="w-4 h-4 mr-2 flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                    >
                      {loading ? 'Signing in...' : 'Log in'}
                    </Button>
                  </div>

                  <div className="text-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Don't have an account? </span>
                    <button
                      type="button"
                      onClick={onSignUp}
                      className="text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Sign Up!
                    </button>
                  </div>
                </form>
              </FormContentWrapper>
            </div>

            {/* Bottom section with password change */}
            <BottomSectionWrapper isVisible={!isTransitioning}>
              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-indigo-100 dark:bg-indigo-900/30 rounded-full p-1">
                    <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Need to change your password?</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Update your password securely anytime you need to.
                    </p>
                    <button
                      onClick={onForgotPassword}
                      className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-1 hover:text-indigo-800 dark:hover:text-indigo-300"
                    >
                      Change Password
                    </button>
                  </div>
                </div>
              </div>
            </BottomSectionWrapper>
          </div>
        </div>

        {/* Right side - Visual Design */}
        <div className="w-1/2 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-800 dark:via-gray-900 dark:to-indigo-900 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-80 h-80 relative">
              {/* Main cube */}
              <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl transform rotate-12 shadow-2xl"
                   style={{
                     boxShadow: '0 25px 50px -12px rgba(99, 102, 241, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                   }}>
              </div>
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full opacity-80 shadow-lg transform rotate-45"></div>
              <div className="absolute -bottom-6 -left-6 w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full opacity-70 shadow-lg transform -rotate-12"></div>
              <div className="absolute top-1/2 -left-8 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full opacity-60 shadow-lg transform rotate-45"></div>
            </div>
          </div>
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-32 h-32 border border-indigo-300 dark:border-indigo-600 rounded-full"></div>
            <div className="absolute bottom-20 right-20 w-24 h-24 border border-purple-300 dark:border-purple-600 rounded-full"></div>
            <div className="absolute top-1/2 right-10 w-16 h-16 border border-pink-300 dark:border-pink-600 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Windows Hello Authentication Modal */}
      <WindowsHelloModal
        isOpen={showHelloModal}
        email={savedEmail || ''}
        displayName={displayName}
        isAuthenticating={isAuthenticating}
        onCancel={handleCancelHello}
      />
    </div>
  )
}
