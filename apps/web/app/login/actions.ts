'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { loginReturnPath, reportReturnCookie, reportReturnPath } from '@/lib/login-return-path';
import { appOrigin } from '@/lib/supabase/config';

export async function signInWithGoogle(formData: FormData) {
  const next = loginReturnPath(formData.get('next'));
  const reportPath = reportReturnPath(next);
  const callback = new URL('/auth/callback', appOrigin());
  if (next && !reportPath) callback.searchParams.set('next', next);
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google', options: { redirectTo: callback.href },
  });
  if (error || !data.url) redirect(`/login?message=google-error${next ? `&next=${encodeURIComponent(next)}` : ''}`);
  const store = await cookies();
  store.set(reportReturnCookie, reportPath ?? '', {
    path: '/auth/callback',
    httpOnly: true,
    sameSite: 'lax',
    secure: callback.protocol === 'https:',
    maxAge: reportPath ? 600 : 0,
  });
  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) redirect('/dashboard?message=signout-error');
  redirect('/login');
}
