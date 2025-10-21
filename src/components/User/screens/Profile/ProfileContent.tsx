import { motion } from 'framer-motion';
import { SquarePen } from 'lucide-react';
import { useRef } from 'react';

interface ProfileContentProps {
  bio?: string | null;
  isEditingBio: boolean;
  localBio: string;
  busy: boolean;
  memberSince?: string;
  accountType?: string;
  onEditNameClick: () => void;
  onEditBioClick: () => void;
  onLocalBioChange: (value: string) => void;
  onSaveBio: () => void;
  onCancelBioEdit: () => void;
}

export function ProfileContent({
  bio,
  isEditingBio,
  localBio,
  busy,
  memberSince,
  accountType,
  onEditNameClick,
  onEditBioClick,
  onLocalBioChange,
  onSaveBio,
  onCancelBioEdit
}: ProfileContentProps) {
  const bioEditRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className="w-full px-6 lg:px-12 xl:px-16 py-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
      >
        {/* Tabs row (disabled) */}
        <motion.div 
          className="-mt-1 border-t border-gray-200 dark:border-gray-800"
          initial={{ opacity: 0, scaleX: 0.8 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.7, ease: "easeOut" }}
        >
          <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-0 text-sm scrollbar-hide">
            {['Timeline','Friends','Photos','Archive','More'].map((tab, index) => (
              <motion.button 
                key={tab} 
                disabled 
                aria-disabled 
                className="px-2 py-1 rounded text-gray-500 dark:text-gray-400 opacity-50 cursor-not-allowed select-none"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 0.5, y: 0 }}
                transition={{ duration: 0.3, delay: 0.8 + index * 0.1, ease: "easeOut" }}
              >
                {tab}
              </motion.button>
            ))}
            <motion.div 
              className="ml-auto flex items-center gap-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 1.1, ease: "easeOut" }}
            >
              <div className="text-xs text-gray-500 dark:text-gray-400 opacity-70 select-none">Coming soon</div>
              <button 
                onClick={onEditNameClick} 
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs"
              >
                <SquarePen className="h-4 w-4" />
                Edit
              </button>
            </motion.div>
          </div>
        </motion.div>

        {/* Body columns */}
        <motion.div 
          className="mt-6 grid grid-cols-12 gap-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.3, ease: "easeOut" }}
        >
          {/* Left Column: Member Info + Intro */}
          <motion.div 
            className="col-span-4 space-y-6"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 1.5, ease: "easeOut" }}
          >
            {/* Member Info */}
            <motion.div 
              className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-900"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.7, ease: "easeOut" }}
            >
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <div className="text-xs text-gray-500">Member Since</div>
                  <div className="text-sm text-gray-900 dark:text-white">{memberSince}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Account Type</div>
                  <div className="text-sm text-gray-900 dark:text-white">{accountType}</div>
                </div>
              </div>
            </motion.div>
            
            {/* Intro */}
            <motion.div 
              className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-900"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.9, ease: "easeOut" }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">Intro</div>
                <button 
                  onClick={onEditBioClick} 
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs"
                >
                  <SquarePen className="h-4 w-4" />
                  Edit
                </button>
              </div>
              {isEditingBio ? (
                <div ref={bioEditRef}>
                  <textarea 
                    value={localBio} 
                    onChange={(e) => onLocalBioChange(e.target.value)} 
                    rows={4} 
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y" 
                    placeholder="Tell people about yourself..." 
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <button 
                      onClick={onSaveBio} 
                      disabled={busy} 
                      className="px-4 py-2 rounded-full bg-green-600 text-white text-xs hover:bg-green-700 disabled:opacity-60"
                    >
                      Save
                    </button>
                    <button 
                      onClick={onCancelBioEdit} 
                      className="px-4 py-2 rounded-full bg-gray-600 text-white text-xs hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line min-h-[1rem]">
                  {bio || '—'}
                </div>
              )}
            </motion.div>
          </motion.div>

          {/* Right Column: Posts */}
          <motion.div 
            className="col-span-8"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 1.7, ease: "easeOut" }}
          >
            {/* Posts (coming soon) */}
            <motion.div 
              className="rounded-xl border border-gray-200 dark:border-gray-800 p-6 bg-white dark:bg-gray-900"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 2.1, ease: "easeOut" }}
            >
              <div className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Posts</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-6">Coming soon</div>
              <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
                <button disabled aria-disabled className="px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-800 opacity-50 cursor-not-allowed text-sm">Create</button>
                <button disabled aria-disabled className="px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-800 opacity-50 cursor-not-allowed text-sm">Photo/Video</button>
                <button disabled aria-disabled className="px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-800 opacity-50 cursor-not-allowed text-sm">Tag Friends</button>
                <button disabled aria-disabled className="px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-800 opacity-50 cursor-not-allowed text-sm">Check In</button>
                <button disabled aria-disabled className="px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-800 opacity-50 cursor-not-allowed text-sm">Event</button>
                <button disabled aria-disabled className="px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-800 opacity-50 cursor-not-allowed text-sm">Poll</button>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}