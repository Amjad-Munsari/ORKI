# Data Access Pattern — N+1 Guardrail

**Established:** 2026-05-10 (Phase 9, plan 05).
**Reviewed clean:** 2026-05-10 — `src/lib/products.ts`, `src/lib/cart/server.ts`, `src/lib/orders/server.ts` (read paths).

## The Rule

**Always use Drizzle's relational query pattern with `with: {}` for related entities. Never iterate a list and call the DB inside the loop.**

A single relational query produces a single round-trip; a list-then-loop pattern is N+1: one query for the list, then one query per item. With 50 products that's 51 queries — and the cost compounds with every nested relation.

## Good (preserved)

From `src/lib/products.ts:70-80`:

```ts
export async function getAllProducts(): Promise<Product[]> {
  const result = await db.query.products.findMany({
    with: {
      sizes: true,
      images: { orderBy: (images, { asc }) => [asc(images.sortOrder)] },
    },
  });
  return result.map(toProduct);
}
```

Single round-trip via Drizzle's relational graph. Postgres returns the joined data in one statement. The `with` clause maps to LEFT JOINs that the driver collapses into the parent shape.

## Bad (do not introduce)

```ts
// N+1 antipattern — DO NOT WRITE THIS
const products = await db.query.products.findMany();
for (const p of products) {
  p.images = await db.query.images.findMany({ where: eq(images.productId, p.id) });
}
```

Each iteration is a round-trip. 50 products = 51 queries. With Postgres on Supabase that's 51 × ~30ms RTT = ~1.5s on a hot day. Same shape with `Promise.all` is just as bad — it parallelizes the queries but doesn't reduce their count.

## Acceptable Exception (documented)

`src/lib/orders/server.ts:387-409` — `transitionOrderStatus` stock-restoration loop. Per-item loop iterating `order.items` to restore `stock_count` per item. This is acceptable because:

1. Bounded by items-per-order (a real, low limit — typically <10).
2. Invoked from an admin transition action (low-frequency, never on a hot path).
3. Required for correctness — each item's `product_sizes.stock_count` is an independent UPDATE, not a SELECT pattern.

This is NOT a real N+1 — it's a write fan-out with a hard ceiling. Keep as is.

## Dev-Time Detection

`src/lib/db/client.ts` enables Drizzle's built-in logger when `env.NODE_ENV !== 'production'`. In `next dev`, every executed SQL statement prints to stdout. Visually scan during feature development for repeated `SELECT ... WHERE id = $N` patterns inside a single request — that's an N+1 surfacing.

Production logs do NOT include SQL output (gate is off in Vercel Production AND Preview, both of which set `NODE_ENV=production`). This protects against information disclosure (T-09-05-02) while preserving the dev signal.

## Workflow

When adding new data-access code:

1. Always reach for `db.query.<table>.findMany({ with: {…} })` first.
2. If a join is needed across more than two hops, prefer a single `findMany` with nested `with` over chaining.
3. If you find yourself awaiting a query inside a `for`/`forEach`/`Promise.all`, stop — restructure as a relational query or a single `IN (…)` query.
4. After feature completes, run the page in `next dev` and watch the logger output for one request cycle. Count the SELECTs; explain any surprises.

## Status

PERF-06 — reviewed clean as of 2026-05-10. Re-review at the end of every future phase that adds new data-access code paths (in particular: any phase touching cart/server.ts, orders/server.ts, or introducing new server actions that read joined data).
