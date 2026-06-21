/**
 * Playwright base config for Phase 10 E2E tests.
 *
 * Spec files live under tests/e2e/ — created on demand by individual plans
 * (10-04 cart-merge, 10-06 admin-gate, 10-07 CSRF). The directory may be
 * empty until those plans land; `npx playwright test --list` returns 0 tests
 * in that case, which is expected and not a failure.
 *
 * webServer.command boots `npm run dev` so tests run against a real Next.js
 * dev server (Turbopack). reuseExistingServer keeps local DX fast — set CI=1
 * to force a fresh server boot in CI.
 */
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
