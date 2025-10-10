import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/services' // Use the single client instance
import { Button, Input, Label } from '@/components/ui'
import { Mail, Lock, Info, Fingerprint, Loader2 } from 'lucide-react'
import { hashPasswordSecure } from '@/lib/utils'
import { FormContentWrapper, BottomSectionWrapper } from '../wrappers'
import { readSave, saveWrite } from '@/lib/system/saveClient'
import { WindowsHelloModal } from '../modals/WindowsHelloModal'
import { isWebAuthnSupported, authenticateWithPasskeyOffline } from '@/lib/services/webauthn'
import { notify } from '@/lib/toast'

interface LoginProps {
  onSuccess: () => void
  onSignUp?: () => void
  onForgotPassword?: () => void
  isTransitioning?: boolean
}

export function Login({ onSuccess, onSignUp, onForgotPassword, isTransitioning = false }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [savedEmail, setSavedEmail] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState<string>('')
  const [storedEmails, _setStoredEmails] = useState<string[]>([])
  const [_hasLoggedBefore, setHasLoggedBefore] = useState(false)
  const [isWebAuthnAvailable, setIsWebAuthnAvailable] = useState(false)
  const [showHelloModal, setShowHelloModal] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const passwordRef = useRef<HTMLInputElement | null>(null)

  // Check Windows Credential Manager and load saved emails
  useEffect(() => {
    let mounted = true
    setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true)
    const updateOnline = () => setIsOnline(navigator.onLine)
    window.addEventListener('online', updateOnline)
    window.addEventListener('offline', updateOnline)

    ;(async () => {
      try {
        // Check if WebAuthn (Windows Hello) is supported
        const webAuthnSupported = isWebAuthnSupported()
        if (mounted) setIsWebAuthnAvailable(webAuthnSupported)
        // Windows Hello flows use WebAuthn only (online/offline). No DPAPI prompts.

        // Load last used email from save file
        const s = await readSave()
        if (mounted) {
          setHasLoggedBefore(!!s.loggedInBefore)
        }
        if (mounted && s?.lastEmail) {
          setSavedEmail(s.lastEmail)
          if (!email) setEmail(s.lastEmail)

          // Use saved displayName if available; fallback to email username
          if (s.displayName) {
            setDisplayName(s.displayName)
          } else {
            setDisplayName(s.lastEmail.split('@')[0])
          }

          // Try to refresh display name from Supabase if session exists
          const { data } = await supabase.auth.getUser()
          const userMetaSource = data?.user as unknown as {
            user_metadata?: Record<string, unknown>
            raw_user_meta_data?: Record<string, unknown>
          }
          const meta: Record<string, unknown> =
            userMetaSource?.user_metadata ?? userMetaSource?.raw_user_meta_data ?? {}
          const pickString = (obj: Record<string, unknown>, key: string): string | undefined =>
            typeof obj[key] === 'string' ? (obj[key] as string) : undefined
          const name = pickString(meta, 'display_name') || pickString(meta, 'full_name') || pickString(meta, 'name')
          if (name) {
            setDisplayName(name as string)
            await saveWrite({ displayName: name as string, lastEmail: s.lastEmail })
          }

          // Online WebAuthn removed: no server passkey check
        }
      } catch {}
    })()

    return () => {
      mounted = false
      window.removeEventListener('online', updateOnline)
      window.removeEventListener('offline', updateOnline)
    }
  }, [email])

  // Offline-only Windows Hello (WebAuthn assertion without server verify)
  const handleOfflineHelloLogin = async () => {
    setShowHelloModal(true)
    setIsAuthenticating(true)
    setLoading(true)
    setError('')
    try {
      await new Promise((r) => setTimeout(r, 250))
      const result = await authenticateWithPasskeyOffline()
      if (!result.success) {
        const msg = result.error || 'Authentication cancelled'
        setError(msg)
        notify.error(msg)
        return
      }
      // Mark offline session and persist minimal identity
      const nameToPersist = (displayName && displayName.trim()) || (savedEmail ? savedEmail.split('@')[0] : 'offline user')
      await saveWrite({ loggedInBefore: true, lastEmail: savedEmail || null, displayName: nameToPersist, offlineSession: true })
      setHasLoggedBefore(true)
      onSuccess()
    } catch {
      const msg = 'Windows Hello authentication failed. Please try again.'
      setError(msg)
      notify.error(msg)
    } finally {
      setIsAuthenticating(false)
      setLoading(false)
      setShowHelloModal(false)
    }
  }

  // Online WebAuthn (server-backed) removed entirely

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
        notify.error(error.message)
      } else {
        try {
          // After successful login, fetch display_name from Supabase and persist
          const { data } = await supabase.auth.getUser()
          const loginMetaSource = data?.user as unknown as {
            user_metadata?: Record<string, unknown>
            raw_user_meta_data?: Record<string, unknown>
          }
          const loginMeta: Record<string, unknown> =
            loginMetaSource?.user_metadata ?? loginMetaSource?.raw_user_meta_data ?? {}
          const pickLoginString = (obj: Record<string, unknown>, key: string): string | undefined =>
            typeof obj[key] === 'string' ? (obj[key] as string) : undefined
          const derivedName =
            pickLoginString(loginMeta, 'display_name') ||
            pickLoginString(loginMeta, 'full_name') ||
            pickLoginString(loginMeta, 'name') ||
            email.split('@')[0]
          setDisplayName(derivedName)
          await saveWrite({ loggedInBefore: true, lastEmail: email, displayName: derivedName })
          setHasLoggedBefore(true)
        } catch {
          // Fallback: persist whatever we have
          try { await saveWrite({ loggedInBefore: true, lastEmail: email, displayName }) } catch {}
        }
        // Do NOT auto-register Windows Hello here; only do it when user explicitly requests.
        onSuccess()
      }
    } catch {
      const msg = 'An unexpected error occurred'
      setError(msg)
      notify.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`${isOnline ? 'w-[900px] h-[750px] bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-2xl' : 'w-full h-full bg-transparent rounded-none shadow-none'}`}>
      <div className="flex w-full h-full">
        {/* Left side - Login form */}
        <div className={`${isOnline ? 'w-1/2' : 'w-full'} p-10 md:p-12 flex flex-col`}>
          <div className="max-w-lg mx-auto w-full h-full flex flex-col">
            {isOnline && (
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Welcome to Sparcclen
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Initiate the impossible
                </p>
              </div>
            )}

            <div className="flex-1 flex flex-col">
              <FormContentWrapper isVisible={!isTransitioning}>
                <form onSubmit={handleSubmit} className="space-y-5">
                  {(!isOnline) && (
                    <div className={`${isOnline ? 'mb-4 p-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-2 border-indigo-200 dark:border-indigo-700 relative overflow-hidden' : 'mb-2 p-0 bg-transparent border-0 relative overflow-visible'}`}>
                      {/* Fingerprint background pattern (online only) */}
                      {isOnline && (
                        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
                          <Fingerprint className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 text-indigo-600" />
                        </div>
                      )}
                      
                      <div className={`relative ${isOnline ? 'flex items-center justify-between' : 'flex flex-col items-center justify-center text-center gap-3'}`}>
                        <div>
                          <div className="text-base font-semibold text-indigo-900 dark:text-indigo-200 mb-1">
                            {!isOnline
                              ? `Welcome, ${(displayName && displayName.trim()) || (savedEmail ? savedEmail : 'offline user')}!`
                              : `Welcome back, ${displayName || savedEmail}!`}
                          </div>
                          <div className="text-xs text-indigo-600 dark:text-indigo-400">
                            {isWebAuthnAvailable ? 'Sign in with Windows Hello (Offline)' : "Windows Hello isn't available on this device. Enable a PIN/biometric in Windows Hello."}
                          </div>
                        </div>
                        {(!isOnline && !isWebAuthnAvailable) ? null : (
                          <div className={`${isOnline ? 'relative' : 'relative mt-2'}`}>
                            <button
                              type="button" 
                              onClick={handleOfflineHelloLogin}
                              disabled={loading}
                              className={`${isOnline ? 'ml-4' : ''} flex-shrink-0 w-14 h-14 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95`}
                              title={'Continue with Windows Hello (Offline)'}
                            >
                              {loading ? (
                                <Loader2 className="w-6 h-6 text-white animate-spin" />
                              ) : (
                                <Fingerprint className="w-6 h-6 text-white" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {isOnline && (
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
                  )}

                  {isOnline && (
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
                  )}

                  {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3 rounded-lg flex items-center text-sm">
                      <Info className="w-4 h-4 mr-2 flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  {isOnline && (
                  <div className="pt-4">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                    >
                      {loading ? 'Signing in...' : 'Log in'}
                    </Button>
                  </div>
                  )}

                  {isOnline && (
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
                  )}
                </form>
              </FormContentWrapper>
            </div>

            {/* Bottom section with password change (online only) */}
            <BottomSectionWrapper isVisible={!isTransitioning && isOnline}>
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
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

        {/* Right side - Visual Design (hide when offline for a minimal offline auth UI) */}
        {isOnline && (
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
        )}
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
