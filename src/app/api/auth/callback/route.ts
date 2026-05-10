/**
 * Phase 10 Plan 04 — Supabase recovery-link callback.
 *
 * Receives `?code=<oauth-pkce-code>&next=<destination>` from the recovery
 * email link (issued by `supabase.auth.resetPasswordForEmail` in
 * requestPasswordResetAction, Plan 10-03). Exchanges the code for a session
 * via the SSR client (writes the auth cookies) then redirects to `next`
 * (defaults to /en/reset-password).
 *
 * Per RESEARCH §7 #14: this route lives at `/api/auth/callback` (INSIDE /api)
 * so next-intl middleware excludes it — the route handler creates its own
 * SSR client and owns the cookie write.
 *
 * On any failure (missing code, exchange error) we redirect to
 * /en/forgot-password?error=invalid_link rather than surfacing internals
 * (SEC-06 generic error policy).
 */
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

/**
 * WR-05 (Phase 10 review): resolve locale from the requester's NEXT_LOCALE
 * cookie (set by next-intl middleware) so failure redirects preserve
 * locale. Arabic users who click an invalid recovery link should land on
 * /ar/forgot-password, not /en/forgot-password.
 */
async function resolveLocale(): Promise<'en' | 'ar'> {
  const jar = await cookies();
  return jar.get('NEXT_LOCALE')?.value === 'ar' ? 'ar' : 'en';
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const locale = await resolveLocale();
  // `next` typically comes through as /<locale>/reset-password (set by
  // requestPasswordResetAction). Default to the resolved locale when absent.
  const next = searchParams.get('next') ?? `/${locale}/reset-password`;

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`);
      }
    } catch (err) {
      console.error('[auth/callback]', err);
    }
  }
  return NextResponse.redirect(
    `${origin}/${locale}/forgot-password?error=invalid_link`,
  );
}
