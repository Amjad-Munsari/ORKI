---
phase: 11-storefront-ui-ux-polish-en
plan: "08"
subsystem: ui
tags: [pdp, gallery, scroll-snap, IntersectionObserver, skeleton, rtl, reduced-motion]

# Dependency graph
requires:
  - phase: 11-01
    provides: CSS vars and logical-prop conventions
  - phase: 11-06
    provides: getPlaceholderVariantName + PDPGallery slug prop (back-compat stub)

provides:
  - src/components/pdp/PDPGallery.tsx — desktop vertical thumb strip + mobile scroll-snap carousel with dot indicators
  - src/components/pdp/PDPGallerySkeleton.tsx — static 4:5 hero + 3 thumb shells (no shimmer)
  - PDP route: Suspense boundary with PDPGallerySkeleton fallback + slug prop wired

affects:
  - Phase 11-11 (PDPInfoPanel touches same PDP page)
  - Phase 11-16 (live-verify with artificial delay confirms skeleton)
  - Phase 999.11 AR audit (RTL mirror is free via document [dir])

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "IntersectionObserver for mobile scroll-snap dot tracking — threshold [0.25, 0.5, 0.75], picks most-intersecting cell"
    - "useReducedMotion from motion/react — scrollIntoView uses behavior 'auto' instead of 'smooth'"
    - "CSS scroll-snap-type x mandatory + snap-center — native RTL via document [dir], no JS flip"
    - "Explicit TypeScript BestEntry type alias to work around TS narrowing of mutable variable in forEach callback"

key-files:
  created:
    - src/components/pdp/PDPGallerySkeleton.tsx
  modified:
    - src/components/pdp/PDPGallery.tsx
    - src/app/[locale]/shop/[category]/[slug]/page.tsx

key-decisions:
  - "Desktop thumb strip is inline-start column (80px) in md:grid-cols-[80px_1fr] — no sticky this phase, deferred"
  - "IntersectionObserver threshold set at 0.25/0.5/0.75 — active dot requires >0.5 ratio to avoid flickering at edges"
  - "Mobile scroll container hides scrollbar via [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden arbitrary Tailwind variants"
  - "Suspense boundary added defensively around PDPGallery — Plan 11-16 will verify skeleton with artificial data-fetch delay"
  - "TypeScript BestEntry type alias pattern used to resolve TS2339 narrowing error on mutable variable in forEach"

requirements-completed: [SC-1, SC-5, SC-6]

# Metrics
duration: 7min
completed: 2026-05-17
---

# Phase 11 Plan 08: PDP Gallery Upgrade Summary

**Mid-depth PDP gallery with desktop vertical thumb strip (inline-start, logical CSS), mobile CSS scroll-snap carousel with IntersectionObserver dot tracking, and static skeleton shells — closes F-Vis-3.**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-05-17T13:06:03Z
- **Completed:** 2026-05-17T13:12:26Z
- **Tasks:** 3
- **Files modified:** 3 (1 created, 2 modified)

## Accomplishments

- Created `PDPGallerySkeleton.tsx` — static `bg-white/[0.03]` shells at correct aspect ratios (4:5 hero, 3:4 thumbs), matching the desktop two-column grid structure, no shimmer, role=status for AT
- Rewrote `PDPGallery.tsx` as Client Component with desktop vertical thumb strip on inline-start, mobile horizontal scroll-snap container with dot indicators tracked via IntersectionObserver, useReducedMotion respect, all directional classes via logical CSS props
- Wired PDP route page with `slug={product.slug}`, Suspense boundary wrapping PDPGallery with PDPGallerySkeleton as fallback

## Viewport Breakpoint Behavior

| Viewport | Layout |
|----------|--------|
| Mobile (< md) | Single horizontal scroll-snap row; full-width cells; dots below; scrollbar hidden |
| Desktop (≥ md) | Two-column: 80px thumb strip (inline-start) + main stack (inline-end); dots hidden |

## IntersectionObserver Threshold Tuning

- Thresholds: `[0.25, 0.5, 0.75]` — fires on each crossing boundary
- Active dot: requires `intersectionRatio > 0.5` to set — prevents premature switching when cell is only partially scrolled into view
- Observer disconnects and re-creates when `visibleImages.length` changes

## Reduced-Motion Handling

- `useReducedMotion()` from `motion/react` (same pattern as `PageTransition.tsx`)
- Thumb-click and dot-click both call `scrollToIndex()`
- `scrollIntoView({ behavior: shouldReduceMotion ? 'auto' : 'smooth' })` — instant snap under reduced motion

## RTL-via-Logical-Props Confirmation

- `md:grid-cols-[80px_1fr]` — thumb strip occupies inline-start (auto-flips in RTL)
- No `left-`/`right-` directional classes — confirmed by `grep -nE "\b(left|right)-[0-9]"` returning empty
- Mobile scroll-snap container inherits RTL scroll direction from document `[dir=rtl]` natively

## PDP Page Wiring

- Added `Suspense` import from 'react'
- Added `PDPGallerySkeleton` import from `@/components/pdp/PDPGallerySkeleton`
- Wrapped `<PDPGallery>` in `<Suspense fallback={<PDPGallerySkeleton />}>`
- Passed `slug={product.slug}` — enables deterministic placeholder variant from Plan 11-06

## Task Commits

1. **Task 1: Create PDPGallerySkeleton** — `6467066` (feat)
2. **Task 2: Rewrite PDPGallery** — `4cba52d` (feat)
3. **Task 3: Wire PDP page** — `dda469c` (feat)

## Files Created/Modified

- `src/components/pdp/PDPGallerySkeleton.tsx` — Static 4:5 hero shell + 3 thumb shells at 3:4, bg-white/[0.03], role=status
- `src/components/pdp/PDPGallery.tsx` — Client Component with thumb strip (desktop) + scroll-snap carousel + IntersectionObserver dots (mobile)
- `src/app/[locale]/shop/[category]/[slug]/page.tsx` — Suspense boundary + slug prop wiring

## Decisions Made

- Desktop thumb strip is non-sticky this phase (sticky deferred to live-dev if time permits per plan spec)
- IntersectionObserver threshold 0.5 chosen as active-dot threshold — balances responsiveness vs. edge flicker
- Suspense boundary added defensively even though PDP data is server-fetched synchronously — Plan 11-16 will test with artificial delay
- TypeScript BestEntry type alias pattern applied to resolve TS2339 narrowing bug in forEach callback

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TS2339 TypeScript narrowing error on mutable `best` variable**
- **Found during:** Task 2 (PDPGallery rewrite)
- **Issue:** TypeScript narrowed the `best` variable to `never` inside the `forEach` callback because it's a mutable `let` — `best.ratio` and `best.index` were not accessible
- **Fix:** Added explicit `type BestEntry = { index: number; ratio: number }` type alias, cast the assignment with `as BestEntry`, and resolved via a separate `const resolved = best as BestEntry | null` before the conditional
- **Files modified:** src/components/pdp/PDPGallery.tsx
- **Verification:** `npx tsc --noEmit` exits 0
- **Committed in:** `4cba52d` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — TypeScript narrowing bug)
**Impact on plan:** Required for type-correct compilation. No scope creep, no behavior change.

## Issues Encountered

None beyond the TypeScript narrowing fix above.

## Known Stubs

None — PDPGallery is fully wired. `slug` is passed from `product.slug` (not a route param fallback). Skeleton ships and is bound to the Suspense boundary. Plan 11-16 will do live verification.

## Threat Flags

None — no network endpoints, auth paths, or schema changes. Pure client-side UI rendering with IntersectionObserver (browser API only).

## Self-Check

- [x] `src/components/pdp/PDPGallerySkeleton.tsx` exists
- [x] `bg-white/[0.03]` appears 3× in skeleton (thumb × 3 loop + main hero)
- [x] `aspectRatio: '4 / 5'` present in skeleton (1×)
- [x] `aspectRatio: '3 / 4'` present in skeleton (1×)
- [x] No `animate-` classes in skeleton
- [x] `'use client'` in PDPGallery (1×)
- [x] `useReducedMotion` in PDPGallery (2×)
- [x] `IntersectionObserver` in PDPGallery (2×)
- [x] `snap-x snap-mandatory` in PDPGallery (1×)
- [x] `snap-center` in PDPGallery (1×)
- [x] No `left-`/`right-` directional classes in PDPGallery
- [x] `focus-visible:ring-offset-black` in PDPGallery (2×)
- [x] `aria-label` in PDPGallery (5×)
- [x] `variant={variant}` in PDPGallery (2×)
- [x] `PDPGallerySkeleton` in PDP route page (2×)
- [x] `slug={` in PDP route page (1×)
- [x] `Suspense` in PDP route page (3×)
- [x] Commits 6467066, 4cba52d, dda469c exist on main
- [x] `npx tsc --noEmit` exits 0
- [x] `npm run lint` exits 0
- [x] `npm run build` exits 0

## Self-Check: PASSED

---
*Phase: 11-storefront-ui-ux-polish-en*
*Completed: 2026-05-17*
