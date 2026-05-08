# SPEC: Phase 6 — Admin Dashboard & Product Management

**Status:** DRAFT
**Owner:** AI Agent
**Phase:** 6

## 1. Objective
Build a lightweight internal dashboard to manage the product catalog and inventory directly from the browser, replacing the need for manual database/seed script edits.

## 2. Requirements

### [ADMIN-01] Route Protection
- Path: `/admin` and sub-routes.
- Initially: Open for development, but with a warning banner.
- Final: Protected by basic auth or NextAuth (Phase 10).

### [ADMIN-02] Product Inventory Table
- Display all products from the database.
- Columns: Image (thumbnail), Name, SKU/Slug, Price, Category, Stock Status.
- Quick Search: Filter products by name or category.

### [ADMIN-03] Product Editor
- Modal or separate page to edit product details.
- Fields: Name (EN/AR), Description (EN/AR), Price, Category.
- Size Matrix: Toggle `inStock` for each size (XS, S, M, L, XL).

### [ADMIN-04] Product Creation
- Form to add a new product.
- Auto-generates slug from English name.
- Default sizes assigned on creation.

## 3. Technical Constraints
- Use **Server Actions** for all CRUD operations.
- Use **TanStack Table** (or simple Tailwind table) for the list view.
- Maintain existing database schema.

## 4. Success Criteria
1. Admin can see all 20 products in the `/admin` dashboard.
2. Admin can toggle a size to "Out of Stock" and see it immediately reflected on the storefront PDP.
3. Admin can create a new product that appears in the `/shop`.
