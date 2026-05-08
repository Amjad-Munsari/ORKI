# Phase 7: Product Catalog & Dynamic Inventory - Context

**Gathered:** 2026-05-08
**Status:** Ready for planning

<domain>
## Phase Boundary
This phase transitions the storefront from static data to a dynamic database-driven model using Drizzle ORM and local Postgres. It focuses on inventory accuracy, SEO completeness, and performance through on-demand revalidation.

- **Focus:** Storefront (Catalog, PDP, Categories).
- **Core Goal:** Real-time stock reflection and SEO parity with static version.
</domain>

<decisions>
## Implementation Decisions

### [CAT-01] Data Source Cutover
- **Decision:** Perform a clean cutover to the database. The `src/lib/products.ts` logic will be entirely refactored to query the DB using Drizzle.
- **Rationale:** Minimizes technical debt and prevents "split-brain" bugs between static and dynamic data.

### [CAT-02] Inventory UX: Low Stock & Deferral
- **Decision:** 
    - Implement "Low Stock" indicators on the product grid and PDP for sizes/items with limited availability.
    - Defer the "Notify Me" email capture functionality to a later phase (once notification infrastructure is established).
- **Rationale:** Focuses on immediate conversion signals (scarcity) while avoiding incomplete feature implementation.

### [CAT-03] Image Serving
- **Decision:** Continue using local file serving optimized by `next/image`'s internal engine. Ensure the schema and components are ready for a CDN URL swap (Cloudinary/Vercel Blob) in Phase 9.
- **Rationale:** Avoids external cloud dependency during the local development milestone.

### [CAT-04] Caching & Revalidation
- **Decision:** Use **On-Demand Revalidation**. Catalog and product pages will be revalidated via `revalidatePath` or `revalidateTag` whenever the Admin Dashboard (Phase 6) performs a mutation.
- **Rationale:** Provides the best user experience where stock updates are reflected instantly without the overhead of short-TTL polling.

</decisions>

<canonical_refs>
## Canonical References
- `src/lib/db/schema.ts` — Database schema source of truth.
- `src/lib/products.ts` — Data access layer to be refactored.
- `src/app/[locale]/shop` — Main storefront route.
- `src/app/actions/admin.ts` — Mutations to trigger revalidation.
- `ROADMAP.md` — Requirement list (Phase 7).
- `REQUIREMENTS.md` — ECOM-01, ECOM-05, ECOM-06, SEO-01... (Full traceability).
</canonical_refs>

<specifics>
## Specific Ideas
- Add a `stock_level` helper in `src/lib/products-logic.ts` to determine when "Low Stock" badge should show.
- Ensure `generateMetadata` in PDP is fully dynamic.
</specifics>
