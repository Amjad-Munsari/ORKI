# 0004_phase11_timestamptz_and_product_fk — notes

Closes the remaining schema-correctness items from the 2026-06-21 DB review
(the three "still open" items listed in `0003_…NOTES.md`).

## What changed

1. **timestamptz** — 8 business-timestamp columns converted from `timestamp`
   (tz-naive) to `timestamptz`: `products.created_at/updated_at`,
   `carts.created_at/updated_at`, `cart_items.added_at`,
   `orders.placed_at/updated_at`, `order_events.created_at`.
   (`auth_events.created_at` was already correct.) The app has always written
   UTC instants (`defaultNow()` / `new Date()` on UTC infra), so the cast uses
   `... AT TIME ZONE 'UTC'` to declare the stored naive values as UTC. Drizzle
   maps both `timestamp` and `timestamptz` to JS `Date`, so there is **no app
   code change** — only `schema.ts` annotations (`{ withTimezone: true }`).

2. **order_items.product_id → nullable + ON DELETE SET NULL** — was NOT NULL +
   NO ACTION, which blocked deleting any product that had ever been ordered and
   broke `seed?force=1` once orders existed. order_items is a historical
   snapshot, so the link now nulls on product delete (mirrors `size_id`).
   `OrderItem.productId` is `string | null` in `domain.ts`; the stock-restoration
   fallback in `orders/server.ts` guards the null case (a deleted product's sizes
   are cascade-gone, so there is nothing to restore anyway).

## Idempotency / safety

- timestamptz casts run only when the column is still `timestamp without time
  zone` (guarded via `information_schema.columns`), so re-running is a no-op and
  `auth_events` is never touched.
- The FK swap uses `DROP CONSTRAINT IF EXISTS` + `ALTER COLUMN ... DROP NOT NULL`
  (a Postgres no-op when already nullable) + re-`ADD` under the same
  drizzle-conventional constraint name.
- Runs once on production (columns/constraint in pre-fix state) and in order on a
  fresh `db:migrate`. End state == `schema.ts`.

## Drizzle snapshot re-baseline (fixes `db:generate`)

This change also **repaired the broken Drizzle snapshot chain**. Previously the
newest snapshot was `0001` (stale: `user_id` text, no `size_id`, no checks), and
`0002`/`0003` were hand-authored without snapshots, so `db:generate` emitted
garbage diffs. `meta/0004_snapshot.json` was generated from the current
`schema.ts` and adopted as the accurate baseline. Verified: a subsequent
`drizzle-kit generate` reports **"No schema changes, nothing to migrate."**

⚠ `0002`/`0003` still have no snapshot files (they are hand-authored, like
`0002` always was). `db:generate` tolerates the gap — it diffs against the
newest snapshot present (`0004`). Continue hand-authoring any migration that
touches `auth.users` cross-schema FKs or RLS (Drizzle cannot express those);
plain table/column/index/check/FK changes can now use the normal
`db:generate` → `db:migrate` flow again.
