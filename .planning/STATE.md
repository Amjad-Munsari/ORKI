---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: Backend Integration & Technical Foundations
current_phase: 10
status: executing
stopped_at: Phase 10 Plan 05 complete — Wave 2 closer landed (mergeGuestCartIntoUserCart race-safe txn, /account orders-list + per-order detail, UserMenu + SignOutButton in Navbar/MobileNavDrawer, lifted OrderDetailView, Account i18n namespace EN+AR, cross-user RLS deny test passed against live Supabase). Plan 10-06 (admin gate) next.
last_updated: "2026-05-10T20:55:00.000Z"
last_activity: 2026-05-10 -- Phase 10 Plan 05 executed (8 tasks, 8 commits); src/lib/cart/merge-on-signin.ts (race-safe txn) + src/app/[locale]/account/{layout,page}.tsx + /account/orders/[reference]/page.tsx + src/components/account/{OrdersList,OrderRow}.tsx + src/components/auth/{UserMenu,SignOutButton}.tsx + src/components/order/OrderDetailView.tsx (lifted) + Account i18n namespace + cross-user RLS deny test (passed live)
progress:
  total_phases: 6
  completed_phases: 0
  total_plans: 28
  completed_plans: 22
  percent: 79
---

# Project State: ORKI

**Current Phase:** 10
**Status:** Phase 10 in progress — Waves 0-2 complete (Plans 01, 02, 03, 04, 05); Plan 10-06 (admin gate) next
**Last Updated:** 2026-05-10

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-06)

**Core value:** A premium underground streetwear shopping experience that feels as intentional as the brand itself — dark, minimal, and unapologetically cultural.
**Current focus:** Phase 10 — authentication-and-security-core (executing)

## Current Position

Phase: 10 (authentication-and-security-core) — IN PROGRESS
Plan: 6 of 7 (next: 10-06 admin gate — Wave 2)

- [x] Phase 5: Local Database & ORM (Drizzle + Postgres) [100%]
- [x] Phase 6: Admin Dashboard & Product Management [100%]
- [x] Phase 7: Product Catalog & Dynamic Inventory [100%]
- [~] Phase 8: Cart, Checkout State & Order Flow [partial — 8/9 plans built; UAT paused with cart-refresh gap; 08-07 email deferred]
- [x] Phase 9: Performance, Legal & Polish [plans complete — 8/8; gap closure 09-07 + 09-08 merged; verification pending]
- [~] Phase 10: Authentication & Security Core [executing — 5/7 plans complete; Waves 0-2 landed (foundations, schema, actions, UI surface, account-area + cart-merge + UserMenu)]

Last activity: 2026-05-10 -- Phase 10 Plan 05 complete (account area + cart-merge + UserMenu — race-safe mergeGuestCartIntoUserCart txn, /account orders-list + per-order detail with anti-enumeration notFound, UserMenu+SignOutButton in Navbar/MobileNavDrawer, lifted OrderDetailView, Account i18n namespace EN+AR, cross-user RLS deny test passed live)

## Performance Metrics

**Velocity:**

- Total plans completed: 25
- Average duration: ~15 min/plan (estimated)
- Total execution time: ~390 min (estimated)

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| Phase 1 Foundation (complete) | 7/7 | ~90 min | ~13 min |
| Phase 2 Core Shopping (complete) | 8/8 | ~120 min | ~15 min |
| Phase 3 Cart & Checkout (complete) | 4/4 | ~75 min | ~18 min |
| Phase 4 Brand & Polish (complete) | 1/1 | ~30 min | ~30 min |

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- 10-05: Cart merge swallows ALL errors at two layers (the merge function + the signInAction call site) — auth flow must NEVER break on merge failure (T-10-05-03 acceptance criterion).
- 10-05: /account/orders/[reference] returns notFound() for BOTH 'doesn't exist' AND 'exists-but-isn't-yours' — never 403, never leak the distinction (UI-SPEC §Anti-patterns #11, T-10-05-01).
- 10-05: UserMenu trigger label is the literal "Account" — NEVER the email (T-10-05-02 mitigation against screenshot leakage); email lives only in aria-label.
- 10-05: OrderDetailView lifted with confirmationChrome boolean prop — one source of truth for /checkout/confirmation (full chrome) and /account/orders/[reference] (bare card).
- 10-03: signup-failed audit rows reuse the `signup` event with `metadata: { failed: true, collision: <bool>, code: <supabase> }` — keeps AuthEventType vocabulary tight.
- 10-03: Email normalisation (`.trim().toLowerCase()`) lives in zod schemas so audit log + Supabase calls always see canonical form.
- 10-03: requestPasswordResetAction always returns `ok:true` (anti-enumeration); audit row always written for ops visibility.
- 10-03: Cookie-flag test asserts only fields Supabase SSR controls (sameSite=lax, path=/); httpOnly + secure are runtime-adapter concerns verified separately in 10-07.
- 04-01: Used `AnimatePresence` with `mode="wait"` in `layout.tsx` for premium page transitions.
- 04-01: Implemented `useReducedMotion` hook to toggle transform-based animations for accessibility.
- 04-01: Home page editorial grid uses 3:4 and 4:5 aspect ratios consistent with catalog/PDP.

### Pending Todos

- **Phase 8 follow-up:** cart resets on full-page refresh (UX-08 / Plan 08-02 cookie-backed hydration regression). Reproduce in EN at `/en/shop`. Logged in `08-UAT.md` Gaps + Test 1.
- **Phase 8 follow-up:** finish UAT scenarios S2–S7 + S9 once cart-refresh fix lands.
- **Phase 8 follow-up:** Plan 08-07 (Resend email) deferred until `RESEND_API_KEY` provisioned; restore Scenario 8 then.

### Blockers/Concerns

- Cart-refresh persistence regression is a major UX-08 gap carried into Phase 9. Acceptable to advance per user direction, but Phase 8 cannot be marked complete until fixed.

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Phase 8 bug | Cart resets on page refresh (UX-08 / Plan 08-02) | open — diagnose + fix | 2026-05-10 |
| Phase 8 UAT | Scenarios S2–S7 + S9 outstanding | paused | 2026-05-10 |
| Phase 8 plan | 08-07 Resend transactional email | deferred until RESEND_API_KEY | 2026-05-10 |

## Session Continuity

Last session: 2026-05-10
Stopped at: Phase 10 Plan 05 complete — 8 tasks committed; account area + cart-merge + UserMenu live; 96 vitest passing (1 skipped lockout); cross-user RLS deny test passed against live Supabase
Resume file: .planning/phases/10-authentication-and-security-core/10-06-PLAN.md
Next command: /gsd-execute-phase 10 (next plan: 10-06 admin gate — Wave 2)
