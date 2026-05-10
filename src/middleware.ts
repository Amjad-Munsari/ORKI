import { type NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { createServerClient } from '@supabase/ssr';
import { routing } from './i18n/routing';
import { env } from '@/lib/env';

const intlMiddleware = createMiddleware(routing);

/**
 * Combined middleware: next-intl locale routing + Supabase session refresh.
 *
 * Order matters (RESEARCH §7 #10): intlMiddleware computes the locale-routed
 * response first; then we instantiate a Supabase server client whose `setAll`
 * adapter updates BOTH the request cookies (for any subsequent middleware /
 * RSC reads in the same render) and the outgoing response cookies. Calling
 * `await supabase.auth.getUser()` triggers the JWT refresh path and re-issues
 * the cookie pair if the access token is expiring.
 */
export async function middleware(request: NextRequest) {
  let response = intlMiddleware(request);

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = intlMiddleware(request);
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Use getUser() (not getSession()) — getUser revalidates the JWT against
  // Supabase Auth and is the only call safe to anchor security gates on
  // (RESEARCH §7 #3).
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)',
};
