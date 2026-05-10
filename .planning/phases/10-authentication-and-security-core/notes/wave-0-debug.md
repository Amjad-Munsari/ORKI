---
phase: 10
plan: 01
artifact: wave-0-debug-note
date: 2026-05-10
---

# Phase 10 Wave-0 Smoke Test — Outcome

## Date

2026-05-10 (executed during plan 10-01).

## Smoke Test Outcome

A temporary debug page was scaffolded at `src/app/[locale]/debug-auth/page.tsx`
to verify the Wave-0 auth wiring end-to-end. The page is a Server Component that
calls `createClient()` from `@/lib/supabase/server` and renders the result of
`supabase.auth.getUser()` as JSON.

### Result (unauthenticated request)

```
GET http://localhost:3002/en/debug-auth   HTTP 200

<pre>
{
  "email": null,
  "id": null
}
</pre>
```

### What this proves

1. **Env validation works.** The `env` import from `@/lib/env` resolved all four
   Supabase keys at build time without throwing — confirms zod schema in
   `src/lib/env.ts` validates `.env.local` correctly.
2. **SSR Supabase client compiles.** Server Component import of
   `@/lib/supabase/server` succeeded under the dev compiler; the `'server-only'`
   import did not contaminate the client bundle.
3. **Combined middleware boots.** The request passed through both layers:
   - next-intl redirected `/debug-auth` → `/en/debug-auth` (locale routing
     intact).
   - Supabase `createServerClient` instantiated inside the middleware and
     `await supabase.auth.getUser()` returned cleanly (no JWT cookies set yet,
     so `user` is `null` — the documented unauthenticated response).
4. **No bundler leak.** The dev server log contained no warnings about
   `SUPABASE_SERVICE_ROLE_KEY` being inlined into client chunks. The four-layer
   service-role boundary holds at this point. (Plan 10-07 closes the loop with a
   production-bundle grep.)

### Cleanup

- The temporary `src/app/[locale]/debug-auth/page.tsx` was DELETED in this same
  plan. No `debug-auth` directory exists in the repo after plan 10-01 lands.
- Verified: `test ! -d src/app/debug-auth && test ! -d "src/app/[locale]/debug-auth"`
  → both true.

## Confirm-Email Setting (CONTEXT.md compliance)

CONTEXT.md decision: "No email confirmation required. New accounts can log in
immediately after signup." This requires the Supabase project setting **Auth →
Settings → Email Auth → "Confirm email"** to be **disabled**.

> **Owner:** Repo owner (user). The Wave-0 smoke test does NOT exercise the
> signup path (deferred to plan 10-04), so this setting is not directly verified
> here. However, plans 10-03 and 10-04 will fail their fixture tests if
> "Confirm email" is left enabled. Tracked: confirm the toggle is off in the
> Supabase Dashboard for project ref `gkcaakimmvsctwpvccwt` BEFORE 10-04 runs.

## Phase 10 Wave Manifest

Locked in 10-RESEARCH.md §5; reproduced here so the executor of any later wave
plan has a single-page reference:

| Wave | Plans | Sequencing | Notes |
|------|-------|-----------|-------|
| **Wave 0** | 10-01, 10-02 | sequential | Foundations: clients + middleware + Playwright + fixture (10-01); schema migration + RLS + `auth_events` table (10-02). |
| **Wave 1** | 10-03 | after Wave 0 | Auth Server Actions (signup / signin / signout / password-reset) with zod + audit + error mapping. |
| **Wave 2** | 10-04, 10-05, 10-06 | parallel after Wave 1 | UI for auth pages (10-04); account area + cart-merge + UserMenu (10-05); admin gate + audit-log surface (10-06). |
| **Wave 3** | 10-07 | after Wave 2 | Security headers + CSP + final verification + production-bundle grep. |

## Pointers

- **Plan 10-02 starts here.** Schema migration (FK to `auth.users(id)` + RLS
  policies + `auth_events` table) consumes nothing from this plan beyond the
  Drizzle / Supabase env that was already in place. Independent of 10-01 except
  that the `env` schema must accept the four Supabase keys (now true).
- **Plan 10-03 starts here.** Server Actions consume `createClient` from
  `@/lib/supabase/server` and the `signInTestUser` / `createTestUser` fixtures
  from `tests/setup/supabase-test-client.ts`.
- **All later plans:** import the SSR client via `import { createClient } from
  '@/lib/supabase/server'`. The admin client is fenced — only
  `src/app/actions/admin/**`, `src/app/[locale]/admin/**`, and `tests/**` may
  import `@/lib/supabase/admin`.
