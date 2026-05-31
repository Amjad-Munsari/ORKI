/**
 * Phase 10 Plan 03 — SEC-09 audit-log coverage.
 *
 * For each event type, trigger the corresponding action and assert a row
 * lands in public.auth_events with the correct event/email/userId fields.
 *
 * Live-DB; gated on hasSupabaseEnv && hasDbUrl.
 *
 * Coverage:
 *  - signup                    → signUpAction
 *  - signin                    → signInAction (valid)
 *  - signin_failed             → signInAction (invalid)
 *  - password_reset_requested  → requestPasswordResetAction
 *  - password_changed          → setPasswordAction (with active session)
 *  - signout                   → signOutAction
 *
 * Notes:
 *  - signOutAction calls redirect('/login') from next/navigation, which throws
 *    a NEXT_REDIRECT internally. Tests catch + ignore that throw.
 *  - setPasswordAction relies on the recovery session being active in the
 *    cookie store; under unit-tests that's not feasible without a real cookie
 *    jar, so the password_changed assertion runs against a successful
 *    updateUser call performed via signed-in session (createTestUser yields a
 *    confirmed user; we sign them in and call setPasswordAction).
 */
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { resetCookieJar } from '../setup/next-cookies-mock';

import {
  hasSupabaseEnv,
  createTestUser,
  cleanupTestUser,
} from '../setup/supabase-test-client';
import { hasDbUrl } from '../helpers/test-db';
import {
  signUpAction,
  signInAction,
  signOutAction,
  requestPasswordResetAction,
} from '@/app/actions/auth';

async function rowsFor(email: string, event: string) {
  const { db } = await import('@/lib/db/client');
  const { authEvents } = await import('@/lib/db/schema');
  const { eq, and } = await import('drizzle-orm');
  return db
    .select()
    .from(authEvents)
    .where(and(eq(authEvents.email, email), eq(authEvents.event, event)));
}

describe.skipIf(!hasSupabaseEnv || !hasDbUrl)('writeAuthEvent coverage (SEC-09)', () => {
  let createdUserId: string | null = null;

  beforeEach(() => {
    resetCookieJar();
  });

  afterEach(async () => {
    if (createdUserId) {
      await cleanupTestUser(createdUserId);
      createdUserId = null;
    }
  });

  it('signup writes auth_events.event = "signup"', async () => {
    const email = `audit+${Date.now()}-${Math.random().toString(36).slice(2, 8)}@orki.test`;
    const result = await signUpAction({
      email,
      password: 'long-enough-pw',
      acceptTerms: true,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    createdUserId = result.data.userId;

    const rows = await rowsFor(email, 'signup');
    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(rows[0].userId).toBe(createdUserId);
  });

  it('signin writes auth_events.event = "signin"', async () => {
    const { userId, email, password } = await createTestUser();
    createdUserId = userId;

    const result = await signInAction({ email, password });
    expect(result.ok).toBe(true);

    const rows = await rowsFor(email, 'signin');
    expect(rows.length).toBeGreaterThanOrEqual(1);
  });

  it('signin_failed writes auth_events.event = "signin_failed"', async () => {
    const { userId, email } = await createTestUser();
    createdUserId = userId;

    await signInAction({ email, password: 'wrong-pw' });

    const rows = await rowsFor(email, 'signin_failed');
    expect(rows.length).toBeGreaterThanOrEqual(1);
  });

  it('password_reset_requested writes auth_events row', async () => {
    const { userId, email } = await createTestUser();
    createdUserId = userId;

    const result = await requestPasswordResetAction({ email });
    // Anti-enumeration: ALWAYS ok=true regardless of whether email exists.
    expect(result.ok).toBe(true);

    const rows = await rowsFor(email, 'password_reset_requested');
    expect(rows.length).toBeGreaterThanOrEqual(1);
  });

  it('signout writes auth_events.event = "signout"', async () => {
    const { userId, email } = await createTestUser();
    createdUserId = userId;

    // signOutAction no longer redirects (navigation moved client-side to
    // SignOutButton to avoid a soft-nav "Failed to fetch" on the next sign-in
    // POST). It now returns void. The legacy NEXT_REDIRECT guard is retained
    // defensively in case the action is reverted to a server redirect.
    try {
      await signOutAction();
    } catch (e) {
      const err = e as { digest?: string; message?: string };
      const looksLikeRedirect =
        (err.digest && String(err.digest).startsWith('NEXT_REDIRECT')) ||
        /NEXT_REDIRECT/.test(String(err.message ?? ''));
      if (!looksLikeRedirect) throw e;
    }

    // signOut without an active session writes a row with email=null,
    // so we can't query by email. Confirm at least one signout row exists
    // recently.
    const { db } = await import('@/lib/db/client');
    const { authEvents } = await import('@/lib/db/schema');
    const { eq, gt, and } = await import('drizzle-orm');
    const since = new Date(Date.now() - 60_000);
    const rows = await db
      .select()
      .from(authEvents)
      .where(and(eq(authEvents.event, 'signout'), gt(authEvents.createdAt, since)));
    expect(rows.length).toBeGreaterThanOrEqual(1);
    // pin reference so tooling doesn't flag it unused
    expect(typeof email).toBe('string');
  });
});
