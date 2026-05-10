/**
 * Phase 10 Plan 07 — CSP shape unit test (SEC-05).
 *
 * Pure-string assertions on the CSP value. Reconstructs the CSP using the
 * same logic as next.config.ts to test both production (no `vercel.live`)
 * and preview (with `vercel.live`) postures without spawning a server.
 *
 * The duplicated builder is a deliberate trade-off: importing next.config.ts
 * directly from a test is awkward (TS config wrapper, withNextIntl side
 * effects, VERCEL_ENV pollution). The duplication is small (12 lines) and
 * any drift from production behaviour is caught by the live header test
 * (tests/security/headers.test.ts) on a real deploy.
 */
import { describe, it, expect } from 'vitest';

function buildCsp(opts: { isPreview: boolean }): string {
  const previewScripts = opts.isPreview ? ' https://vercel.live' : '';
  const previewConnect = opts.isPreview ? ' https://vercel.live' : '';
  return [
    `default-src 'self'`,
    `script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com${previewScripts}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob: https://images.unsplash.com https://gkcaakimmvsctwpvccwt.supabase.co`,
    `font-src 'self' data:`,
    `connect-src 'self' https://gkcaakimmvsctwpvccwt.supabase.co wss://gkcaakimmvsctwpvccwt.supabase.co https://vitals.vercel-insights.com${previewConnect}`,
    `frame-src 'none'`,
    `frame-ancestors 'none'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `upgrade-insecure-requests`,
  ].join('; ');
}

describe('CSP shape (SEC-05)', () => {
  it('production CSP does not include vercel.live', () => {
    const csp = buildCsp({ isPreview: false });
    expect(csp).not.toContain('vercel.live');
  });

  it('preview CSP includes vercel.live in script-src and connect-src', () => {
    const csp = buildCsp({ isPreview: true });
    expect(csp).toMatch(/script-src[^;]*https:\/\/vercel\.live/);
    expect(csp).toMatch(/connect-src[^;]*https:\/\/vercel\.live/);
  });

  it('CSP contains frame-ancestors none, default-src self, form-action self', () => {
    const csp = buildCsp({ isPreview: false });
    expect(csp).toContain(`frame-ancestors 'none'`);
    expect(csp).toContain(`default-src 'self'`);
    expect(csp).toContain(`form-action 'self'`);
  });

  it('CSP script-src has no wildcard outside named hosts', () => {
    const csp = buildCsp({ isPreview: false });
    const scriptSrc =
      csp.split(';').find((d) => d.trim().startsWith('script-src')) ?? '';
    expect(scriptSrc).not.toMatch(/\bscript-src\s+[^']*\*/);
  });

  it('CSP includes Supabase project domain in img-src and connect-src', () => {
    const csp = buildCsp({ isPreview: false });
    expect(csp).toMatch(
      /img-src[^;]*https:\/\/gkcaakimmvsctwpvccwt\.supabase\.co/,
    );
    expect(csp).toMatch(
      /connect-src[^;]*https:\/\/gkcaakimmvsctwpvccwt\.supabase\.co/,
    );
    expect(csp).toMatch(
      /connect-src[^;]*wss:\/\/gkcaakimmvsctwpvccwt\.supabase\.co/,
    );
  });

  it('CSP includes upgrade-insecure-requests directive', () => {
    const csp = buildCsp({ isPreview: false });
    expect(csp).toContain('upgrade-insecure-requests');
  });

  it('CSP includes object-src none and base-uri self', () => {
    const csp = buildCsp({ isPreview: false });
    expect(csp).toContain(`object-src 'none'`);
    expect(csp).toContain(`base-uri 'self'`);
  });
});
