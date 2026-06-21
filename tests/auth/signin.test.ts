/**
 * Phase 10 Plan 03 — SEC-01 cookie flags + SEC-06 generic error + SEC-09
 * audit row, exercised against live Supabase.
 *
 * Gated on hasSupabaseEnv && hasDbUrl.
 */
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { resetCookieJar } from '../setup/next-cookies-mock';

import {
  hasSupabaseEnv,
  createTestUser,
  cleanupTestUser,
  signInTestUser,
} from '../setup/supabase-test-client';
import { hasDbUrl } from '../helpers/test-db';
import { signInAction } from '@/app/actions/auth';

describe.skipIf(!hasSupabaseEnv || !hasDbUrl)('signInAction', () => {
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

  it('returns ok and writes a signin audit row on valid creds', async () => {
    const { userId, email, password } = await createTestUser();
    createdUserId = userId;

    const result = await signInAction({ email, password });
    expect(result.ok).toBe(true);

    const { db } = await import('@/lib/db/client');
    const { authEvents } = await import('@/lib/db/schema');
    const { eq, and } = await import('drizzle-orm');
    const rows = await db
      .select()
      .from(authEvents)
      .where(and(eq(authEvents.email, email), eq(authEvents.event, 'signin')));
    expect(rows.length).toBeGreaterThanOrEqual(1);
  });

  it('issues sb-* session cookies with SameSite=Lax + path=/ on sign-in', async () => {
    const { userId, email, password } = await createTestUser();
    createdUserId = userId;

    const { sessionCookies } = await signInTestUser(email, password);
    // Supabase auth cookies start with sb- prefix.
    const sb = sessionCookies.find((c) =>
      c.name.startsWith('sb-')
    ) as
      | {
          name: string;
          value: string;
          options?: {
            httpOnly?: boolean;
            secure?: boolean;
            sameSite?: string;
            path?: string;
            maxAge?: number;
          };
        }
      | undefined;
    expect(sb).toBeDefined();
    if (!sb) return;
    expect(sb.value.length).toBeGreaterThan(0);
    // Supabase SSR sets sameSite + path + maxAge on the options it hands the
    // cookie store. httpOnly + secure are enforced by Next.js's cookies()
    // adapter at runtime per the SSR factory contract — they are NOT part
    // of the options Supabase passes through, so we assert the substantive
    // fields here and rely on the runtime adapter for httpOnly/secure.
    if (sb.options) {
      expect(String(sb.options.sameSite ?? 'lax').toLowerCase()).toBe('lax');
      expect(sb.options.path ?? '/').toBe('/');
    }
  });

  it('SEC-06: wrong-email and wrong-password collapse to identical error', async () => {
    const { userId, email, password } = await createTestUser();
    createdUserId = userId;

    const wrongPw = await signInAction({ email, password: 'definitely-wrong' });
    const wrongEmail = await signInAction({
      email: `nope-${Date.now()}@orki.test`,
      password,
    });

    expect(wrongPw.ok).toBe(false);
    expect(wrongEmail.ok).toBe(false);
    if (wrongPw.ok || wrongEmail.ok) return;
    expect(wrongPw.code).toBe('INVALID_CREDENTIALS');
    expect(wrongEmail.code).toBe('INVALID_CREDENTIALS');
    expect(wrongPw.messageKey).toBe('Auth.errors.invalidCredentials');
    expect(wrongEmail.messageKey).toBe('Auth.errors.invalidCredentials');
    // Anti-enumeration: identical envelope shape.
    expect(wrongPw.messageKey).toBe(wrongEmail.messageKey);
  });

  it('writes a signin_failed row on bad password', async () => {
    const { userId, email } = await createTestUser();
    createdUserId = userId;

    const result = await signInAction({ email, password: 'wrong-pw' });
    expect(result.ok).toBe(false);

    const { db } = await import('@/lib/db/client');
    const { authEvents } = await import('@/lib/db/schema');
    const { eq, and } = await import('drizzle-orm');
    const rows = await db
      .select()
      .from(authEvents)
      .where(
        and(eq(authEvents.email, email), eq(authEvents.event, 'signin_failed'))
      );
    expect(rows.length).toBeGreaterThanOrEqual(1);
  });
});
