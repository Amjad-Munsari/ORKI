---
phase: 10
plan: 01
subsystem: auth-foundations
tags: [supabase, ssr, middleware, eslint, playwright, env, security]
dependency_graph:
  requires:
    - .env.local with NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ADMIN_EMAILS provisioned
    - "@supabase/ssr (already in package.json)"
    - "@supabase/supabase-js (already in package.json)"
  provides:
    - "Supabase browser/SSR/admin client factories (importable from @/lib/supabase/{client,server,admin})"
    - "Combined Supabase-refresh + next-intl middleware on every non-API request"
    - "ESLint fence preventing @/lib/supabase/admin imports outside admin paths and tests"
    - "Playwright + tests/setup/supabase-test-client.ts fixture (createTestUser / signInTestUser / cleanupTestUser / hasSupabaseEnv)"
    - "Wave-0 smoke confirmation that env + middleware + SSR client are wired correctly"
  affects:
    - "Every Phase 10 plan downstream of this one (10-02 schema/RLS, 10-03 actions, 10-04 UI, 10-05 account/cart-merge, 10-06 admin gate, 10-07 security headers)"
tech_stack:
  added:
    - "@playwright/test@^1.59.1 (devDependency)"
  patterns:
    - "Service-role four-layer boundary: 'server-only' import + no NEXT_PUBLIC_ prefix + ESLint no-restricted-imports + bundler-grep verifier (10-07)"
    - "Combined-middleware shape (intl first, Supabase getUser second, request-cookie rewrite to feed next-intl with refreshed JWT)"
    - "Test-fixture gate via hasSupabaseEnv mirrors hasDbUrl precedent in tests/helpers/test-db.ts"
key_files:
  created:
    - src/lib/supabase/client.ts
    - src/lib/supabase/server.ts
    - src/lib/supabase/admin.ts
    - playwright.config.ts
    - tests/setup/supabase-test-client.ts
    - .planning/phases/10-authentication-and-security-core/notes/wave-0-debug.md
  modified:
    - src/lib/env.ts
    - src/middleware.ts
    - eslint.config.mjs
    - package.json
    - package-lock.json
decisions:
  - "Use getUser() (not getSession()) on the security-critical paths; getSession trusts the cookie verbatim and is spoofable."
  - "Empty getAll/setAll on the admin client — keeps service-role bypass intact even if cookies leak in."
  - "tests/** added to the no-restricted-imports allowlist so the Supabase test fixture can use the admin client to provision and tear down test users."
  - "Debug page placed under src/app/[locale]/debug-auth (not bare /debug-auth) so next-intl middleware doesn't 404 the smoke-test path."
metrics:
  duration_minutes: 22
  completed_date: 2026-05-10
  tasks_completed: 8
  files_changed: 11
---

# Phase 10 Plan 01: Auth Foundations Summary

Wave-0 Supabase client factories, combined Supabase-refresh + next-intl middleware, ESLint fence on the service-role admin client, Playwright + shared test fixture, and a documented end-to-end smoke test confirming the wiring works.

## What Shipped

### Supabase clients

| File | Role | Key | Cookies | RLS |
|------|------|-----|---------|-----|
| `src/lib/supabase/client.ts` | browser factory | anon | browser-managed | n/a (browser context) |
| `src/lib/supabase/server.ts` | SSR factory | anon | per-request via `cookies()` | bound (`auth.uid()` resolves) |
| `src/lib/supabase/admin.ts` | service-role factory | service-role | empty getAll/setAll | bypassed |

The three factories are the entry points for every Phase 10 server-action, RSC, route handler, and admin path. Single-import points keep cookie handling consistent.

### Combined middleware

`src/middleware.ts` is now a single async `middleware()` function that:

1. Computes the next-intl response (locale routing).
2. Instantiates a `createServerClient` whose `setAll` adapter writes refreshed cookies into BOTH the request (so subsequent reads in the same render see fresh JWTs) and the outgoing response.
3. Calls `await supabase.auth.getUser()` to revalidate the JWT against Supabase Auth (only `getUser` is safe to anchor security gates on — `getSession` is spoofable).

Matcher preserved verbatim: `/((?!api|trpc|_next|_vercel|.*\\..*).*)`. `/api` is intentionally excluded so the password-recovery callback (lands in 10-04) can manage its own session lifecycle.

### Service-role four-layer boundary

| Layer | Mechanism | Lives in |
|-------|-----------|----------|
| 1 | `import 'server-only'` | `src/lib/supabase/admin.ts` line 1 |
| 2 | `SUPABASE_SERVICE_ROLE_KEY` has no `NEXT_PUBLIC_` prefix | `src/lib/env.ts` zod schema |
| 3 | ESLint `no-restricted-imports` blocks `@/lib/supabase/admin` outside allowlisted paths | `eslint.config.mjs` |
| 4 | Production-bundle grep | Plan 10-07 (deferred) |

Layers 1-3 are **active**; layer 4 lands with the security-headers plan. Negative test confirmed during execution: importing `@/lib/supabase/admin` from `src/lib/__neg-test.ts` triggered the ESLint rule with the documented error message.

### Playwright + shared test fixture

- `@playwright/test@^1.59.1` installed as devDependency.
- `playwright.config.ts` at repo root (chromium project, baseURL localhost:3000, screenshot-on-failure, dev-server lifecycle).
- `tests/setup/supabase-test-client.ts` exports `hasSupabaseEnv`, `adminClient`, `createTestUser`, `signInTestUser`, `cleanupTestUser`. Plans 10-03 / 10-04 / 10-05 / 10-06 / 10-07 consume this directly.
- Browser binaries NOT downloaded (heavy, plan-runtime constraint). Plans that author E2E specs run `npx playwright install chromium` on demand.

### Wave-0 smoke test

Temporary `src/app/[locale]/debug-auth/page.tsx` Server Component — calls `createClient()` → `supabase.auth.getUser()` → renders `{ email, id }`.

```
GET http://localhost:3002/en/debug-auth   HTTP 200

<pre>
{
  "email": null,
  "id": null
}
</pre>
```

Result `email: null` for an unauthenticated request is the documented success path. It proves env validation, SSR client compilation, and middleware boot all line up.

The debug page was DELETED in the same plan; only the durable note (`notes/wave-0-debug.md`) remains.

## Tasks Completed

| # | Task | Commit |
|---|------|--------|
| 1.1 | Extend `src/lib/env.ts` with Supabase env vars | `06aac9a` |
| 1.2 | Create `src/lib/supabase/client.ts` (browser factory) | `e723113` |
| 1.3 | Create `src/lib/supabase/server.ts` (SSR factory, RLS-bound) | `4862a94` |
| 1.4 | Create `src/lib/supabase/admin.ts` (service-role factory) | `e81d044` |
| 1.5 | ESLint `no-restricted-imports` rule fencing `@/lib/supabase/admin` | `7d7f477` |
| 1.6 | Combined Supabase-refresh + next-intl middleware | `db8831e` |
| 1.7 | Install Playwright + scaffold E2E config + shared test fixture | `f508d77` |
| 1.8 | Wave-0 smoke test + debug note (page created and deleted) | `02903e3` |

## Verification Results

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` over new/modified files (`src/lib/env.ts`, `src/lib/supabase/**`, `src/middleware.ts`, `tests/setup/supabase-test-client.ts`, `playwright.config.ts`) | clean |
| `npx eslint` over the same set | clean |
| ESLint negative test (forbidden import from `src/lib/__neg-test.ts`) | rule fired with documented message |
| `npx playwright --version` | `1.59.1` |
| Wave-0 smoke test (unauthenticated GET to debug page) | returned `{"email": null, "id": null}` — wiring confirmed |
| `npm run dev` boot with the four Supabase env vars | clean (no env-validation throw) |

## Deviations from Plan

### Plan numbering vs prompt numbering

The execution prompt referred to "13 tasks" and "task 1.13 installs Playwright" / "task 1.10 adds an ESLint rule". The plan file actually defines 8 tasks (1.1 through 1.8). The work delivered matches the plan's 8 tasks exactly; the prompt's task numbers appear to be an artifact of an earlier draft. No work was skipped or invented — every `<task>` block in `10-01-PLAN.md` was executed and committed.

### Debug page route placement (Task 1.8 deviation, Rule 3)

The plan specified `src/app/debug-auth/page.tsx`. When the route was placed there, next-intl middleware redirected `/debug-auth` to `/en/debug-auth`, which 404'd because the route was outside the `[locale]` segment. **Fix:** moved the debug page to `src/app/[locale]/debug-auth/page.tsx`. The temporary page was still deleted within the same plan, satisfying the acceptance criterion. Documented in `notes/wave-0-debug.md`.

### Playwright browser binaries NOT downloaded (per runtime_notes)

Runtime constraint stated: "do NOT run `npx playwright install` browsers". Only the npm devDep + config + fixture are shipped. Plans 10-04 / 10-06 / 10-07 will need to download chromium binaries on first E2E run.

## Auth Gates

None during this plan. The `.env.local` was pre-provisioned per runtime_notes; no manual auth steps were required.

## Pointers for Downstream Plans

### Plan 10-02 (next, Wave 0)

- Schema migration adding FK `carts.user_id` / `orders.user_id` → `auth.users(id)` and RLS policies + `auth_events` table.
- Independent of 10-01 except for env: the four Supabase keys are now zod-validated in `src/lib/env.ts`.
- Reminder from `wave-0-debug.md`: confirm Supabase Dashboard → Auth → Email → "Confirm email" is **disabled** before 10-04 runs (CONTEXT.md decision).

### Plan 10-03 (Wave 1)

- Server Actions (`signUpAction`, `signInAction`, `signOutAction`, `requestPasswordResetAction`, `setPasswordAction`) consume `createClient` from `@/lib/supabase/server`.
- Audit-log writes use `createAdminClient` from `@/lib/supabase/admin` (allowlisted: `src/app/actions/admin/**` — server actions for admin operations live there per the ESLint override).
- Tests use `createTestUser` / `signInTestUser` / `cleanupTestUser` from `tests/setup/supabase-test-client.ts`.

### Plans 10-04 / 10-05 / 10-06 (Wave 2)

- All consume the SSR client via `import { createClient } from '@/lib/supabase/server'`.
- 10-06 admin pages can import the admin client (`@/lib/supabase/admin`) directly because `src/app/[locale]/admin/**` is allowlisted in eslint.config.mjs.
- E2E specs land under `tests/e2e/` (directory created on first spec).

### Plan 10-07 (Wave 3)

- Closes layer 4 of the service-role boundary: a verifier task that builds `npm run build`, then greps `.next/static/**` for the first 12 chars of `process.env.SUPABASE_SERVICE_ROLE_KEY`. Expected: zero matches.

## Threat Model Status

All `mitigate` dispositions from the plan's `<threat_model>` are implemented:

| Threat | Mitigation | Status |
|--------|-----------|--------|
| T-10-01-01 (service-role key in client bundle) | Four-layer boundary | layers 1-3 active; layer 4 (10-07) deferred |
| T-10-01-02 (forged Supabase cookies) | `await supabase.auth.getUser()` in middleware | active |
| T-10-01-04 (admin client picking up user JWT) | Empty `getAll`/`setAll` on admin client | active |

Threats with disposition `accept` (T-10-01-03 documented mutation, T-10-01-05 test-env hits production) are documented as accepted; no follow-up needed.

## Self-Check: PASSED

**Files verified to exist:**
- src/lib/env.ts (modified) — FOUND
- src/lib/supabase/client.ts — FOUND
- src/lib/supabase/server.ts — FOUND
- src/lib/supabase/admin.ts — FOUND
- src/middleware.ts (modified) — FOUND
- eslint.config.mjs (modified) — FOUND
- playwright.config.ts — FOUND
- tests/setup/supabase-test-client.ts — FOUND
- .planning/phases/10-authentication-and-security-core/notes/wave-0-debug.md — FOUND
- src/app/[locale]/debug-auth/ — DELETED (as required)
- src/app/debug-auth/ — DELETED (as required)

**Commits verified to exist:**
- 06aac9a (env) — FOUND
- e723113 (client) — FOUND
- 4862a94 (server) — FOUND
- e81d044 (admin) — FOUND
- 7d7f477 (eslint) — FOUND
- db8831e (middleware) — FOUND
- f508d77 (playwright) — FOUND
- 02903e3 (debug note) — FOUND
