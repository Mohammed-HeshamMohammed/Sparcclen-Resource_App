import { createContext, useContext, useRef, useState, useEffect, ReactNode } from 'react'
import { useAuth } from '@/lib/auth'
import { getOrCreateProfileKey } from '@/lib/services'
import { fetchProfileDecrypted, saveProfileEncrypted } from '@/lib/services'
import { supabase } from '@/lib/services'
import { saveWrite, readSave } from '@/lib/system/saveClient'
import { avatarService } from '@/lib/services'
import { saveEncryptedProfileLocal } from '@/lib/services'
import { normalizeToDataUrl } from '@/lib/utils/dataUrl'

type SupabaseUpdateClient = {
  from: (table: string) => {
    update: (values: Record<string, unknown>) => {
      eq: (column: string, value: unknown) => Promise<{ error: unknown }>
    }
  }
}

interface ProfileData {
  displayName: string
  email: string | null
  avatarUrl: string | null
  coverUrl: string | null
  bio: string | null
  memberSince?: string
  accountType?: string
}

interface ProfileContextType {
  profile: ProfileData
  isLoading: boolean
  isInitialLoad: boolean
  isSyncing: boolean
  updateDisplayName: (name: string) => Promise<void>
  updateBio: (bio: string | null) => Promise<void>
  updateCover: (dataUrlOrBlob: string | Blob | null) => Promise<void>
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
    coverUrl: null,
    bio: null,
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
        coverUrl: null,
        bio: null,
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
          const saveData = await readSave()
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
            // Load cached cover immediately (same offline-first behavior as avatar)
            try {
              if (typeof localStorage !== 'undefined') {
                const cached = localStorage.getItem('cover_cache:' + mail)
                if (cached) {
                  const parsed = JSON.parse(cached) as { dataUrl?: string; timestamp?: number }
                  if (parsed?.dataUrl) {
setProfile(prev => ({ ...prev, coverUrl: parsed.dataUrl || null }))
                  }
                }
              }
            } catch {}
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
            
            if (!fetched.ok) {
              // Public fallback: try to read unencrypted fields even if decryption failed
              try {
                const publicRes = await supabase
                  .from('profiles')
                  .select('cover_public, bio_public')
                  .eq('user_id', user.id)
                  .maybeSingle()
                const publicError = publicRes.error
                const publicData = publicRes.data as { cover_public: string | null; bio_public: string | null } | null
                // Normalize cover payload to a data URL for the UI
                
                if (!publicError && publicData) {
                  setProfile(prev => ({
                    ...prev,
                    coverUrl: normalizeToDataUrl(publicData.cover_public) ?? prev.coverUrl ?? null,
                    bio: publicData.bio_public ?? prev.bio ?? null,
                  }))
                }
              } catch (publicError) {
                console.warn('Failed to load public profile data:', publicError)
              }
            }

            if (fetched.ok) {
              // Update with fresh online data
              setProfile(prev => ({
                ...prev,
                displayName: fetched.data.displayName,
                memberSince: fetched.data.memberSince,
                accountType: fetched.data.accountType,
                coverUrl: fetched.data.cover ?? null,
                bio: fetched.data.bio ?? null,
              }))

              // Save updated display name offline
              try { await saveWrite({ displayName: fetched.data.displayName }) } catch {}

              // Refresh avatar (will update if there's a newer version online)
              const avatarUrl = await avatarService.getAvatarUrl(mail)
              if (avatarUrl) {
                setProfile(prev => ({ ...prev, avatarUrl }))
              }
              
              // Load public cover and bio data (unencrypted, visible to others)
              try {
                const publicRes = await supabase
                  .from('profiles')
                  .select('cover_public, bio_public')
                  .eq('user_id', user.id)
                  .maybeSingle()
                const publicError = publicRes.error
                const publicData = publicRes.data as { cover_public: string | null; bio_public: string | null } | null
                
                if (!publicError && publicData) {
                  setProfile(prev => ({
                    ...prev,
                    coverUrl: normalizeToDataUrl(publicData.cover_public) ?? fetched.data.cover ?? prev.coverUrl ?? null,
                    bio: publicData.bio_public ?? fetched.data.bio ?? prev.bio ?? null,
                  }))
                }
              } catch (publicError) {
                console.warn('Failed to load public profile data:', publicError)
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
              // Even if decryption failed for other reasons, still try to load public fields
              try {
                const publicRes = await supabase
                  .from('profiles')
                  .select('cover_public, bio_public')
                  .eq('user_id', user.id)
                  .maybeSingle()
                const publicError = publicRes.error
                const publicData = publicRes.data as { cover_public: string | null; bio_public: string | null } | null
                if (!publicError && publicData) {
                  setProfile(prev => ({
                    ...prev,
                    coverUrl: normalizeToDataUrl(publicData.cover_public) ?? prev.coverUrl ?? null,
                    bio: publicData.bio_public ?? prev.bio ?? null,
                  }))
                }
              } catch (publicError) {
                console.warn('Failed to load public profile data:', publicError)
              }
              // Check if profile row exists but fetch failed due to missing picture_enc or other fields
              const { data: existingRow } = await supabase
                .from('profiles')
                .select('user_id')
                .eq('user_id', user.id)
                .maybeSingle()

              if (existingRow) {
                // Profile row exists, just update the missing fields without touching picture_enc
                const updatedProfile = {
                  displayName: dn,
                  email: mail,
                  memberSince: user.created_at || new Date().toISOString(),
                  accountType: ((meta['role'] as string | undefined) || (appMeta['role'] as string | undefined) || 'Free'),
                  cover: null,
                  bio: null,
                }
                await saveProfileEncrypted(updatedProfile, password, true) // Preserve existing picture_enc
                
                setProfile(prev => ({
                  ...prev,
                  memberSince: updatedProfile.memberSince,
                  accountType: updatedProfile.accountType,
                }))
              } else {
                // Truly no profile row, create new one
                const newProfile = {
                  displayName: dn,
                  email: mail,
                  memberSince: user.created_at || new Date().toISOString(),
                  accountType: ((meta['role'] as string | undefined) || (appMeta['role'] as string | undefined) || 'Free'),
                  cover: null,
                  bio: null,
                }
                await saveProfileEncrypted(newProfile, password)
                
                setProfile(prev => ({
                  ...prev,
                  memberSince: newProfile.memberSince,
                  accountType: newProfile.accountType,
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
      cover: profile.coverUrl ?? null,
      bio: profile.bio ?? null,
    }
    
    await saveProfileEncrypted(profileData, password, true) // Preserve picture_enc
    void saveEncryptedProfileLocal(profileData as Required<typeof profileData>, user.email, password)
    
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
      cover: profile.coverUrl ?? null,
      bio: profile.bio ?? null,
    }

    await saveProfileEncrypted(profileData, password, true) // Preserve picture_enc
    void saveEncryptedProfileLocal(profileData as Required<typeof profileData>, user.email, password)

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
    
    // Update local state
    setProfile(prev => ({ ...prev, avatarUrl }))
  }

  const updateCover = async (dataUrlOrBlob: string | Blob | null) => {
    if (!user?.email) throw new Error('No user email')

    // Convert blob to data URL if needed
    const toDataUrl = async (b: Blob): Promise<string> => new Promise((resolve, reject) => {
      try {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result || ''))
        reader.onerror = (e) => reject(e)
        reader.readAsDataURL(b)
      } catch (e) { reject(e) }
    })

    const dataUrl = typeof dataUrlOrBlob === 'string'
      ? dataUrlOrBlob
      : dataUrlOrBlob instanceof Blob
        ? await toDataUrl(dataUrlOrBlob)
        : null

    // Ensure profile row exists and update encrypted profile first (so all required fields exist)
    const password = await getOrCreateProfileKey(user.email)
    const profileData = {
      displayName: profile.displayName || (user.user_metadata?.display_name as string) || user.email?.split('@')[0] || 'User',
      email: user.email,
      memberSince: profile.memberSince || user.created_at || new Date().toISOString(),
      accountType: profile.accountType || 'Free',
      cover: dataUrl,
      bio: profile.bio ?? null,
    }

    await saveProfileEncrypted(profileData, password, true)
    void saveEncryptedProfileLocal(profileData as Required<typeof profileData>, user.email, password)

    // Update public column with unencrypted data (store as base64 JSON)
    try {
      let payload: string | null = null
      if (dataUrl) {
        try {
          // Convert data URL to base64 + mime
          const res = await fetch(dataUrl)
          const blobToStore = await res.blob()
          const buf = await blobToStore.arrayBuffer()
          const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)))
          payload = JSON.stringify({ mime: blobToStore.type || 'image/jpeg', b64 })
        } catch {
          // Fallback: if 'dataUrl' is already a data URL, strip header; otherwise assume raw base64
          let b64 = dataUrl
          let mimeType = 'image/jpeg'
          try {
            if (typeof dataUrl === 'string' && dataUrl.startsWith('data:')) {
              const comma = dataUrl.indexOf(',')
              const header = dataUrl.substring(5, comma) // e.g., "image/png;base64"
              const [mt] = header.split(';')
              if (mt) mimeType = mt
              b64 = dataUrl.substring(comma + 1)
            }
          } catch {}
          payload = JSON.stringify({ mime: mimeType, b64 })
        }
      }
      const { error } = await (supabase as unknown as SupabaseUpdateClient)
        .from('profiles')
        .update({ cover_public: payload })
        .eq('user_id', user.id)
      
      if (error) {
        console.error('Failed to save cover image to public column:', error)
      }
    } catch (error) {
      console.warn('Could not update public cover field:', error)
    }

    // Cache cover locally to mirror avatar offline-first behavior
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('cover_cache:' + user.email, JSON.stringify({ dataUrl, timestamp: Date.now() }))
      }
    } catch {}

    setProfile(prev => ({ ...prev, coverUrl: dataUrl }))
  }

  const updateBio = async (bio: string | null) => {
    if (!user?.email) throw new Error('No user email')

    // Ensure profile row exists and update encrypted profile first (so all required fields exist)
    const password = await getOrCreateProfileKey(user.email)
    const profileData = {
      displayName: profile.displayName || (user.user_metadata?.display_name as string) || user.email?.split('@')[0] || 'User',
      email: user.email,
      memberSince: profile.memberSince || user.created_at || new Date().toISOString(),
      accountType: profile.accountType || 'Free',
      cover: profile.coverUrl ?? null,
      bio,
    }

    await saveProfileEncrypted(profileData, password, true)
    void saveEncryptedProfileLocal(profileData as Required<typeof profileData>, user.email, password)

    // Update public column with unencrypted data
    try {
      const { error } = await (supabase as unknown as SupabaseUpdateClient)
        .from('profiles')
        .update({ bio_public: bio })
        .eq('user_id', user.id)
      
      if (error) {
        console.error('Failed to save bio to public column:', error)
      }
    } catch (error) {
      console.warn('Could not update public bio field:', error)
    }

    setProfile(prev => ({ ...prev, bio }))
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
      updateBio,
      updateAvatar,
      updateCover,
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
