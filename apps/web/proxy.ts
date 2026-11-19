import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { reportReturnPath } from './lib/login-return-path';
import { supabaseConfig } from './lib/supabase/config';

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, key } = supabaseConfig();
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(values) {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (request.method === 'GET' && (error || !claims || claims.is_anonymous || claims.client_id || claims.reporty_mcp_connection)) {
    const next = reportReturnPath(request.nextUrl.pathname + request.nextUrl.search);
    if (next) {
      const login = new URL('/login', request.url);
      login.searchParams.set('next', next);
      const redirect = NextResponse.redirect(login);
      response.cookies.getAll().forEach(cookie => redirect.cookies.set(cookie));
      response = redirect;
    }
  }
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

export const config = { matcher: ['/', '/login', '/dashboard/:path*', '/auth/:path*', '/oauth/:path*', '/invite/:path*', '/guest/:path*', '/extension/:path*'] };
