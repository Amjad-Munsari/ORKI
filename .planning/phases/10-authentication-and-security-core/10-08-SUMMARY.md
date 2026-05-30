---
phase: 10-authentication-and-security-core
plan: "08"
subsystem: auth-gap-closure
tags: [auth, cart, hydration, ux, gap-closure]
dependency_graph:
  requires: [10-01, 10-02, 10-03, 10-04, 10-05, 10-06, 10-07]
  provides: [password-reset-roundtrip, guest-cart-union, hydration-safe-nav, single-backlink]
  affects: [src/app/api/auth/callback, src/lib/cart/merge-on-signin, src/components/nav, src/components/auth]
tech_stack:
  added: []
  patterns:
    - verifyOtp token_hash+type=recovery branch for Supabase default email links
    - onConflictDoUpdate item-level cart union inside FOR UPDATE transaction
    - useReducedMotionSafe replacing raw useReducedMotion in rendered-output paths
key_files:
  created:
    - tests/integration/cart-merge-union.test.ts
  modified:
    - src/app/api/auth/callback/route.ts
    - src/lib/cart/merge-on-signin.ts
    - src/components/nav/CartBadge.tsx
    - src/components/nav/MobileNavDrawer.tsx
    - src/components/auth/ForgotPasswordForm.tsx
decisions:
  - "PDPGallery.tsx left unchanged: useReducedMotion() used only in useEffect + event handler, never affects rendered output, so raw hook is correct there per useReducedMotionSafe docblock"
  - "Task 5 optional guard skipped: clean-profile re-verify requires human browser session; environmental diagnosis confirmed by 4/4 Playwright repro + 15/15 HTTP 200s in UAT root-cause; no code change applied"
  - "TDD test uses createTestUser for real auth.users FK; gated on canRun (hasDbUrl && hasSupabaseEnv)"
metrics:
  duration: "~25min"
  completed: "2026-05-30"
  tasks_completed: 4
  tasks_skipped: 1
  files_modified: 5
  files_created: 1
---

# Phase 10 Plan 08: UAT Gap Closure Summary

One-liner: Five Phase 10 UAT gaps closed — token_hash recovery callback, guest-cart item-level union, hydration-safe reduced-motion hooks in nav, and removed duplicate back-link.

## Gaps Closed

### Gap Test 7 — Password-Reset Round-Trip (major)

**Root cause:** Callback only handled `?code` PKCE shape; Supabase's default "Reset Password" email delivers `token_hash` + `type=recovery` — no matching branch, fell through to `invalid_link`.

**Fix:** Added `verifyOtp({ type: 'recovery', token_hash })` branch above the existing `exchangeCodeForSession` fallback in `src/app/api/auth/callback/route.ts`. Both link shapes now work.

**Commit:** `0a1e19a` — `fix(10-08): add token_hash+type=recovery branch to auth callback`

**Acceptance:** `verifyOtp` branch is present; invalid-code/token still falls through to `forgot-password?error=invalid_link`. Full live round-trip (real email click → reset form) requires Supabase env + a real recovery email — deferred to manual UAT re-run.

---

### Gap Test 10 — Guest Cart Merge (major)

**Root cause:** `mergeGuestCartIntoUserCart` performed no item-level union. DELETE branch destroyed guest items via `cart_items.cartId ON DELETE CASCADE`.

**Fix (TDD):**
- RED commit `5b0d3d2`: four failing tests (Tests A–D) proving union requirement.
- GREEN commit `440e585`: replaced DELETE-only branch with `onConflictDoUpdate` upsert loop summing quantities on `(cartId, productId, sizeId)` unique index, then deleting the now-empty guest cart — all inside the existing FOR UPDATE transaction.

**Commits:** `5b0d3d2` (RED), `440e585` (GREEN)

**Acceptance:** `npx vitest run tests/integration/cart-merge-union.test.ts` — 4 passed. Test uses `createTestUser` for real `auth.users` FK; gated on `canRun = hasDbUrl && hasSupabaseEnv`.

---

### Gap Test 12 — Hydration Mismatch on Nav (major)

**Root cause:** `CartBadge.tsx` and `MobileNavDrawer.tsx` called raw `useReducedMotion()` from `motion/react` in rendered output. For `prefers-reduced-motion` users, AnimatePresence subtrees diverged between SSR (false) and first client render (true), shifting React `useId` counters → Base UI SheetTrigger id mismatch.

**Fix:** Replaced `useReducedMotion()` with `useReducedMotionSafe()` in both files.

**PDPGallery audit decision:** `src/components/pdp/PDPGallery.tsx:26` uses `useReducedMotion()` only inside a `useEffect` (line 39), its dep array (line 45), and a scroll `behavior` value (line 86). None affect rendered output. Per the `useReducedMotionSafe` docblock, the raw hook is correct there. Migrating it would defer the parallax `matchMedia` setup by one tick for no hydration benefit. **Left unchanged.**

**Commit:** `1a73e00` — `fix(10-08): adopt useReducedMotionSafe in CartBadge + MobileNavDrawer`

**Acceptance:** Grep gate: `grep -n "useReducedMotion\b" CartBadge.tsx MobileNavDrawer.tsx | grep -v "useReducedMotionSafe"` returns 0 matches. E2e spec (`hydration-reduced-motion.spec.ts`) needs dev server + Playwright browsers — env not available headless; grep gate is the env-free acceptance.

---

### Gap Test 6 — Duplicate Back-Link in Forgot-Password (minor)

**Root cause:** Success state rendered two identical "Back to sign in" links: the page-chrome footer (forgot-password/page.tsx:25-32) and the form's own success branch (ForgotPasswordForm.tsx:70-77).

**Fix:** Removed the form's `<p className="text-center"><Link href="/login">{t('back')}</Link></p>` block (lines 70-77) and the now-unused `Link` import.

**Commit:** `982d9f8` — `fix(10-08): remove duplicate back-link from forgot-password success state`

**Acceptance:** `t('back')` absent in `ForgotPasswordForm.tsx`; ESLint clean (no unused-import warning).

---

### Gap Test 4 — Invalid Login "Failed to Fetch" (non-defect, environmental)

**Status:** Optional task — clean-profile re-verification is the primary action; code change is explicitly optional and intentionally skipped.

**Decision:** As a headless agent I cannot run a clean incognito browser session. The environmental diagnosis is already confirmed in UAT root-cause analysis (4/4 Playwright repro succeeded in clean browser; 15/15 live endpoint HTTP 200s on invalid POSTs). No code change applied. This matches the plan's "complete ONLY the clean-profile re-verification and skip the code change; note the decision in the SUMMARY" guidance.

**Verification deferred:** Manual human re-run in incognito/clean browser with extensions disabled should confirm the symptom does not recur.

---

## Whole-Plan Regression Guard

- `npx tsc --noEmit` — clean (exit 0)
- `npx eslint src/components/nav/CartBadge.tsx src/components/nav/MobileNavDrawer.tsx src/components/auth/ForgotPasswordForm.tsx src/app/api/auth/callback/route.ts src/lib/cart/merge-on-signin.ts` — clean (exit 0)

## Checks Requiring Live Environment

| Check | Env needed | Status |
|-------|-----------|--------|
| Password-reset full round-trip (real email click) | Supabase env + recovery email | Deferred to manual UAT |
| `cart-merge-union.test.ts` Tests A–D | DATABASE_URL + NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY | Ran and passed (env available) |
| `hydration-reduced-motion.spec.ts` | dev server + Playwright browsers | Deferred — grep gate passed as env-free acceptance |
| Test 4 clean-profile re-verify | Human browser session (incognito) | Deferred — task intentionally skipped per plan guidance |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test used hardcoded UUID that failed auth.users FK**
- **Found during:** Task 2 TDD GREEN phase
- **Issue:** `TEST_USER_ID = '00000000-0000-0000-0000-000000000001'` doesn't exist in `auth.users`; `carts.userId` has a live cross-schema FK. Test D (claim branch) threw `23503 foreign key violation`.
- **Fix:** Updated test to use `createTestUser` from `tests/setup/supabase-test-client.ts` to provision a real Supabase auth user; gate extended to `canRun = hasDbUrl && hasSupabaseEnv`.
- **Files modified:** `tests/integration/cart-merge-union.test.ts`
- **Commit:** `440e585` (GREEN, includes updated test)

## TDD Gate Compliance

- RED gate: `test(10-08)` commit `5b0d3d2` — 4 tests failing as expected
- GREEN gate: `feat(10-08)` commit `440e585` — 4 tests passing

## Self-Check: PASSED

Files exist:
- `src/app/api/auth/callback/route.ts` — FOUND
- `src/lib/cart/merge-on-signin.ts` — FOUND
- `src/components/nav/CartBadge.tsx` — FOUND
- `src/components/nav/MobileNavDrawer.tsx` — FOUND
- `src/components/auth/ForgotPasswordForm.tsx` — FOUND
- `tests/integration/cart-merge-union.test.ts` — FOUND

Commits:
- `0a1e19a` — Task 1 (callback token_hash branch)
- `5b0d3d2` — Task 2 RED (regression test)
- `440e585` — Task 2 GREEN (union fix)
- `1a73e00` — Task 3 (hydration-safe nav hooks)
- `982d9f8` — Task 4 (remove duplicate back-link)
