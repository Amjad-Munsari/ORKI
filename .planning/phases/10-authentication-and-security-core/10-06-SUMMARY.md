---
phase: 10-authentication-and-security-core
plan: 06
subsystem: auth

tags: [supabase-auth, rls, admin-allowlist, audit-log, playwright, drizzle, next-app-router]

# Dependency graph
requires:
  - phase: 10-authentication-and-security-core
    provides: "isAdminEmail (10-03), writeAuthEvent + auth_events table (10-02/10-03), createClient SSR (10-01), createAdminClient ESLint fence (10-01)"
provides:
  - "SSR admin gate (auth + email allowlist) on /[locale]/admin/* with forensic denial audit"
  - "/admin/audit page surfacing public.auth_events (paginated, EN-only utility UI)"
  - "Playwright e2e spec proving unauthenticated /admin/* redirects to /login"
affects: [10-07 verification, future admin extensions, Phase 11 hardening (TOTP/IP-allowlist)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Layout-level SSR gate: getUser → isAdminEmail → audit+redirect, runs before any chrome HTML emits"
    - "Drizzle direct read for admin-scoped data (postgres role bypasses RLS; same effective access as service-role)"
    - "Anti-screenshot stance: admin chrome shows email in dir=ltr only after gate passes"

key-files:
  created:
    - "src/app/[locale]/admin/audit/page.tsx"
    - "src/components/admin/AuditTable.tsx"
    - "tests/e2e/admin-gate.spec.ts"
  modified:
    - "src/app/[locale]/admin/layout.tsx"

key-decisions:
  - "Drizzle (postgres role) chosen over createAdminClient PostgREST for audit reads — matches existing admin tree (inventory/page.tsx). Either path bypasses RLS identically; Drizzle wins on consistency."
  - "Redirect (not notFound) on deny per plan frontmatter — anti-enumeration is mitigated because the SSR redirect emits before any admin chrome leaks. Disposition: T-10-06-02 accept-LOW."
  - "Email-allowlist only for SEC-08; TOTP MFA + IP allowlist explicitly deferred to a Phase 11 hardening pass."
  - "Spec covers unauthed-redirect automatically; signed-in-non-allowlist case is a documented test.skip — owned by Plan 10-07 manual verification."

patterns-established:
  - "Admin gate idiom: createClient → getUser → isAdminEmail → writeAuthEvent(denied) → redirect, in layout (not middleware), so every nested page inherits it for free."
  - "Audit-write-before-redirect: forensic row always lands first; redirect cannot be short-circuited to skip the audit."
  - "Reference fields (timestamps, IDs, IPs, emails) carry dir='ltr' even in admin EN-only chrome — future-proofs for RTL admin if ever enabled."

requirements-completed:
  - SEC-08
  - SEC-09

# Metrics
duration: ~25min
completed: 2026-05-11
---

# Phase 10 Plan 06: Admin Gate & Audit Surface Summary

**SSR-level admin gate via `supabase.auth.getUser()` + `isAdminEmail()` with forensic deny-audit, plus a Drizzle-backed `/admin/audit` page surfacing `public.auth_events` as a utility table.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-05-10T23:51Z
- **Completed:** 2026-05-11T00:01Z
- **Tasks:** 3
- **Files modified/created:** 4 (1 modified, 3 created)

## Accomplishments

- `/[locale]/admin/*` is now gated at the layout level: failed `getUser()` OR `isAdminEmail()` writes an `admin_action { denied:true, reason:'not_in_allowlist' }` row to `auth_events` and redirects to `/login`. Hard-coded "Root Admin" chrome replaced with the live signed-in admin's email (dir="ltr").
- `/[locale]/admin/audit` ships as the first read surface for the audit log: paginated 50/page, ordered `createdAt DESC`, utility-grade dark table (6 columns: Time, Event, Email, User ID, IP, Metadata).
- `tests/e2e/admin-gate.spec.ts` automates the unauthenticated-redirect proof for both `/en/admin` and `/en/admin/audit`; the signed-in-non-allowlist case is documented as a `test.skip` for Plan 10-07's manual run.
- Bonus: added an "Audit" link to the admin sidebar nav so the new surface is reachable without typing the URL.

## Task Commits

Each task was committed atomically:

1. **Task 6.1: Admin layout gate** — `7696c2e` (feat)
2. **Task 6.2: /admin/audit + AuditTable** — `8c53927` (feat)
3. **Task 6.3: admin-gate Playwright spec** — `380335b` (test)

**Plan metadata commit:** appended after this summary lands.

## Files Created/Modified

- `src/app/[locale]/admin/layout.tsx` — added top-of-function SSR gate (createClient → getUser → isAdminEmail → writeAuthEvent on deny → redirect). Replaced "Connected as / Root Admin" hard-coded chrome with `{user.email}` (dir="ltr"). Added Audit nav entry. Now async by definition.
- `src/app/[locale]/admin/audit/page.tsx` — new RSC reading `authEvents` via Drizzle (postgres role, BYPASSRLS), `force-dynamic`, paginated by `?page=` (50/page).
- `src/components/admin/AuditTable.tsx` — new presentational table; renders empty state inline, 6 LTR-marked reference columns; consumes `AuthEventRow[]` from Drizzle inference.
- `tests/e2e/admin-gate.spec.ts` — new Playwright spec; two automated unauthed-redirect tests + one documented `test.skip` for the signed-in-non-allowlist manual scenario.

## Decisions Made

1. **Drizzle, not createAdminClient, for audit reads.** Both paths bypass RLS identically (postgres role + service_role are the only two roles with read access to `auth_events` per 10-02). Drizzle wins on consistency with the rest of the admin tree (`admin/inventory/page.tsx`). The ESLint fence still allows future switch to `createAdminClient` in this path — both are admin-fenced.
2. **Redirect, not notFound, on deny.** The plan frontmatter and acceptance criteria call for `redirect('/login')` and disposition T-10-06-02 accepts the minimal info-leak (admin path exists) because the SSR redirect happens before any admin HTML emits. notFound would be friendlier to anti-enumeration but breaks the audit-then-redirect contract the plan codifies.
3. **EN-only admin chrome.** Per UI-SPEC §"Header Changes" admin pages stay EN-only. Hard-coded EN literals on the audit page are intentional, not a deviation.
4. **Deferred SEC-08 hardening.** TOTP MFA + IP allowlist explicitly out of scope per CONTEXT.md — flagged as Phase 11 hardening candidates in the threat register (T-10-06-07).
5. **`getUser()`, not `getSession()`.** Mandatory per RESEARCH §7 #3 — the cookie is spoofable; the JWT must revalidate against Supabase Auth on every admin nav. The latency cost is documented as accepted (T-10-06-06).

## Deviations from Plan

None of significance.

**Minor additions (all within plan intent, not auto-fix-rule deviations):**
- Added an "Audit" entry to the admin sidebar nav so the new `/admin/audit` page is reachable without typing the URL. The plan's `<approach>` only described the gate + chrome edits; adding the nav link is a natural UX completion of a "new surface added to admin tree" change.
- Changed the sub-label "Connected as" → "Signed in as" for clarity (kept the literal "Root Admin" removal per acceptance regex).

**Total deviations:** 0 auto-fix-rule deviations.
**Impact on plan:** None. The nav entry is additive; the label rephrase is cosmetic and the verify regex `!/Root Admin/.test(c)` still passes.

## Issues Encountered

None. Pre-existing tsc errors in `tests/products.test.ts`, `tests/SizeSelector.test.tsx`, and `vitest.config.ts` were present before this plan started — verified out of scope (CLAUDE.md scope boundary). Pre-existing lint errors in `scripts/*.cjs` (require-imports) also out of scope.

## Verification Results

- `npx eslint <files-touched>` — clean (zero errors / zero warnings on my 4 files)
- `npx tsc --noEmit` — zero errors in my files (pre-existing test/config errors unchanged)
- `npm test` (vitest) — 96 passed, 1 skipped (the documented lockout case from 10-03), 0 regressions
- `npx playwright test tests/e2e/admin-gate.spec.ts --list` — 3 tests discoverable (2 automated + 1 documented skip); execution deferred to 10-07 per CONTEXT.md (browser binaries not installed)
- Plan's `<verify>` regex gates — all three PASS

## User Setup Required

None new. `SUPABASE_ADMIN_EMAILS` was provisioned in Plan 10-01 (`.env.local`) and is consumed verbatim by `isAdminEmail`. The user's account, when registered, must use one of the comma-separated emails listed there.

For Vercel deploys: ensure `SUPABASE_ADMIN_EMAILS` is set in Production + Preview + Development scopes (server-side only — must NOT have `NEXT_PUBLIC_` prefix). This was already called out by 10-01's USER-SETUP.

## Threat Surface Notes

No new threat surface introduced beyond what the plan's `<threat_model>` already declared. Specifically:

- T-10-06-01 (EoP via direct URL) → mitigated by Task 6.1.
- T-10-06-03 (silent denials / repudiation) → mitigated; `writeAuthEvent` runs before `redirect`.
- T-10-06-04 (auth_events leak via anon PostgREST) → mitigated by RLS-no-policies + admin-path gate.

The "Audit" nav link is additive admin chrome — only visible to allowlist admins (parent layout gate fires first).

## Pointers for Plan 10-07 (Verification)

The following manual / live-environment checks belong to 10-07 and were intentionally NOT automated here:

1. **Signed-in non-allowlist denial.** Sign up a test user with an email NOT in `SUPABASE_ADMIN_EMAILS`. Visit `/en/admin`. Expect redirect to `/en/login`. Then run:
   ```sql
   select id, user_id, email, event, metadata, created_at
   from auth_events
   where event='admin_action'
     and (metadata->>'denied')::boolean = true
   order by created_at desc limit 5;
   ```
   The newest row must reference the test user and `metadata.reason='not_in_allowlist'`.

2. **Allowlist admin happy path.** Sign in as `amjadmunsari@gmail.com` (or whichever entry is currently in `SUPABASE_ADMIN_EMAILS`). Visit `/en/admin` and `/en/admin/audit`. Expect the chrome to render with the user's email in the header right and the audit table populated.

3. **Playwright browser execution.** `npx playwright install` was deliberately NOT run by this plan (per CONTEXT.md). 10-07 owns the install + the actual `npx playwright test` run.

## Next Plan Readiness

Plan 10-07 (verification + tightening) can proceed. Wave 2 is closed. The remaining gap before Phase 10 sign-off is the manual SEC-08 signed-in-non-admin verification documented above.

---
*Phase: 10-authentication-and-security-core*
*Completed: 2026-05-11*

## Self-Check: PASSED

Created files (verified to exist on disk):
- `src/app/[locale]/admin/audit/page.tsx` — FOUND
- `src/components/admin/AuditTable.tsx` — FOUND
- `tests/e2e/admin-gate.spec.ts` — FOUND

Modified file (verified to exist on disk):
- `src/app/[locale]/admin/layout.tsx` — FOUND

Commits (verified in `git log`):
- `7696c2e` (Task 6.1: admin gate) — FOUND
- `8c53927` (Task 6.2: /admin/audit) — FOUND
- `380335b` (Task 6.3: Playwright spec) — FOUND
