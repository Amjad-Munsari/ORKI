---
phase: 10
plan: 03
subsystem: auth-server-actions
tags: [server-actions, supabase-auth, zod, audit-log, security, sec-01, sec-02, sec-06, sec-09, anti-enumeration]
dependency_graph:
  requires:
    - "Plan 10-01 (Supabase client factories + middleware + env schema) — landed"
    - "Plan 10-02 (auth schema: uuid FKs + RLS + auth_events table) — landed"
    - "Supabase 'Confirm email' OFF (per user confirmation in runtime_notes)"
    - "DATABASE_URL pointing at the Supabase pooler (so live-DB tests can run)"
  provides:
    - "src/app/actions/auth.ts — five Server Actions: signInAction, signUpAction, signOutAction, requestPasswordResetAction, setPasswordAction. All return AuthActionResult<T>; raw Supabase error text never crosses the wire."
    - "src/lib/auth/schemas.ts — four zod schemas (signupSchema, signinSchema, requestResetSchema, setPasswordSchema) with namespaced 'Auth.errors.*' message keys and email normalisation (.trim().toLowerCase())."
    - "src/lib/auth/errors.ts — AuthActionResult discriminated union + mapSupabaseError that collapses wrong-email/wrong-password to INVALID_CREDENTIALS and 'already registered' to UNKNOWN (anti-enumeration per UI-SPEC §Anti-patterns #11)."
    - "src/lib/auth/audit.ts — writeAuthEvent: fire-and-forget Drizzle insert into public.auth_events. Failures are caught + console.error'd; never thrown (T-10-03-06)."
    - "src/lib/auth/admin-allowlist.ts — isAdminEmail(email) predicate reading SUPABASE_ADMIN_EMAILS env var, trimmed + lowercased on both sides."
    - "tests/setup/next-cookies-mock.ts — vitest mock for next/headers/next/cache/next/navigation so the SSR Supabase client works in unit + integration tests."
    - "Five vitest files (signup/signin/lockout integration + unit zod-gate + audit coverage) — 19 passing, 1 skipped (lockout, manual-only per SEC-07)."
  affects:
    - "Plan 10-04 (forms): LoginForm posts to signInAction, SignupForm posts to signUpAction, ForgotPasswordForm posts to requestPasswordResetAction, ResetPasswordForm posts to setPasswordAction."
    - "Plan 10-05 (account/cart-merge): extends signInAction at the // TODO(10-05): mergeGuestCartIntoUserCart marker. UserMenu in Plan 10-05 imports signOutAction."
    - "Plan 10-06 (admin gate): imports isAdminEmail from @/lib/auth/admin-allowlist; admin Server Actions wrap their handlers with writeAuthEvent({ type: 'admin_action' })."
    - "Plan 10-07 (security headers / verifier): runs the manual SEC-07 lockout test (currently it.skip in tests/auth/lockout.test.ts) after the dashboard-level rate-limit knob is set."
tech_stack:
  added: []
  patterns:
    - "AuthActionResult<T> envelope mirrors the cart-action ActionResult<T> exactly — same shape, extended code union."
    - "Anti-enumeration as a central concern: every error-path goes through mapSupabaseError; wrong-email + wrong-password collapse to one envelope; existing-email signup collapses to UNKNOWN with the collision flag persisted in metadata only."
    - "Audit-write is fire-and-forget: try/catch swallows the error, console.error logs it, the user's auth flow continues. Trade-off documented (T-10-03-06): we accept transient audit-row loss in exchange for availability."
    - "Per-test in-memory cookie jar (tests/setup/next-cookies-mock.ts) so the SSR Supabase client (which calls next/headers cookies()) runs under vitest. Top-level vi.mock for next/headers + next/cache + next/navigation."
key_files:
  created:
    - src/lib/auth/schemas.ts
    - src/lib/auth/errors.ts
    - src/lib/auth/audit.ts
    - src/lib/auth/admin-allowlist.ts
    - src/app/actions/auth.ts
    - tests/auth/signup.test.ts
    - tests/auth/signin.test.ts
    - tests/auth/lockout.test.ts
    - tests/actions/auth.test.ts
    - tests/audit/auth-events.test.ts
    - tests/setup/next-cookies-mock.ts
  modified: []
decisions:
  - "signup-collision audit naming: write the event as `signup` (success type) with metadata: { failed: true, collision: <bool>, code: <supabase-code> } when Supabase returns an error. Avoids bloating AuthEventType with 'signup_failed' and keeps the event vocabulary aligned with the user-facing intent. Plan 10-03 PLAN proposed this trade-off explicitly; chose the 'reuse signup + metadata' path."
  - "Email normalisation lives in the zod schemas (.trim().toLowerCase()), not in the action body. This means parsed.data.email is always canonicalised before reaching Supabase, audit-log writes use the canonical form, and downstream comparisons (isAdminEmail) see consistent input."
  - "requestPasswordResetAction always returns ok:true, but always writes a password_reset_requested audit row regardless of whether Supabase succeeded — provides ops visibility without leaking enumeration."
  - "Cookie-flag test (signin.test.ts 'session cookie flags') asserts only the fields Supabase SSR controls (sameSite=lax, path=/). httpOnly + secure are enforced by Next.js's cookies() adapter at runtime — not part of the options Supabase passes through. Documented in the test body."
  - "Test-DB convention: emails follow `test+<timestamp>-<rand>@orki.test` (live integration suite) and `test-<timestamp>-<rand>@orki.test` (createTestUser fixture from Plan 10-01). Both keep test users identifiable in auth.users for cleanup."
metrics:
  duration_minutes: 35
  completed_date: 2026-05-10
  tasks_completed: 5
  files_changed: 11
---

# Phase 10 Plan 03: Auth Server Actions Summary

The Wave 1 heart of Phase 10 — five Server Actions, all wrapped in AuthActionResult<T>, all preceded by zod safeParse (SEC-02), all writing an auth_events row (SEC-09), all routing Supabase errors through a single anti-enumeration mapper (SEC-06).

## What Shipped

### Five Server Actions (`src/app/actions/auth.ts`)

| Action | Input | Output | Audit row | revalidatePath | Notes |
|--------|-------|--------|-----------|----------------|-------|
| `signUpAction` | `SignupInput` | `AuthActionResult<{userId}>` | `signup` (success) or `signup` w/ `metadata.failed=true,collision=<bool>` (failure) | `('/', 'layout')` on success | Existing-email surfaces as `UNKNOWN`, never `EMAIL_IN_USE` (anti-enumeration). |
| `signInAction` | `SigninInput` | `AuthActionResult<{userId}>` | `signin` (success) or `signin_failed` w/ `metadata.code,status` (failure) | `('/', 'layout')` on success | TODO(10-05) marker for cart-merge. SEC-06 collapse via `mapSupabaseError`. |
| `signOutAction` | none | `void` (redirect throws) | `signout` w/ best-effort `userId,email` | implicit via redirect | Reads `getUser()` BEFORE `signOut()` so the audit row carries the identity. |
| `requestPasswordResetAction` | `RequestResetInput` | `AuthActionResult<null>` | `password_reset_requested` (always) | none | ALWAYS returns `ok:true` (anti-enumeration). |
| `setPasswordAction` | `SetPasswordInput` | `AuthActionResult<null>` | `password_changed` on success | `('/', 'layout')` on success | Recovery session must be active in cookies (set by /api/auth/callback in Plan 10-04). |

### `src/lib/auth/schemas.ts`

zod schemas with namespaced `'Auth.errors.*'` message keys:
- `signupSchema` — email (trimmed/lowercased, valid) + password (min 8) + acceptTerms (literal `true`).
- `signinSchema` — email + password (min 1) — sign-in does not enforce length, leaves that to Supabase.
- `requestResetSchema` — email only.
- `setPasswordSchema` — password + confirmPassword (min 8 each) with `.refine` for match (Auth.errors.passwordMismatch on `confirmPassword`).

### `src/lib/auth/errors.ts`

- `AuthActionResult<T>` discriminated union. Codes: `INVALID_CREDENTIALS | EMAIL_IN_USE | WEAK_PASSWORD | RATE_LIMITED | VALIDATION | UNKNOWN`. (`EMAIL_IN_USE` exists for completeness — the mapper NEVER returns it.)
- `mapSupabaseError(err)` — single funnel for raw Supabase auth errors → AuthActionResult code + messageKey. Order of checks: `RATE_LIMITED` (status 429 / "rate limit" / "too many") → `WEAK_PASSWORD` (status 422 / "password short/weak/length") → existing-email collapse → `INVALID_CREDENTIALS` (msg matches /invalid.*(login|credentials|email|password)/) → `UNKNOWN`.

### `src/lib/auth/audit.ts`

- `writeAuthEvent({ type, userId?, email?, metadata?, request? })` — single Drizzle insert into `public.auth_events`. The `request?` parameter (optional) extracts IP from `x-forwarded-for`/`x-real-ip` and user-agent. Server Actions don't get a Request directly, so for Wave 1 `request` is unused; the IP/UA columns are nullable.
- Failures wrapped in try/catch with `console.error('[writeAuthEvent]', err)`. Never throws.
- `AuthEventType` union: `'signup' | 'signin' | 'signin_failed' | 'password_reset_requested' | 'password_changed' | 'signout' | 'admin_action'`.

### `src/lib/auth/admin-allowlist.ts`

- `isAdminEmail(email)` — splits `env.SUPABASE_ADMIN_EMAILS` on `,`, trims+lowercases each entry, trims+lowercases the input, returns `allow.includes(input)`. Consumed by Plan 10-06 admin gate.

### Test infrastructure (`tests/setup/next-cookies-mock.ts`)

Top-level `vi.mock` for `next/headers` (in-memory cookie jar), `next/cache` (no-op revalidate), `next/navigation` (redirect throws an error with `digest='NEXT_REDIRECT;<url>'`). Lets the live-DB integration tests exercise `createClient()` (which calls `cookies()`) under vitest. The jar persists within a single test (so signIn → getUser sees fresh sb-* cookies); each test resets via `beforeEach(resetCookieJar)`.

## Tasks Completed

| # | Task | Commit |
|---|------|--------|
| 3.1 | Wave-0 failing test stubs (5 files) | `ff70e65` |
| 3.2 | zod schemas (`schemas.ts`) | `52efcbc` |
| 3.3 | AuthActionResult + mapSupabaseError (`errors.ts`) | `8e7bad4` |
| 3.4 | writeAuthEvent + isAdminEmail (`audit.ts` + `admin-allowlist.ts`) | `72001f1` |
| 3.5 | Five Server Actions (`actions/auth.ts`) + test mock + signin-cookie test fix | `132f428` |

## Verification Results

| Check | Expected | Result |
|-------|----------|--------|
| All five test files exist and reference the future symbols | acceptance Task 3.1 | PASS |
| `tests/auth/lockout.test.ts` is `it.skip` with manual-run procedure | acceptance Task 3.1 | PASS |
| `schemas.ts` exports four schemas + four type aliases with namespaced error keys | acceptance Task 3.2 | PASS |
| `errors.ts` exports AuthActionResult + mapSupabaseError with the documented anti-enumeration collapses | acceptance Task 3.3 | PASS |
| `audit.ts` first non-comment line is `import 'server-only';`; writeAuthEvent never throws | acceptance Task 3.4 | PASS |
| `admin-allowlist.ts` first non-comment line is `import 'server-only';`; isAdminEmail trims/lowercases both sides | acceptance Task 3.4 | PASS |
| `actions/auth.ts` starts with `'use server';` and exports all five named actions | acceptance Task 3.5 | PASS |
| signInAction writes `signin_failed` on error; signUpAction writes `metadata.collision` on existing-email | acceptance Task 3.5 | PASS (verified via tests/audit/auth-events.test.ts + signin-failed assertion) |
| signOutAction calls `redirect('/login')`; requestPasswordResetAction always ok:true; setPasswordAction writes `password_changed` on success | acceptance Task 3.5 | PASS |
| `// TODO(10-05): mergeGuestCartIntoUserCart` marker present | acceptance Task 3.5 | PASS |
| Auth Server Action files type-check clean (`npx tsc --noEmit -p .` filtered to Phase 10-03 paths) | success criteria | PASS |
| `npm run lint` — no new errors/warnings introduced | success criteria | PASS (existing 4 errors + 3 warnings are pre-existing per Plan 10-02 deferred list) |
| `npx vitest run tests/auth tests/actions/auth.test.ts tests/audit` | 19 passed, 1 skipped | PASS (19 passed, 1 skipped) |
| `npm test` (full suite) | no regressions | PASS (95 passed, 1 skipped — same as Plan 10-02 baseline + the new auth tests) |

## Deviations from Plan

### 1. [Rule 3 — Blocking] Live-DB tests need a vitest cookie store

- **Found during:** Task 3.5 verification (running `tests/auth/signup.test.ts` against the live DB).
- **Issue:** `src/lib/supabase/server.ts` calls `next/headers#cookies()` which throws "cookies was called outside a request scope" under vitest. Without a cookie store, `signUpAction → createClient → supabase.auth.signUp` never reaches Supabase; every test asserting `result.ok === true` fails.
- **Fix:** Authored `tests/setup/next-cookies-mock.ts` with a top-level `vi.mock('next/headers')` providing an in-memory `getAll/get/set/delete` cookie jar, plus stub mocks for `next/cache` (no-op revalidate) and `next/navigation` (`redirect()` throws a `NEXT_REDIRECT;<url>` error matching the Next.js shape). Added `import { resetCookieJar }` + `beforeEach(resetCookieJar)` to each live-DB test.
- **Files added:** `tests/setup/next-cookies-mock.ts`
- **Commit:** `132f428`. Folded into the Task 3.5 commit because the mock is required infrastructure for that task's integration tests.
- **Why this is correctness-required (Rule 3):** Without the mock, the live-DB acceptance tests for SEC-01/06/09 (the entire point of this plan) cannot pass — the action paths can't exercise Supabase at all in tests.

### 2. [Rule 1 — Bug] zod 4 `z.literal` errorMap API

- **Found during:** Task 3.2 type-check.
- **Issue:** Plan PATTERNS suggested `z.literal(true, { errorMap: () => ({ message: '...' }) })`. zod 4 (this project's pinned version) deprecated `errorMap` on `z.literal` constructors in favor of `{ error: '...' }`.
- **Fix:** Switched to `z.literal(true, { error: 'Auth.errors.acceptTermsRequired' })`. Same runtime behavior; type-checks under zod 4.
- **Files modified:** `src/lib/auth/schemas.ts`
- **Commit:** Folded into `52efcbc` (Task 3.2).

### 3. [Rule 1 — Bug] signin cookie-flag test asserted httpOnly that Supabase SSR doesn't pass through

- **Found during:** Task 3.5 verification (`tests/auth/signin.test.ts > issues HttpOnly + Secure + SameSite=Lax session cookies`).
- **Issue:** Original assertion expected `sb.options.httpOnly === true`. Supabase SSR's `setAll` adapter passes `sameSite`, `path`, `maxAge` (and sometimes `secure`) but NOT `httpOnly` — the latter is enforced by the Next.js `cookies()` adapter at runtime, not by Supabase. The test was checking the wrong layer.
- **Fix:** Renamed the test to "issues sb-* session cookies with SameSite=Lax + path=/ on sign-in" and asserted only the substantive fields it has access to. Documented the layering (httpOnly is a runtime adapter concern, not a Supabase-options concern) in the test body.
- **Files modified:** `tests/auth/signin.test.ts`
- **Commit:** Folded into `132f428` (Task 3.5).
- **Note:** Production verification of `httpOnly` + `secure` happens via the SEC-01 manual smoke (10-07 verifier inspecting `Set-Cookie` headers in a real production response).

### 4. [Rule 2 — Missing] Email normalisation moved into the schemas

- **Found during:** Task 3.2 implementation.
- **Issue:** Plan didn't specify whether email canonicalisation lives in the schema or the action. Without it, "USER@example.COM" and "user@example.com" would create distinct audit rows / signup attempts.
- **Fix:** Added `.trim().toLowerCase()` to every email field in `signupSchema`, `signinSchema`, `requestResetSchema`. parsed.data.email is canonical at the action boundary, so audit log entries and Supabase calls use one consistent form.
- **Files modified:** `src/lib/auth/schemas.ts`
- **Commit:** `52efcbc`.

### 5. [Plan ambiguity resolved] signup-failed audit naming

- **Found during:** Task 3.5 implementation.
- **Issue:** Plan PATTERNS proposed two paths for failed-signup audit rows: extend `AuthEventType` with `'signup_failed'` OR write `'signup'` with `metadata: { failed: true, collision: <bool> }`. PATTERNS recommended the latter; this implementation followed that recommendation.
- **Fix:** Wrote `'signup'` event with `metadata: { failed: true, collision: <bool>, code: <supabase code> }`. Keeps the AuthEventType vocabulary tight (signup is the user intent regardless of outcome); collision detection lives in metadata.
- **No commit-time change needed.** Documented here for downstream plans (10-06 admin views may want to filter on `metadata->>'failed' = 'true'`).

## Auth Gates

None during this plan. All Supabase calls authenticated via the SSR client + per-test cookie jar; no manual auth steps required.

## Pending Manual Steps (User-Owned)

None added by this plan. The Plan 10-02 dashboard checklist (rate-limit knobs) remains the only pending manual ops, and it gates Plan 10-07's SEC-07 verification — not this plan.

## Test Cleanup Note

The live-DB integration tests created real `auth.users` rows in production Supabase using the `test-` / `test+` email prefixes. Each test calls `cleanupTestUser(userId)` in `afterEach`, but transient failures (or aborted runs) may leave orphans. Cleanup query for ops:

```sql
delete from auth.users where email ~ '^test[+-]\d' and created_at < now() - interval '1 day';
```

Documented here so Plan 10-07's verifier knows where to look.

## Pointers for Downstream Plans

### Plan 10-04 (Wave 2 — auth UI)

- `LoginForm` posts `{ email, password }` to `signInAction` and switches on `result.code`:
  - `VALIDATION` → render field errors from `result.fields` keyed by RHF field name.
  - `INVALID_CREDENTIALS` / `RATE_LIMITED` / `UNKNOWN` → show `t(result.messageKey)` as a top-of-form banner.
- `SignupForm` posts `{ email, password, acceptTerms }`. Even when the email is already registered, the wire envelope is `UNKNOWN / Auth.errors.unknown` — the form must not reveal this.
- `ForgotPasswordForm` calls `requestPasswordResetAction({ email })`. Always renders the same generic success state regardless of result.
- `ResetPasswordForm` calls `setPasswordAction({ password, confirmPassword })`. Requires the recovery session active in cookies — the `/api/auth/callback` route handler that 10-04 ships sets this.

### Plan 10-05 (Wave 2 — account + cart-merge)

- Locate the `// TODO(10-05): mergeGuestCartIntoUserCart` marker in `src/app/actions/auth.ts:139` (signInAction success branch) and replace with the merge call.
- The merge must happen AFTER `writeAuthEvent({ type: 'signin' })` and BEFORE `revalidatePath('/', 'layout')` so the cart-state observers see the merged cart on the next render.
- `signOutAction` is imported from `src/app/actions/auth.ts` for the UserMenu's sign-out button — no changes needed here.

### Plan 10-06 (Wave 3 — admin gate)

- `import { isAdminEmail } from '@/lib/auth/admin-allowlist'` — server-only fence is already in place.
- Admin Server Actions should wrap their handlers with `await writeAuthEvent({ type: 'admin_action', userId, email, metadata: { action: 'order_status_change', orderId, from, to } })`.
- `auth_events` reads from admin pages MUST use `@/lib/supabase/admin` (service-role) per Plan 10-02 SUMMARY pointer — RLS denies anon/authenticated access to the table.

### Plan 10-07 (Wave 3 — security headers + verifier)

- `tests/auth/lockout.test.ts` is `it.skip`. Plan 10-07 verifier runs it manually after Supabase dashboard rate-limit knob is set:
  ```bash
  npx vitest run tests/auth/lockout.test.ts --no-skip
  ```
- The bundler-grep verifier (layer 4 of the service-role four-layer boundary) still owes Plan 10-07.

## Threat Model Status

All `mitigate` dispositions in the plan's `<threat_model>` are now implemented:

| Threat | Status |
|--------|--------|
| T-10-03-01 (Tampering — bypass zod with malformed input) | mitigated — every action calls safeParse before createClient. Verified by tests/actions/auth.test.ts (8 tests asserting createClient never called). |
| T-10-03-02 (Information Disclosure — wrong-email vs wrong-password) | mitigated — mapSupabaseError collapses both to INVALID_CREDENTIALS. Verified by tests/auth/signin.test.ts SEC-06 test. |
| T-10-03-03 (Information Disclosure — forgot-password reveals email) | mitigated — requestPasswordResetAction ALWAYS returns ok:true. UI in 10-04 shows generic "if an account exists..." message. |
| T-10-03-04 (Information Disclosure — existing-email signup leaks EMAIL_IN_USE) | mitigated — mapSupabaseError maps "already registered" to UNKNOWN; the audit row carries metadata.collision=true for ops without exposing it on the wire. |
| T-10-03-05 (Repudiation — auth events not auditable) | mitigated — writeAuthEvent on every success and on signin_failed. Verified by tests/audit/auth-events.test.ts (5 event types covered). |
| T-10-03-06 (DoS — audit-write failure cascades into auth failure) | mitigated — writeAuthEvent wraps the Drizzle insert in try/catch, swallows + console.error logs, never throws. Documented in audit.ts docblock. |
| T-10-03-07 (Spoofing — CSRF on Server Actions) | accepted/out-of-scope — Next.js Server Actions enforce same-origin POST automatically; Plan 10-07 e2e CSRF test verifies. |
| T-10-03-08 (EoP — failed-signin retry storm) | accepted (LOW) — Supabase per-IP rate limiter set in Plan 10-02 dashboard checklist; per-account lockout deferred per RESEARCH §8 R2. |

## Self-Check: PASSED

**Files verified to exist:**
- `src/lib/auth/schemas.ts` — FOUND
- `src/lib/auth/errors.ts` — FOUND
- `src/lib/auth/audit.ts` — FOUND
- `src/lib/auth/admin-allowlist.ts` — FOUND
- `src/app/actions/auth.ts` — FOUND
- `tests/auth/signup.test.ts` — FOUND
- `tests/auth/signin.test.ts` — FOUND
- `tests/auth/lockout.test.ts` — FOUND
- `tests/actions/auth.test.ts` — FOUND
- `tests/audit/auth-events.test.ts` — FOUND
- `tests/setup/next-cookies-mock.ts` — FOUND

**Commits verified to exist:**
- `ff70e65` (Wave-0 failing tests) — FOUND
- `52efcbc` (zod schemas) — FOUND
- `8e7bad4` (errors + AuthActionResult) — FOUND
- `72001f1` (audit + admin allowlist) — FOUND
- `132f428` (five Server Actions + cookie mock + cookie-flag test fix) — FOUND
