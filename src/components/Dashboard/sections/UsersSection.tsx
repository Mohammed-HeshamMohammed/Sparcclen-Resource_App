import { memo } from 'react'
import { Users } from 'lucide-react'

interface UserLite {
  id: string
  email: string | null
  name: string | null
  role: string
  avatarUrlMeta: string | null
}

interface Props {
  users: UserLite[]
  userAvatars: Record<string, string>
  currentUserEmail: string | null | undefined
  profileAccountType: string | null | undefined
  onSelectUser: (user: UserLite) => void
}

export const UsersSection = memo(function UsersSection({ users, userAvatars, currentUserEmail, profileAccountType, onSelectUser }: Props) {
  const sortedUsers = users
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-blue-500" />
        <h3 className="font-semibold text-gray-900 dark:text-white">Current Users</h3>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {sortedUsers.slice(0, 6).map(usr => {
          const isMe = !!(usr.email && usr.email === currentUserEmail)
          const displayRole = isMe && profileAccountType ? String(profileAccountType) : String(usr.role || 'Free')
          return (
            <div key={usr.id} className="text-center">
              {displayRole === 'CEO' ? (
                <div className="relative w-24 h-24 mx-auto mb-2 flex-shrink-0 cursor-pointer" role="button" onClick={() => onSelectUser(usr)}>
                  <div className="absolute inset-0 rounded-full">
                    <div className="absolute inset-0 rounded-full bg-[conic-gradient(#ff005e,#ffbe0b,#00f5d4,#00bbf9,#9b5de5,#ff005e)] animate-rotate-slow"></div>
                    <div className="absolute -inset-[2px] rounded-full bg-[conic-gradient(#ff005e,#ffbe0b,#00f5d4,#00bbf9,#9b5de5,#ff005e)] blur-sm opacity-40 animate-rotate-slow"></div>
                  </div>
                  <div className="absolute inset-[2px] rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    {userAvatars[usr.id] ? (
                      <img src={userAvatars[usr.id]} alt={usr.name || 'User'} className="w-full h-full object-cover rounded-full" />
                    ) : usr.avatarUrlMeta ? (
                      <img src={usr.avatarUrlMeta} alt={usr.name || 'User'} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <span className="text-white text-base font-semibold">
                        {(usr.name || usr.email || 'U').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="relative w-[5.5rem] h-[5.5rem] mx-auto mb-2 flex-shrink-0 cursor-pointer" role="button" onClick={() => onSelectUser(usr)}>
                  {userAvatars[usr.id] ? (
                    <img src={userAvatars[usr.id]} alt={usr.name || 'User'} className={`w-full h-full object-cover rounded-full ring-2 ring-offset-1 dark:ring-offset-gray-950 ring-offset-white ${displayRole === 'Admin' ? 'ring-amber-500' : displayRole === 'Premium' ? 'ring-emerald-500' : 'ring-gray-400'}`} />
                  ) : usr.avatarUrlMeta ? (
                    <img src={usr.avatarUrlMeta} alt={usr.name || 'User'} className={`w-full h-full object-cover rounded-full ring-2 ring-offset-1 dark:ring-offset-gray-950 ring-offset-white ${displayRole === 'Admin' ? 'ring-amber-500' : displayRole === 'Premium' ? 'ring-emerald-500' : 'ring-gray-400'}`} />
                  ) : (
                    <div className={`w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-base font-semibold ring-2 ring-offset-1 dark:ring-offset-gray-950 ring-offset-white ${displayRole === 'Admin' ? 'ring-amber-500' : displayRole === 'Premium' ? 'ring-emerald-500' : 'ring-gray-400'}`}>
                      {(usr.name || usr.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              )}
              <div className="text-xs text-gray-700 dark:text-gray-300 break-words text-center">
                {usr.name || usr.email?.split('@')[0] || 'User'}
              </div>
            </div>
          )
        })}
      </div>
      {users.length > 6 && (
        <div className="text-center mt-3">
          <span className="text-xs text-gray-500 dark:text-gray-400">+{users.length - 6} more</span>
        </div>
      )}
    </div>
  )
})
