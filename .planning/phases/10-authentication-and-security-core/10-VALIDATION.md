---
phase: 10
slug: authentication-and-security-core
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-10
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Source: `10-RESEARCH.md` §3 Validation Architecture.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | `vitest@^4.1.5` (installed) + `@testing-library/react@^16.3.2` + `jsdom@^29.1.1` |
| **E2E framework** | `@playwright/test` — **NOT installed** (Wave 0 install task) |
| **Config file** | `vitest.config.ts` (existing); `playwright.config.ts` (Wave 0) |
| **Quick run command** | `npm run test` (= `vitest run --passWithNoTests`) |
| **Full suite command** | `npm run test && npx playwright test` |
| **Estimated runtime** | quick: ~30s · full: ~2 min |

---

## Sampling Rate

- **After every task commit:** Run `npm run test`
- **After every plan wave:** Run `npm run test && npx playwright test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~30 seconds (quick) / ~120 seconds (full)

---

## Per-Task Verification Map

> Populated by gsd-planner during PLAN.md authoring. Each task's `<automated>` block must reference one of the test files below or declare a Wave 0 stub.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| _to be filled by gsd-planner_ |  |  |  |  |  |  |  |  |  |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Tooling install:
- [ ] `npm install -D @playwright/test && npx playwright install --with-deps chromium`
- [ ] `playwright.config.ts` — base URL `http://localhost:3000`, single chromium project, screenshot-on-failure

Shared fixtures:
- [ ] `tests/setup/supabase-test-client.ts` — creates a fresh test user, captures session cookie, returns SSR-shaped client

Test stubs (one per behaviour, mapped to REQ-IDs):
- [ ] `tests/auth/signup.test.ts` — SEC-01 signup → `auth.users` row + httpOnly cookie
- [ ] `tests/auth/signin.test.ts` — SEC-01 cookie flags + SEC-06 generic error on invalid creds
- [ ] `tests/auth/lockout.test.ts` — SEC-07 throttle after 5 failed attempts (CI-skipped, manual-only)
- [ ] `tests/actions/auth.test.ts` — SEC-02 zod validation on every auth Server Action
- [ ] `tests/security/headers.test.ts` — SEC-05 all six headers present on every page
- [ ] `tests/security/csp.test.ts` — SEC-05 CSP correctness (no `*` in script-src, has `frame-ancestors 'none'`)
- [ ] `tests/audit/auth-events.test.ts` — SEC-09 one row per auth event with correct fields
- [ ] `tests/rls/cross-user-deny.test.ts` — RLS denies User A reading User B's order
- [ ] `tests/e2e/csrf.spec.ts` — SEC-04 mismatched-Origin Server Action returns 403
- [ ] `tests/e2e/admin-gate.spec.ts` — SEC-08 non-allowlist email redirected from `/admin`
- [ ] `tests/e2e/cart-merge.spec.ts` — guest cart merges into user-owned cart on first sign-in
- [ ] `tests/e2e/password-reset.spec.ts` — reset-link → setPassword → sign-in round-trip

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Lockout after 5 failed sign-in attempts in 5 min | SEC-07 | Hits live Supabase rate-limiter; flaky/slow in CI; per-IP basis is non-deterministic in shared CI runners | (1) Set explicit override via Supabase Management API in Wave 0. (2) Locally run `npx vitest run tests/auth/lockout.test.ts` against a real project. (3) Document outcome (status code, body) in `10-VERIFICATION.md`. |
| CSP does not break any production page | SEC-05 | Real-browser console errors are the only authoritative signal; static analysis cannot catch all runtime CSP violations | (1) Open every route in Chrome with DevTools Console open. (2) Confirm zero CSP violations. (3) Test EN + AR locales. (4) Document in `10-VERIFICATION.md`. |
| Supabase password-recovery email actually arrives | password reset | Requires SMTP configuration outside the repo; Supabase email-template AR variant must be set in dashboard | (1) Trigger `requestPasswordResetAction` against the real project. (2) Confirm email delivered. (3) Click link, confirm `reset-password?type=recovery` route handles it. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s (quick) / 120s (full)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
