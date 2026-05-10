/**
 * Phase 10 Plan 07 — Security headers integration test (SEC-05).
 *
 * Boots `next start -p 3100` against the production build and curls a sample
 * of routes (EN + AR + auth + account) asserting all six security headers
 * from next.config.ts are present in the response.
 *
 * GATED by RUN_HEADER_TESTS=1 because:
 *   1. The test requires `npm run build` to have run first (vitest cannot
 *      cleanly chain a build into a test run).
 *   2. Spawning `next start` from default `npm test` would slow the unit
 *      suite and is unnecessary outside CI / the verifier loop.
 *
 * To run locally:
 *   npm run build && RUN_HEADER_TESTS=1 npm run test tests/security/headers.test.ts
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn, type ChildProcess } from 'node:child_process';

const PORT = 3100;
const BASE = `http://localhost:${PORT}`;
const ROUTES = ['/en', '/ar', '/en/login', '/en/signup', '/en/account'];

const REQUIRED_HEADERS = [
  'content-security-policy',
  'strict-transport-security',
  'x-frame-options',
  'x-content-type-options',
  'referrer-policy',
  'permissions-policy',
];

let server: ChildProcess | null = null;

const shouldRun = !!process.env.RUN_HEADER_TESTS;

describe.skipIf(!shouldRun)('Security headers (SEC-05)', () => {
  beforeAll(async () => {
    server = spawn('npx', ['next', 'start', '-p', String(PORT)], {
      stdio: 'pipe',
      shell: process.platform === 'win32',
    });
    // Poll until the server accepts connections (max ~30 s).
    for (let i = 0; i < 60; i++) {
      try {
        const res = await fetch(BASE, { redirect: 'manual' });
        if (res.status > 0) break;
      } catch {
        // not ready yet
      }
      await new Promise((r) => setTimeout(r, 500));
    }
  }, 60_000);

  afterAll(() => {
    server?.kill();
  });

  for (const route of ROUTES) {
    it(`${route} returns all six security headers`, async () => {
      const res = await fetch(`${BASE}${route}`, { redirect: 'manual' });
      for (const h of REQUIRED_HEADERS) {
        expect(res.headers.has(h), `Missing ${h} on ${route}`).toBe(true);
      }
    });
  }

  it('CSP header includes frame-ancestors none', async () => {
    const res = await fetch(`${BASE}/en`, { redirect: 'manual' });
    const csp = res.headers.get('content-security-policy') ?? '';
    expect(csp).toMatch(/frame-ancestors 'none'/);
  });

  it('Strict-Transport-Security header has 2-year max-age + preload', async () => {
    const res = await fetch(`${BASE}/en`, { redirect: 'manual' });
    const hsts = res.headers.get('strict-transport-security') ?? '';
    expect(hsts).toMatch(/max-age=63072000/);
    expect(hsts).toMatch(/includeSubDomains/);
    expect(hsts).toMatch(/preload/);
  });
});
