/**
 * Phase 10 Plan 03 — SEC-01 signup integration test.
 *
 * Verifies signUpAction creates an auth.users row + writes a 'signup' row
 * to public.auth_events. Live-DB; gated on hasSupabaseEnv && hasDbUrl so CI
 * without env passes cleanly.
 *
 * Test users use a `test+<timestamp>-<rand>@orki.test` convention so they
 * are identifiable for cleanup (per runtime_notes — Supabase email confirm
 * is OFF, so signUp returns a session immediately).
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  hasSupabaseEnv,
  adminClient,
  cleanupTestUser,
} from '../setup/supabase-test-client';
import { hasDbUrl } from '../helpers/test-db';
import { signUpAction } from '@/app/actions/auth';

describe.skipIf(!hasSupabaseEnv || !hasDbUrl)('signUpAction', () => {
  let createdUserId: string | null = null;

  afterEach(async () => {
    if (createdUserId) {
      await cleanupTestUser(createdUserId);
      createdUserId = null;
    }
  });

  it('creates an auth.users row on success', async () => {
    const email = `test+${Date.now()}-${Math.random().toString(36).slice(2, 8)}@orki.test`;
    const result = await signUpAction({
      email,
      password: 'sufficiently-long-pw',
      acceptTerms: true,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    createdUserId = result.data.userId;

    const admin = adminClient();
    const { data } = await admin.auth.admin.listUsers();
    expect(data.users.find((u) => u.email === email)).toBeDefined();
  });

  it('writes a signup row to auth_events', async () => {
    const email = `test+${Date.now()}-${Math.random().toString(36).slice(2, 8)}@orki.test`;
    const result = await signUpAction({
      email,
      password: 'sufficiently-long-pw',
      acceptTerms: true,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    createdUserId = result.data.userId;

    const { db } = await import('@/lib/db/client');
    const { authEvents } = await import('@/lib/db/schema');
    const { eq, and } = await import('drizzle-orm');
    const rows = await db
      .select()
      .from(authEvents)
      .where(and(eq(authEvents.email, email), eq(authEvents.event, 'signup')));
    expect(rows.length).toBeGreaterThanOrEqual(1);
  });
});
