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

## Still open (intentionally OUT OF SCOPE here — backlog)

This migration fixes the `db:migrate` reproduction gap only. Not addressed:

1. **Drizzle snapshot staleness** — the newest real snapshot is `0001`. `0002`
   and `0003` are hand-authored with no snapshot, and `0001` still describes
   `user_id` as `text`. So `npm run db:generate` will emit an **incorrect** diff
   (re-casting `user_id`, re-adding objects, unable to express the `auth.users`
   FKs/RLS). Forward schema changes must be hand-authored until the snapshot is
   re-baselined. Do not trust `db:generate` as-is.
2. **`timestamptz`** — all business timestamps are `timestamp` (no tz) except
   `auth_events.created_at`. Should be `timestamptz` project-wide.
3. **`order_items.product_id` ON DELETE** — currently `NO ACTION`, which blocks
   deleting any product that was ever ordered (inconsistent with the snapshot
   design; `SET NULL` would preserve history while allowing deletion).

## Superseded scripts

`scripts/apply-11-order-sizeid.ts` and `scripts/apply-11-constraints.ts` are now
redundant with this migration. They are kept (referenced by Phase 11 planning
docs) but carry a deprecation header pointing here. Prefer `db:migrate`.
