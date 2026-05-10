# Phase 9 — Deferred Items (out-of-scope discoveries)

Discovered during Plan 09-01 execution. NOT fixed in this plan because the issues are
not directly caused by Plan 09-01's changes.

## Pre-existing TypeScript errors (untouched)

### `src/app/[locale]/checkout/page.tsx:57` — payment-method type mismatch

```
error TS2322: Type '"mada" | "stcpay" | "applepay" | "visa"' is not assignable to
type '"cod" | "card" | "mada" | "stcpay" | "applepay"'.
  Type '"visa"' is not assignable to type '"cod" | "card" | "mada" | "stcpay" | "applepay"'.
```

A literal union mismatch between the locally enumerated payment methods and the
canonical `PaymentMethod` type. Belongs to Phase 8 (cart/checkout). Out of scope for
Phase 9.

### `tests/**/*.{ts,tsx}` — multiple errors

- `Size` interface fixtures missing `id` and `stock` fields (drift between fixture
  factories and the domain type).
- `tests/products.test.ts` treats `getAllProducts()` (which returns
  `Promise<Product[]>`) as a synchronous array — pre-existing test bug from before
  the data-access layer became async.

These are pre-existing test-file issues that pre-date Phase 9 and are not gated by
Plan 09-01. Recommended owner: a test-fixture refresh plan after Phase 8 UAT
finalization.

## Pre-existing build-time env validation (untouched, discovered Plan 09-06)

`npm run build` halts at `src/lib/env.ts:44` requiring `STORAGE_URL` or `DATABASE_URL`.
This is pre-existing infrastructure (Phase 8 / data layer) and is not introduced or
modified by Plan 09-06. The two new files (`src/lib/cookie-consent.ts` and
`src/components/CookieBanner.tsx`) type-check cleanly under the project `tsc --noEmit`
run (zero errors in either file path); the production build is gated by the env
variable, not by these files. Out of scope for Plan 09-06; recommended owner: a
build-environment configuration plan.

## Full benefit-bar / About / Contact next-intl migration (deferred from gap closure)

**Source:** 09-REVIEW.md WR-04
**Surfaced:** 2026-05-10 (Plan 09-08)
**Files affected:**
- `src/components/footer/Footer.tsx:23,27,31,55-58,76-77` (benefit bar + nav links — three of four benefit-bar lines remain hardcoded EN; nav links remain hardcoded EN)
- `src/app/[locale]/about/page.tsx:30-86` (entire page is `isRtl ? 'AR' : 'EN'` ternaries)
- `src/app/[locale]/contact/ContactClient.tsx:30-95` (form labels, button copy, success state)

**What 09-08 did:** Fixed only the SAR-vs-USD currency defect on the shipping line (`$149` → `300 SAR`). All other ternary strings remain EN/AR ternaries.

**Recommended owner:** A standalone follow-up plan (post-Phase 9 polish or a Phase-10+ i18n hygiene pass) that:
- Adds `Footer.benefitBar.{shipping,returns,payments,support}` keys to `messages/{en,ar}.json`.
- Adds `Footer.nav.{home,tops,bottoms,ourStory}` keys.
- Migrates `about/page.tsx` body copy to a `Pages.about.*` namespace.
- Migrates `ContactClient.tsx` strings to a `Pages.contact.*` namespace.
- Drops the `TODO(i18n) benefit-bar` comment at `Footer.tsx:11-14` once migration is complete.

Out of scope for Phase 9; not gated by any Phase 9 must_have or roadmap success criterion.
