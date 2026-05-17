---
phase: 11-storefront-ui-ux-polish-en
plan: 12
subsystem: ui
tags: [shop, suspense, skeleton, shadcn-select, base-ui, next-intl, streaming]

# Dependency graph
requires:
  - phase: 11-storefront-ui-ux-polish-en
    plan: 01
    provides: container-max CSS variable used in shop page layout
  - phase: 11-storefront-ui-ux-polish-en
    plan: 03
    provides: focus ring pattern on ShopHeader category tabs
  - phase: 11-storefront-ui-ux-polish-en
    plan: 07
    provides: ProductGrid grid column system (grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16)
provides:
  - ShopGridSkeleton: 8-card static 3:4 shell at bg-white/[0.03] matching ProductGrid column system
  - ShopGridSection: async server component wrapping getAllProducts + ShopHeader + ProductGrid
  - Suspense boundary on shop page — skeleton shows while products stream in
  - shadcn Select (Base UI-backed) replacing native <select> for sort in ShopHeader
affects:
  - 11-16 (throttled-network visual verification of skeleton + sort dropdown chrome)
  - 11-14 (empty-state copy — builds on ShopGridSection error/empty state structure)

# Tech tracking
tech-stack:
  added:
    - "@base-ui/react/select (via shadcn CLI — select.tsx component)"
  patterns:
    - "Option B streaming pattern: parent route renders Suspense boundary; ShopGridSection async child does data fetch"
    - "Static skeleton shells: bg-white/[0.03] rectangles at 3:4 aspect ratio, no shimmer (D-13)"
    - "Base UI Select null guard: onValueChange receives (value | null) — guard with v !== null before passing to setSort"

key-files:
  created:
    - src/components/shop/ShopGridSkeleton.tsx
    - src/components/ui/select.tsx
  modified:
    - src/app/[locale]/shop/page.tsx
    - src/components/shop/ShopHeader.tsx

key-decisions:
  - "Option B streaming refactor: ShopGridSection async child holds data fetch; parent wraps in Suspense — cleanest SSR streaming with minimal structural change"
  - "Base UI Select (not Radix): project uses shadcn base-nova style which installs @base-ui/react/select, not Radix. API is onValueChange(value, eventDetails) with value typed as T|null"
  - "Null guard on onValueChange: Base UI Select allows deselect (value=null); guard before calling setSort to preserve string-only contract"
  - "ShopHeader stays inside ShopGridSection: productCount is only known after getAllProducts; co-locating avoids prop drilling and keeps header+grid under same Suspense boundary"

patterns-established:
  - "D-13 skeleton rule: static bg-white/[0.03] shells only — no animate-pulse, no shimmer, no gradient sweeps"
  - "ShopGridSection pattern: when a Server Component needs to be Suspense-streamable, extract into named async function at module scope (not a separate file) and wrap caller in Suspense"

requirements-completed: [SC-1, SC-5, SC-6]

# Metrics
duration: 18min
completed: 2026-05-17
---

# Phase 11 Plan 12: Shop Suspense Skeleton + shadcn Sort Select Summary

**Suspense-streamed ShopGridSection with static 8-card skeleton fallback, and shadcn Base UI Select replacing native sort dropdown with brand-aligned dark chrome**

## Performance

- **Duration:** ~18 min
- **Started:** 2026-05-17T00:00:00Z
- **Completed:** 2026-05-17T00:18:00Z
- **Tasks:** 3
- **Files modified:** 4 (+ 1 auto-installed)

## Accomplishments
- Created `ShopGridSkeleton.tsx` — 8-card static 3:4 shells at `bg-white/[0.03]`, shared grid column system, `role=status` a11y, zero animation (D-13 compliant)
- Refactored `shop/page.tsx` to Option B streaming: `ShopGridSection` async server component holds `getAllProducts()` + header + grid; parent renders single `<Suspense fallback={<ShopGridSkeleton />}>`
- Replaced native `<select>` in `ShopHeader.tsx` with shadcn Select (Base UI-backed); dark chrome: `bg-transparent`, `border-white/[0.12]`, `bg-[var(--color-secondary-surface)]` dropdown, focus-visible ring preserved; EN+AR labels intact

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ShopGridSkeleton** - `2fb7b47` (feat)
2. **Task 2: Refactor shop/page.tsx Suspense+ShopGridSection** - `6d00bf9` (feat)
3. **Task 3: Replace native select with shadcn Select** - `b919f3e` (feat)

## Files Created/Modified
- `src/components/shop/ShopGridSkeleton.tsx` - Static 8-card 3:4 skeleton, shared grid columns, role=status, D-13 no-animation
- `src/app/[locale]/shop/page.tsx` - Option B Suspense refactor; ShopGridSection async child streams products
- `src/components/shop/ShopHeader.tsx` - shadcn Select replaces native <select>; Base UI null guard on onValueChange
- `src/components/ui/select.tsx` - Installed via shadcn CLI (base-nova style, @base-ui/react/select backend)

## Decisions Made
- **Option B streaming:** Keep parent route synchronous in shape; extract async fetch into `ShopGridSection`. This means skeleton renders on actual slow loads (first paint, throttled network) without requiring a separate file.
- **shadcn base-nova Select:** Project uses `style: "base-nova"` in `components.json` — shadcn CLI installs `@base-ui/react/select`, not Radix `@radix-ui/react-select`. The API surface is similar but `onValueChange` has signature `(value: T | null, eventDetails) => void`.
- **Null guard pattern:** Wrapped `onValueChange` as `(v) => { if (v !== null) setSort(v) }` to satisfy TypeScript and preserve `setSort`'s `string`-only contract.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed missing shadcn Select component**
- **Found during:** Task 3 pre-check (shadcn Select not present at `src/components/ui/select.tsx`)
- **Issue:** Plan required `@/components/ui/select` but component not yet installed in project
- **Fix:** Ran `npx shadcn@latest add select --yes` which installed Base UI-backed select.tsx
- **Files modified:** `src/components/ui/select.tsx` (created)
- **Verification:** File exists; TypeScript compiles; build passes
- **Committed in:** b919f3e (Task 3 commit)

**2. [Rule 1 - Bug] Null guard on Base UI onValueChange**
- **Found during:** Task 3 TypeScript check
- **Issue:** Base UI `SelectRoot.onValueChange` signature is `(value: T | null, eventDetails) => void`; `setSort(sort: string)` only accepts `string` — TS error TS2322
- **Fix:** Changed `onValueChange={setSort}` to `onValueChange={(v) => { if (v !== null) setSort(v) }}`
- **Files modified:** `src/components/shop/ShopHeader.tsx`
- **Verification:** `npx tsc --noEmit` exits 0; `npm run lint` exits 0; `npm run build` succeeds
- **Committed in:** b919f3e (Task 3 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both auto-fixes necessary for correct function. No scope creep. shadcn CLI auto-install is standard workflow for missing UI primitives.

## Issues Encountered
- Base UI Select (`@base-ui/react/select`) differs from Radix-based shadcn Select in `onValueChange` signature — value can be `null`. Handled via null guard. Plan template assumed Radix API; adapted to Base UI without structural change.

## Known Stubs
None — all functionality is wired with real data.

## Next Phase Readiness
- F-Exp-2 (skeleton) and F-Exp-6 (sort select) are now closed
- Plan 11-16 will verify skeleton on throttled network and sort dropdown visual chrome match
- Plan 11-14 (empty-state copy) builds on `ShopGridSection` structure already in place

---
*Phase: 11-storefront-ui-ux-polish-en*
*Completed: 2026-05-17*
