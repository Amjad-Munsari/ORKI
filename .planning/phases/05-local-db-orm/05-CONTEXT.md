# Phase 5 Context: Local Database & ORM Setup

**Date:** 2026-05-08
**Phase:** 5 — Local Database & ORM Setup
**Milestone:** v2.0 — Backend Integration & Technical Foundations

---

<domain>
Establish the local database infrastructure layer — PostgreSQL schema, Drizzle ORM, environment validation, and dependency hygiene — that all subsequent backend phases (Auth, Catalog, Cart, etc.) build on.

This phase does NOT include authentication, product API routes, or any UI changes. It ends when the DB is running locally, ORM is configured, schemas are defined, env vars are validated, and `npm audit` passes at moderate level.
</domain>

---

<decisions>

## 1. Database Engine & ORM

**Decision: Drizzle ORM + local PostgreSQL**

Rationale:
- TypeScript-first, zero runtime codegen — schema is just TypeScript types
- SQL-like schema definition gives precise control over structure
- Thin layer over `pg` driver — no magic, no black-box query generation
- Production migration to Supabase = one env var swap (`DATABASE_URL`) — Supabase is standard Postgres
- Fits cleanly with the existing `src/lib/products.ts` abstraction layer (comments already anticipate a backend swap)
- Works excellently with Next.js 15 App Router and Server Actions
- Lighter and more maintainable than Prisma or Medusa v2 for this scale

**Local Postgres:** Docker (`docker-compose.yml` at repo root) with a named volume for persistence. This ensures all contributors run an identical DB environment without system Postgres conflicts.

**NOT chosen:**
- Medusa v2 — full commerce platform, too opinionated, fights the existing architecture
- Supabase JS client (local) — tightly couples to cloud at this stage; Phase 5 is explicitly "local database (pre-Supabase)"
- Prisma — heavier, codegen-dependent, overkill for this scale

## 2. Schema Design

**Initial schemas for Phase 5 (foundational tables only):**

```
products          — id, slug, name_en, name_ar, description_en, description_ar, category, price, currency, in_stock, created_at, updated_at
product_sizes     — id, product_id (FK), label, in_stock
product_images    — id, product_id (FK), url, sort_order
```

These mirror the existing `Product` type in `src/types/domain.ts` exactly — no type drift.

**Indexes required (INFRA-02 / ECOM-06):**
- `products.slug` — unique index (used by `getProductBySlug`)
- `products.category` — index (used by `getProductsByCategory`)
- `product_sizes.product_id` — index (FK join)

**Auth tables are NOT included in Phase 5** — those belong to Phase 6.

## 3. Environment & Secrets

**Decision: `.env.local` + Zod validation module + `.env.example` template**

Implementation:
- `.env.local` — local secrets, never committed (already in `.gitignore`)
- `.env.example` — committed template with placeholder values and comments describing each var
- `src/lib/env.ts` — Zod schema that validates all required env vars at module load time; throws a descriptive error on startup if any are missing or malformed

Required vars for Phase 5:
```
DATABASE_URL=postgresql://orki:orki@localhost:5432/orki_dev
```

Future vars (Phase 6+) will be added to `env.ts` when needed — it's the single source of truth.

## 4. Dependency Audit Policy

**Decision: `npm audit --audit-level=moderate`**

- Phase 5 does not close if any HIGH or CRITICAL vulnerabilities are unresolved
- LOW severity advisories are acceptable and documented in `SECURITY-EXCEPTIONS.md` with justification
- `npm audit` is run as the final verification step before marking Phase 5 complete
- `package-lock.json` is committed and treated as the lock artifact (INFRA-04)

## 5. Integration Point with Existing Abstraction

**`src/lib/products.ts` is the ONLY file that changes when wiring DB:**

The existing codebase was explicitly designed for this:
```ts
// src/lib/products.ts
// "When Medusa v2 backend is integrated, only this file changes."
```

Phase 5 plan:
1. Keep static data in `src/data/products.ts` as fallback / seed reference
2. Add Drizzle query functions in `src/lib/db/` directory
3. Update `src/lib/products.ts` to call Drizzle instead of static array
4. Zero changes to any component files — abstraction holds

**File structure target:**
```
src/
  lib/
    db/
      client.ts       — Drizzle client singleton (uses DATABASE_URL from env.ts)
      schema.ts       — Drizzle schema definitions (products, sizes, images)
      migrations/     — Drizzle migration files (auto-generated)
    env.ts            — Zod env validation
    products.ts       — UPDATED: queries DB via Drizzle (same public API)
```

</decisions>

---

<canonical_refs>
- `.planning/REQUIREMENTS.md` — INFRA-01, INFRA-02, INFRA-03, INFRA-04 (primary requirements for this phase)
- `.planning/ROADMAP.md` — Phase 5 success criteria
- `src/types/domain.ts` — Canonical Product/CartItem types; DB schema must match exactly
- `src/lib/products.ts` — Integration point; public API must not change
- `src/data/products.ts` — Seed data reference for initial DB population
</canonical_refs>

---

<code_context>

## Reusable Assets

- **`src/types/domain.ts`** — `Product`, `Size`, `CartItem` interfaces; Drizzle schema must produce rows that map to these types with no transformation
- **`src/lib/products.ts`** — Existing abstraction layer; all public functions (`getAllProducts`, `getProductBySlug`, `getProductsByCategory`, `getRelatedProducts`, `getStockState`) must retain identical signatures after DB integration
- **`src/data/products.ts`** — 6 seed products with bilingual names, prices, sizes; use as seed script data

## Patterns

- **Next.js 15 App Router** — use Server Actions or `async` Server Components for DB calls; no client-side DB access
- **Zustand** — cart state is already client-side via Zustand; no DB interaction needed for cart in this phase
- **TypeScript strict mode** — `tsconfig.json` enforces strict; all Drizzle schema inferences must be fully typed

</code_context>

---

<deferred>
- Supabase migration — deferred to a future milestone (just a `DATABASE_URL` swap)
- Auth tables (`users`, `sessions`) — Phase 6
- Order tables — Phase 8
- Image storage / WebP pipeline — Phase 7
</deferred>
