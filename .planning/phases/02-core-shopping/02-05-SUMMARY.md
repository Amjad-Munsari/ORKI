---
plan: 02-05
phase: 02-core-shopping
status: complete
wave: 3
tasks_completed: 2
tasks_total: 2
self_check: PASSED
---

# Plan 02-05 Summary — Shop Pages

## What Was Built

**Shop Index Page** (`src/app/[locale]/shop/page.tsx`): Server Component. `await params` (locale) + `await searchParams` (category, sort) per Next.js 15 requirement. Server-side filtering by category (`tops`/`bottoms`/all) and sorting (`newest`/`price-asc`/`price-desc`). ShopHeader wrapped in `<Suspense fallback={null}>` (required because ShopHeader uses `useSearchParams`). Unknown category/sort values ignored gracefully — never throws.

**Category Page** (`src/app/[locale]/shop/[category]/page.tsx`): Server Component. `await params` (locale, category) + `await searchParams` (sort). `notFound()` for any category other than `tops`/`bottoms`. `getProductsByCategory(category)` pre-filters products. Sort applied server-side. ShopHeader in `<Suspense fallback={null}>`. Satisfies D-04 (category sub-routes same page, pre-filtered).

## Key Files

- `src/app/[locale]/shop/page.tsx` — /shop index with filter+sort
- `src/app/[locale]/shop/[category]/page.tsx` — /shop/tops + /shop/bottoms

## Commits

- `520afa9` — feat(02-05): /shop index + /shop/[category] Server Component pages

## Acceptance Criteria

- [x] `await searchParams` in shop/page.tsx
- [x] `await params` in shop/[category]/page.tsx
- [x] `notFound()` for invalid category segments
- [x] `ShopHeader` wrapped in `<Suspense fallback={null}>` on both pages
- [x] Server-side filter+sort logic (newest/price-asc/price-desc)
- [x] No physical CSS directional classes

## Deviations

None. Plan executed exactly as specified.

## Self-Check: PASSED
