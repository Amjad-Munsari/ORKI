---
phase: 10
plan: 02
subsystem: auth-schema
tags: [drizzle, postgres, supabase, rls, migration, auth_events, security]
dependency_graph:
  requires:
    - "Plan 10-01 (Supabase client factories + middleware + env schema) — landed"
    - "Pre-migration probe (RESEARCH §2.1) returning 0 rows against production DB"
    - "DATABASE_URL in .env.local pointing at the Supabase pooler"
  provides:
    - "public.carts.user_id and public.orders.user_id are uuid + cross-schema FK to auth.users(id) ON DELETE SET NULL"
    - "public.auth_events table for Phase 10 audit logging (consumed by Plan 10-03 writeAuthEvent)"
    - "RLS enabled on six public tables (carts, cart_items, orders, order_items, order_events, auth_events) with 9 owner-scoped policies"
    - "Drizzle schema mirrors DB (uuid columns + authEvents pgTable + AuthEventRow / NewAuthEventRow type exports)"
    - "Idempotent migration applicator + journal backfill scripted (scripts/apply-10-02-migration.ts) so future db:migrate is a clean no-op"
  affects:
    - "Plan 10-03 (auth Server Actions) — can now import authEvents from @/lib/db/schema and call db.insert(authEvents) without compile errors"
    - "Plan 10-05 (account/cart-merge) — relies on RLS cross-user-deny semantics in tests"
    - "Plan 10-06 (admin gate) — admin pages that read auth_events use the service-role client (only role with access)"
tech_stack:
  added: []
  patterns:
    - "Hand-authored Drizzle migration (text→uuid + cross-schema FK + RLS + audit table) — same workflow 0001_phase8_cart_orders used for its custom DDL"
    - "RLS-enabled-with-no-policies pattern for service-role-only tables (auth_events)"
    - "(SELECT auth.uid()) wrapper on every policy expression — Postgres caches the result per statement instead of per-row (RESEARCH §7 #13)"
    - "Cross-schema FK to auth.users(id) declared in raw SQL only — Drizzle .references() chain is intentionally omitted because Drizzle cannot introspect the auth schema (ADR-002 §6)"
    - "Idempotent migration apply via transaction + hash-backfill into drizzle.__drizzle_migrations to recover from a db:push-bootstrapped database where the journal tracking table is empty"
key_files:
  created:
    - src/lib/db/migrations/0002_phase10_auth_fk_and_rls.sql
    - scripts/apply-10-02-migration.ts
    - .planning/phases/10-authentication-and-security-core/notes/wave-0-probe.md
    - .planning/phases/10-authentication-and-security-core/notes/supabase-dashboard-checklist.md
  modified:
    - src/lib/db/schema.ts
    - src/lib/db/migrations/meta/_journal.json
decisions:
  - "Cross-schema FK declared in raw SQL, NOT via Drizzle .references() — Drizzle can't introspect auth.* and chaining .references at a non-Drizzle table breaks drizzle-kit generate diff (RESEARCH §7 #5)"
  - "auth_events.user_id has NO FK — log rows must survive auth.users hard-deletion for forensic purposes (RESEARCH §7 #12). Email snapshot kept on the same row."
  - "Apply via custom script (postgres driver, single transaction) instead of npm run db:migrate — the existing schema was originally bootstrapped via db:push, so drizzle.__drizzle_migrations was empty and db:migrate would have re-attempted 0000/0001 against existing tables."
  - "Script backfills all three migration hashes into drizzle.__drizzle_migrations so future db:migrate is a clean no-op."
metrics:
  duration_minutes: 18
  completed_date: 2026-05-10
  tasks_completed: 5
  files_changed: 6
---

# Phase 10 Plan 02: Auth Schema (FK + RLS + auth_events) Summary

Wave-0 schema migration delivering: cross-schema FKs from `carts.user_id` / `orders.user_id` to `auth.users(id)` ON DELETE SET NULL, RLS enabled on six tables with nine owner-scoped policies, and the `public.auth_events` audit-log table (service-role-only access). Drizzle schema mirrored, journal registered, migration applied + verified against production Supabase.

## What Shipped

### Migration `0002_phase10_auth_fk_and_rls.sql`

Hand-authored DDL split into seven sections, separated by the Drizzle statement-breakpoint marker:

| Section | Contents |
|---------|----------|
| 1 | Drop the two text-column indexes (`carts_user_id_idx`, `orders_user_id_idx`) |
| 2 | `ALTER COLUMN user_id TYPE uuid USING user_id::uuid` on `public.carts` and `public.orders` |
| 3 | Add `carts_user_id_fk` and `orders_user_id_fk` — `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL` |
| 4 | Recreate the two indexes on the now-uuid columns |
| 5 | `CREATE TABLE public.auth_events` (id uuid PK, user_id uuid no-FK, email, event, metadata jsonb, ip_address, user_agent, created_at) + 3 indexes |
| 6 | `ENABLE ROW LEVEL SECURITY` on six tables (carts, cart_items, orders, order_items, order_events, auth_events) |
| 7 | Nine `CREATE POLICY` statements from RESEARCH §2.5, all wrapping `auth.uid()` in `(SELECT …)` for per-statement caching |

A defense-in-depth comment block precedes the RLS section explaining the Drizzle-bypass / PostgREST-protected pattern.

### Drizzle schema `src/lib/db/schema.ts`

- `carts.userId` and `orders.userId` changed from `text('user_id')` to `uuid('user_id')`. Both retain their nullable shape (guest paths still work).
- Added inline comments above each line explaining why `.references(authUsers.id)` is NOT chained: Drizzle cannot introspect `auth.*`; chaining would break `drizzle-kit generate` diff (ADR-002 §6 + RESEARCH §7 #5).
- Added `authEvents` `pgTable` with three indexes and `AuthEventRow` / `NewAuthEventRow` type exports.

### Journal + DB apply

- `meta/_journal.json` appended with `{ idx: 2, version: '7', tag: '0002_phase10_auth_fk_and_rls', breakpoints: false }`.
- `scripts/apply-10-02-migration.ts` applies the SQL in a single transaction via the `postgres` driver and backfills all three migration hashes (0000, 0001, 0002) into `drizzle.__drizzle_migrations`. Subsequent `npm run db:migrate` is a clean no-op (verified — output: `migrations applied successfully` with zero pending work).

### Notes

- `notes/wave-0-probe.md` — records the 0-row probe result with the corrected SQL (see Deviations).
- `notes/supabase-dashboard-checklist.md` — five-item checklist enumerating the manual Supabase dashboard + Management API operations the user must perform for SEC-03 / SEC-07 / SEC-09.

## Tasks Completed

| # | Task | Commit |
|---|------|--------|
| 2.1 | Pre-migration SQL probe note (0 rows confirmed) | `9e82580` |
| 2.2 | Hand-author `0002_phase10_auth_fk_and_rls.sql` | `1a5d1ed` |
| 2.3 | Mirror migration in Drizzle `schema.ts` (uuid columns + authEvents) | `ffd7cfa` |
| 2.4 | Register in journal + apply to DB + backfill hashes | `702769f` |
| 2.5 | Supabase manual-ops checklist | `29c4f91` |
| —   | Lint fix: `any` → `unknown` in migration script catch blocks | `6b34d1d` |

## Verification Results

| Check | Expected | Result |
|-------|----------|--------|
| `notes/wave-0-probe.md` exists with "SAFE TO PROCEED" + "0 rows" + "Probe SQL" | acceptance Task 2.1 | PASS |
| Migration SQL contains 2× `REFERENCES auth.users(id) ON DELETE SET NULL`, 6× `ENABLE ROW LEVEL SECURITY`, ≥9 `CREATE POLICY`, `CREATE TABLE public.auth_events`, `ALTER COLUMN user_id TYPE uuid USING user_id::uuid`, `(SELECT auth.uid())` wrapper, `--> statement-breakpoint`, defense-in-depth comment | acceptance Task 2.2 | PASS (2 / 6 / 9 / present / present / present / present / present) |
| `schema.ts` — 3× `userId: uuid('user_id')` (carts + orders + authEvents), 0× `userId: text('user_id')`, 1× `export const authEvents`, type exports present, no `.references(authUsers` | acceptance Task 2.3 | PASS |
| `npx tsc --noEmit` clean on the modified `schema.ts` file specifically | acceptance Task 2.3 | PASS (errors elsewhere are pre-existing — see Deferred Issues) |
| `_journal.json` has entry `{ idx: 2, tag: '0002_phase10_auth_fk_and_rls', breakpoints: false }` | acceptance Task 2.4 | PASS |
| DB query: `carts.user_id` data_type | `uuid` | `uuid` |
| DB query: `orders.user_id` data_type | `uuid` | `uuid` |
| DB query: count FKs named `carts_user_id_fk` + `orders_user_id_fk` | 2 | 2 |
| DB query: `auth_events` table exists | 1 row | 1 row |
| DB query: count policies on 5 user-data tables | ≥9 | 9 (exactly) |
| DB query: RLS enabled on six tables (carts, cart_items, orders, order_items, order_events, auth_events) | all true | all true |
| `npm run db:migrate` after apply | "migrations applied successfully" no-op | clean no-op |
| `npm run lint` on touched files | clean | clean (pre-existing errors elsewhere — out of scope) |
| Dashboard checklist contains "Confirm email", "Rate limit for sign-ups", `rate_limit_email_sent`, project ref, "Plan 10-07" | acceptance Task 2.5 | PASS |

## Deviations from Plan

### 1. [Rule 1 — Bug] Pre-migration probe planning-bug correction

- **Found during:** Task 2.1 (per runtime_notes briefing).
- **Issue:** The probe SQL originally drafted in `10-RESEARCH.md` §2.1 referenced columns `customer_id` and an `audit_log` table — neither exists in the public schema. As written, the probe would have errored on missing-column / missing-table rather than returning meaningful rows.
- **Fix:** The user ran a corrected probe using the actual column names (`public.carts.user_id`, `public.orders.user_id`). Both returned 0 rows, so the migration was safe to proceed.
- **Files modified:** `notes/wave-0-probe.md` records both the corrected SQL and the 0-row result, with an explicit "Notes" section warning future readers not to re-run the original §2.1 verbatim.
- **No code commit** for this correction — it's a documentation-only adjustment captured in the probe note.

### 2. [Rule 1 — Bug] Statement-breakpoint marker inside an SQL comment broke the splitter

- **Found during:** Task 2.4 (when the apply script split the SQL file).
- **Issue:** The migration file's header comment contained the literal string `\`--> statement-breakpoint\`` (back-ticked for emphasis). The splitter treated it as a real statement delimiter, slicing a comment in half and leaving a stray backtick in the second half that Postgres rejected as a syntax error.
- **Fix:** Rewrote the comment to describe the marker prose-style without including the literal marker text. Re-applied — all 28 statements ran clean.
- **Files modified:** `src/lib/db/migrations/0002_phase10_auth_fk_and_rls.sql`
- **Commit:** folded into `702769f` (Task 2.4).

### 3. [Rule 3 — Blocking] Migration apply via custom script instead of `npm run db:push`

- **Found during:** Task 2.4 (when `npm run db:migrate` reported success but produced no DB change).
- **Issue:** The `drizzle.__drizzle_migrations` tracking table existed but was **empty** — the schema had originally been bootstrapped via `db:push` (which doesn't write to the tracking table) rather than `db:migrate`. So `db:migrate` tried to apply 0000 first, hit "table already exists" on CREATE TABLE, and silently stopped without applying 0002.
- **Fix:** Authored `scripts/apply-10-02-migration.ts` (postgres driver, single transaction, statement-by-statement) which:
  1. Applies 0002 in a single transaction (so a partial failure rolls back the whole thing).
  2. Backfills the hashes of all three migrations (0000, 0001, 0002) into `drizzle.__drizzle_migrations` so future `db:migrate` runs are a clean no-op.
  Verified `db:migrate` is now silent — "migrations applied successfully" with no pending work.
- **Files added:** `scripts/apply-10-02-migration.ts`
- **Commit:** `702769f`. This is the plan's documented fallback path (Task 2.4 step 3: "use the canonical drizzle-kit + raw SQL workflow").

### 4. [Rule 1 — Bug] Lint error in the apply script (any in catch)

- **Found during:** post-Task-2.4 lint pass.
- **Issue:** Two `catch (e: any)` blocks in `scripts/apply-10-02-migration.ts` violated `@typescript-eslint/no-explicit-any`.
- **Fix:** Replaced with `catch (e: unknown)` + `e instanceof Error` narrowing.
- **Commit:** `6b34d1d`.

## Auth Gates

None during this plan. The DATABASE_URL was pre-provisioned (per runtime_notes); the user pre-ran the corrected probe before this plan executed.

## Pending Manual Steps (User-Owned)

Documented in `notes/supabase-dashboard-checklist.md`. None block Plan 10-03; all are required before Plan 10-07's SEC-07 manual verification step:

- [ ] Disable "Confirm email" in Supabase Dashboard
- [ ] Set "Rate limit for sign-ups and sign-ins" = 5 per 5 min per IP
- [ ] PATCH four `rate_limit_*` knobs via Management API
- (Email-template AR variant and DKIM/SPF deferred to launch checklist)

## Deferred Issues (Pre-existing, Out of Scope)

The following lint / type errors exist in the codebase and are NOT touched by this plan:

- `npx tsc --noEmit` — errors in `tests/AddToCartButton.test.tsx`, `tests/cartStore.test.ts`, `tests/products.test.ts`, `tests/SizeSelector.test.tsx`, `tests/ProductCard.test.tsx`, `vitest.config.ts`, `src/app/[locale]/checkout/page.tsx` (line 57 paymentMethod type narrowing). All pre-existed before Plan 10-02 — Plan 10-01 SUMMARY does not record fixes for them, and they touch files outside this plan's scope.
- `npm run lint` — errors in `scripts/check-legal-placeholders.cjs` + `scripts/smoke-routes.cjs` (`require()` style) and unused-var warnings in `CookieBanner.tsx` / `orders/server.test.ts`. All pre-existing.

Per the SCOPE BOUNDARY rule, none of these are caused by this plan's changes, so they are logged here for follow-up (not fixed by this plan).

## Pointers for Downstream Plans

### Plan 10-03 (next, Wave 1)

- `import { authEvents, type NewAuthEventRow } from '@/lib/db/schema'` is now valid. Use `db.insert(authEvents).values({ ... })` inside `writeAuthEvent`. Drizzle uses the postgres connection-string role which BYPASSRLS, so writes succeed without a JWT.
- `auth_events` reads from non-admin paths will return zero rows (no policy on the table). Admin paths (Plan 10-06) must use the service-role client.

### Plan 10-05 (Wave 2 — account + cart merge)

- The RLS cross-user-deny test should sign in as User A, sign-in as User B in a separate session, and assert that User B's `select * from orders` via PostgREST returns zero rows for User A's orders. The 9 policies enforce `user_id = (SELECT auth.uid())` — RESEARCH §8 R7's required verification.
- Cart-merge logic continues using Drizzle (BYPASSRLS), so RLS does not affect the merge SQL. RLS only matters when/if PostgREST starts reading carts.

### Plan 10-06 (Wave 3 — admin gate)

- Admin reads of `auth_events` MUST use `@/lib/supabase/admin` (the service-role client) because no policy grants access to anon/authenticated roles. The ESLint fence from Plan 10-01 already restricts that import to `src/app/[locale]/admin/**` and `src/app/actions/admin/**`.

### Plan 10-07 (Wave 3 — security headers / verifier)

- Manual SEC-07 verification: `notes/supabase-dashboard-checklist.md` items 2, 3, 4 must be ticked before the 6th-request-returns-429 test runs.
- Bundler grep for `SUPABASE_SERVICE_ROLE_KEY` (layer 4 of the four-layer boundary) is still owed by 10-07.

## Threat Model Status

All `mitigate` dispositions in the plan's `<threat_model>` are now implemented:

| Threat | Status |
|--------|--------|
| T-10-02-01 (partial-apply state from non-uuid rows) | mitigated — Task 2.1 probe returned 0 rows; the ALTER ran cleanly |
| T-10-02-02 (anon-role cross-user read) | mitigated — 9 owner-scoped policies enforce `user_id = (SELECT auth.uid())`; cross-user-deny test in 10-05 will exercise this |
| T-10-02-03 (non-admin read of `auth_events`) | mitigated — RLS enabled, zero policies; only service_role bypass can read or write |
| T-10-02-04 (FK side-channel revealing deleted users) | accepted per plan — ON DELETE SET NULL not exposed to clients |
| T-10-02-05 (forensic trail lost on user delete) | mitigated — `auth_events.user_id` has NO FK; email column kept |
| T-10-02-06 (drizzle-kit autogenerates a conflicting 0003) | mitigated — schema mirrors DB; verified `db:migrate` is a clean no-op post-apply |

## Self-Check: PASSED

**Files verified to exist:**
- `src/lib/db/migrations/0002_phase10_auth_fk_and_rls.sql` — FOUND
- `src/lib/db/schema.ts` (modified — uuid columns + authEvents) — FOUND
- `src/lib/db/migrations/meta/_journal.json` (modified — idx 2 appended) — FOUND
- `scripts/apply-10-02-migration.ts` — FOUND
- `.planning/phases/10-authentication-and-security-core/notes/wave-0-probe.md` — FOUND
- `.planning/phases/10-authentication-and-security-core/notes/supabase-dashboard-checklist.md` — FOUND

**Commits verified to exist:**
- `9e82580` (probe) — FOUND
- `1a5d1ed` (migration SQL) — FOUND
- `ffd7cfa` (schema.ts mirror) — FOUND
- `702769f` (journal + apply) — FOUND
- `29c4f91` (checklist) — FOUND
- `6b34d1d` (lint fix) — FOUND
