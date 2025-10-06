import { useState } from 'react';
import { createUserDev } from '@/lib/userManager';

interface AdminUsersProps {
  roles: string[];
}

export function AdminUsers({ roles: _roles }: AdminUsersProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Founder' | 'Creator' | 'Admin' | 'normal'>('normal');
  const [message, setMessage] = useState('');

  const handleCreate = async () => {
    setMessage('Creating...');
    try {
      await createUserDev(username, password, role as any);
      setMessage(`Created user ${username}.`);
    } catch (err: any) {
      setMessage('Failed to create user');
    }
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-bold mb-2">User Management</h3>
      <div className="space-y-2">
        <input 
          value={username} 
          onChange={(e) => setUsername(e.target.value)} 
          placeholder="username" 
          className="p-2 border rounded w-full" 
        />
        <input 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          placeholder="password" 
          type="password"
          className="p-2 border rounded w-full" 
        />
        <select 
          value={role} 
          onChange={(e) => setRole(e.target.value as any)} 
          className="p-2 border rounded w-full"
        >
          <option value="Founder">Founder</option>
          <option value="Creator">Creator</option>
          <option value="Admin">Admin</option>
          <option value="normal">normal</option>
        </select>
        <div className="flex gap-2">
          <button 
            onClick={handleCreate} 
            className="bg-primary-600 text-white px-4 py-2 rounded"
            disabled={!username || !password}
          >
            Create user
          </button>
        </div>
        {message && <div className="text-sm text-gray-700">{message}</div>}
        
        <div className="mt-4 p-3 border rounded bg-gray-50 dark:bg-gray-800">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Note: User authentication is now handled by Supabase Auth. 
            Two-factor authentication can be configured in the Supabase dashboard.
          </div>
        </div>
      </div>
    </div>
  );
}
