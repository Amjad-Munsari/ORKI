/**
 * Phase 10 Plan 04 — Supabase recovery-link callback.
 *
 * Handles TWO link shapes produced by Supabase:
 *
 *  PRIMARY — `token_hash` + `type=recovery` (Supabase default "Reset Password"
 *  email template). Verified via `supabase.auth.verifyOtp({ type: 'recovery',
 *  token_hash })`. This is the shape real users receive from a stock Supabase
 *  project — no email-template customisation required.
 *
 *  FALLBACK — `?code=<pkce-code>` shape. Verified via
 *  `supabase.auth.exchangeCodeForSession(code)`. Used when the Supabase project
 *  is configured for PKCE email links (custom template or future default change).
 *
 * Per RESEARCH §7 #14: this route lives at `/api/auth/callback` (INSIDE /api)
 * so next-intl middleware excludes it — the route handler creates its own
 * SSR client and owns the cookie write.
 *
 * On any failure (missing params, exchange/verify error) we redirect to
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

  // PRIMARY: token_hash + type=recovery — Supabase's default "Reset Password"
  // email shape. verifyOtp matches the stock template and avoids PKCE
  // code_verifier-cookie fragility on cross-context email clicks.
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  if (token_hash && type === 'recovery') {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.verifyOtp({ type: 'recovery', token_hash });
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`);
      }
    } catch (err) {
      console.error('[auth/callback]', err);
    }
  }

  // FALLBACK: ?code PKCE shape (custom template or future Supabase default).
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
