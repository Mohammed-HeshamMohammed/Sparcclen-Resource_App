import { supabase } from '../services/supabase';
import { authenticator } from 'otplib';

export type Role = 'Founder' | 'Creator' | 'Admin' | 'normal';

export async function createUserDev(username: string, password: string, role: Role = 'normal') {
  // synthesize email from username for signUp
  const email = `${username}@example.com`;

  // Try to sign up the user (will succeed if not exists). Ignore errors.
  try {
    await supabase.auth.signUp({ email, password });
  } catch (e) {
    // ignore
  }

  // Retrieve user
  const { data: current } = await supabase.auth.getUser();
  const user = current.user;
  if (!user) {
    // After signUp, supabase may still require confirmation; try to find user row
    const { data: uRow } = await (supabase as any)
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();
    if (uRow) {
      // Construct a minimal user-like object
      // @ts-ignore
      return { id: uRow.id };
    }
    throw new Error('User creation failed');
  }

  // Set role and initial app_settings including totp_secret
  const secret = authenticator.generateSecret();
  await (supabase as any).from('app_settings').upsert({
    user_id: user.id,
    totp_secret: secret,
    theme: 'light',
    settings: { roles: [role], username, email },
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  });

  // Ensure a users/profile row exists linking auth user to profile data
  try {
    await (supabase as any).from('users').upsert({ auth_uid: user.id, email, username, display_name: username }).select();
  } catch (err: any) {
    // If table doesn't exist, ignore — migration may not have run yet.
    // eslint-disable-next-line no-console
    console.warn('Could not upsert profile row in users table:', err?.message ?? String(err));
  }

  return { id: user.id, email: user.email, secret };
}

export async function grantRoleToUser(userId: string, role: Role) {
  const { data: existing } = await (supabase as any)
    .from('app_settings')
    .select('id, settings')
    .eq('user_id', userId)
    .maybeSingle();

  if (!existing) {
    await (supabase as any).from('app_settings').insert({ user_id: userId, theme: 'light', settings: { roles: [role] } });
    return;
  }

  const roles = (existing.settings && existing.settings.roles) || [];
  if (!roles.includes(role)) roles.push(role);

  await (supabase as any).from('app_settings').update({ settings: { ...existing.settings, roles } }).eq('id', existing.id);
}

export async function getRolesForUser(userId: string): Promise<Role[]> {
  const { data } = await (supabase as any).from('app_settings').select('settings').eq('user_id', userId).maybeSingle();
  return (data?.settings?.roles as Role[]) || [];
}
