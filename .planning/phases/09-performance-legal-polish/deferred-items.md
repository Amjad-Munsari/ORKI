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
