-- ──────────────────────────────────────────────────────────────────────────────
-- 0003_phase11_sizeid_and_constraints.sql
--
-- Re-baseline: folds two previously OUT-OF-BAND apply scripts into the Drizzle
-- journal so `npm run db:migrate` reproduces production end-to-end.
--
--   scripts/apply-11-order-sizeid.ts → order_items.size_id (+FK +index +backfill)
--   scripts/apply-11-constraints.ts  → CHECK constraints + product_sizes UNIQUE
--
-- WHY THIS EXISTS: before this migration, a fresh `db:migrate` (journal
-- 0000→0002) produced an order_items table WITH NO size_id column. But the
-- checkout path inserts order_items.size_id (src/lib/orders/server.ts), so every
-- new environment (CI integration DB, disaster-recovery rebuild, fresh dev)
-- broke at checkout with "column size_id does not exist". The size_id column and
-- the CHECK/UNIQUE invariants only ever reached production via the two standalone
-- apply-11 scripts, which are wired into nothing. This migration makes the
-- journal the single source of truth for those objects.
--
-- IDEMPOTENT BY DESIGN. Every statement uses IF NOT EXISTS / EXCEPTION
-- duplicate_object / NOT VALID. Drizzle's migrator runs a journal entry only when
-- its `when` exceeds the latest row in drizzle.__drizzle_migrations; production's
-- latest is 0002 (created_at 1778803200000) and this entry's `when` is greater,
-- so it runs exactly once on prod — where these objects ALREADY EXIST (apply-11),
-- making it a no-op — and in order on a fresh DB, where it creates them.
--
-- Hand-authored (not drizzle-kit emitted), same as 0002. Drizzle-kit's last real
-- snapshot is 0001 (stale: it still believes user_id is text and knows nothing of
-- 0002's auth FK/RLS), so `db:generate` cannot be trusted to emit a correct diff.
-- See 0003_phase11_sizeid_and_constraints.NOTES.md for the full reasoning and the
-- still-open follow-ups (snapshot re-baseline, timestamptz, product_id onDelete).
-- ──────────────────────────────────────────────────────────────────────────────

-- ─── Section 1: order_items.size_id (mirror of apply-11-order-sizeid.ts) ─────
-- Nullable + ON DELETE SET NULL: order_items is a historical snapshot, so a
-- deleted size must null the link, never delete the line. Stock restoration
-- prefers this id; (product_id, size_label) is the snapshot fallback.
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS size_id uuid;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE public.order_items ADD CONSTRAINT order_items_size_id_fk
    FOREIGN KEY (size_id) REFERENCES public.product_sizes(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS order_items_size_id_idx ON public.order_items (size_id);--> statement-breakpoint
-- Backfill existing rows by (product_id, label). No-op on a fresh/empty DB.
UPDATE public.order_items oi
  SET size_id = ps.id
  FROM public.product_sizes ps
  WHERE oi.size_id IS NULL
    AND ps.product_id = oi.product_id
    AND ps.label = oi.size_label;--> statement-breakpoint

-- ─── Section 2: invariant constraints (mirror of apply-11-constraints.ts) ────
-- CHECKs are NOT VALID: enforced on all FUTURE writes; existing rows are not
-- re-scanned (matches the original apply script; safe against any prior state).
DO $$ BEGIN ALTER TABLE public.products ADD CONSTRAINT products_price_nonneg CHECK (price >= 0) NOT VALID; EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE public.products ADD CONSTRAINT products_category_valid CHECK (category in ('tops', 'bottoms')) NOT VALID; EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE public.products ADD CONSTRAINT products_currency_valid CHECK (currency = 'SAR') NOT VALID; EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS product_sizes_product_label_unq ON public.product_sizes (product_id, label);--> statement-breakpoint
DO $$ BEGIN ALTER TABLE public.product_sizes ADD CONSTRAINT product_sizes_stock_nonneg CHECK (stock >= 0) NOT VALID; EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE public.cart_items ADD CONSTRAINT cart_items_quantity_positive CHECK (quantity > 0) NOT VALID; EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE public.carts ADD CONSTRAINT carts_locale_valid CHECK (locale in ('en', 'ar')) NOT VALID; EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE public.orders ADD CONSTRAINT orders_currency_valid CHECK (currency = 'SAR') NOT VALID; EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE public.orders ADD CONSTRAINT orders_locale_valid CHECK (locale in ('en', 'ar')) NOT VALID; EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE public.order_items ADD CONSTRAINT order_items_quantity_positive CHECK (quantity > 0) NOT VALID; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
