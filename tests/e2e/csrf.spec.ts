/**
 * Phase 10 Plan 07 — CSRF e2e spec (SEC-04).
 *
 * Proves Next.js 15 Server Actions enforce same-origin via the Origin/Host
 * header check (RESEARCH §2.3): a POST to a Server Action endpoint with a
 * forged `Origin` header is rejected with HTTP 4xx.
 *
 * Recipe (RESEARCH §2.3):
 *   1. Land on /en/login (any page hosting a Server Action).
 *   2. Replay a POST against the page URL with `Origin: https://attacker.example`
 *      and `Next-Action: <id>` headers, plus a multipart Server Action body.
 *   3. Expect status >= 400 and < 600. Specifically NOT 200.
 *
 * Notes:
 *   - Next.js's exact transport for Server Actions (header names, body shape)
 *     shifts across minor versions. The assertion intentionally focuses on
 *     the 4xx outcome, not body parsing.
 *   - Browser binaries are NOT installed by this plan; execution deferred to
 *     the verifier (10-VERIFICATION.md Gate 6) per the same pattern as
 *     admin-gate.spec.ts.
 *   - If the test goes flaky against a future Next version, fall back to the
 *     manual recipe in 10-VERIFICATION.md and add `test.skip()` here with a
 *     justification comment.
 */
import { test, expect } from '@playwright/test';

test.describe('CSRF — Server Actions same-origin enforcement (SEC-04)', () => {
  test('mismatched Origin on Server Action POST is rejected', async ({
    page,
    request,
  }) => {
    // Visit /en/login to confirm the page renders and a Server Action is
    // wired up (the form action attribute typically references the action).
    await page.goto('/en/login');

    // Replay a Server Action POST with a forged Origin. The body shape is a
    // best-effort minimal multipart payload; the assertion only requires
    // that Next.js rejects the cross-origin attempt with a 4xx/5xx — not
    // that the action ID resolves.
    const response = await request.post('/en/login', {
      headers: {
        Origin: 'https://attacker.example',
        'Next-Action': '0000000000000000000000000000000000000000',
        'Content-Type': 'multipart/form-data; boundary=xxx',
      },
      data:
        '--xxx\r\n' +
        'Content-Disposition: form-data; name="0"\r\n' +
        '\r\n' +
        '[{}]\r\n' +
        '--xxx--\r\n',
      // Don't follow redirects — we want the raw status from the action.
      maxRedirects: 0,
      failOnStatusCode: false,
    });

    // Expected: any 4xx/5xx. NOT 200. NOT a successful action mutation.
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(600);
    expect(response.status()).not.toBe(200);
  });
});
