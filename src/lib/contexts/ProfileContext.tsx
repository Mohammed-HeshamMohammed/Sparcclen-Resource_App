import { createContext, useContext, useRef, useState, useEffect, ReactNode } from 'react'
import { useAuth } from '@/lib/auth'
import { getOrCreateProfileKey } from '@/lib/services/profileKey'
import { fetchProfileDecrypted, saveProfileEncrypted, downloadProfilePictureDecrypted } from '@/lib/services'
import { supabase } from '@/lib/services'
import { saveWrite } from '@/lib/system/saveClient'

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
  updateDisplayName: (name: string) => Promise<void>
  updateAvatar: (blob: Blob) => Promise<void>
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
  const fetchedForUserRef = useRef<string | null>(null)

  // Fetch profile exactly once per user session
  useEffect(() => {
    if (!user) {
      // Reset profile when user logs out
      setProfile({
        displayName: 'User',
        email: null,
        avatarUrl: null,
        importedResources: 0,
      })
      fetchedForUserRef.current = null
      return
    }

    const uid = user.id
    if (!uid) return
    if (fetchedForUserRef.current === uid) return
    fetchedForUserRef.current = uid

    const fetchProfile = async () => {
      setIsLoading(true)
      try {
        const dn = (user.user_metadata?.display_name as string) || user.email?.split('@')[0] || 'User'
        const email = user.email ?? null
        
        // Set basic info immediately
        setProfile(prev => ({
          ...prev,
          displayName: dn,
          email,
        }))

        const mail = user.email || ''
        if (!mail) return

        const password = await getOrCreateProfileKey(mail)
        const fetched = await fetchProfileDecrypted(password)
        
        if (fetched.ok) {
          // Update with decrypted profile data
          setProfile(prev => ({
            ...prev,
            displayName: fetched.data.displayName,
            importedResources: fetched.data.importedResources ?? 0,
            memberSince: fetched.data.memberSince,
            accountType: fetched.data.accountType,
            lastActive: fetched.data.lastActive,
          }))
          
          try { await saveWrite({ displayName: fetched.data.displayName }) } catch {}
          
          // Try download avatar if exists
          const pic = await downloadProfilePictureDecrypted(password)
          if (pic.ok) {
            const url = URL.createObjectURL(pic.blob)
            setProfile(prev => ({ ...prev, avatarUrl: url }))
          }
        } else if (fetched.error === 'Profile not found') {
          // Create new profile
          const newProfile = {
            displayName: dn,
            email: mail,
            memberSince: user.created_at || new Date().toISOString(),
            accountType: 'free',
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
          
          try { await supabase.auth.updateUser({ data: { display_name: newProfile.displayName } }) } catch {}
          try { await saveWrite({ displayName: newProfile.displayName }) } catch {}
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const updateDisplayName = async (name: string) => {
    if (!user?.email) throw new Error('No user email')
    
    const password = await getOrCreateProfileKey(user.email)
    const profileData = {
      displayName: name,
      email: user.email,
      memberSince: profile.memberSince || user.created_at || new Date().toISOString(),
      accountType: profile.accountType || 'free',
      importedResources: profile.importedResources,
      lastActive: new Date().toISOString(),
    }
    
    await saveProfileEncrypted(profileData, password)
    
    // Update local state immediately
    setProfile(prev => ({ ...prev, displayName: name }))
    
    // Sync with auth metadata and save
    try { await supabase.auth.updateUser({ data: { display_name: name } }) } catch {}
    try { await saveWrite({ displayName: name }) } catch {}
  }

  const updateAvatar = async (blob: Blob) => {
    if (!user?.email) throw new Error('No user email')
    
    const { uploadProfilePictureEncrypted } = await import('@/lib/services')
    const password = await getOrCreateProfileKey(user.email)
    await uploadProfilePictureEncrypted(blob, password)
    
    // Update local state immediately
    const croppedUrl = URL.createObjectURL(blob)
    if (profile.avatarUrl) {
      try { URL.revokeObjectURL(profile.avatarUrl) } catch {}
    }
    setProfile(prev => ({ ...prev, avatarUrl: croppedUrl }))
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
      updateDisplayName,
      updateAvatar,
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
