-- ──────────────────────────────────────────────────────────────────────────────
-- 0005_phase11_order_idempotency.sql
--
-- Double-charge / duplicate-order protection. Adds orders.idempotency_key: a
-- per-checkout-attempt key the client sends so submitCheckout can dedupe a
-- double-click / back-button resubmit / silent network retry — returning the
-- ORIGINAL order instead of creating a second one or charging twice. The UNIQUE
-- constraint is the database-level hard guarantee (Postgres allows many NULLs
-- under a unique index, so guest/legacy rows are unaffected).
--
-- Idempotent (IF NOT EXISTS + duplicate_object guard): runs once on prod where
-- the column has never existed, and in order on a fresh db:migrate. The new
-- column is nullable and additive — no table rewrite, no data backfill.
-- Snapshot meta/0005_snapshot.json was generated from schema.ts (accurate);
-- this hand-authored SQL produces the identical end state with re-run safety.
-- ──────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS idempotency_key text;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE public.orders ADD CONSTRAINT orders_idempotency_key_unique UNIQUE (idempotency_key);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
