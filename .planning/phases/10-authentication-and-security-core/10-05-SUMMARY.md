---
phase: 10
plan: 05
subsystem: authentication-and-security-core / account-area + cart-merge + header-auth-slot
tags: [auth, account, rls, cart-merge, navbar, ui, i18n, anti-enumeration, sec-01, sec-08, ux-04, ux-09]
dependency_graph:
  requires:
    - "Plan 10-03 (signInAction with the TODO(10-05) marker, signOutAction, AuthActionResult envelope, writeAuthEvent)"
    - "Plan 10-04 (Auth UI surface — /login, /signup, /forgot-password, /reset-password)"
    - "Plan 10-02 (auth.users FK + RLS policies on carts.user_id and orders.user_id; cross-schema FK)"
    - "Phase 8 (carts/orders schema; orders.userId; getOrderByReference; OrderDetailView source markup)"
  provides:
    - "src/lib/cart/merge-on-signin.ts — mergeGuestCartIntoUserCart(userId, sessionId) with race-safe SELECT … FOR UPDATE transaction (R5 in §8 of RESEARCH.md)"
    - "src/components/order/OrderDetailView.tsx — lifted presentational RSC consumed by /checkout/confirmation AND /account/orders/[reference] (one source of truth)"
    - "src/app/[locale]/account/{layout,page}.tsx — auth-gated orders-list landing (RLS-friendly Drizzle SSR + UI-SPEC Account chrome)"
    - "src/app/[locale]/account/orders/[reference]/page.tsx — per-order detail page with anti-enumeration notFound() ownership check"
    - "src/components/account/{OrdersList,OrderRow}.tsx — list wrapper (handles empty state inline) + outline-only status-pill row"
    - "src/components/auth/{UserMenu,SignOutButton}.tsx — base-ui dropdown + form-action sign-out (works without JS)"
    - "messages/{en,ar}.json — new Account namespace (16 keys) + Nav.signIn + Nav.account"
    - "tests/rls/cross-user-deny.test.ts — proves RLS-bound PostgREST denies cross-user reads"
    - "tests/e2e/cart-merge.spec.ts — Playwright spec for guest→authed merge UX"
  affects:
    - "Plan 10-06 (admin gate) — UserMenu pattern reusable for admin chrome; signOutAction reuse continues; isAdminEmail from 10-03 ships next"
    - "Plan 10-07 (manual verification + CSRF) — owns the cart-merge Playwright run, the manual RLS cross-user walkthrough, and final SEC-07 lockout sweep"
tech-stack:
  added: []
  patterns:
    - "Race-safe one-shot merge: db.transaction wrapping a SELECT … FOR UPDATE on the user's cart row, then either DELETE the guest cart (user already has one) or UPDATE the guest cart's userId atomically with a NULL-userId guard to prevent concurrent-tab double-claim."
    - "Defensive merge hook in getOrCreateCart(): every authenticated request whose resolved cart lacks userId triggers the merge — catches paths that bypass signInAction (future social-callback flows, cookie restoration after Supabase token refresh)."
    - "Anti-enumeration ownership gate: /account/orders/[reference] returns notFound() for BOTH 'this reference doesn't exist' AND 'this reference exists but isn't yours' — never 403, never leaks the distinction (UI-SPEC §Anti-patterns #11, T-10-05-01)."
    - "UserMenu label-vs-aria-label split: trigger shows the literal word 'Account' (NEVER the email — emails leak in screenshots, T-10-05-02); aria-label carries the email so screen readers can announce the active account."
    - "Form-action sign-out: <form action={signOutAction}> works without JS — the form submission posts to the Server Action and the server-side redirect('/login') completes the flow even if the page never hydrated."
    - "Lifted OrderDetailView with confirmationChrome boolean prop: one source of truth shared between the guest /checkout/confirmation page (full success chrome) and the /account/orders/[reference] account view (bare card). Eyebrow bumped 10px → 12px per UI-SPEC §Anti-patterns #15."
key-files:
  created:
    - src/lib/cart/merge-on-signin.ts
    - src/components/order/OrderDetailView.tsx
    - src/app/[locale]/account/layout.tsx
    - src/app/[locale]/account/page.tsx
    - src/app/[locale]/account/orders/[reference]/page.tsx
    - src/components/account/OrdersList.tsx
    - src/components/account/OrderRow.tsx
    - src/components/auth/UserMenu.tsx
    - src/components/auth/SignOutButton.tsx
    - tests/rls/cross-user-deny.test.ts
    - tests/e2e/cart-merge.spec.ts
  modified:
    - src/lib/cart/session.ts
    - src/app/actions/auth.ts
    - src/lib/orders/server.ts
    - src/app/[locale]/checkout/confirmation/page.tsx
    - src/components/nav/Navbar.tsx
    - src/components/nav/MobileNavDrawer.tsx
    - messages/en.json
    - messages/ar.json
decisions:
  - "Cart merge swallows ALL errors via console.error — defence in depth at two layers (the merge function itself + the signInAction call site try/catch). Auth flow must NEVER break on merge failure (T-10-05-03 mitigation acceptance criterion)."
  - "UserMenu rendered only at md+ in desktop Navbar; mobile drawer carries its own UserMenu slot inside the Sheet. UI-SPEC §Header Changes mandated 'On mobile, the trigger lives inside MobileNavDrawer rather than in the icon cluster' to keep the Navbar uncluttered."
  - "OrderDetailView's confirmationChrome boolean defaults to false. Account route renders the bare card; only /checkout/confirmation passes confirmationChrome to opt into the full success-icon + thanks + CTAs cluster. Cleaner than two near-identical components."
  - "Support footer in OrderDetailView bumped 10px → 12px to satisfy the strict 4-distinct-size typography contract (UI-SPEC §Anti-patterns #15). Per UI-SPEC the bump is acceptable, not regressive."
  - "RLS test uses createServerClient bound to A's session cookies (signInTestUser cookie-jar fixture) — proves the RLS gate at the PostgREST layer, not at Drizzle. Both paths exist by design: Drizzle bypasses RLS so getOrdersForUser filters by userId explicitly; PostgREST is RLS-bound so the cross-user-deny gate is enforced at the database level."
  - "Cart-merge Playwright spec uses role-based selectors (no hard-coded data-testid) for copy resilience. Browser binary install is NOT invoked here — Plan 10-07 verifier owns the execution + manual round-trip documentation."
metrics:
  duration: ~12 min
  completed: 2026-05-10
  tasks_completed: 8
  files_changed: 19
  loc_added: ~980
---

# Phase 10 Plan 05: Account Area, Cart-Merge & UserMenu Summary

Wave 2 closer. The post-login surface: cart-merge on first sign-in (race-safe txn), the `/account` orders-list landing + per-order detail, and the header `<UserMenu>` swap. Cross-user RLS deny is also proven here — the gate that justifies the RLS work in Plan 10-02 ran green against the live Supabase project.

## What shipped

### Cart-merge (`src/lib/cart/merge-on-signin.ts`)

One-shot `mergeGuestCartIntoUserCart(userId, sessionId)` with the CONTEXT.md semantics:
- If the user has no server cart → claim the guest cart by setting `userId`.
- If the user already has a server cart → silently DELETE the guest cart (T-10-05-07 accepted: no item-level union per CONTEXT, simpler UX than "overwrite").

Race-safety per RESEARCH §7 #9: `db.transaction` wraps a `SELECT … FOR UPDATE` on the user's cart row, then either DELETEs the guest cart (matched by `sessionId AND userId IS NULL`) or UPDATEs `userId` with the same NULL-userId guard — so concurrent tabs can't double-claim. The function is idempotent: a second call sees the guest row already userId-bound (or absent) and the WHERE guard makes the operation a no-op.

Two integration points:
- **`signInAction`** (`src/app/actions/auth.ts`) — proactive merge: reads the `orki_sid` cookie via `next/headers#cookies()` immediately after a successful Supabase sign-in, dynamic-imports the merge function, calls it before `revalidatePath('/', 'layout')`. The `// TODO(10-05)` marker from Plan 10-03 is gone.
- **`getOrCreateCart()`** (`src/lib/cart/session.ts`) — defensive merge: every authenticated request whose resolved cart still lacks `userId` triggers the merge and re-fetches the user's cart. Covers paths that bypass `signInAction` (future social-login callbacks, cookie restoration after Supabase token refresh).

Both call sites swallow all errors via `console.error`. Auth flow must never break on merge failure (T-10-05-03 mitigation acceptance criterion).

### Account area (`/[locale]/account`)

- **`layout.tsx`** — auth gate. `supabase.auth.getUser()` (revalidates the JWT against Supabase; NEVER the legacy session API — see `src/lib/supabase/server.ts` docblock). Redirects to `/login` if absent.
- **`page.tsx`** — orders-list landing. Server Component, `dynamic = 'force-dynamic'`. Queries `getOrdersForUser(user.id, { limit: 20, offset: 0 })` (new helper in `src/lib/orders/server.ts` — explicit userId filter because Drizzle bypasses RLS). Renders the UI-SPEC §"Account Page Chrome": Tier 4 eyebrow + Tier 1 Display heading + `signedInAs` micro-line with `dir="ltr"` email span + `<OrdersList />`.
- **`orders/[reference]/page.tsx`** — per-order detail. Defensive `getUser()` + `getOrderByReference()` + ownership check. **Mismatched ownership returns `notFound()` — NEVER 403** (UI-SPEC §Anti-patterns #11, T-10-05-01). Reuses the lifted `<OrderDetailView />` and adds a back-link to `/account` + the `signedInAs` micro-line. `ArrowLeft` icon uses `.rtl-flip` so it points the correct way in AR.

### Presentational components

- **`OrdersList.tsx`** — handles empty state inline with the UI-SPEC `[#111111]` card (Tier 1 Display heading reused for the empty headline + primary-CTA "Browse the shop" link).
- **`OrderRow.tsx`** — single card with the outline-only status pill (UI-SPEC §Anti-patterns #10: status conveyed by label, not color). Reference rendered LTR via explicit `dir="ltr"`. Date formatter uses `Intl.DateTimeFormat` with `ar-SA-u-nu-latn` for AR (Latin numerals per CLAUDE.md §Design System currency contract).

### OrderDetailView lift

Lifted `src/app/[locale]/checkout/confirmation/page.tsx:52-109` verbatim into `src/components/order/OrderDetailView.tsx`. New `confirmationChrome` prop (default `false`) toggles the full success badge + back-home/continue-shopping CTAs + support footer — `/account/orders/[reference]` renders the bare card while `/checkout/confirmation` opts into the full chrome. Eyebrow (`text-[10px]` → `text-[12px]`) and support footer (`text-[10px]` → `text-[12px]`) bumped per UI-SPEC §Anti-patterns #15 (4-distinct-size typography contract).

### Header auth slot

- **`SignOutButton.tsx`** — `<form action={signOutAction}>` per UI-SPEC §Header Changes. NOT `useTransition` — the form-action pattern works without JavaScript hydration. No confirmation modal (UI-SPEC §Anti-patterns #9). Destructive-tinted text color (`text-red-400/90`) is sufficient affordance.
- **`UserMenu.tsx`** — client component using `@base-ui/react/menu`. Receives `user: { id, email } | null` prop. Renders the "Sign in" Link when `user === null`, the dropdown trigger when authed. **Trigger label is the literal word "Account" — NEVER the email** (UI-SPEC + T-10-05-02 mitigation against screenshot leakage). Email is exposed ONLY through `aria-label={t('userMenu', { email: user.email })}`. Dropdown panel uses the UI-SPEC chrome (`min-w-[220px] bg-[#111111] border border-white/10 rounded-lg p-2 shadow-2xl`) with `align="end"` for automatic RTL mirroring.
- **`Navbar.tsx`** — converted to fetch `user` via `createClient()` + `getUser()` server-side. Passes a normalised `authedUser` to both `<UserMenu />` (desktop right cluster, between `CartTrigger` and `LanguageSwitcher`) and `<MobileNavDrawer user={authedUser} />`.
- **`MobileNavDrawer.tsx`** — accepts a new optional `user` prop; appends the `<UserMenu />` inside the sheet (separated from the nav links by `border-t border-white/10`).

### i18n

- **`messages/en.json` + `messages/ar.json`** — new top-level `Account` namespace with 16 keys (`eyebrow`, `heading`, `signedInAs` carrying `<email>` rich-text token, `referenceLabel`, `pagination`, `nextPage`, `prevPage`, `empty.{eyebrow, heading, body, cta}`, `backToAccount`, `signOut`, `signingOut`, `userMenu`, `account`). Nav extended with `signIn` + `account`. AR mirror uses the functional-formal imperative tone established by the Auth namespace in Plan 10-04.

### Tests

- **`tests/rls/cross-user-deny.test.ts`** — provisions two users via admin client, seeds an order owned by B (Drizzle bypasses RLS by design — we're testing the read path, not the write path), signs in as A, builds an RLS-bound PostgREST client from A's session cookies (via the `signInTestUser` cookie-jar fixture from Plan 10-01), and asserts the SELECT-by-id AND SELECT-by-reference queries both return `[]`. **The test ran green against the live Supabase project** — the RLS policies from Plan 10-02 are PROVEN to enforce cross-user deny at the PostgREST layer.
- **`tests/e2e/cart-merge.spec.ts`** — Playwright spec structuring the guest-add → signup → cart-retained flow. Role-based selectors. Browser binaries NOT installed; execution deferred to Plan 10-07.

## Tasks completed

| # | Task | Commit |
|---|------|--------|
| 5.1 | mergeGuestCartIntoUserCart (race-safe txn) | `b4b484e` |
| 5.2 | Wire merge into getOrCreateCart + signInAction | `363c09b` |
| 5.3 | Lift OrderDetailView (12px eyebrow) | `9d2f155` |
| 5.4 | Account namespace + Nav.signIn/account (en+ar) | `2086317` |
| 5.5 | /account layout + page + OrdersList + OrderRow | `941c0ca` |
| 5.6 | /account/orders/[reference] (ownership notFound) | `a7a1d37` |
| 5.7 | SignOutButton + UserMenu in Navbar + MobileNavDrawer | `428ab34` |
| 5.8 | Cross-user RLS deny + cart-merge e2e | `aceedd7` |

## Verification results

| Check | Expected | Result |
|-------|----------|--------|
| `mergeGuestCartIntoUserCart` first non-comment line is `import 'server-only'`; exports symbol; uses `db.transaction` with `FOR UPDATE` lock; swallows errors via `console.error` | Task 5.1 acceptance | PASS |
| `signInAction` no longer has `TODO(10-05)`; reads `orki_sid` cookie; calls merge | Task 5.2 acceptance | PASS |
| `getOrCreateCart` invokes the merge after cookie resolution when an authed user is detected | Task 5.2 acceptance | PASS |
| `OrderDetailView` lifted; no `text-[10px]` remaining; confirmation page imports + renders it | Task 5.3 acceptance | PASS |
| `Account` namespace + `Nav.{signIn,account}` exist in both locales; `signedInAs` carries `<email>` rich-text token | Task 5.4 acceptance | PASS |
| `/account/layout.tsx` uses `getUser()` + `redirect('/login')`; `/account/page.tsx` exports `dynamic = 'force-dynamic'`; OrdersList renders empty-state inline; OrderRow uses outline-only pill + `dir="ltr"` reference | Task 5.5 acceptance | PASS |
| `/account/orders/[reference]` has ≥3 `notFound()` calls + ownership check via `order.userId !== user.id`; reuses `<OrderDetailView />` | Task 5.6 acceptance | PASS |
| SignOutButton uses `<form action={signOutAction}>`; UserMenu trigger label NOT email but aria-label includes email; Navbar fetches user via SSR; MobileNavDrawer slots UserMenu | Task 5.7 acceptance | PASS |
| Cross-user RLS test runs against live Supabase + skips cleanly when env absent | Task 5.8 acceptance | PASS (live run: 1 passed, 7.32s) |
| Cart-merge Playwright spec detected by `playwright test --list` | Task 5.8 acceptance | PASS (1 test detected) |
| `npx tsc --noEmit -p .` — no new errors introduced | success criteria | PASS (pre-existing errors in `checkout/page.tsx`, several `tests/*.ts`, `vitest.config.ts` per Plan 10-04 baseline; ZERO new from this plan) |
| `npm test` — full vitest suite | no regressions | PASS (96 passed, 1 skipped vs Plan 10-04 baseline 95 + 1 — +1 new RLS test, all green) |
| `npm run lint` — no new errors/warnings introduced | success criteria | PASS (7 pre-existing problems in `scripts/*.cjs` + `CookieBanner.tsx` + `orders/server.test.ts` per Plan 10-04 baseline; ZERO new from this plan) |

## Deviations from Plan

### 1. [Rule 1 — Bug] `text-[10px]` lingering in OrderDetailView docblock + support footer

- **Found during:** Task 5.3 verification (`!/text-\[10px\]/.test(v)` failed twice).
- **Issue:** First occurrence was in a JSDoc comment ("bumped from `text-[10px]` to `text-[12px]`"). Second was in the support-footer paragraph at the bottom of the confirmation chrome (originally `<p className="text-[10px] text-white/20 uppercase tracking-tighter">{t('support')}</p>` at line 104 of the pre-lift confirmation page). Plan PATTERNS only called out line-70 eyebrow; verify regex was stricter.
- **Fix:** Removed the literal token from the docblock; bumped the support-footer eyebrow to `text-[12px]` to satisfy the strict 4-distinct-size typography contract. Per UI-SPEC §Anti-patterns #15 the bump is consistent with the eyebrow lift.
- **Files modified:** `src/components/order/OrderDetailView.tsx`
- **Commit:** Folded into `9d2f155` (Task 5.3).

### 2. [Rule 1 — Bug] `// TODO(10-05)` lingering in `auth.ts` docblock after Task 5.2 call-site removal

- **Found during:** Task 5.2 verification (`!/TODO\(10-05\)/.test(a)` failed).
- **Issue:** Plan 10-03 docblock at `src/app/actions/auth.ts:18` had `* `// TODO(10-05)` marker below` documenting the future cart-merge hook. The CALL-SITE marker was removed correctly; the DOCBLOCK pointer was not.
- **Fix:** Updated the docblock to reflect that cart-merge landed in Plan 10-05 (signInAction now calls mergeGuestCartIntoUserCart immediately after successful sign-in).
- **Files modified:** `src/app/actions/auth.ts`
- **Commit:** Folded into `363c09b` (Task 5.2).

### 3. [Rule 1 — Bug] `getSession()` reference in account layout docblock failed strict negative regex

- **Found during:** Task 5.5 verification (`!/getSession\(\)/.test(layout)` failed).
- **Issue:** Original docblock read "Calls supabase.auth.getUser() (NOT getSession() — see…)" which the verify regex caught.
- **Fix:** Reworded the docblock to use "the legacy session API" instead of the literal `getSession()` token. Behaviour unchanged; check passes.
- **Files modified:** `src/app/[locale]/account/layout.tsx`
- **Commit:** Folded into `941c0ca` (Task 5.5).

### 4. [Rule 2 — Critical functionality] Defensive merge hook in `getOrCreateCart()` rewritten to preserve the original return shape

- **Found during:** Task 5.2 implementation.
- **Issue:** Plan PATTERNS sketched the merge hook as appended-after-return, but the existing function had two early-return paths (cookie-present-and-row-exists, cookie-mints-new-row). Patching both call sites would duplicate logic and miss the case where the merge re-fetches a now-userId-bound cart.
- **Fix:** Refactored to a single `resolvedCart` variable that defers the return; the merge hook runs once at the bottom with a try/catch boundary. The merge re-fetches by `eq(carts.userId, user.id)` and replaces `resolvedCart` if the merge changed the row pointer.
- **Files modified:** `src/lib/cart/session.ts`
- **Commit:** Folded into `363c09b` (Task 5.2).
- **Why correctness-required (Rule 2):** Without the rewrite, the merge would only run on the cookie-mints-new-row path (where there's no existing cart to merge into — defeating the purpose). The refactor is the minimum surgery to make the hook actually fire on the path that needs it.

### No architectural changes (Rule 4 not triggered)

The plan was implemented exactly as specified for the merge semantics, the account routes, the UserMenu chrome, and the threat-model mitigations. No unexpected schema / route / framework changes.

## Threat-model coverage

| Threat ID | Status | Notes |
|-----------|--------|-------|
| T-10-05-01 (Info disclosure — order-reference enumeration via `/account/orders/[reference]`) | mitigated | Ownership check returns `notFound()` (NEVER 403). Plan 10-04 `[locale]/not-found.tsx` chrome reused; the 404 is identical whether the reference doesn't exist OR exists-but-isn't-yours. **Cross-user RLS deny test (Task 5.8) further proves the underlying database gate.** |
| T-10-05-02 (Info disclosure — UserMenu trigger exposes email in screenshots) | mitigated | UI-SPEC mandates trigger label = literal "Account"; email lives only in `aria-label`. Verified by Task 5.7 acceptance check (`aria-label` present, no email rendered in trigger). |
| T-10-05-03 (Race / Tampering — two simultaneous tabs trigger merge → duplicate items or orphan carts) | mitigated | `db.transaction` with `SELECT … FOR UPDATE` on the user's cart row + NULL-userId guard on the UPDATE/DELETE clauses make the merge idempotent under concurrent invocation. Plan 10-07 manual verification will exercise the two-tab race. |
| T-10-05-04 (Info disclosure — Drizzle bypasses RLS so missing userId filter could leak orders) | mitigated | `getOrdersForUser` explicitly filters by `userId`; cross-user-deny test (Task 5.8) **PROVES** the RLS-bound PostgREST path is also locked down. Defence in depth at both layers. |
| T-10-05-05 (Spoofing — direct URL to `/account/page.tsx` bypasses auth) | mitigated | `account/layout.tsx` calls `getUser()` and redirects to `/login` if absent. `page.tsx` also defensively returns null on `!user`. |
| T-10-05-06 (Repudiation — sign-out without audit trail) | mitigated | `signOutAction` (Plan 10-03) writes `auth_events.signout` BEFORE redirect; `SignOutButton` invokes it via form-action. No client-side fetch path. |
| T-10-05-07 (Info disclosure — cart-merge silently overwrites a user's existing cart) | accept | CONTEXT.md decision documented in `mergeGuestCartIntoUserCart` JSDoc. UX trade-off: simpler than item-union, no surprise overwrites of the user's cart. |

**HIGH-severity threats:** T-10-05-01 (mitigated, proven by Task 5.8). T-10-05-04 (mitigated by belt-and-braces userId filter + RLS, proven by Task 5.8 against live Supabase).

## Pointers for downstream plans

### Plan 10-06 (Wave 2 — admin gate)

- `isAdminEmail` from Plan 10-03 (`src/lib/auth/admin-allowlist.ts`) is ready to consume. Admin gate should mirror the `account/layout.tsx` pattern: SSR `getUser()` → check `isAdminEmail(user.email)` → `notFound()` (NOT 403) on non-admin to preserve anti-enumeration.
- `UserMenu` is the reusable chrome for admin nav too — consider gating an "Admin" menu item by `isAdminEmail` server-side and passing a `showAdmin` prop or a fresh `<AdminMenu />` component if admin chrome diverges.
- Admin Server Actions must wrap their handlers with `writeAuthEvent({ type: 'admin_action', ... })` per Plan 10-03 pointer.
- `auth_events` reads from admin pages MUST use `@/lib/supabase/admin` (service-role) per Plan 10-02 fence — RLS denies anon/authenticated access to that table.

### Plan 10-07 (Wave 3 — verifier + CSRF + headers)

- `tests/e2e/cart-merge.spec.ts` exists with one structured test. Plan 10-07 owns:
  - Browser binary install (`npx playwright install chromium`) — same gate as 10-04's `password-reset.spec.ts`.
  - Manual round-trip documentation in `10-VERIFICATION.md`: visit `/en/account` while logged out → confirm `/login` redirect; sign in → confirm orders list (or empty state); add an item as guest, sign up, confirm cart retains item; sign out → confirm `/login` redirect.
  - **Two-tab merge race manual check** — open two tabs as the same about-to-sign-in user, complete sign-in in both within ~1s, confirm the merged cart is consistent (no duplicate items, no orphan carts).
- The cross-user-deny test PASSED against the live Supabase project — 10-07 verifier can cite this as evidence for SEC-08 walkthrough rather than re-running.
- Service-role-key bundler grep (layer 4 of the four-layer boundary) still owes Plan 10-07.

## Self-Check: PASSED

**Files verified to exist:**
- `src/lib/cart/merge-on-signin.ts` — FOUND
- `src/components/order/OrderDetailView.tsx` — FOUND
- `src/app/[locale]/account/layout.tsx` — FOUND
- `src/app/[locale]/account/page.tsx` — FOUND
- `src/app/[locale]/account/orders/[reference]/page.tsx` — FOUND
- `src/components/account/OrdersList.tsx` — FOUND
- `src/components/account/OrderRow.tsx` — FOUND
- `src/components/auth/UserMenu.tsx` — FOUND
- `src/components/auth/SignOutButton.tsx` — FOUND
- `tests/rls/cross-user-deny.test.ts` — FOUND
- `tests/e2e/cart-merge.spec.ts` — FOUND

**Commits verified to exist:**
- `b4b484e` (mergeGuestCartIntoUserCart) — FOUND
- `363c09b` (wire merge into getOrCreateCart + signInAction) — FOUND
- `9d2f155` (lift OrderDetailView) — FOUND
- `2086317` (Account namespace + Nav additions) — FOUND
- `941c0ca` (/account layout + page + OrdersList + OrderRow) — FOUND
- `a7a1d37` (/account/orders/[reference]) — FOUND
- `428ab34` (SignOutButton + UserMenu wiring) — FOUND
- `aceedd7` (cross-user RLS deny + cart-merge e2e) — FOUND
