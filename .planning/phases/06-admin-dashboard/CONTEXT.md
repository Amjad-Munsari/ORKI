# Phase 6: Admin Dashboard - Context

**Gathered:** 2026-05-08
**Status:** Ready for planning

<domain>
## Phase Boundary
This phase delivers an internal management interface for the ORKI storefront. It allows admins to manage products, inventory, and eventually images, without direct database access.

- **Primary URL:** `/admin`
- **Focus:** CRUD for Products and Size Stock toggles.
</domain>

<decisions>
## Implementation Decisions

### [ADMIN-01] Route Protection
- **Decision:** Use a simple Middleware-based check for a `ADMIN_PASSWORD` cookie. If missing or invalid, redirect to `/admin/login` (even if it's just a simple form for now).
- **Rationale:** Prevents public indexing and casual access before full Auth is ready.

### [ADMIN-02] UI Framework
- **Decision:** Use a clean, utilitarian "Industrial/Brutalist" style for the admin side, distinct from the storefront.
- **Rationale:** Focus on speed and clarity. No need for the high-end storefront animations here.

### [ADMIN-03] Data Fetching
- **Decision:** Use Server Actions for all writes. Use standard Server Components for reads.
- **Rationale:** Minimal client-side state management needed for simple tables.

### [ADMIN-04] Inventory Management
- **Decision:** Single-click stock toggles on the main inventory list.
- **Rationale:** Minimize clicks for the most common admin task (marking something as sold out).

</decisions>

<canonical_refs>
## Canonical References
- `src/lib/db/schema.ts` — Database source of truth.
- `src/lib/db/index.ts` — Database client.
- `.planning/phases/06-admin-dashboard/SPEC.md` — Requirement source.
</canonical_refs>

<specifics>
## Specific Ideas
- Sidebar with links: [Inventory, Products, Orders (Phase 8), Settings].
- Table should show "Low Stock" indicators if possible.
</specifics>
