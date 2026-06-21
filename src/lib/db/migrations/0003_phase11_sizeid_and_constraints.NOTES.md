# 0003_phase11_sizeid_and_constraints — re-baseline notes

## What this migration does

Folds two previously **out-of-band** apply scripts into the Drizzle journal:

| Script (now superseded) | Objects |
|-------------------------|---------|
| `scripts/apply-11-order-sizeid.ts` | `order_items.size_id` column, `order_items_size_id_fk` (ON DELETE SET NULL), `order_items_size_id_idx`, backfill by `(product_id, label)` |
| `scripts/apply-11-constraints.ts`  | 9 CHECK constraints (`products`, `product_sizes`, `cart_items`, `carts`, `orders`, `order_items`) + `product_sizes_product_label_unq` UNIQUE index |

## Why it was needed

`schema.ts` declared `order_items.size_id`, the CHECK constraints, and the
`UNIQUE(product_id, label)` index, but **no journaled migration emitted them** —
they only reached production through the two `apply-11` scripts, which are wired
into nothing (`package.json`, CI, README all silent). Consequences before this fix:

- A fresh `npm run db:migrate` (journal `0000→0002`) produced `order_items` with
  **no `size_id`**. The checkout path inserts `order_items.size_id`
  (`src/lib/orders/server.ts`), so every new environment broke at checkout with
  `column "size_id" does not exist`.
- Without `product_sizes_product_label_unq`, duplicate `(product_id, label)`
  size rows were possible, which silently corrupts the stock/`inStock`
  reconciliation in `orders/server.ts` (it assumes label uniqueness per product).

After `0003`, `db:migrate` reproduces production end-to-end.

## Why it is safe to apply to production

Drizzle's migrator runs a journal entry only when its `when` exceeds the latest
row in `drizzle.__drizzle_migrations`. Production's latest is `0002`
(`created_at = 1778803200000`, backfilled by `scripts/apply-10-02-migration.ts`).
This entry's `when` is `1782086400000` (greater), so it runs **exactly once** on
prod. Every statement is idempotent (`IF NOT EXISTS` / `EXCEPTION WHEN
duplicate_object` / `NOT VALID`), and the objects **already exist** on prod from
the `apply-11` scripts — so the single run is a verified no-op. On a fresh DB the
statements create the objects in order.

CHECK constraints are added `NOT VALID` (matching the original apply script):
enforced on all future writes, existing rows not re-scanned. On a fresh DB this
is equivalent to `VALID` since the tables are empty.

All statements are transaction-safe (plain `CREATE INDEX`, no `CONCURRENTLY`), so
the migrator's per-migration transaction wraps them cleanly.

## Applying

- **Fresh DB:** `npm run db:migrate` runs `0000→0003` in order. (Supabase only —
  `0002` references `auth.users`, which a plain local Postgres won't have.)
- **Production:** `npm run db:migrate` runs `0003` alone as a no-op.
  - ⚠ Pre-flight: confirm `drizzle.__drizzle_migrations` actually contains the
    `0002` row (`SELECT tag-equivalent created_at` — expect `1778803200000` as the
    max). It should, via `apply-10-02-migration.ts`. If it is somehow missing,
    drizzle would attempt to re-run `0002` (non-idempotent — see its NOTES) before
    `0003`. Verify before running against prod.

## Follow-ups — all RESOLVED in 0004

These were deferred from 0003 and are now fixed by
`0004_phase11_timestamptz_and_product_fk.sql` (see its NOTES):

1. ✅ **Drizzle snapshot staleness** — `meta/0004_snapshot.json` re-baselined from
   current `schema.ts`; `db:generate` now reports "No schema changes". (Still
   hand-author migrations touching `auth.users` FKs / RLS — Drizzle can't express
   them.)
2. ✅ **`timestamptz`** — the 8 remaining tz-naive columns converted in 0004.
3. ✅ **`order_items.product_id` ON DELETE** — now nullable + `SET NULL` in 0004.

## Superseded scripts

`scripts/apply-11-order-sizeid.ts` and `scripts/apply-11-constraints.ts` are now
redundant with this migration. They are kept (referenced by Phase 11 planning
docs) but carry a deprecation header pointing here. Prefer `db:migrate`.
