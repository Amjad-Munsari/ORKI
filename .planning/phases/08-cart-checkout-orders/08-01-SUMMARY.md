---
phase: 08-cart-checkout-orders
plan: 01
subsystem: data-layer
tags: [drizzle, schema, migration, postgres, supabase, phase-8]
requires:
  - "Drizzle ORM"
  - "Supabase Postgres (DATABASE_URL set in .env.local)"
provides:
  - "carts, cart_items, orders, order_items, order_events tables (live DB)"
  - "order_status pgEnum (pending|confirmed|shipped|delivered|cancelled|refunded)"
  - "Drizzle Row types: CartRow, CartItemRow, OrderRow, OrderItemRow, OrderEventRow"
  - "Domain types: Cart, ServerCartItem, Order, OrderItem, OrderEvent, OrderStatus"
affects:
  - "src/lib/db/schema.ts (extended)"
  - "src/types/domain.ts (extended)"
  - "Live Supabase Postgres (Phase 8 tables now exist)"
tech-stack:
  added: []
  patterns:
    - "pgEnum for order_status (type-safe over CHECK constraints)"
    - "Integer halalas for all money columns (no float drift)"
    - "Composite uniqueIndex on cart_items (cartId, productId, sizeId) for UPSERT"
    - "Embedded shipping address snapshot on orders (not normalized this phase)"
    - "Snapshotted productNameEn/Ar + unitPriceCents on order_items (time-of-purchase)"
key-files:
  created:
    - "src/lib/db/migrations/0001_phase8_cart_orders.sql"
    - "src/lib/db/migrations/meta/0001_snapshot.json"
    - ".planning/phases/08-cart-checkout-orders/08-01-SUMMARY.md"
  modified:
    - "src/lib/db/schema.ts"
    - "src/types/domain.ts"
    - "src/lib/db/migrations/meta/_journal.json"
decisions:
  - "userId on carts/orders is nullable text (not uuid) — Phase 10 (Supabase Auth) will later cross-schema FK to auth.users(id) text"
  - "carts.locale column kept (planner spec) so cart-time locale survives into order email language"
  - "trackingNumber column added on orders now (nullable) — populated when shipping fires later"
  - "order_events composite (orderId, type) is NON-unique — state-change events repeat; email idempotency is enforced at send-time via row-existence query for 'email_sent.*' types"
metrics:
  duration: "~6 min"
  tasks_completed: 3
  files_changed: 5
  completed: 2026-05-10
---

# Phase 8 Plan 01: Schema + Migration Summary

**One-liner:** Added Phase 8 cart/order/order-events Drizzle tables + `order_status` pgEnum, generated migration `0001_phase8_cart_orders.sql`, pushed to live Supabase Postgres — every Phase 8 Wave-1+ plan can now import the new tables.

## What was done

1. **Extended `src/lib/db/schema.ts`** with five new tables (`carts`, `cart_items`, `orders`, `order_items`, `order_events`), the `order_status` pgEnum (six values, exact order), all relations, all indexes (per ECOM-06), and corresponding `$inferSelect` / `$inferInsert` Row type exports.
2. **Extended `src/types/domain.ts`** with `OrderStatus`, `Cart`, `ServerCartItem`, `Order`, `OrderItem`, `OrderEvent` interfaces. The pre-existing client-side `CartItem` (Zustand store contract) was left untouched; the new server shape is exported as `ServerCartItem` to avoid name collision.
3. **Generated migration** `src/lib/db/migrations/0001_phase8_cart_orders.sql` via `drizzle-kit generate --name=phase8_cart_orders`. `meta/_journal.json` has both idx 0 and idx 1 entries; `meta/0001_snapshot.json` was created.
4. **Pushed migration to live Supabase Postgres** via `npm run db:push`. First run reported `[✓] Changes applied`; second run reported `[i] No changes detected` (idempotent — schema in sync).

## Commits

| Hash      | Type  | Message                                                    |
| --------- | ----- | ---------------------------------------------------------- |
| `83a77fb` | feat  | add Phase 8 cart/order tables to Drizzle schema             |
| `fd645e5` | chore | generate Drizzle migration 0001_phase8_cart_orders          |

(Task 3 — db:push — has no source-file output and produced no commit; its artifact is the live-DB schema state.)

## Acceptance criteria (all PASS)

- `grep -c "pgEnum('order_status'" src/lib/db/schema.ts` → 1
- `grep -c "export const carts = pgTable" src/lib/db/schema.ts` → 1
- `grep -c "export const cartItems = pgTable" src/lib/db/schema.ts` → 1
- `grep -c "export const orders = pgTable" src/lib/db/schema.ts` → 1
- `grep -c "export const orderItems = pgTable" src/lib/db/schema.ts` → 1
- `grep -c "export const orderEvents = pgTable" src/lib/db/schema.ts` → 1
- `grep -c "subtotalCents: integer" src/lib/db/schema.ts` → 1
- `grep -c "uniqueIndex('cart_items_cart_product_size_unq')" src/lib/db/schema.ts` → 1
- `grep -c "type OrderStatus" src/types/domain.ts` → 1
- `grep -c "export interface Order " src/types/domain.ts` → 1
- `grep -c "export type OrderRow" src/lib/db/schema.ts` → 1
- `npx tsc --noEmit` → 0 errors referencing schema.ts or domain.ts (test-file errors pre-existing, out of scope)
- `grep -c 'CREATE TYPE "public"."order_status"' src/lib/db/migrations/0001_phase8_cart_orders.sql` → 1
- All 5 `CREATE TABLE` statements present in migration → confirmed
- `cart_items_cart_product_size_unq` UNIQUE INDEX present in migration → confirmed
- First `npm run db:push` exited 0 with `[✓] Changes applied`
- Second `npm run db:push` exited 0 with `[i] No changes detected`

## Deviations from plan

**None — plan executed exactly as written.**

One incidental observation: drizzle-kit's diff vs. the 0000 snapshot also picked up `ALTER TABLE "product_sizes" ADD COLUMN "stock"` because the `stock` column was previously added to schema.ts and live DB via `db:push` without ever updating the 0000 snapshot. This catch-up ALTER is harmless (the live column already exists, so `db:push`'s own diff vs. live DB skipped it) and keeps the migration files internally consistent going forward.

No CLAUDE.md violations. No Rule 1/2/3 auto-fixes. No Rule 4 architectural decisions surfaced.

## Authentication gates

None encountered.

## New tables (live DB)

- `carts` — id, sessionId (unique, indexed), userId (text, nullable, indexed), locale, createdAt, updatedAt
- `cart_items` — id, cartId, productId, sizeId, quantity, addedAt + unique composite index
- `orders` — id, reference (unique, indexed), userId (nullable, indexed), email (indexed), locale, status (enum, indexed, default 'pending'), subtotalCents, shippingCents, vatCents, totalCents, currency, embedded shipping address fields, paymentMethod, trackingNumber, placedAt (indexed), updatedAt
- `order_items` — id, orderId, productId, sizeLabel, productNameEn/Ar, unitPriceCents, quantity (with FK indexes)
- `order_events` — id, orderId, type, metadata (jsonb), createdAt (with orderId/type indexes; NOT unique)

## New enum

`order_status` (Postgres enum): `pending | confirmed | shipped | delivered | cancelled | refunded` — exact order matters for some clients.

## Money convention reminder for downstream plans

All Phase 8 money columns (`subtotalCents`, `shippingCents`, `vatCents`, `totalCents`, `unitPriceCents`) are **integer halalas** (1 SAR = 100 halalas). Existing `products.price` is still **whole SAR** (Phase 5 contract; not migrated). Downstream pricing code must `* 100` when copying from `products.price` into `order_items.unitPriceCents`.

## Phase 10 readiness (Supabase Auth — deferred)

`carts.userId` and `orders.userId` are `text NULL`. Per ADR-002, Phase 10 will:
1. Backfill these to reference `auth.users(id)` (also text/uuid in Supabase Auth).
2. Add cross-schema FK constraints.
3. Possibly tighten to `NOT NULL` for authenticated paths.

No schema work needed in Phase 8 for that — the columns exist and are indexed.

## Known stubs

None. Plan is purely a schema/migration foundation; no UI rendering paths exist yet.

## Threat flags

None — no new network endpoints, auth paths, or trust-boundary surface introduced. All new tables sit behind the existing Drizzle/Server-Action perimeter.

## Self-Check: PASSED

- src/lib/db/schema.ts → FOUND
- src/types/domain.ts → FOUND
- src/lib/db/migrations/0001_phase8_cart_orders.sql → FOUND
- src/lib/db/migrations/meta/0001_snapshot.json → FOUND
- Commit 83a77fb → FOUND
- Commit fd645e5 → FOUND
- Live DB: carts, cart_items, orders, order_items, order_events tables created (per `[✓] Changes applied` + idempotent re-run)
- Live DB: order_status enum created (per same)
