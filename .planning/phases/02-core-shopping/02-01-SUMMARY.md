---
phase: 02-core-shopping
plan: 01
subsystem: ui
tags: [typescript, next-intl, zustand, motion, product-data, i18n, animation]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: types/domain.ts Product interface, animation-presets.ts base object, messages/ JSON structure
provides:
  - 6 ORKI products in src/data/products.ts covering all stock states (in-stock, partial, fully OOS)
  - getStockState() and getRelatedProducts() helpers in src/lib/products.ts
  - StockState union type exported from src/lib/products.ts
  - Phase 2 animation presets: cardHover, badgePop, dropdownOpen, successState
  - Shop namespace (20 keys) in both messages/en.json and messages/ar.json
  - Extended Nav namespace with categories and cart keys in both locales
affects: [02-02, 02-03, 02-04, 02-05, 02-06, 02-07, 02-08]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Product data layer contract: all product access via src/lib/products.ts, never src/data/products.ts directly"
    - "StockState 3-way derivation from product.sizes array — no new Product field added (backend contract preserved)"
    - "Animation presets extended by appending to the existing object before closing as const"
    - "i18n namespaces extended by adding Shop namespace alongside existing Nav/Footer/Placeholder/Meta"

key-files:
  created: []
  modified:
    - src/data/products.ts
    - src/lib/products.ts
    - src/lib/animation-presets.ts
    - messages/en.json
    - messages/ar.json

key-decisions:
  - "getStockState derives 3-way state from sizes array — no new Product field added to preserve backend contract in types/domain.ts"
  - "Product array order is newest-first (default sort); no ID-based ordering needed"
  - "Shop namespace has 20 translation keys (plan spec listed 16 but full key list in the action totals 20)"

patterns-established:
  - "StockState pattern: 'in-stock' | 'partial' | 'out-of-stock' derived from product.sizes — use getStockState() in all Phase 2 badge/display components"
  - "getRelatedProducts(currentId, category, limit=4): same-category filter, exclude self, slice to limit — wire to PDP related row"

requirements-completed: [SHOP-01, SHOP-02, SHOP-03, SHOP-04, PDP-03, PDP-08, PDP-09, ANIM-03]

# Metrics
duration: 3min
completed: 2026-05-07
---

# Phase 2 Plan 01: Data Foundation Summary

**6 ORKI products with full bilingual data, getStockState/getRelatedProducts helpers, 4 Phase 2 animation presets, and complete Shop i18n namespace in EN and AR**

## Performance

- **Duration:** 3 min
- **Started:** 2026-05-07T12:18:20Z
- **Completed:** 2026-05-07T12:21:21Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Populated src/data/products.ts with 6 ORKI-style products (3 tops, 3 bottoms) covering all stock states: partial OOS (orki-heavy-tee-black), fully OOS (orki-washed-tee-ecru), partial OOS bottoms (orki-utility-cargo-black, orki-track-pants-black), and fully in-stock items
- Extended src/lib/products.ts with getStockState() (returning 'in-stock' | 'partial' | 'out-of-stock') and getRelatedProducts() (same-category filter, exclude self, configurable limit)
- Added 4 Phase 2 animation presets to animationPresets object: cardHover, badgePop, dropdownOpen, successState — with values matching UI-SPEC easing curves
- Added complete Shop namespace (20 keys) and extended Nav namespace (categories, cart) to both messages/en.json and messages/ar.json

## Task Commits

Each task was committed atomically:

1. **Task 1: Populate product data and extend lib/products.ts** - `ab877fc` (feat)
2. **Task 2: Extend animation presets and add Shop i18n keys** - `e49c153` (feat)

**Plan metadata:** (included in task commits — no separate metadata commit)

## Files Created/Modified
- `src/data/products.ts` - 6 ORKI products, 3 tops + 3 bottoms, bilingual EN/AR, SAR pricing, all stock states covered
- `src/lib/products.ts` - Added getStockState(), getRelatedProducts(), StockState type after existing exports
- `src/lib/animation-presets.ts` - Added cardHover, badgePop, dropdownOpen, successState presets
- `messages/en.json` - Extended Nav with categories/cart, added Shop namespace (20 keys)
- `messages/ar.json` - Extended Nav with categories/cart, added Shop namespace (20 keys) in Arabic

## Decisions Made
- getStockState derives 3-way stock state from product.sizes array — chose not to add a new field to the Product interface to preserve the backend contract shape defined in types/domain.ts
- Product array order is newest-first (default sort) per plan spec — array position is the canonical sort order for the 'newest' option

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Known Stubs

- `images: []` on all 6 products — empty images array is intentional for Phase 2. PlaceholderImage components use a data URI src and ignore the images array during Phase 2. Real images will be wired in a future phase by setting the src prop directly. This does not prevent any Phase 2 plan goal from being achieved (PlaceholderImage is already wired to use data URI independently of product.images).

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes at trust boundaries introduced. Files are static and public by design (per T-02-01 and T-02-02 in plan threat register).

## Next Phase Readiness

All Phase 2 data contracts are now concrete. Downstream plans can:
- Import `getAllProducts()`, `getProductsByCategory()`, `getProductBySlug()`, `getStockState()`, `getRelatedProducts()` from `src/lib/products.ts`
- Use `animationPresets.cardHover`, `badgePop`, `dropdownOpen`, `successState` in Motion components
- Use `t('Shop.addToCart')` etc. from the Shop namespace in both locales

No blockers for Wave 2 (plan 02-03) which depends on Wave 1 completion.

---
*Phase: 02-core-shopping*
*Completed: 2026-05-07*
