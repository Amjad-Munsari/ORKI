# Phase 8 — Deferred Items

Out-of-scope discoveries during plan execution. Track here, do not fix in this phase unless promoted to a plan.

## From Plan 08-03 (orders pure libs)

### `tests/products.test.ts` still fails — env-var validation under vitest
- **File:** `tests/products.test.ts` (committed in 74b3538, Plan 02-02)
- **Original error:** `This module cannot be imported from a Client Component module. It should only be used from a Server Component.` (server-only)
- **Plan 08-03 partial fix:** Added `vi.mock('server-only', () => ({}))` to `tests/setup.ts` — clears the server-only barrier.
- **Remaining error:** `Missing or invalid environment variables` (thrown from `src/lib/env.ts:35` when `src/lib/db/client.ts` is loaded). Vitest doesn't load `.env` by default and the test doesn't mock `@/lib/db/client`.
- **Why deferred:** Belongs in a dedicated test-infra plan. Either: (a) extend `tests/setup.ts` to load `.env.test` via `dotenv`, or (b) mock `@/lib/db/client` and `@/lib/env` per-test.
- **Status:** Not blocking Plan 08-03. Plan 08-03's own tests (state-machine, pricing, reference) pass cleanly.

## From Plan 08-04 (validation + i18n)

### Pre-existing TypeScript errors in `tests/products.test.ts` and `tests/SizeSelector.test.tsx`
- **Files:** `tests/products.test.ts`, `tests/SizeSelector.test.tsx`
- **Errors:** `Size` type missing `id`/`stock` properties; `Promise<Product[]>` array methods called on un-awaited promises.
- **Cause:** Pre-existing, unrelated to validation/i18n work. Surfaces under `npx tsc --noEmit` from the whole-repo type-check.
- **Why deferred:** Belongs in a dedicated test-infra plan alongside the `server-only` mock fix.
- **Status:** Plan 08-04's own files (`src/lib/checkout/schemas.ts`, `src/lib/checkout/schemas.test.ts`, `src/lib/checkout/__tests__/schemas.test.ts`) type-check cleanly.
