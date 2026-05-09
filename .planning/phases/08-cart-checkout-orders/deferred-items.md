# Phase 8 — Deferred Items

Out-of-scope discoveries during plan execution. Track here, do not fix in this phase unless promoted to a plan.

## From Plan 08-03 (orders pure libs)

### `tests/products.test.ts` fails with "server-only" import error
- **File:** `tests/products.test.ts` (committed in 74b3538, Plan 02-02)
- **Error:** `This module cannot be imported from a Client Component module. It should only be used from a Server Component.`
- **Cause:** The test imports `src/lib/products.ts` which now starts with `import 'server-only'`. The `server-only` package throws under vitest because there is no React Server Component runtime.
- **Why deferred:** Pre-dates this plan (Phase 2). Fix belongs in a dedicated test-infra plan that mocks `server-only` in the vitest setup, e.g.:
  ```ts
  vi.mock('server-only', () => ({}));
  ```
- **Status:** Not blocking Plan 08-03. Plan 08-03's own tests (state-machine, pricing, reference) do not import server-only.

## From Plan 08-04 (validation + i18n)

### Pre-existing TypeScript errors in `tests/products.test.ts` and `tests/SizeSelector.test.tsx`
- **Files:** `tests/products.test.ts`, `tests/SizeSelector.test.tsx`
- **Errors:** `Size` type missing `id`/`stock` properties; `Promise<Product[]>` array methods called on un-awaited promises.
- **Cause:** Pre-existing, unrelated to validation/i18n work. Surfaces under `npx tsc --noEmit` from the whole-repo type-check.
- **Why deferred:** Belongs in a dedicated test-infra plan alongside the `server-only` mock fix.
- **Status:** Plan 08-04's own files (`src/lib/checkout/schemas.ts`, `src/lib/checkout/schemas.test.ts`, `src/lib/checkout/__tests__/schemas.test.ts`) type-check cleanly.
