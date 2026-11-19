import { loginReturnPath, reportReturnCookie, reportReturnPath } from '@/lib/login-return-path';
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { appOrigin } from '@/lib/supabase/config';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const store = await cookies();
  const pendingReport = store.get(reportReturnCookie)?.value;
  const next = loginReturnPath(request.nextUrl.searchParams.get('next')) ?? reportReturnPath(pendingReport);
  if (pendingReport) store.set(reportReturnCookie, '', { path: '/auth/callback', maxAge: 0 });
  const code = request.nextUrl.searchParams.get('code');
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      store.delete('reporty_pending_invite');
      return NextResponse.redirect(`${appOrigin()}${next ?? '/dashboard'}`);
    }
  }
  return NextResponse.redirect(`${appOrigin()}/login?message=callback-error${next ? `&next=${encodeURIComponent(next)}` : ''}`);
}
