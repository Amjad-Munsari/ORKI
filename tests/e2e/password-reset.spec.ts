/**
 * Phase 10 Plan 04 — Password reset e2e spec.
 *
 * Two automated tests + one documented manual round-trip:
 *   1. /api/auth/callback?code=invalid → redirect to forgot-password?error=invalid_link
 *   2. /[locale]/forgot-password renders the generic success message regardless
 *      of whether the email exists (SEC-06 anti-enumeration).
 *   3. Manual round-trip is `test.skip(...)` — Plan 10-07 owns the documented
 *      manual procedure (mirrors lockout pattern per 10-VALIDATION.md).
 *
 * Browser binaries are NOT installed by this plan; execution is deferred to
 * Plan 10-07 verification.
 */
import { test, expect } from '@playwright/test';

test.describe('Password reset', () => {
  test('callback redirects on invalid code', async ({ page }) => {
    await page.goto('/api/auth/callback?code=invalid-code-xxxxx');
    // After the 302/redirect chain Playwright lands on the final URL; expect
    // to end up on /forgot-password with the invalid_link error param.
    await expect(page).toHaveURL(/\/forgot-password\?error=invalid_link$/);
  });

  test('forgot-password form shows generic success regardless of email existence', async ({
    page,
  }) => {
    await page.goto('/en/forgot-password');
    await page
      .getByLabel(/email/i)
      .fill('definitely-not-a-real-user@orki.test');
    await page.getByRole('button', { name: /send recovery link/i }).click();
    // Generic anti-enumeration success copy from Auth.forgot.success
    await expect(
      page.getByText(/check your inbox|account exists/i),
    ).toBeVisible();
  });

  test.skip('manual: full reset round-trip', async () => {
    // 1. Trigger forgot-password with a real test user's email.
    // 2. Click the recovery link in the inbox (Supabase email).
    // 3. Confirm /reset-password loads, set a new password.
    // 4. Sign in with the new password — succeed.
    // Documented in 10-VERIFICATION.md (Plan 10-07 owns automation if any).
  });
});
