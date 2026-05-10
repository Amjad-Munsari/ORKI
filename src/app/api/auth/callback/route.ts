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
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/en/reset-password';

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
    `${origin}/en/forgot-password?error=invalid_link`,
  );
}
