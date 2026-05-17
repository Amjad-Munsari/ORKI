---
phase: 11-storefront-ui-ux-polish-en
plan: "01"
subsystem: ui
tags: [design-tokens, css-variables, typography, tailwind, display-scale]

# Dependency graph
requires:
  - phase: globals.css ORKI color tokens
    provides: --color-placeholder-bg, --color-secondary-surface already defined

provides:
  - display-1..display-4 fluid utility classes in @layer utilities
  - --container-max: 1440px token in @theme inline
  - Storefront pages unified to max-w-[var(--container-max)]
  - Near-black hex literals collapsed to CSS vars on home/about/contact/footer pages

affects:
  - 11-02 through 11-15 (all consume --container-max and display-N utilities)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Display scale via @layer utilities + CSS clamp() — fluid from min to max, no breakpoint JS"
    - "Container width via --container-max CSS var — single-token control across all storefront pages"
    - "Near-black palette: #0A0A0A (editorial fields) → --color-placeholder-bg; #111111 (chrome) → --color-secondary-surface"

key-files:
  created: []
  modified:
    - src/app/globals.css
    - src/app/[locale]/page.tsx
    - src/app/[locale]/about/page.tsx
    - src/app/[locale]/contact/ContactClient.tsx
    - src/components/footer/Footer.tsx
    - src/app/[locale]/shop/page.tsx
    - src/app/[locale]/shop/[category]/page.tsx
    - src/app/[locale]/shop/[category]/[slug]/page.tsx

key-decisions:
  - "display-4 chosen for home hero H1 (44..90px clamp) and brand-ethos H3 — both map to the old text-[90px]/text-7xl range"
  - "display-2 for About header (56..120px) — replaces md:text-[120px]"
  - "display-3 for Contact header (48..100px) — replaces md:text-[100px]"
  - "display-1 for Footer wordmark (64..160px) — replaces md:text-[160px]; letter-spacing now lives in .display-1 so tracking-[-0.05em] dropped"
  - "Container width chosen: 1440px (home/footer already used this; shop/about/contact/category/PDP pages bumped from 1280px)"
  - "Canonical near-black: #0A0A0A for editorial/placeholder fields (--color-placeholder-bg); #111111 for chrome/surface (--color-secondary-surface)"
  - "checkout/page.tsx max-w-[1280px] NOT changed — Checkout is explicitly out of Phase 11 scope per CONTEXT.md"

patterns-established:
  - "display-N: reusable fluid utility — all hero/display text must use display-1..4, never bespoke text-[Npx]"
  - "max-w-[var(--container-max)]: all storefront page wrappers use this token, not hardcoded pixel values"
  - "bg-[var(--color-placeholder-bg)] for editorial near-black frames; bg-[var(--color-secondary-surface)] for dark chrome backgrounds"

requirements-completed: [SC-1, SC-6]

# Metrics
duration: 15min
completed: 2026-05-17
---

# Phase 11 Plan 01: Design Token Foundation Summary

**Fluid display-size scale (display-1..4 via clamp) + --container-max:1440px token + near-black hex collapse to CSS vars across all storefront pages.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-05-17T00:00:00Z
- **Completed:** 2026-05-17T00:15:00Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Defined 4 fluid display-size utilities in `@layer utilities` (display-1..display-4, all using `clamp()`) replacing 5 different bespoke `text-[Npx]` literals across the storefront
- Added `--container-max: 1440px` to `@theme inline` — single source of truth for all storefront page wrappers
- Applied `max-w-[var(--container-max)]` to 7 storefront page files (home, about, contact, footer, shop, category, PDP); checkout intentionally excluded (out of scope)
- Collapsed all near-black hex literals (`#0a0a0a`, `#0d0d0d`, `#050505`) to `bg-[var(--color-placeholder-bg)]` or `bg-[var(--color-secondary-surface)]` on home and about pages

## Task Commits

1. **Task 1: Define display-scale utilities + container-max token in globals.css** - `94fddc9` (feat)
2. **Task 2: Apply display utilities + container token to home/about/contact/footer** - `ccf67c3` (feat)

## Files Created/Modified

- `src/app/globals.css` — Added display-1..display-4 to @layer utilities; --container-max to @theme inline
- `src/app/[locale]/page.tsx` — display-4 hero H1 + ethos H3; 3x container-max; 3x CSS-var near-blacks
- `src/app/[locale]/about/page.tsx` — display-2 header; container-max; 2x CSS-var near-blacks
- `src/app/[locale]/contact/ContactClient.tsx` — display-3 header; container-max
- `src/components/footer/Footer.tsx` — display-1 wordmark; container-max
- `src/app/[locale]/shop/page.tsx` — container-max
- `src/app/[locale]/shop/[category]/page.tsx` — container-max (deviation: not in plan files_modified but required for 0-match acceptance criteria)
- `src/app/[locale]/shop/[category]/[slug]/page.tsx` — container-max (deviation: same reason)

## Decisions Made

- Container: 1440px (home + footer already used this; widened shop/about/contact/category/PDP from 1280px)
- Canonical near-black: `#0A0A0A` → `--color-placeholder-bg` for editorial placeholder frames; `#111111` → `--color-secondary-surface` for UI chrome
- `display-4` serves double duty on home (hero H1 and brand-ethos H3) since both targeted the ~72–90px range
- `display-1` absorbs all footer wordmark tracking/leading — removed the inline `tracking-[-0.05em] leading-none` since `.display-1` now owns those

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Extended container-max to category and PDP page files**
- **Found during:** Task 2 verification
- **Issue:** Acceptance criteria required `grep -rn "max-w-\[1280px\]\|max-w-\[1440px\]" src/app src/components` to return 0 matches. `shop/[category]/page.tsx` and `shop/[category]/[slug]/page.tsx` still used `max-w-[1280px]` but were not listed in the plan's `files_modified`.
- **Fix:** Applied `max-w-[var(--container-max)]` to both files. `checkout/page.tsx` retained its `max-w-[1280px]` since checkout is explicitly out of Phase 11 scope.
- **Files modified:** `src/app/[locale]/shop/[category]/page.tsx`, `src/app/[locale]/shop/[category]/[slug]/page.tsx`
- **Verification:** `grep -rn "max-w-\[1280px\]\|max-w-\[1440px\]" src/app src/components` returns 1 match (checkout only)
- **Committed in:** `ccf67c3` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 2 — missing container token on storefront pages)
**Impact on plan:** Essential for meeting the plan's own 0-match acceptance criterion. No scope creep — category and PDP are storefront pages within Phase 11 scope.

## Issues Encountered

None — all replacements applied cleanly. TypeScript (`npx tsc --noEmit`) and ESLint (`npm run lint`) both exit 0.

## Verification Grep Results

```
grep -E "^\s*\.display-[1-4]\s*\{" src/app/globals.css → 4 matches (one per class)
grep "container-max:" src/app/globals.css              → 1 match (1440px)
grep -c "clamp(" src/app/globals.css                   → 4 matches
grep -c "max-w-\[var(--container-max)\]" src/app/[locale]/page.tsx → 3 matches
grep -rn "max-w-\[1280px\]\|max-w-\[1440px\]" src/app src/components → 1 match (checkout, out of scope)
near-black hex literals in page.tsx + about/page.tsx   → 0 matches
CSS var near-black usage (placeholder-bg + secondary-surface) → 5 matches combined
npx tsc --noEmit                                        → exit 0
npm run lint                                            → exit 0
```

## Known Stubs

None — this plan is purely token/class definitions and find-replace. No data wired, no UI components with placeholder data.

## Threat Flags

None — CSS token definitions and class name replacements introduce no new security surface.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- display-1..display-4 utilities are live in globals.css — all subsequent plans (11-02+) can use them immediately
- --container-max token is live — all storefront containers are unified at 1440px
- Near-black hex literals on home/about/contact/footer are collapsed — PlaceholderImage.tsx:48 is intentionally deferred to Plan 11-06

---
*Phase: 11-storefront-ui-ux-polish-en*
*Completed: 2026-05-17*
