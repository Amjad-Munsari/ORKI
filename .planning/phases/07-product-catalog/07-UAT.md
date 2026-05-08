---
status: testing
phase: 07-product-catalog
source: [.planning/phases/07-product-catalog/07-SUMMARY.md]
started: "2026-05-08T18:56:00Z"
updated: "2026-05-08T18:56:00Z"
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

number: 1
name: Cold Start Smoke Test
expected: |
  Kill any running server/service. Clear ephemeral state (temp DBs, caches, lock files). Start the application from scratch. Server boots without errors, any seed/migration completes, and a primary query (health check, homepage load, or basic API call) returns live data.
awaiting: user response

## Tests

### 1. Cold Start Smoke Test
expected: |
  Kill any running server/service. Clear ephemeral state (temp DBs, caches, lock files). Start the application from scratch. Server boots without errors, any seed/migration completes, and a primary query (health check, homepage load, or basic API call) returns live data.
result: [pending]

### 2. Dynamic Product Catalog
expected: |
  Navigate to the /shop page. Products should render correctly using data from the database. Deleting a product in the database should cause it to disappear from the shop (after refresh/revalidation).
result: [pending]

### 3. Scarcity Signal: Product Card
expected: |
  Find a product in the admin dashboard and set one of its sizes to a stock level between 1 and 5. Navigate to the /shop page. The product card should show a "LOW STOCK" overlay bar.
result: [pending]

### 4. Scarcity Signal: PDP
expected: |
  Navigate to a product detail page (PDP) where a size has stock between 1 and 5. Select that size. A red warning message "ONLY [N] LEFT" should appear below the size selector.
result: [pending]

### 5. Admin Inventory Management
expected: |
  In the Admin Dashboard, update the stock of a size to 0. The "In Stock" status for that size should automatically toggle to OFF. Save changes. On the storefront PDP, that size should now be disabled/unselectable.
result: [pending]

### 6. SEO & Metadata
expected: |
  View the page source or use a meta-tag inspector on a PDP. The `<title>` should dynamically include the product name, and a valid `application/ld+json` script should be present containing the Product and BreadcrumbList schema.
result: [pending]

## Summary

total: 6
passed: 0
issues: 0
pending: 6
skipped: 0

## Gaps

[none yet]
