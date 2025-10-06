import { useAuth } from '@/lib/auth';

interface SettingsModalProps {
  onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const { user } = useAuth();

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-gray-900 rounded p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Settings</h3>
          <button onClick={onClose} className="text-sm text-gray-500">Close</button>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="font-semibold">Account Information</h4>
            <p className="text-sm text-gray-500">Your account details</p>
          </div>

          <div className="space-y-2">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <p className="text-sm text-gray-600 dark:text-gray-400">{user?.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">User ID</label>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">{user?.id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Account Created</label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 mb-2">
              Two-factor authentication is handled by Supabase Auth. 
              You can manage your security settings in your Supabase dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
