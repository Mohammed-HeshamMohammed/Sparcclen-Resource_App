import { createContext, useContext, useRef, useState, useEffect, ReactNode } from 'react'
import { useAuth } from '@/lib/auth'
import { getOrCreateProfileKey } from '@/lib/services'
import { fetchProfileDecrypted, saveProfileEncrypted } from '@/lib/services'
import { supabase } from '@/lib/services'
import { saveWrite } from '@/lib/system/saveClient'
import { avatarService } from '@/lib/services'

interface ProfileData {
  displayName: string
  email: string | null
  avatarUrl: string | null
  importedResources: number
  memberSince?: string
  accountType?: string
  lastActive?: string
}

interface ProfileContextType {
  profile: ProfileData
  isLoading: boolean
  isInitialLoad: boolean
  isSyncing: boolean
  updateDisplayName: (name: string) => Promise<void>
  updateAvatar: (blob: Blob) => Promise<void>
  updateAccountType: (type: string) => Promise<void>
  refreshProfile: () => Promise<void>
}

const ProfileContext = createContext<ProfileContextType | null>(null)

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [profile, setProfile] = useState<ProfileData>({
    displayName: 'User',
    email: null,
    avatarUrl: null,
    importedResources: 0,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const fetchedForUserRef = useRef<string | null>(null)

  // Load profile with offline-first strategy
  useEffect(() => {
    if (!user) {
      // Reset profile when user logs out
      setProfile({
        displayName: 'User',
        email: null,
        avatarUrl: null,
        importedResources: 0,
      })
      setIsInitialLoad(true)
      setIsSyncing(false)
      fetchedForUserRef.current = null
      // Clear avatar cache for previous user
      avatarService.clearAllAvatarCaches()
      return
    }

    const uid = user.id
    if (!uid) return
    if (fetchedForUserRef.current && fetchedForUserRef.current !== uid) {
      // User changed, clear avatar cache for previous user
      avatarService.clearAllAvatarCaches()
    }
    if (fetchedForUserRef.current === uid) return
    fetchedForUserRef.current = uid

    const loadProfile = async () => {
      setIsLoading(true)
      setIsInitialLoad(true)
      
      try {
        const metaSource = user as unknown as { user_metadata?: Record<string, unknown>; raw_user_meta_data?: Record<string, unknown>; app_metadata?: Record<string, unknown> }
        const meta = metaSource.user_metadata ?? metaSource.raw_user_meta_data ?? {}
        const appMeta = metaSource.app_metadata ?? {}
        const dn = (meta['display_name'] as string) || user.email?.split('@')[0] || 'User'
        const email = user.email ?? null
        const mail = user.email || ''

        // Step 1: Load offline data immediately (from save file and local avatar cache)
        try {
          const saveData = await import('@/lib/system/saveClient').then(m => m.readSave())
          const offlineDisplayName = saveData.displayName || dn
          
          // Set offline data immediately
          setProfile(prev => ({
            ...prev,
            displayName: offlineDisplayName,
            email,
          }))

          // Load offline avatar immediately
          if (mail) {
            const avatarUrl = await avatarService.getAvatarUrl(mail, true) // prioritize offline
            if (avatarUrl) {
              setProfile(prev => ({ ...prev, avatarUrl }))
            }
          }

          // Mark initial load as complete - user sees their data now
          setIsInitialLoad(false)
        } catch (error) {
          console.warn('Failed to load offline data:', error)
          // Fallback to basic info
          setProfile(prev => ({
            ...prev,
            displayName: dn,
            email,
          }))
          setIsInitialLoad(false)
        }

        // Step 2: Sync with online data in background
        if (mail) {
          setIsSyncing(true)
          
          try {
            const password = await getOrCreateProfileKey(mail)
            const fetched = await fetchProfileDecrypted(password)
            
            if (fetched.ok) {
              // Update with fresh online data
              setProfile(prev => ({
                ...prev,
                displayName: fetched.data.displayName,
                importedResources: fetched.data.importedResources ?? 0,
                memberSince: fetched.data.memberSince,
                accountType: fetched.data.accountType,
                lastActive: fetched.data.lastActive,
              }))

              // Save updated display name offline
              try { await saveWrite({ displayName: fetched.data.displayName }) } catch {}

              // Refresh avatar (will update if there's a newer version online)
              const avatarUrl = await avatarService.getAvatarUrl(mail)
              if (avatarUrl) {
                setProfile(prev => ({ ...prev, avatarUrl }))
              }

              // Reconcile: if auth role differs from encrypted profile role, update the encrypted profile to auth role
              try {
                const authRole = (meta['role'] as string | undefined) || (appMeta['role'] as string | undefined) || undefined
                const norm = (s?: string | null) => (s || '').trim().toLowerCase()
                if (authRole && norm(authRole) !== norm(fetched.data.accountType)) {
                  const updated = {
                    ...fetched.data,
                    accountType: authRole,
                  }
                  await saveProfileEncrypted(updated, password, true) // Preserve picture_enc
                  setProfile(prev => ({ ...prev, accountType: authRole }))
                }
              } catch {}
            } else if (fetched.error === 'Profile not found') {
              // Check if profile row exists but fetch failed due to missing picture_enc or other fields
              const { data: existingRow } = await supabase
                .from('profiles')
                .select('picture_enc')
                .eq('user_id', user.id)
                .maybeSingle()

              if (existingRow) {
                // Profile row exists, just update the missing fields without touching picture_enc
                const updatedProfile = {
                  displayName: dn,
                  email: mail,
                  memberSince: user.created_at || new Date().toISOString(),
                  accountType: ((meta['role'] as string | undefined) || (appMeta['role'] as string | undefined) || 'Free'),
                  importedResources: 0,
                  lastActive: new Date().toISOString(),
                }
                await saveProfileEncrypted(updatedProfile, password, true) // Preserve existing picture_enc
                
                setProfile(prev => ({
                  ...prev,
                  memberSince: updatedProfile.memberSince,
                  accountType: updatedProfile.accountType,
                  lastActive: updatedProfile.lastActive,
                }))
              } else {
                // Truly no profile row, create new one
                const newProfile = {
                  displayName: dn,
                  email: mail,
                  memberSince: user.created_at || new Date().toISOString(),
                  accountType: ((meta['role'] as string | undefined) || (appMeta['role'] as string | undefined) || 'Free'),
                  importedResources: 0,
                  lastActive: new Date().toISOString(),
                }
                await saveProfileEncrypted(newProfile, password)
                
                setProfile(prev => ({
                  ...prev,
                  memberSince: newProfile.memberSince,
                  accountType: newProfile.accountType,
                  lastActive: newProfile.lastActive,
                }))
              }
              
              try { await supabase.auth.updateUser({ data: { display_name: dn } }) } catch {}
              try { await saveWrite({ displayName: dn }) } catch {}
            }
          } catch (error) {
            console.warn('Failed to sync online profile data:', error)
            // Continue with offline data - no error thrown
          } finally {
            setIsSyncing(false)
          }
        }
      } catch (error) {
        console.error('Failed to load profile:', error)
        setIsInitialLoad(false)
        setIsSyncing(false)
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const updateDisplayName = async (name: string) => {
    if (!user?.email) throw new Error('No user email')
    
    const password = await getOrCreateProfileKey(user.email)
    const profileData = {
      displayName: name,
      email: user.email,
      memberSince: profile.memberSince || user.created_at || new Date().toISOString(),
      accountType: profile.accountType || 'Free',
      importedResources: profile.importedResources,
      lastActive: new Date().toISOString(),
    }
    
    await saveProfileEncrypted(profileData, password, true) // Preserve picture_enc
    
    // Update local state immediately
    setProfile(prev => ({ ...prev, displayName: name }))
    
    // Sync with auth metadata and save
    try { await supabase.auth.updateUser({ data: { display_name: name } }) } catch {}
    try { await saveWrite({ displayName: name }) } catch {}
  }

  const updateAccountType = async (type: string) => {
    if (!user?.email) throw new Error('No user email')

    const password = await getOrCreateProfileKey(user.email)
    const profileData = {
      displayName: profile.displayName || (user.user_metadata?.display_name as string) || user.email?.split('@')[0] || 'User',
      email: user.email,
      memberSince: profile.memberSince || user.created_at || new Date().toISOString(),
      accountType: type,
      importedResources: profile.importedResources,
      lastActive: new Date().toISOString(),
    }

    await saveProfileEncrypted(profileData, password, true) // Preserve picture_enc

    // Update local state immediately
    setProfile(prev => ({ ...prev, accountType: type }))

    // Also sync auth metadata so current session reflects the new role
    try { await supabase.auth.updateUser({ data: { role: type } }) } catch {}
  }

  const updateAvatar = async (blob: Blob) => {
    if (!user?.email) throw new Error('No user email')
    
    // Use the new avatar service for upload
    const result = await avatarService.uploadAvatar(user.email, blob)
    if (!result.success) {
      throw new Error(result.error || 'Failed to upload avatar')
    }
    
    // Get the new avatar URL
    const avatarUrl = await avatarService.getAvatarUrl(user.email)
    
    // Clean up old avatar URL (no-op for data URLs)
    // if (profile.avatarUrl && profile.avatarUrl.startsWith('blob:')) {
    //   try { URL.revokeObjectURL(profile.avatarUrl) } catch {}
    // }
    
    // Update local state
    setProfile(prev => ({ ...prev, avatarUrl }))
  }

  const refreshProfile = async () => {
    // Force refresh by clearing the fetched ref and re-running the effect
    fetchedForUserRef.current = null
    if (user) {
      fetchedForUserRef.current = user.id
      // Re-trigger the effect by updating a dummy state or calling fetch directly
      // For now, we'll just reset and let the effect re-run
    }
  }

  return (
    <ProfileContext.Provider value={{
      profile,
      isLoading,
      isInitialLoad,
      isSyncing,
      updateDisplayName,
      updateAvatar,
      updateAccountType,
      refreshProfile,
    }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const context = useContext(ProfileContext)
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider')
  }
  return context
}
