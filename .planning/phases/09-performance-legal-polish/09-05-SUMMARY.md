---
phase: 09-performance-legal-polish
plan: 05
subsystem: reliability
tags: [error-boundary, not-found, drizzle, n+1, try-catch, rsc, next-intl, perf-05, perf-06]
requires:
  - 09-01-SUMMARY.md   # Errors namespace in messages/{en,ar}.json
  - 09-04-SUMMARY.md   # SEO/metadata wave shipped before reliability hygiene wraps the system
provides:
  - "src/app/global-error.tsx (top-level boundary, owns own <html>/<body>)"
  - "src/app/[locale]/error.tsx (per-locale boundary via useTranslations('Errors'))"
  - "src/app/[locale]/not-found.tsx (per-locale 404 RSC via getTranslations('Errors.notFound'))"
  - "src/components/error/BrandedErrorPage.tsx (shared chrome, single source of truth — Issue #6 fix)"
  - "Drizzle dev-time logger gated on env.NODE_ENV !== 'production'"
  - "Three server pages (shop/admin-orders/checkout-confirmation) with try/catch + Errors.section fallback copy"
  - ".planning/codebase/data-access-pattern.md (PERF-06 N+1 guardrail rule + reviewed-clean note)"
affects:
  - "messages/en.json (read-only — Errors namespace consumed)"
  - "messages/ar.json (read-only — Errors namespace consumed)"
tech-stack:
  added: []
  patterns:
    - "Three-file Next.js 15 error stack (global-error / [locale]/error / [locale]/not-found)"
    - "Shared chrome component consumed by both Client and Server contexts (no 'use client' on the chrome itself)"
    - "Per-route try/catch with i18n fallback for graceful degradation on DB outages"
    - "Drizzle logger gate aligned to project's existing env.NODE_ENV convention"
key-files:
  created:
    - "src/app/global-error.tsx"
    - "src/app/[locale]/error.tsx"
    - "src/app/[locale]/not-found.tsx"
    - "src/components/error/BrandedErrorPage.tsx"
    - ".planning/codebase/data-access-pattern.md"
  modified:
    - "src/lib/db/client.ts"
    - "src/app/[locale]/shop/page.tsx"
    - "src/app/[locale]/admin/orders/page.tsx"
    - "src/app/[locale]/checkout/confirmation/page.tsx"
decisions:
  - "Issue #6 fix locked: BrandedErrorPage is the single chrome — all three error/404 pages import + render it. Zero duplicate JSX."
  - "Reconciliation #1 honored: app/global-error.tsx is the canonical Next.js 15 top-level boundary; app/error.tsx was deliberately NOT created."
  - "T-09-05-01 mitigation centralized: errorDigest renders only when NODE_ENV === 'development', enforced once in BrandedErrorPage rather than three times across the consumer files."
  - "Confirmation page's try/catch separates 'DB unavailable' (renders Errors.section.orderLoadFailed reassurance copy — payment was already accepted) from 'order doesn't exist' (still notFound()). A Supabase blip should not 404 a paying customer."
  - "Plan was NOT split into 09-05a/09-05b — execution proceeded as one plan; all three sub-domains (boundaries, logger gate, try/catch hardening) landed cleanly without context-cost balloon."
metrics:
  duration: "~30min"
  completed: "2026-05-10"
  tasks: 3
  commits: 4
  files_created: 5
  files_modified: 4
---

# Phase 09 Plan 05: Reliability hygiene — branded error/404 stack + Drizzle logger gate + try/catch hardening Summary

PERF-05 + PERF-06 reliability hygiene shipped: a four-file branded error/404 stack (global-error + per-locale error + per-locale not-found + shared `BrandedErrorPage` chrome), Drizzle's SQL logger gated to dev-only via `env.NODE_ENV !== 'production'`, three server pages (shop / admin orders / checkout confirmation) wrapping their DB reads in try/catch with `Errors.section.*` fallback copy, and the `.planning/codebase/data-access-pattern.md` guardrail doc that captures the 2026-05-10 N+1 reviewed-clean status.

## What shipped

### Task 1 — Branded error/404 stack with shared chrome (commit `2b7a0d1`)

Four new files, all wired through one chrome component:

| File | Type | Translation strategy | Variant |
|------|------|----------------------|---------|
| `src/app/global-error.tsx` | Client (`'use client'`), owns own `<html>`/`<body>` | Hard-coded bilingual `COPY` keyed off `document.documentElement.lang` | `error` |
| `src/app/[locale]/error.tsx` | Client (`'use client'`) | `useTranslations('Errors')` | `error` |
| `src/app/[locale]/not-found.tsx` | Server Component | `getTranslations('Errors.notFound')` | `404` |
| `src/components/error/BrandedErrorPage.tsx` | Shared chrome (no `'use client'`) | Plain props from each consumer | both |

Chrome behavior:
- `role="alert"` rendered only when `variant === 'error'` — UI-SPEC line 304 keeps the 404 quiet for AT users.
- `errorDigest` rendered only when `process.env.NODE_ENV === 'development'` — T-09-05-01 mitigation centralized in one place (not three).
- Primary CTA renders as `<button onClick={onPrimary}>` when `onPrimary` is passed (used by both error variants for `reset()`); otherwise as `<Link href={ctaHref}>`.
- Secondary CTA is optional; `Link` + `@/i18n/navigation` so locale prefixing is automatic for the per-locale variants and falls back to `/` for global-error (where the locale layout has been replaced).

`global-error.tsx` deliberately does NOT mount `<Analytics>` / `<SpeedInsights>` (Pitfall 1), does NOT use next-intl (no provider in scope at that level), and does NOT export a `metadata` object (unsupported by Next.js 15 in this file).

### Task 2 — Drizzle dev-time logger gate + N+1 guardrail doc (commit `fe79e7f`)

`src/lib/db/client.ts` now reads:

```ts
export const db = drizzle(conn, {
  schema,
  logger: env.NODE_ENV !== 'production',
});
```

The gate uses the same `env.NODE_ENV` check the file already uses at lines 24/29 — fully consistent with project convention. Both Vercel Preview and Production set `NODE_ENV=production`, so SQL never leaks to either log stream (T-09-05-02 mitigated). In `next dev` every executed statement prints to stdout, surfacing N+1 patterns visually during feature work.

`.planning/codebase/data-access-pattern.md` (69 lines) documents the rule, the good/bad example pair, the acceptable per-item write fan-out exception in `src/lib/orders/server.ts:387-409`, and the 2026-05-10 reviewed-clean status across the three read-path files (`products.ts`, `cart/server.ts`, `orders/server.ts`).

### Task 3 — try/catch hardening on three server pages (commit `4a7a7d1`)

| Page | DB call | Fallback i18n key | Notes |
|------|---------|-------------------|-------|
| `src/app/[locale]/shop/page.tsx` | `getAllProducts()` | `Errors.section.shopLoadFailed` | Filter/sort happen AFTER the null-check; fallback returns early. |
| `src/app/[locale]/admin/orders/page.tsx` | `getAllOrders()` | `Errors.section.adminOrdersFailed` | Locale already resolved before the fetch; admin pages still consume next-intl. |
| `src/app/[locale]/checkout/confirmation/page.tsx` | `getOrderByReference(ref)` | `Errors.section.orderLoadFailed` | Two distinct paths: a thrown error → fallback copy (payment-already-confirmed reassurance); `null` return → `notFound()`. |

All three log via `console.error` inside the catch (not silent — Vercel logs surface the underlying SQL/network error to operators) and use `role="alert"` on the fallback container. Happy paths are unchanged — fallback is an early-return.

### Commit `a98bd70` — lint cleanup

The project's lint config does not enable `no-console`, so the planner's prophylactic `eslint-disable-next-line no-console` comments were flagged as unused-directives. Dropped the comments. Also removed unused `_locale`/`_isRtl` destructured aliases from `BrandedErrorPage` — the project lacks an `argsIgnorePattern` rule, so the underscore prefix didn't suppress the warning. Both props remain part of the public typed interface for future variants; they are simply not destructured at runtime.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] `BrandedErrorPage` lint warnings on `_locale`/`_isRtl`**
- **Found during:** Task 1 production build
- **Issue:** Project's eslint config has no `argsIgnorePattern` rule, so the underscore-prefix convention recommended in the plan triggered `@typescript-eslint/no-unused-vars` warnings.
- **Fix:** Removed the destructured aliases entirely. Props remain in the typed interface for future variants; chrome inherits direction from the outer document tree.
- **Files modified:** `src/components/error/BrandedErrorPage.tsx`
- **Commit:** `a98bd70`

**2. [Rule 1 — Bug] Unused `eslint-disable-next-line no-console` directives**
- **Found during:** Task 1 production build
- **Issue:** The plan suggested `// eslint-disable-next-line no-console` ahead of every `console.error` call, but the project's lint config does not enable `no-console` — so the directives themselves became "Unused eslint-disable directive" warnings.
- **Fix:** Removed the disable comments across all five files where I added `console.error`.
- **Files modified:** `global-error.tsx`, `[locale]/error.tsx`, `shop/page.tsx`, `admin/orders/page.tsx`, `checkout/confirmation/page.tsx`
- **Commit:** `a98bd70`

### Out-of-scope discoveries (NOT fixed — pre-existing, deferred)

- `src/app/[locale]/checkout/page.tsx:57` — TypeScript type error `Type '"mada" | "stcpay" | "applepay" | "visa"' is not assignable to type '"cod" | "card" | "mada" | "stcpay" | "applepay"'`. Pre-existing in the checkout page; unrelated to PERF-05/06. The checkout page treats `'visa'` as a separate method while the cart schema unions only `'card'`. Out of scope.
- A handful of pre-existing test-file TS errors (tests using outdated `Size` shape; tests treating `Promise<Product[]>` as iterable). Unrelated. Out of scope.
- `vitest.config.ts` `forks` option type complaint. Pre-existing. Out of scope.

These pre-existing issues caused `npx next build` to fail at the type-check step. I confirmed via `npx tsc --noEmit | grep -E "(global-error|locale\\]/error|locale\\]/not-found|BrandedErrorPage|shop/page|admin/orders/page|checkout/confirmation/page|lib/db/client)"` that **zero** of those errors come from files this plan touched. `npx next lint` against this plan's eight files reported "No ESLint warnings or errors".

## Key Decisions

1. **Chrome is the single audit surface (Issue #6 fix locked).** The three error/404 pages each import and render exactly one `<BrandedErrorPage>`; there is no duplicate JSX. T-09-05-01 (stack-trace info disclosure) is mitigated once, in the chrome's `{errorDigest && process.env.NODE_ENV === 'development'}` guard, instead of three times across consumer files.

2. **`global-error.tsx` over `app/error.tsx` (Wave 0 reconciliation #1 honored).** Verified via `test ! -f src/app/error.tsx`. The canonical Next.js 15 top-level boundary is `global-error.tsx`, owning its own `<html>`/`<body>`.

3. **Confirmation page splits "DB unavailable" from "order does not exist".** A Supabase blip should NOT 404 a customer whose payment was already accepted. The catch path renders `Errors.section.orderLoadFailed` reassurance copy with `role="alert"`; the `null` return path still calls `notFound()`.

4. **No plan split.** The `<scope_note>` allowed splitting into 09-05a/09-05b if any single task's context cost ballooned past ~30%. None did — all three sub-domains landed cleanly in one execution. The plan was executed as a single unit.

5. **Drizzle logger gate uses the file's existing convention.** `env.NODE_ENV !== 'production'` matches the patterns at `client.ts:24` and `client.ts:29`. Adding the gate did not require importing anything new.

## Verification

Plan-level checklist (all 16 points pass):

| # | Check | Result |
|---|-------|--------|
| 1 | `test -f src/app/global-error.tsx` | OK |
| 2 | `test -f src/app/[locale]/error.tsx` | OK |
| 3 | `test -f src/app/[locale]/not-found.tsx` | OK |
| 4 | `test -f src/components/error/BrandedErrorPage.tsx` | OK |
| 5 | `test -f .planning/codebase/data-access-pattern.md` | OK |
| 6 | `grep -E "logger:.*NODE_ENV" src/lib/db/client.ts` | 1 |
| 7 | `grep -E 'try\s*\{' src/app/[locale]/shop/page.tsx` | 1 |
| 8 | `grep "shopLoadFailed" src/app/[locale]/shop/page.tsx` | 1 |
| 9 | `grep "orderLoadFailed" src/app/[locale]/checkout/confirmation/page.tsx` | 1 |
| 10 | `grep "adminOrdersFailed" src/app/[locale]/admin/orders/page.tsx` | 1 |
| 11 | `test ! -f src/app/error.tsx` (must NOT exist) | OK |
| 12a | `grep -c "import.*BrandedErrorPage" src/app/global-error.tsx` | 1 |
| 12b | `grep -c "import.*BrandedErrorPage" src/app/[locale]/error.tsx` | 1 |
| 12c | `grep -c "import.*BrandedErrorPage" src/app/[locale]/not-found.tsx` | 1 |
| 12d | `grep -c "<BrandedErrorPage" src/app/global-error.tsx` | 1 |
| 12e | `grep -c "<BrandedErrorPage" src/app/[locale]/error.tsx` | 1 |
| 12f | `grep -c "<BrandedErrorPage" src/app/[locale]/not-found.tsx` | 1 |

`npx next lint` against the eight files this plan touched: clean. `npx tsc --noEmit` reports zero errors in any plan-09-05 file (pre-existing errors in `checkout/page.tsx` and several test files are unrelated to PERF-05/06 and out of scope per the scope-boundary rule).

Manual dev tests (deferred — orchestrator-level, not part of executor scope):
- Visit `/en/lkjhasdf` → expect branded 404 (no `role="alert"`) with shop CTA.
- Forcibly throw inside `/en/shop/page.tsx` → expect branded per-locale error (with `role="alert"`) + retry CTA.
- `NODE_ENV=production npm start` → expect zero `Query: SELECT ...` lines from Drizzle in logs.

## Self-Check: PASSED

- Created files exist:
  - `src/components/error/BrandedErrorPage.tsx` — FOUND
  - `src/app/global-error.tsx` — FOUND
  - `src/app/[locale]/error.tsx` — FOUND
  - `src/app/[locale]/not-found.tsx` — FOUND
  - `.planning/codebase/data-access-pattern.md` — FOUND
- Modified files contain expected markers:
  - `src/lib/db/client.ts` contains `logger:` gate — FOUND
  - `src/app/[locale]/shop/page.tsx` contains `shopLoadFailed` + `try {` — FOUND
  - `src/app/[locale]/admin/orders/page.tsx` contains `adminOrdersFailed` + `try {` — FOUND
  - `src/app/[locale]/checkout/confirmation/page.tsx` contains `orderLoadFailed` + `try {` — FOUND
- Commits exist on branch:
  - `2b7a0d1` (Task 1) — FOUND
  - `fe79e7f` (Task 2) — FOUND
  - `4a7a7d1` (Task 3) — FOUND
  - `a98bd70` (lint cleanup) — FOUND
- `app/error.tsx` does NOT exist (planner reconciliation #1) — confirmed absent.
