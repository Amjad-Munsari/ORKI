---
plan: 02-04
phase: 02-core-shopping
status: complete
wave: 3
tasks_completed: 2
tasks_total: 2
self_check: PASSED
---

# Plan 02-04 Summary — Shop Components

## What Was Built

**StockStateBadge** (`src/components/shop/StockStateBadge.tsx`): Server Component. Three states × two contexts: in-stock → renders nothing; partial → nothing on card, inline text on PDP; out-of-stock → overlay bar on card (`inset-inline-start-0 inset-inline-end-0` logical properties), inline text on PDP. All variants use `role="status"`.

**ProductCard** (`src/components/shop/ProductCard.tsx`): Server Component. Link from `@/i18n/navigation` with `group` class enables simultaneous group-hover effects per D-09/ANIM-03: `motion-safe:group-hover:scale-[1.04]` on the PlaceholderImage (3:4 aspect, `duration-300 ease-out`) + `group-hover:underline` on the product name. Price formatted with `Intl.NumberFormat('ar-SA-u-nu-latn')` for Western numerals in both locales. No physical CSS directional classes.

**ProductGrid** (`src/components/shop/ProductGrid.tsx`): Server Component. `grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6`. First 4 cards get `priority={true}` for above-the-fold image loading. Bilingual empty state when `products.length === 0`.

**ShopHeader** (`src/components/shop/ShopHeader.tsx`): `'use client'` component. Uses `useSearchParams` from `next/navigation` (read-only, safe in Client Components) + `useRouter`/`usePathname` from `@/i18n/navigation` for URL push. Category tabs (All/Tops/Bottoms) and sort select both update URL query params without page reload (D-03). Count display uses `t('productCount', { count })` from next-intl.

## Key Files

- `src/components/shop/StockStateBadge.tsx` — 3-state × 2-context badge
- `src/components/shop/ProductCard.tsx` — hover zoom + underline card
- `src/components/shop/ProductGrid.tsx` — responsive 2/3/4 col grid
- `src/components/shop/ShopHeader.tsx` — URL-based filter + sort

## Commits

- `062526b` — feat(02-04): ProductCard with motion-safe hover zoom+underline, StockStateBadge 3-state
- `ceda364` — feat(02-04): ProductGrid responsive grid, ShopHeader URL-based filter+sort

## Acceptance Criteria

- [x] `motion-safe:group-hover:scale-[1.04]` in ProductCard (count: 1)
- [x] `role="status"` in StockStateBadge (count: 3)
- [x] `inset-inline` logical properties in StockStateBadge (count: 1)
- [x] `grid-cols-2`, `md:grid-cols-3`, `xl:grid-cols-4` in ProductGrid (count: 1 each)
- [x] `'use client'` in ShopHeader (count: 1)
- [x] `useSearchParams` in ShopHeader (count: 1)
- [x] `from '@/i18n/navigation'` in ShopHeader (count: 1)
- [x] No physical CSS directional classes in any file
- [x] TypeScript: no new errors

## Deviations

None. Plan executed exactly as specified.

## Self-Check: PASSED
