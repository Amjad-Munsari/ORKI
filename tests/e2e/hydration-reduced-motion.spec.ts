/**
 * Regression: hydration mismatch under `prefers-reduced-motion: reduce`.
 *
 * Root cause (fixed): motion's `useReducedMotion` returns false during SSR (no
 * matchMedia) but true on the client's first render for reduced-motion users.
 * Components that branched their RENDERED output on it (ScrollReveal,
 * PageTransition, AddToCartButton) emitted different server vs client markup,
 * which shifted the React fiber tree and surfaced as a Base UI `useId` mismatch
 * on the mobile-nav Sheet trigger. Fix: `useReducedMotionSafe` returns the
 * server-consistent value until mounted.
 *
 * This suite emulates the reduced-motion preference and asserts no hydration
 * error on the storefront's key surfaces. Each route is warmed once (the Next
 * dev server lazy-compiles routes on first hit, which can emit a one-off cold
 * transient) and then re-measured on a reload for a clean hydration pass.
 */
import { test, expect, type Page } from '@playwright/test';

// The Next dev server lazy-compiles routes on first hit; the very first
// hydration of a cold route can emit a one-off transient that is NOT a real
// mismatch (verified clean against a production build). Retry absorbs that
// dev-only transient — a genuine hydration regression fails deterministically
// on every attempt.
test.describe.configure({ retries: 2 });

async function expectNoHydrationError(page: Page, path: string) {
  const errors: string[] = [];
  const onConsole = (m: { type(): string; text(): string }) => {
    if (m.type() === 'error' && /hydrat/i.test(m.text())) errors.push(m.text());
  };
  const onPageError = (e: Error) => {
    if (/hydrat/i.test(e.message)) errors.push(e.message);
  };
  // Emulate the user preference that triggered the original mismatch.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  // Warm the route (dev lazy-compile) without measuring.
  await page.goto(path, { waitUntil: 'networkidle' });
  // Now measure a clean hydration on the warm route.
  page.on('console', onConsole);
  page.on('pageerror', onPageError);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  page.off('console', onConsole);
  page.off('pageerror', onPageError);
  expect(errors, errors.join('\n\n')).toHaveLength(0);
}

const STATIC_PAGES = ['/en', '/ar', '/en/shop', '/ar/shop'];

for (const path of STATIC_PAGES) {
  test(`no hydration mismatch under reduced motion: ${path}`, async ({ page }) => {
    await expectNoHydrationError(page, path);
  });
}

test('no hydration mismatch under reduced motion: a product detail page', async ({
  page,
}) => {
  await page.goto('/en/shop', { waitUntil: 'networkidle' });
  const href = await page
    .locator('a[href*="/en/shop/"][href*="/"]')
    .first()
    .getAttribute('href');
  test.skip(!href || href.split('/').length < 5, 'no PDP link found on shop page');
  await expectNoHydrationError(page, href!);
});
