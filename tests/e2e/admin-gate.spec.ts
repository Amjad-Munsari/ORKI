/**
 * Phase 10 Plan 06 — Admin gate e2e spec (SEC-08).
 *
 * Two automated tests + one documented manual scenario.
 *
 * Automated coverage (no session cookie present):
 *   1. GET /en/admin redirects to /en/login.
 *   2. GET /en/admin/audit redirects to /en/login (nested path is gated too).
 *
 * The signed-in-but-not-allowlist case is exercised manually per
 * 10-VERIFICATION.md (Plan 10-07). Playwright cannot import the vitest test
 * fixtures cleanly; we keep this spec focused on the unauthed redirect that
 * proves the layout gate fires before any chrome renders.
 *
 * Browser binaries are NOT installed by this plan; execution deferred to 10-07.
 */
import { test, expect } from '@playwright/test';

test.describe('Admin gate (SEC-08)', () => {
  test('unauthenticated GET /admin redirects to /login', async ({ page }) => {
    await page.goto('/en/admin');
    // After the redirect chain, expect to land on /en/login.
    await expect(page).toHaveURL(/\/en\/login(\?|$)/);
  });

  test('unauthenticated GET /admin/audit redirects to /login', async ({
    page,
  }) => {
    await page.goto('/en/admin/audit');
    await expect(page).toHaveURL(/\/en\/login(\?|$)/);
  });

  test.skip('manual: signed-in non-allowlist user is denied', async () => {
    // 1. Sign up a test user via /signup with an email NOT in
    //    SUPABASE_ADMIN_EMAILS (e.g. random-not-allowlisted@orki.test).
    // 2. Visit /en/admin → expect redirect to /en/login.
    // 3. Verify a forensic row was written:
    //      select * from auth_events
    //      where event='admin_action'
    //        and (metadata->>'denied')::boolean = true
    //      order by created_at desc limit 5;
    //    The newest row should reference the test user's id + email and
    //    metadata.reason = 'not_in_allowlist'.
    // Documented in 10-VERIFICATION.md (Plan 10-07 owns the manual sign-off).
  });
});
