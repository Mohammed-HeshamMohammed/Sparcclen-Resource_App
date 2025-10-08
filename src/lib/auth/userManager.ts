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
    // In dev, signUp may require email confirmation; fallback to Admin lookup via Edge Function
    try {
      const { data: lookup } = await (supabase as any).functions.invoke('get_user_by_email', {
        body: { email }
      });

      if (lookup?.ok && lookup.id) {
        // Set role and initial app_settings for the found auth user id (best-effort; may fail due to RLS without session)
        const secret = authenticator.generateSecret();
        try {
          await (supabase as any).from('app_settings').upsert({
            user_id: lookup.id,
            totp_secret: secret,
            theme: 'light',
            settings: { roles: [role], username, email },
            updated_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          });
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn('[createUserDev] Could not upsert app_settings for found auth user:', err);
        }
        return { id: lookup.id, email, secret };
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[createUserDev] auth lookup via edge function failed');
    }
    throw new Error('User creation requires email confirmation or sign-in.');
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

  // Custom profile storage via 'users' table has been removed.

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
