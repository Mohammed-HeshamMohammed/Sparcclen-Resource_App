import { motion } from 'framer-motion'

interface Props {
  open: boolean
  sidebarAvatarUrl: string | null
  fallbackInitial: string
  role?: string
  badgeClass: string
  displayName: string
  email: string
  userIsPresent: boolean
  offlineActive: boolean
  onSignOut: () => void
}

export function UserPanel({
  open,
  sidebarAvatarUrl,
  fallbackInitial,
  role,
  badgeClass,
  displayName,
  email,
  userIsPresent,
  offlineActive,
  onSignOut,
}: Props) {
  return (
    <div className="relative flex items-center justify-start">
      {role === 'CEO' ? (
        <div className="relative z-20 w-14 h-14 flex-shrink-0">
          <div className="absolute inset-0 rounded-full">
            <div className="absolute inset-0 rounded-full bg-[conic-gradient(#ff005e,#ffbe0b,#00f5d4,#00bbf9,#9b5de5,#ff005e)] animate-rotate-slow"></div>
            <div className="absolute -inset-1 rounded-full bg-[conic-gradient(#ff005e,#ffbe0b,#00f5d4,#00bbf9,#9b5de5,#ff005e)] blur-md opacity-40 animate-rotate-slow"></div>
          </div>
          <div className="absolute inset-[3px] rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            {sidebarAvatarUrl ? (
              <img
                src={sidebarAvatarUrl}
                alt="Profile"
                className="w-full h-full object-cover object-center rounded-full"
              />
            ) : (
              <span className="text-white text-xl font-semibold leading-none">
                {fallbackInitial}
              </span>
            )}
          </div>
          {role && (
            <span className={`absolute -top-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 text-[10px] leading-none rounded-full font-semibold shadow ${badgeClass}`}>
              {role}
            </span>
          )}
        </div>
      ) : (
        <div className="relative z-20 w-14 h-14 rounded-full flex-shrink-0">
          <div className="absolute inset-0 rounded-full"></div>
          <div className={`w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center ring-2 ring-offset-2 dark:ring-offset-gray-950 ring-offset-white ${
            role === 'Admin' ? 'ring-amber-500 shadow-[0_0_12px_#f59e0b40]' : role === 'Premium' ? 'ring-emerald-500 shadow-[0_0_12px_#10b98140]' : 'ring-gray-400 shadow-[0_0_10px_#9ca3af40]'
          }`}>
            {sidebarAvatarUrl ? (
              <img
                src={sidebarAvatarUrl}
                alt="Profile"
                className="w-full h-full object-cover object-center rounded-full"
              />
            ) : (
              <span className="text-white text-xl font-semibold leading-none">
                {fallbackInitial}
              </span>
            )}
          </div>
          {role && (
            <span className={`absolute -top-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 text-[10px] leading-none rounded-full font-semibold shadow ${badgeClass}`}>
              {role}
            </span>
          )}
        </div>
      )}

      <motion.div
        className="absolute inset-0 flex items-center justify-between rounded-full"
        animate={{
          paddingLeft: open ? '12px' : '0px',
          paddingRight: open ? '12px' : '0px',
          paddingTop: open ? '6px' : '0px',
          paddingBottom: open ? '6px' : '0px',
          marginLeft: open ? '-8px' : '0px',
          marginRight: open ? '-8px' : '0px',
        }}
        transition={{ duration: 0.15, ease: 'easeInOut' }}
      >
        <div className="flex items-center w-full">
          <div className="w-14 h-14 flex-shrink-0" />
          <motion.div
            animate={{
              opacity: open ? 1 : 0,
              width: open ? 'auto' : 0,
              marginLeft: open ? '8px' : '0px',
            }}
            transition={{ duration: 0.15, ease: 'easeInOut' }}
            className="flex flex-col overflow-hidden whitespace-nowrap min-w-0 flex-1"
          >
            <span className="text-sm font-medium truncate text-[var(--app-sidebar-text)]">
              {userIsPresent ? displayName : offlineActive ? 'offline user' : displayName}
            </span>
            <span className="text-xs truncate sidebar-muted">
              {userIsPresent ? email : 'Email unavailable in offline mode'}
            </span>
          </motion.div>

          <motion.div
            animate={{ opacity: open ? 1 : 0, width: open ? 'auto' : 0 }}
            transition={{ duration: 0.15, ease: 'easeInOut' }}
            className="overflow-hidden flex-shrink-0"
         >
            <button
              onClick={onSignOut}
              className="p-2 rounded-lg transition-colors sidebar-button"
              title="Logout"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5 sidebar-icon" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
