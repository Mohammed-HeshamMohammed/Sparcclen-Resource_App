import { motion } from 'framer-motion';
import { useRef } from 'react';

interface ProfileHeaderProps {
  avatarUrl?: string | null;
  displayName: string;
  email?: string | null;
  canEdit: boolean;
  isEditingName: boolean;
  localDisplayName: string;
  busy: boolean;
  save?: { offlineSession?: boolean } | null;
  onAvatarClick: () => void;
  onLocalDisplayNameChange: (value: string) => void;
  onSaveName: () => void;
  onCancelEdit: () => void;
}

export function ProfileHeader({
  avatarUrl,
  displayName,
  email,
  canEdit,
  isEditingName,
  localDisplayName,
  busy,
  save,
  onAvatarClick,
  onLocalDisplayNameChange,
  onSaveName,
  onCancelEdit
}: ProfileHeaderProps) {
  const nameEditRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className="w-full px-6 lg:px-12 xl:px-16">
      <div className="relative z-30 flex items-end gap-4 max-w-none">
        {/* Avatar overlaps the cover */}
        <motion.div 
          className="-mt-20 sm:-mt-24 md:-mt-28 lg:-mt-32 relative z-50"
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
        >
          <div className="relative">
            <div
              className="w-36 h-36 sm:w-40 sm:h-40 md:w-44 md:h-44 rounded-full overflow-hidden ring-4 ring-white dark:ring-gray-900 shadow-xl outline outline-1 outline-gray-200 dark:outline-gray-800 cursor-pointer"
              onClick={canEdit ? onAvatarClick : undefined}
              title={canEdit ? 'Change profile picture' : 'Sign in to set a profile picture'}
              aria-disabled={!canEdit}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-semibold">
                  {(email?.charAt(0).toUpperCase()) || displayName.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Name and email to the right of avatar */}
        <motion.div 
          className="flex-1 mt-4 sm:mt-5 pb-0"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
        >
          {isEditingName ? (
            <div ref={nameEditRef} className="flex items-center gap-2">
              <input
                type="text"
                value={localDisplayName}
                onChange={(e) => onLocalDisplayNameChange(e.target.value)}
                className="px-3 py-2 rounded-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-base"
              />
              <button 
                onClick={onSaveName} 
                disabled={busy} 
                className="px-3 py-2 rounded-full bg-green-600 text-white text-xs hover:bg-green-700 disabled:opacity-60"
              >
                Save
              </button>
              <button 
                onClick={onCancelEdit} 
                className="px-3 py-2 rounded-full bg-gray-600 text-white text-xs hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="text-2xl font-bold text-gray-900 dark:text-white leading-none">
              {displayName}
            </div>
          )}
          <div className="text-sm text-gray-600 dark:text-gray-400 leading-tight">
            {email ?? (save?.offlineSession ? 'Email unavailable in offline mode' : '')}
          </div>
        </motion.div>
      </div>
    </div>
  );
}