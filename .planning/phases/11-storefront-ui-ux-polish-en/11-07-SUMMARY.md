---
phase: 11-storefront-ui-ux-polish-en
plan: "07"
subsystem: ui
tags: [home, category-splat, scroll-reveal, grid-scale, rtl-flip, typography, focus-ring]

# Dependency graph
requires:
  - phase: 11-01
    provides: display-1..4 utilities, --container-max token, --color-placeholder-bg token
  - phase: 11-03
    provides: focus-visible ring canonical pattern
  - phase: 11-06
    provides: placeholder variant system context
provides:
  - Home page typographic-only category splat (D-03) closing F-Vis-2
  - Featured-Drops + ProductGrid unified grid scale (F-Space-1)
  - ScrollReveal stagger capped at (idx % 4) * 0.08 (F-Exp-4)
  - Brand-ethos em-dash replaced by rtl-flip ArrowRight icon (F-Exp-7)
  - CategoryCard focus-visible ring
affects:
  - 11-16 (visual verification at multiple viewports + RTL)
  - 11-14 (brand-ethos copy UAT — heading text untouched here)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "D-03: Typographic-only category splat — category name as massive 22vw aria-hidden wordmark on near-black field"
    - "Stagger cap: (idx % 4) * 0.08 — prevents cumulative delay waterfall beyond 4-card cycle"
    - ".rtl-flip utility on ArrowRight for direction-aware icon without JS"

key-files:
  created: []
  modified:
    - src/app/[locale]/page.tsx
    - src/components/shop/ProductGrid.tsx

key-decisions:
  - "ScrollReveal has no duration prop — tamed only via stagger cap; duration stays at 0.8s from primitive"
  - "CategoryCard bg-[var(--color-placeholder-bg)] — uses design token instead of bespoke #0d0d0d"
  - "22vw fontSize for wordmark fills each half-viewport splat panel at 50% page width"

patterns-established:
  - "Category splat = typographic-only: giant aria-hidden wordmark + readable H3 foreground (no real image dependency)"
  - "Grid canonical token: grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16 shared across Home + Shop"

requirements-completed: [SC-1, SC-5, SC-6]

# Metrics
duration: 18min
completed: 2026-05-17
---

# Phase 11 Plan 07: Home Page Editorial Polish Summary

**Typographic-only category splat (22vw kerned wordmark), unified Featured-Drops + ProductGrid grid scale, capped stagger, and rtl-flip ArrowRight replacing the em-dash trail**

## Performance

- **Duration:** 18 min
- **Started:** 2026-05-17T00:00:00Z
- **Completed:** 2026-05-17T00:18:00Z
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments

- F-Vis-2 closed: CategoryCard typographic-only treatment — 22vw kerned wordmark fills each splat panel on near-black field; `bg-white/10` overlay wash and ORKI background wordmark removed entirely
- F-Space-1 closed: Featured-Drops grid unified with ProductGrid — both now use `grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16`
- F-Exp-4 closed: ScrollReveal stagger capped at `(idx % 4) * 0.08` — 4-card repeating cycle, no cumulative waterfall
- F-Exp-7 closed: Brand-ethos "Read Our Story —" em-dash replaced by `<ArrowRight className="size-4 rtl-flip" />` with focus-visible ring

## Task Commits

Each task was committed atomically:

1. **Task 1: Inspect ScrollReveal props, unify Featured-Drops grid + tame stagger** - `c63d6f9` (feat)
2. **Task 2: Rewrite home category splat to typographic-only treatment (D-03)** - `c8f04e2` (feat)
3. **Task 3: Replace brand-ethos em-dash with rtl-flip ArrowRight icon + focus ring** - `096f8f2` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/app/[locale]/page.tsx` — Featured-Drops grid + stagger (Task 1), CategoryCard rewrite (Task 2), brand-ethos link (Task 3)
- `src/components/shop/ProductGrid.tsx` — gap-4 md:gap-6 → gap-x-8 gap-y-16 (Task 1)

## ScrollReveal Props Snapshot

`ScrollReveal` accepts: `children`, `delay?: number`, `direction?: 'up'|'down'|'left'|'right'|'none'`, `className?: string`.

**No `duration` prop exists.** Duration is hardcoded at `0.8s` inside the primitive's `variants.visible.transition`. Stagger taming was achieved purely via the `(idx % 4) * 0.08` cap — not via duration shortening. Documented in plan output as agreed fallback.

## CategoryCard Before/After Diff

**Before:**
- Background: `bg-[var(--color-secondary-surface)]` with `ORKI` wordmark at `opacity 0.05`
- Overlay: `bg-white/10 group-hover:bg-transparent` wash
- No focus ring on the Link

**After:**
- Background: `bg-[var(--color-placeholder-bg)]` (design token, no overlay)
- Wordmark: category title (`Tops`/`Bottoms`/Arabic) at `fontSize: '22vw'`, `color: rgba(255,255,255,0.08)`, `tracking-[-0.04em]`, `aria-hidden="true"`
- Hover: `group-hover:scale-[1.03]` on the wordmark layer (subtle, 1000ms)
- Focus ring: `focus-visible:ring-1 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black`
- `ORKI` wordmark appears 0 times in CategoryCard (only in hero section's `aria-hidden` span)

## Grep Verification Results

```
grep -c "grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16" page.tsx → 1 ✓
grep -c "grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16" ProductGrid.tsx → 1 ✓
grep -c "delay={(idx % 4) * 0.08}" page.tsx → 1 ✓
grep -c "delay={idx * 0.1}" page.tsx → 0 ✓ (uncapped form gone)
grep -c "bg-white/10" page.tsx → 0 ✓
grep -c "fontSize: '22vw'" page.tsx → 1 ✓
grep -c "bg-[var(--color-placeholder-bg)]" page.tsx → 3 ✓ (>=2)
grep -c "ORKI" page.tsx → 1 ✓ (hero only)
grep -c "rtl-flip" page.tsx → 1 ✓
grep -c "Read Our Story.*—" page.tsx → 0 ✓
grep -c "focus-visible:ring-offset-black" page.tsx → 2 ✓ (CategoryCard + brand-ethos)
npx tsc --noEmit → exit 0 ✓
npm run lint → exit 0 ✓
```

## Decisions Made

- ScrollReveal primitive has no `duration` prop — tamed stagger via cap only; primitive duration at 0.8s unchanged. This is acceptable; the 4-card repeating cycle (max 0.24s delay) eliminates the perceived waterfall.
- `22vw` fontSize chosen for wordmark — fills approximately one half of viewport (each splat panel is ~50vw on desktop) with the category name when combined with the `tracking-[-0.04em]` compression.
- CategoryCard `bg-[var(--color-placeholder-bg)]` aligns with D-03 near-black field; matches hero section token.
- Brand-ethos heading copy NOT touched (D-07 deferred to Plan 11-14 for UAT candidate selection).

## Deviations from Plan

None — plan executed exactly as written. The ScrollReveal `duration` fallback (stagger-only taming) was pre-documented in the plan as an acceptable alternative.

## Issues Encountered

None. All grep counts matched on first attempt. TypeScript and lint both clean.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- F-Vis-2, F-Space-1, F-Exp-4, F-Exp-7 are closed
- Plan 11-16 will verify visually at 1440px, 1280px, 768px, 375px viewports + RTL mirror
- Plan 11-14 will surface 3 brand-ethos heading candidates in messages/en.json for UAT selection (D-07)
- CategoryCard focus-visible ring in place — ready for Plan 11-03 ring audit sweep

---
*Phase: 11-storefront-ui-ux-polish-en*
*Completed: 2026-05-17*
