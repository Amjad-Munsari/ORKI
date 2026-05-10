-- ──────────────────────────────────────────────────────────────────────────────
-- 0002_phase10_auth_fk_and_rls.sql
--
-- Phase 10 Wave 0 — auth schema foundation.
--
-- Hand-authored (not drizzle-kit emitted). Drizzle-kit cannot emit:
--   - ALTER COLUMN ... TYPE uuid USING ::uuid   (data-cast migrations)
--   - Cross-schema FKs to auth.users(id)        (Drizzle does not introspect auth.*)
--   - RLS enable / CREATE POLICY                (Drizzle-kit RLS support is partial)
--
-- Pre-condition: notes/wave-0-probe.md confirms 0 non-uuid rows in
-- public.carts.user_id and public.orders.user_id. Without that, the
-- USING ::uuid cast below will raise and roll back.
--
-- This file is split into sections separated by the drizzle statement
-- breakpoint marker (see 0001_phase8_cart_orders.sql for the exact form),
-- so the Drizzle migration runner executes one statement at a time.
-- ──────────────────────────────────────────────────────────────────────────────

-- ─── Section 1: drop old indexes on text columns ────────────────────────────
DROP INDEX IF EXISTS carts_user_id_idx;--> statement-breakpoint
DROP INDEX IF EXISTS orders_user_id_idx;--> statement-breakpoint

-- ─── Section 2: ALTER text → uuid ───────────────────────────────────────────
-- The USING expression performs the in-place cast. Postgres requires every
-- non-NULL value to satisfy ::uuid; the Wave-0 probe verified this is safe.
ALTER TABLE public.carts  ALTER COLUMN user_id TYPE uuid USING user_id::uuid;--> statement-breakpoint
ALTER TABLE public.orders ALTER COLUMN user_id TYPE uuid USING user_id::uuid;--> statement-breakpoint

-- ─── Section 3: cross-schema FKs to auth.users(id) ──────────────────────────
-- ON DELETE SET NULL: when a Supabase user is hard-deleted, the cart and order
-- rows survive with user_id = NULL (anonymised history). Audit trail of WHO
-- placed an order is preserved via the snapshotted `email` column on orders.
ALTER TABLE public.carts
  ADD CONSTRAINT carts_user_id_fk
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE public.orders
  ADD CONSTRAINT orders_user_id_fk
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;--> statement-breakpoint

-- ─── Section 4: recreate indexes on the new uuid columns ────────────────────
CREATE INDEX carts_user_id_idx  ON public.carts(user_id);--> statement-breakpoint
CREATE INDEX orders_user_id_idx ON public.orders(user_id);--> statement-breakpoint

-- ─── Section 5: auth_events audit-log table ─────────────────────────────────
-- user_id intentionally has NO FK to auth.users — auth events must survive
-- user deletion (RESEARCH §7 #12). The `email` snapshot keeps the log useful
-- after deletion. service_role-only access enforced by RLS-enabled-no-policies
-- in Section 6 below.
CREATE TABLE public.auth_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  email text,
  event text NOT NULL,
  metadata jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);--> statement-breakpoint
CREATE INDEX auth_events_user_id_idx    ON public.auth_events(user_id);--> statement-breakpoint
CREATE INDEX auth_events_event_idx      ON public.auth_events(event);--> statement-breakpoint
CREATE INDEX auth_events_created_at_idx ON public.auth_events(created_at);--> statement-breakpoint

-- ─── Section 6: RLS enable on six tables ────────────────────────────────────
-- ─── Defense-in-depth note ───────────────────────────────────────────────
-- Phase 10 keeps cart and checkout Drizzle-driven. Drizzle uses the
-- `postgres` connection-string role which bypasses RLS, so guest carts
-- continue to work without any anon-role policy. The policies below apply
-- to PostgREST consumers (anon/authenticated). They are defense-in-depth
-- for any future phase that moves cart reads to the SSR Supabase client.
-- service_role bypasses RLS by privilege (BYPASSRLS) — no policy needed.
-- See RESEARCH §2.5 + §8 R7.
-- Every USING / WITH CHECK wraps auth.uid() in (SELECT ...) so Postgres
-- caches the function result per-statement (RESEARCH §7 #13); without the
-- SELECT, the function fires per row and tanks query plans.
-- ────────────────────────────────────────────────────────────────────────
ALTER TABLE public.carts        ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.cart_items   ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.orders       ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.order_items  ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.auth_events  ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

-- ─── Section 7: RLS policies ────────────────────────────────────────────────
-- carts: owner-only CRUD via PostgREST. Guest path is unaffected (Drizzle bypass).
CREATE POLICY "carts_select_own"
  ON public.carts FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));--> statement-breakpoint
CREATE POLICY "carts_insert_own"
  ON public.carts FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));--> statement-breakpoint
CREATE POLICY "carts_update_own"
  ON public.carts FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));--> statement-breakpoint
CREATE POLICY "carts_delete_own"
  ON public.carts FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));--> statement-breakpoint

-- cart_items: scoped via parent cart ownership.
CREATE POLICY "cart_items_select_own"
  ON public.cart_items FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.carts c
    WHERE c.id = cart_items.cart_id AND c.user_id = (SELECT auth.uid())
  ));--> statement-breakpoint
CREATE POLICY "cart_items_modify_own"
  ON public.cart_items FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.carts c
    WHERE c.id = cart_items.cart_id AND c.user_id = (SELECT auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.carts c
    WHERE c.id = cart_items.cart_id AND c.user_id = (SELECT auth.uid())
  ));--> statement-breakpoint

-- orders: owner-only SELECT. INSERT/UPDATE happen via Drizzle (bypass).
CREATE POLICY "orders_select_own"
  ON public.orders FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));--> statement-breakpoint

-- order_items: scoped via parent order ownership.
CREATE POLICY "order_items_select_own"
  ON public.order_items FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id AND o.user_id = (SELECT auth.uid())
  ));--> statement-breakpoint

-- order_events: same pattern.
CREATE POLICY "order_events_select_own"
  ON public.order_events FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_events.order_id AND o.user_id = (SELECT auth.uid())
  ));--> statement-breakpoint

-- auth_events: NO POLICIES. RLS-enabled-with-no-policies means anon and
-- authenticated have zero access. service_role bypasses (BYPASSRLS privilege)
-- and is the only role permitted to read or write auth_events. Admin reads
-- go through the service-role admin client (src/lib/supabase/admin.ts).
