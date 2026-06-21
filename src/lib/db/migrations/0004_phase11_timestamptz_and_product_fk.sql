-- ──────────────────────────────────────────────────────────────────────────────
-- 0004_phase11_timestamptz_and_product_fk.sql
--
-- Two schema-correctness fixes (backlog from the 2026-06-21 DB review):
--
--   1. timestamptz — every business timestamp was `timestamp WITHOUT time zone`
--      (tz-naive) except auth_events.created_at. Convert the 8 remaining columns
--      to timestamptz. The app has always written UTC instants (defaultNow() /
--      new Date() on UTC infra), so the stored naive values ARE UTC — the cast
--      declares that explicitly via `AT TIME ZONE 'UTC'`.
--
--   2. order_items.product_id — was NOT NULL + FK ON DELETE NO ACTION, which
--      blocked deleting any product that had ever been ordered (and broke
--      `seed?force=1` once orders existed). order_items is a historical snapshot
--      (name/size/price captured at order time), so the link should null on
--      product delete, mirroring size_id. Make it nullable + ON DELETE SET NULL.
--
-- IDEMPOTENT BY DESIGN. timestamptz casts run only when the column is still
-- `timestamp without time zone`; the FK swap uses DROP ... IF EXISTS + a
-- DROP NOT NULL that Postgres treats as a no-op when already nullable. Safe to
-- run once on production (objects in their pre-fix state) and in order on a
-- fresh DB. Hand-authored (same rationale as 0002/0003 — see those NOTES).
-- ──────────────────────────────────────────────────────────────────────────────

-- ─── Section 1: timestamp → timestamptz (8 columns, UTC-declared) ────────────
DO $$ BEGIN IF (SELECT data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='created_at') = 'timestamp without time zone' THEN EXECUTE 'ALTER TABLE public.products ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE ''UTC'''; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF (SELECT data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='updated_at') = 'timestamp without time zone' THEN EXECUTE 'ALTER TABLE public.products ALTER COLUMN updated_at TYPE timestamptz USING updated_at AT TIME ZONE ''UTC'''; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF (SELECT data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='carts' AND column_name='created_at') = 'timestamp without time zone' THEN EXECUTE 'ALTER TABLE public.carts ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE ''UTC'''; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF (SELECT data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='carts' AND column_name='updated_at') = 'timestamp without time zone' THEN EXECUTE 'ALTER TABLE public.carts ALTER COLUMN updated_at TYPE timestamptz USING updated_at AT TIME ZONE ''UTC'''; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF (SELECT data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='cart_items' AND column_name='added_at') = 'timestamp without time zone' THEN EXECUTE 'ALTER TABLE public.cart_items ALTER COLUMN added_at TYPE timestamptz USING added_at AT TIME ZONE ''UTC'''; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF (SELECT data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='placed_at') = 'timestamp without time zone' THEN EXECUTE 'ALTER TABLE public.orders ALTER COLUMN placed_at TYPE timestamptz USING placed_at AT TIME ZONE ''UTC'''; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF (SELECT data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='updated_at') = 'timestamp without time zone' THEN EXECUTE 'ALTER TABLE public.orders ALTER COLUMN updated_at TYPE timestamptz USING updated_at AT TIME ZONE ''UTC'''; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF (SELECT data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='order_events' AND column_name='created_at') = 'timestamp without time zone' THEN EXECUTE 'ALTER TABLE public.order_events ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE ''UTC'''; END IF; END $$;--> statement-breakpoint

-- ─── Section 2: order_items.product_id → nullable + ON DELETE SET NULL ────────
-- Drop the old NO ACTION FK, relax NOT NULL, re-add the FK with SET NULL under
-- the same drizzle-conventional name so schema.ts stays diff-clean.
ALTER TABLE public.order_items DROP CONSTRAINT IF EXISTS order_items_product_id_products_id_fk;--> statement-breakpoint
ALTER TABLE public.order_items ALTER COLUMN product_id DROP NOT NULL;--> statement-breakpoint
ALTER TABLE public.order_items
  ADD CONSTRAINT order_items_product_id_products_id_fk
  FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;
