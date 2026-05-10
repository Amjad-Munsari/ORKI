/**
 * Phase 10 Plan 05 — cart-merge UX spec.
 *
 * Proves the guest-cart merge UX flow:
 *   1. Visit as guest, add an item to cart.
 *   2. Sign up.
 *   3. Cart drawer still shows the item (mergeGuestCartIntoUserCart ran
 *      inside signUpAction → signInAction or the defensive getOrCreateCart
 *      hook).
 *
 * Browser binaries are NOT installed by this plan; execution is deferred to
 * Plan 10-07 verification. The spec is structured for run-ability against a
 * Supabase test project with NEXT_PUBLIC_SUPABASE_URL +
 * NEXT_PUBLIC_SUPABASE_ANON_KEY set.
 *
 * Cleanup: created auth users are intentionally left as throwaway test rows
 * (test-merge-* email prefix); Plan 10-07 verifier owns the periodic sweep
 * documented in 10-03-SUMMARY.md §"Test Cleanup Note".
 */
import { test, expect } from '@playwright/test';

test.describe('Cart merge on first sign-in', () => {
  test('Guest cart survives sign-up via mergeGuestCartIntoUserCart', async ({
    page,
  }) => {
    // 1. Visit shop as guest.
    await page.goto('/en/shop');

    // 2. Navigate into a PDP and add to cart. Selectors are role-based +
    //    case-insensitive so they're robust against minor copy edits.
    const firstProduct = page.getByRole('link').filter({ hasText: /./ }).first();
    await firstProduct.click();

    // PDP: select a size then click "Add to cart".
    const sizeButton = page
      .getByRole('button', { name: /^(xs|s|m|l|xl)$/i })
      .first();
    if (await sizeButton.count()) {
      await sizeButton.click();
    }
    await page.getByRole('button', { name: /add to cart|add to bag/i }).click();

    // 3. Sign up.
    await page.goto('/en/signup');
    const email = `test-merge-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 6)}@orki.test`;
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/^password$/i).fill('test-password-12345');
    // Accept terms checkbox.
    const acceptTerms = page.getByRole('checkbox');
    if (await acceptTerms.count()) {
      await acceptTerms.check();
    }
    await page.getByRole('button', { name: /create account/i }).click();

    // 4. After redirect to /account, the merged cart must contain at least
    //    one item. Open the cart drawer and assert.
    await page.waitForURL(/\/account/, { timeout: 10000 });
    await page.getByRole('button', { name: /cart|bag|سلة/i }).first().click();

    // The cart drawer renders cart-item entries — assert at least one is
    // visible. Multiple matching strategies hedge against copy drift.
    const cartItem = page
      .locator('[data-testid="cart-item"], [data-cart-item], li')
      .filter({ hasText: /sar|ر\.س|qty|quantity/i })
      .first();
    await expect(cartItem).toBeVisible({ timeout: 5000 });
  });
});
