---
phase: 08-cart-checkout-orders
plan: 04
subsystem: validation-and-i18n
tags: [zod, react-hook-form, next-intl, i18n, validation, checkout]
requires:
  - 08-01 (Drizzle schema for orders/carts — references)
provides:
  - shippingSchema, paymentSelectionSchema, checkoutSchema (single source of truth)
  - PaymentMethodCode type, PAYMENT_METHODS tuple
  - KSA_PHONE_PATTERN — single shared phone regex (no drift policy)
  - i18n keys under Checkout.* / Order.* / Email.* in both EN and AR (110 keys total)
  - Canonical i18n-key contract test at src/lib/checkout/__tests__/schemas.test.ts
affects:
  - Plan 08-05 (server submitCheckout will import checkoutSchema)
  - Plan 08-06 (form rewire will use shippingSchema with zodResolver)
tech-stack:
  added:
    - zod@^4.4.3
    - react-hook-form@^7.75.0
    - "@hookform/resolvers@^5.2.2"
  patterns:
    - "Pinned zod 4 enum custom-error API: z.enum([...], { error: () => ({ message }) })"
    - "next-intl error keys (no raw English in zod messages)"
    - "Bilingual key-tree parity validated by recursive flatten + diff"
key-files:
  created:
    - src/lib/checkout/schemas.ts
    - src/lib/checkout/schemas.test.ts
    - src/lib/checkout/__tests__/schemas.test.ts
  modified:
    - messages/en.json
    - messages/ar.json
decisions:
  - "PAYMENT_METHODS tuple narrowed to ['mada','visa','applepay','stcpay'] to match the pinned zod 4 enum exactly. PaymentGrid.tsx still has 'card' and 'cod' buttons — that file will be reconciled in Plan 08-06 (form rewire)."
  - "KSA_PHONE_PATTERN supports four canonical input forms: '+966 5X XXX XXXX', '+966 5XXXXXXXX' (no spaces), '966 5XXXXXXXX' (no plus), '05XXXXXXXX' (leading zero)."
  - "Zod 4 pinned API used: z.enum([...], { error: () => ({ message: 'Checkout.errors.payment.required' }) }). No errorMap, no .refine fallback."
metrics:
  duration_ms: ~10min
  tasks: 3
  files: 5
  tests_passing: 15
completed: 2026-05-10
---

# Phase 8 Plan 04: Validation Schemas + Bilingual i18n Keys — Summary

zod 4 + react-hook-form 7 + @hookform/resolvers 5 installed. Authored canonical `src/lib/checkout/schemas.ts` (shipping + payment + checkout) using the pinned zod 4 enum API; every error message is a next-intl key. Bilingual `Checkout.* / Order.* / Email.*` namespaces added to both `messages/en.json` and `messages/ar.json` with 110 key-tree-matched entries. Canonical `__tests__` payment-enum bilingual i18n contract test pins downstream behavior; 15 tests pass.

## Commits

| Task | Commit  | Subject                                                                       |
| ---- | ------- | ----------------------------------------------------------------------------- |
| 1    | 33e3147 | feat(08-04): add zod checkout schemas + bilingual i18n key contracts          |
| 1b   | 421c89f | test(08-04): add canonical __tests__ payment-enum bilingual i18n contract test |
| 2    | 81bb5bc | feat(08-04): add bilingual Checkout/Order/Email i18n keys (EN + AR)           |

(Note: dependencies `zod@^4.4.3`, `react-hook-form@^7.75.0`, `@hookform/resolvers@^5.2.2` were installed during Task 1; the `package.json`/`package-lock.json` mutations were absorbed by the parallel wave-1 commit `fd93e90` — `feat(08-02): add cart session...` — which is benign cohabitation. All four wave-1 deps are now in `package.json` and `npm ls` confirms major versions match the plan.)

## Files

| Path                                              | Status   | Purpose                                                              |
| ------------------------------------------------- | -------- | -------------------------------------------------------------------- |
| `src/lib/checkout/schemas.ts`                     | created  | shippingSchema, paymentSelectionSchema, checkoutSchema, KSA_PHONE_PATTERN, PAYMENT_METHODS |
| `src/lib/checkout/schemas.test.ts`                | created  | 12 unit tests covering required/email/phone/address/apartment/payment/full-checkout |
| `src/lib/checkout/__tests__/schemas.test.ts`      | created  | 3 canonical-path bilingual i18n contract tests                       |
| `messages/en.json`                                | modified | append Checkout/Order/Email namespaces                               |
| `messages/ar.json`                                | modified | mirror Arabic translations                                           |

## Verification

- `npm ls zod` → `zod@4.4.3` ✓ (>= 4.x)
- `npm ls react-hook-form` → `react-hook-form@7.75.0` ✓ (>= 7.x)
- `npm ls @hookform/resolvers` → `@hookform/resolvers@5.2.2` ✓ (>= 5.x)
- `npx vitest run src/lib/checkout/` → 2 files, 15 tests, all pass
- `npx tsc --noEmit` on the three new files → clean (no errors)
- EN/AR key parity: 110 keys match (well above 50 threshold)
- All schema-referenced i18n keys (`Checkout.errors.required`, `.tooLong`, `.email`, `.phone.ksa`, `.address.short`, `.payment.required`) resolve in both `messages/en.json` and `messages/ar.json`
- `grep -c "errorMap" src/lib/checkout/schemas.ts` → 0 (legacy zod 3 API absent)
- `grep -c "error: () => ({ message: 'Checkout.errors.payment.required' })" src/lib/checkout/schemas.ts` → 1 (pinned zod 4 form present, exact)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] PAYMENT_METHODS tuple realigned with pinned zod 4 enum**
- **Found during:** Task 1 (test run)
- **Issue:** Plan listed `PAYMENT_METHODS = ['card','mada','stcpay','applepay','cod']` while the pinned enum is `['mada','visa','applepay','stcpay']`. The Task 1 unit test iterates `PAYMENT_METHODS` expecting every item to validate. With the pinned enum (which is non-negotiable per execution rule 2), `'card'` and `'cod'` would fail validation, breaking the test.
- **Fix:** Narrowed `PAYMENT_METHODS` to `['mada','visa','applepay','stcpay'] as const` so the type-level export matches the runtime enum. Documented in the file's JSDoc that `PaymentGrid.tsx` (which still renders `card`/`cod`) will be reconciled in Plan 08-06 form rewire.
- **Files modified:** `src/lib/checkout/schemas.ts`
- **Commit:** 33e3147

**2. [Rule 1 - Bug] KSA_PHONE_PATTERN regex was 1 digit short**
- **Found during:** Task 1 (test run — "accepts a valid payload" failed for `+966 50 123 4567`)
- **Issue:** Plan's regex `/^(?:\+?966\s?5|05)\d(?:\s?\d{3}){2}$|^(?:\+?966|0)5\d{8}$/` expects 8 digits after `+966 5` (1 digit + two 3-digit groups), but Saudi mobile format is `+966 5X XXX XXXX` = 9 digits after `+966` (1 + 3 + 4 grouping with spaces, or 9 plain digits).
- **Fix:** Replaced with `/^(?:\+?966\s?5\d\s?\d{3}\s?\d{4}|0\s?5\d\s?\d{3}\s?\d{4}|(?:\+?966|0)5\d{8})$/` — three alternatives covering: spaced-with-country-code, spaced-with-leading-zero, no-space compact. All four canonical input forms validate; non-KSA forms (US, UK, short numbers) reject.
- **Files modified:** `src/lib/checkout/schemas.ts`
- **Commit:** 33e3147

**3. [Rule 3 - Blocking] Pre-existing tsc errors in unrelated test files**
- **Found during:** Task 1 (acceptance criterion `npx tsc --noEmit` exits 0)
- **Issue:** `tests/products.test.ts` and `tests/SizeSelector.test.tsx` (Phase 2/3 artifacts) emit type errors (un-awaited promises, missing `Size.id`/`stock`). These are unrelated to Plan 08-04 and would have been there regardless.
- **Fix:** Did NOT modify those files (out-of-scope per SCOPE BOUNDARY). Verified my new files type-check cleanly with `npx tsc --noEmit 2>&1 | grep "checkout/schemas"` (no output = clean). Logged to `.planning/phases/08-cart-checkout-orders/deferred-items.md` for a future test-infra plan.
- **Files modified:** `.planning/phases/08-cart-checkout-orders/deferred-items.md`
- **Commit:** 33e3147

### Wave-1 cohabitation note (not a deviation)

Plan 08-02 ran in parallel and committed first (`fd93e90`). Its commit absorbed my `package.json`/`package-lock.json` modifications because both plans called `npm install` on the same working tree. The end state is correct (zod 4, RHF 7, @hookform/resolvers 5, nanoid 5 all in `dependencies`) and `npm ls` reports them at the required major versions.

## Authentication Gates

None.

## Known Stubs

None — schemas are fully wired; only the runtime consumers (server action, RHF form) are deferred to Plans 08-05 and 08-06 by design.

## Self-Check: PASSED

Files exist:
- `src/lib/checkout/schemas.ts` ✓
- `src/lib/checkout/schemas.test.ts` ✓
- `src/lib/checkout/__tests__/schemas.test.ts` ✓
- `messages/en.json` (Checkout/Order/Email present) ✓
- `messages/ar.json` (matching key tree) ✓

Commits exist on `main`:
- `33e3147` ✓
- `421c89f` ✓
- `81bb5bc` ✓
