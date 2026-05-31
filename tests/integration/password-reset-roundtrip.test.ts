/**
 * Phase 10 — Password Reset Round-Trip (UAT Test 7).
 *
 * Closes the manual-UAT gap that was BLOCKED on "needs a real recovery email
 * click". Supabase's admin API mints the exact same recovery token the email
 * carries (admin.generateLink), so the full round-trip is verified against live
 * Supabase WITHOUT an inbox:
 *
 *   1. admin.generateLink({ type: 'recovery' })  → real token_hash (no email sent)
 *   2. verifyOtp({ type: 'recovery', token_hash })  ← EXACTLY what
 *      src/app/api/auth/callback/route.ts does on the PRIMARY link shape
 *   3. updateUser({ password })                     ← EXACTLY what setPasswordAction does
 *   4. sign in with the NEW password → succeeds
 *   5. sign in with the OLD password → rejected
 *
 * Live Supabase env required; self-skips otherwise.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { hasSupabaseEnv } from '../setup/supabase-test-client';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const canRun = hasSupabaseEnv && Boolean(SERVICE_ROLE_KEY && ANON_KEY && SUPABASE_URL);

describe.skipIf(!canRun)('Password reset round-trip (Test 7)', () => {
  const admin = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const anon = (): SupabaseClient =>
    createClient(SUPABASE_URL!, ANON_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

  const stamp = Date.now();
  const email = `reset-${stamp}@orki-test.dev`;
  const OLD_PASSWORD = `Old-${stamp}-Pw!`;
  const NEW_PASSWORD = `New-${stamp}-Pw!`;

  let userId: string;
  let tokenHash: string;

  beforeAll(async () => {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: OLD_PASSWORD,
      email_confirm: true,
    });
    if (error || !data.user) throw error ?? new Error('createUser failed');
    userId = data.user.id;
  });

  afterAll(async () => {
    if (userId) await admin.auth.admin.deleteUser(userId).catch(() => undefined);
  });

  it('mints a real recovery token via admin.generateLink (the email token, no inbox)', async () => {
    const { data, error } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email,
    });
    expect(error).toBeNull();
    expect(data?.properties?.hashed_token).toBeTruthy();
    tokenHash = data!.properties!.hashed_token;
  });

  it('verifyOtp(recovery) establishes a session, then updateUser sets the new password', async () => {
    const client = anon();
    const { data, error } = await client.auth.verifyOtp({
      type: 'recovery',
      token_hash: tokenHash,
    });
    expect(error).toBeNull();
    expect(data.session).not.toBeNull();
    expect(data.user?.id).toBe(userId);

    // Recovery session is live on THIS client — set the new password (mirrors
    // setPasswordAction → supabase.auth.updateUser).
    const { error: updErr } = await client.auth.updateUser({
      password: NEW_PASSWORD,
    });
    expect(updErr).toBeNull();
  });

  it('sign-in with the NEW password succeeds', async () => {
    const { data, error } = await anon().auth.signInWithPassword({
      email,
      password: NEW_PASSWORD,
    });
    expect(error).toBeNull();
    expect(data.user?.id).toBe(userId);
  });

  it('sign-in with the OLD password is rejected', async () => {
    const { data, error } = await anon().auth.signInWithPassword({
      email,
      password: OLD_PASSWORD,
    });
    expect(error).not.toBeNull();
    expect(data.session).toBeNull();
  });
});
