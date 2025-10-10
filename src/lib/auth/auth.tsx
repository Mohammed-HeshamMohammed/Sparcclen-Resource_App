import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase'; // Import the single client instance
import { saveWrite } from '../system/saveClient';

// Auth context types and context
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      // Persist login info if session exists
      if (session?.user?.email) {
        try {
          const userMetaSource = session.user as unknown as {
            user_metadata?: Record<string, unknown>
            raw_user_meta_data?: Record<string, unknown>
          }
          const meta: Record<string, unknown> =
            userMetaSource?.user_metadata ?? userMetaSource?.raw_user_meta_data ?? {}
          const pickStr = (obj: Record<string, unknown>, key: string): string | undefined =>
            typeof obj[key] === 'string' ? (obj[key] as string) : undefined
          const derivedName =
            pickStr(meta, 'display_name') ||
            pickStr(meta, 'full_name') ||
            pickStr(meta, 'name') ||
            (session.user.email?.split('@')[0] ?? null)
          await saveWrite({ loggedInBefore: true, lastEmail: session.user.email, displayName: derivedName ?? null })
        } catch {}
      }
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null)
        // Persist login info if session exists
        if (session?.user?.email) {
          try {
            const userMetaSource = session.user as unknown as {
              user_metadata?: Record<string, unknown>
              raw_user_meta_data?: Record<string, unknown>
            }
            const meta: Record<string, unknown> =
              userMetaSource?.user_metadata ?? userMetaSource?.raw_user_meta_data ?? {}
            const pickStr = (obj: Record<string, unknown>, key: string): string | undefined =>
              typeof obj[key] === 'string' ? (obj[key] as string) : undefined
            const derivedName =
              pickStr(meta, 'display_name') ||
              pickStr(meta, 'full_name') ||
              pickStr(meta, 'name') ||
              (session.user.email?.split('@')[0] ?? null)
            await saveWrite({ loggedInBefore: true, lastEmail: session.user.email, displayName: derivedName ?? null })
          } catch {}
        }
        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    try {
      // Attempt to sign out from Supabase
      await supabase.auth.signOut()
    } catch (error) {
      // If sign out fails (403, network error, etc.), still clear local state
      console.warn('Sign out API call failed, clearing local session:', error)
    }
    
    // Always clear local user state regardless of API success
    setUser(null)
    try { await saveWrite({ offlineSession: false }) } catch {}
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Legacy functions for backward compatibility
export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function setupTOTPForUser(_userId: string): Promise<{ secret: string; otpauth: string }> {
  // This is a placeholder - TOTP functionality would need to be reimplemented
  // if you want to keep this feature
  throw new Error('TOTP functionality has been removed. Please use Supabase Auth instead.')
}
