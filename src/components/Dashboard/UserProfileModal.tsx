import { AnimatePresence, motion } from 'framer-motion'
import { X, Mail } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '@/lib/auth'
import { useProfile } from '@/lib/contexts/ProfileContext'

interface ModalUser {
  id: string
  name: string | null
  email: string | null
  role: string
  avatarUrl: string | null
  coverUrl?: string | null
  bio?: string | null
}

interface Props {
  open: boolean
  user: ModalUser | null
  onClose: () => void
}

export function UserProfileModal({ open, user, onClose }: Props) {
  const { user: authUser } = useAuth()
  const { profile } = useProfile()
  const [otherUserData, setOtherUserData] = useState<{ coverUrl: string | null; bio: string | null }>({ coverUrl: null, bio: null })
  const [isSyncing, setIsSyncing] = useState(false)
  const cachedDataRef = useRef<{ coverUrl: string | null; bio: string | null }>({ coverUrl: null, bio: null })
  
  const isMe = !!(user && (user.id === authUser?.id || (user.email && user.email === authUser?.email)))
  
  // Get cover and bio - use profile data for current user, cached data for others
  const coverUrl = isMe ? (profile.coverUrl || null) : (user?.coverUrl || otherUserData.coverUrl)
  const bio = isMe ? (profile.bio || null) : (user?.bio || otherUserData.bio)

  // Pipeline: Show cached data immediately, then fetch fresh data and update only if changed
  useEffect(() => {
    if (!open || !user || isMe) return
    let cancelled = false

    const loadWithPipeline = async () => {
      try {
        let hasCachedData = false
        
        // Step 1: Load cached data immediately (no await delay)
        if (authUser?.id) {
          const { getUserPublicProfileCached } = await import('@/lib/services/dashboardCache')
          const cached = await getUserPublicProfileCached(authUser.id, user.id)
          if (cached && !cancelled) {
            setOtherUserData(cached)
            cachedDataRef.current = cached
            hasCachedData = true
          }
        }
        
        // Step 2: Always fetch fresh data in background (regardless of cache)
        setIsSyncing(true)
        const { supabase } = await import('@/lib/services')
        const res = await supabase
          .from('profiles')
          .select('user_id,cover_public,bio_public')
          .eq('user_id', user.id)
          .maybeSingle()
        const data = res.data as { user_id: string; cover_public: string | null; bio_public: string | null } | null
        const error = res.error
        
        if (error) {
          console.warn('Background fetch failed for user profile:', error)
          setIsSyncing(false)
          return
        }
        
        const freshData = {
          coverUrl: data?.cover_public ?? null,
          bio: data?.bio_public ?? null,
        }
        
        if (cancelled) return
        
        // Step 3: Only update UI if data actually changed
        if (hasCachedData) {
          const currentData = cachedDataRef.current
          const hasChanges = 
            currentData.coverUrl !== freshData.coverUrl || 
            currentData.bio !== freshData.bio
            
          if (hasChanges) {
            setOtherUserData(freshData) // Smooth update with only the changes
            cachedDataRef.current = freshData
          }
        } else {
          // No cached data was available, show fresh data
          setOtherUserData(freshData)
          cachedDataRef.current = freshData
        }
        
        // Step 4: Always update cache with fresh data
        if (authUser?.id) {
          const { setUserPublicProfileCached } = await import('@/lib/services/dashboardCache')
          await setUserPublicProfileCached(authUser.id, user.id, freshData)
        }
        
        setIsSyncing(false)
        
      } catch (error) {
        console.warn('Pipeline load failed for user profile data:', error)
        setIsSyncing(false)
      }
    }
    
    loadWithPipeline()
    return () => { cancelled = true }
  }, [open, user?.id, isMe, authUser?.id])

  // Reset other user data when modal closes or user changes
  useEffect(() => {
    if (!open || !user) {
      setOtherUserData({ coverUrl: null, bio: null })
      setIsSyncing(false)
      cachedDataRef.current = { coverUrl: null, bio: null }
    }
  }, [open, user])

  

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open || !user) return null


  const content = (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="absolute top-4 right-4 flex items-center gap-2">
              {isSyncing && !isMe && (
                <div className="p-2 rounded-full bg-blue-100/80 dark:bg-blue-900/80 backdrop-blur">
                  <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              <button
                onClick={onClose}
                className="p-2.5 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur text-gray-900 dark:text-white hover:bg-white dark:hover:bg-gray-800 shadow"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Cover header */}
            <div className="h-44 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 relative">
              {coverUrl && (
                <img src={coverUrl} alt="cover" className="absolute inset-0 w-full h-full object-cover transition-all duration-300 ease-in-out" />
              )}
            </div>

            {/* Header with avatar + name like Facebook */}
            <div className="relative px-6 pb-4">
              <div className="flex items-end gap-4">
                {/* Avatar overlapping cover, anchored left */}
                <div className="-mt-12">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-white dark:ring-gray-900 shadow-xl outline outline-1 outline-gray-200 dark:outline-gray-800">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.name || 'User'} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-semibold">
                          {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex-1 pb-2">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {user.name || user.email?.split('@')[0] || 'User'}
                  </div>
                  {user.email && (
                    <div className="mt-1 inline-flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                      <Mail className="h-4 w-4" />
                      <span>{user.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Nav tabs row */}
              <div className="mt-4 border-t border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-0 text-sm">
                  {['Timeline','Friends','Photos','Archive','More'].map(tab => (
                    <button
                      key={tab}
                      className="px-2 py-1 rounded text-gray-500 dark:text-gray-400 opacity-50 cursor-not-allowed select-none"
                      disabled
                      aria-disabled="true"
                      onClick={(e) => e.preventDefault()}
                      title="Coming soon"
                    >
                      {tab}
                    </button>
                  ))}
                  <div className="ml-auto text-xs text-gray-500 dark:text-gray-400 opacity-70 select-none">Coming soon</div>
                </div>
              </div>
            </div>

            {/* Body columns */}
            <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Left column: Intro */}
              <div className="md:col-span-1 space-y-4">
                <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-900 opacity-90">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Intro</div>
                  <div className="transition-all duration-300 ease-in-out">
                    <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line min-h-[1rem]">{bio || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Right column: Composer mock */}
              <div className="md:col-span-2 space-y-4">
                <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 opacity-70">
                  <div className="p-3 border-b border-gray-200 dark:border-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300">Posts</div>
                  <div className="p-6 text-center text-sm text-gray-600 dark:text-gray-400">Coming soon</div>
                  <div className="px-4 pb-4 grid grid-cols-3 gap-2 text-xs">
                    <button disabled aria-disabled="true" className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 opacity-50 cursor-not-allowed">Photo/Video</button>
                    <button disabled aria-disabled="true" className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 opacity-50 cursor-not-allowed">Tag Friends</button>
                    <button disabled aria-disabled="true" className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 opacity-50 cursor-not-allowed">Feeling/Activity</button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return typeof document !== 'undefined' ? createPortal(content, document.body) : content
}
