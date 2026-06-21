/**
 * Phase 10 Plan 03 — SEC-07 lockout (CI-skipped, manual-only).
 *
 * The 6th rapid sign-in attempt from the same IP must return RATE_LIMITED /
 * 'Auth.errors.tooManyAttempts'. Skipped in CI because:
 *   1. Supabase rate-limiter is per-IP; shared CI runners produce non-deterministic
 *      hits.
 *   2. The Wave-0 dashboard checklist (`notes/supabase-dashboard-checklist.md`)
 *      requires the user to set "Rate limit for sign-ups and sign-ins" = 5 per
 *      5 min. Plan 10-07's verifier runs this manually.
 *
 * Manual run procedure:
 *   1. Confirm dashboard knob is set to 5 / 5 min.
 *   2. Run: `npx vitest run tests/auth/lockout.test.ts --no-skip`
 *   3. Expect: signInAction returns { ok: false, code: 'RATE_LIMITED',
 *      messageKey: 'Auth.errors.tooManyAttempts' } on the 6th call.
 *   4. Document the result in 10-07 verifier output.
 */
import { describe, it, expect } from 'vitest';
import { signInAction } from '@/app/actions/auth';

describe('signInAction lockout (SEC-07)', () => {
  it.skip('returns RATE_LIMITED on the 6th rapid failed attempt', async () => {
    const email = `lockout+${Date.now()}@orki.test`;
    let last: Awaited<ReturnType<typeof signInAction>> | null = null;
    for (let i = 0; i < 6; i++) {
      last = await signInAction({ email, password: 'definitely-wrong' });
    }
    expect(last).not.toBeNull();
    if (!last || last.ok) return;
    expect(last.code).toBe('RATE_LIMITED');
    expect(last.messageKey).toBe('Auth.errors.tooManyAttempts');
  });
});
