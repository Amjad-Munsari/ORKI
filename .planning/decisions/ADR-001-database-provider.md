# ADR-001: Database Provider — Supabase Postgres + Drizzle ORM

**Date:** 2026-05-10
**Status:** Accepted
**Supersedes:** Implicit Neon Postgres choice from Phase 5

## Context

Phase 5 set up local + production Postgres on Neon, accessed via Drizzle ORM. The user (project owner) decided to migrate to Supabase as the database platform before executing Phase 8 (Cart, Checkout & Orders).

## Decision

1. **Database host: Supabase Postgres.** Project ref `gkcaakimmvsctwpvccwt`, region `aws-1-ap-south-1`. Accessed via the Supabase Session Pooler on port 5432 (`aws-1-ap-south-1.pooler.supabase.com`). Pooler is IPv4-compatible and works on Vercel out of the box; the direct connection is IPv6-only and unreliable on serverless.

2. **ORM: Drizzle, kept as-is.** No migration of Phases 5/6/7 query code. Drizzle continues to own:
   - Schema definitions (`src/lib/db/schema.ts`)
   - Migrations (`src/lib/db/migrations/`)
   - All transactional / row-locking queries (Phase 8 `submitCheckout` uses `db.transaction` + `SELECT … FOR UPDATE`)
   - Complex relational queries (`src/lib/products.ts` and analogs in upcoming `src/lib/cart/`, `src/lib/orders/`)

3. **`@supabase/ssr` + `supabase-js` adopted selectively, not as a Drizzle replacement.** Reserved for places where the SDK gives real leverage:
   - Phase 10: Auth (sessions, signup, password reset) — see ADR-002
   - Future: Storage (image uploads), Realtime (admin live order feed)

   These will share the same Supabase Postgres database that Drizzle reads/writes — both clients can coexist on one schema.

## Why Drizzle stays (vs. dropping it for `supabase-js`)

- **Phase 8's stock lock requires `SELECT … FOR UPDATE` inside a multi-statement transaction.** With Drizzle this is a single TypeScript function. With `supabase-js` it would have to become a Postgres stored procedure invoked via `.rpc()`, moving inventory-correctness logic out of TypeScript and into PL/pgSQL.
- **Schema as code.** Drizzle generates migrations from `pgTable()` diffs. `supabase-js` doesn't manage schema — that would push us to Supabase Studio or hand-written SQL migrations.
- **Compile-time type safety on joined queries.** Drizzle infers types directly from schema. `supabase-js` requires `supabase gen types typescript` after every schema change, with looser inferred types on joins.
- **No vendor lock-in.** Drizzle code is portable Postgres. `supabase-js` is PostgREST-specific and only runs against Supabase.
- **No rewrite cost.** Phases 5/6/7 already use Drizzle. Switching would mean rewriting `src/lib/products.ts`, the admin dashboard CRUD, and the seed script — for no functional benefit.

## Consequences

### Positive
- Phase 8 plans need zero changes to accommodate this switch. Drizzle's API is host-agnostic.
- Free upgrade path to Supabase Auth in Phase 10 without reworking the data layer.
- Local dev and production now share a single connection-string env var (`DATABASE_URL` → pooler URL).

### Negative
- Two clients to learn when `supabase-js` lands later (Phase 10) — but each owns a clearly separated concern (Drizzle = data, supabase-js = auth/storage/realtime).
- Session pooler caps connection count to ~50 by default; not a concern at current scale, but to monitor.

### Neutral / Operational
- `.env.local`: `DATABASE_URL` set to the **session pooler** URL (port 5432). Transaction pooler (port 6543) was not used because Drizzle's default `prepare: true` works on session pooler without modification; transaction pooler would require `prepare: false` everywhere.
- `src/lib/db/client.ts` already uses `ssl: 'require'` — works against Supabase as-is.
- `drizzle.config.ts` SSL toggle keys off `NODE_ENV === 'production'`, which `.env.local` sets. No code change required.
- Old Neon connection string archived; project is now decoupled from Neon.

## Verification

Connection sanity:
```
postgres 17.6 — round-trip 2s from local (Mumbai pooler)
products: 20, product_sizes: 100, product_images: 20 — re-seeded successfully
```

## References
- Phase 5 plans: `.planning/phases/05-local-db-orm/`
- Phase 8 context: `.planning/phases/08-cart-checkout-orders/08-CONTEXT.md` (stock-lock requirement)
- Supabase project: `https://gkcaakimmvsctwpvccwt.supabase.co`
