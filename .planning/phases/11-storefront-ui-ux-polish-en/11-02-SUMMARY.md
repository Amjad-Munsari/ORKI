---
phase: 11-storefront-ui-ux-polish-en
plan: "02"
subsystem: ui
tags: [rtl, logical-properties, tailwind, shadcn, dialog, sheet, navigation-menu]

requires:
  - phase: 11-01
    provides: design-token foundation (--container-max, display-scale utilities, near-black canonical vars)

provides:
  - Shadcn primitives (dialog, sheet, navigation-menu) ship logical-prop-only positional classes
  - ShopDropdown panel uses start-0 instead of left-0 for correct RTL alignment
  - F-Space-3 audit finding closed

affects:
  - 11-04 (Navbar dark chrome flip — inherits the ShopDropdown start-0 fix)
  - Any future AR/RTL pass — primitives are now RTL-safe at the primitive level

tech-stack:
  added: []
  patterns:
    - "Tailwind v4 logical-prop mapping: left-N → start-N, right-N → end-N, border-r → border-e, border-l → border-s"
    - "Animation transition tokens (slide-in-from-left/right) are NOT layout classes — leave untouched per scoped decision"

key-files:
  created: []
  modified:
    - src/components/ui/dialog.tsx
    - src/components/ui/sheet.tsx
    - src/components/ui/navigation-menu.tsx
    - src/components/nav/ShopDropdown.tsx

key-decisions:
  - "Animation slide-in-from-left / slide-in-from-right / slide-out-to-left / slide-out-to-right tokens in shadcn className strings are transition animation names, not layout positioning — left untouched per plan scope decision (F-Space-3 targets positional leaks only)"
  - "sheet.tsx data-[side=left]/data-[side=right] borders converted to logical border-e/border-s alongside start-0/end-0 anchors — RTL-correct: a physically-left panel keeps border-e (inline-end = right in LTR, left in RTL)"
  - "navigation-menu.tsx before:right-0 before:left-0 converted to before:end-0 before:start-0 — pseudo-element hover-zone spans full width in both directions"

patterns-established:
  - "Fix physical-direction leaks at the shadcn primitive level once — call sites inherit without changes"

requirements-completed: [SC-1, SC-6]

duration: 12min
completed: "2026-05-17"
---

# Phase 11 Plan 02: RTL Logical-Props Sweep (shadcn Primitives + ShopDropdown) Summary

**Physical-direction Tailwind classes replaced with logical equivalents across dialog, sheet, navigation-menu, and ShopDropdown — closes audit finding F-Space-3 with zero TS/lint/build errors.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-05-17T12:20:00Z
- **Completed:** 2026-05-17T12:32:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Swept all four files for `left-N`, `right-N`, `ml-N`, `mr-N`, `pl-N`, `pr-N` positional classes and replaced with logical Tailwind v4 equivalents
- ShopDropdown panel now aligns to `start-0` — correct in both LTR (EN) and RTL (AR) without additional overrides
- Animation transition tokens (`slide-in-from-left`, `slide-in-from-right`, etc.) deliberately preserved — they are state-machine animation names, not layout

## Class Replacements Made

### `src/components/ui/dialog.tsx`

| Line | Before | After |
|------|--------|-------|
| 56 | `left-1/2` | `start-1/2` |
| 68 | `right-2` | `end-2` |

### `src/components/ui/sheet.tsx`

| Line | Before | After |
|------|--------|-------|
| 56 | `data-[side=left]:left-0` | `data-[side=left]:start-0` |
| 56 | `data-[side=left]:border-r` | `data-[side=left]:border-e` |
| 56 | `data-[side=right]:right-0` | `data-[side=right]:end-0` |
| 56 | `data-[side=right]:border-l` | `data-[side=right]:border-s` |
| 68 | `right-3` | `end-3` |

### `src/components/ui/navigation-menu.tsx`

| Line | Before | After |
|------|--------|-------|
| 111 | `data-[side=bottom]:before:right-0` | `data-[side=bottom]:before:end-0` |
| 111 | `data-[side=bottom]:before:left-0` | `data-[side=bottom]:before:start-0` |

### `src/components/nav/ShopDropdown.tsx`

| Line | Before | After |
|------|--------|-------|
| 50 | `left-0` | `start-0` |

## Task Commits

1. **Task 1: Sweep shadcn primitives** - `8b1e495` (fix)
2. **Task 2: Fix ShopDropdown panel positioning** - `b873c69` (fix)

## Verification Results

```
# Physical-direction grep (must be 0 — excluding animation tokens)
grep -nE "\b(left|right|ml|mr|pl|pr)-[0-9]" dialog.tsx sheet.tsx navigation-menu.tsx \
  | grep -v "slide-in-from-\(left\|right\)"
→ 0 matches

# Logical-prop grep (must be > 0 per file)
grep -cE "\b(start|end|ms|me|ps|pe)-[0-9]" dialog.tsx sheet.tsx navigation-menu.tsx
→ dialog.tsx:2  sheet.tsx:2  navigation-menu.tsx:2

# ShopDropdown left-0 check
grep -nE "\bleft-0\b" ShopDropdown.tsx → 0 matches
grep -n "start-0" ShopDropdown.tsx → line 50: start-0 present

# Type check
npx tsc --noEmit → exit 0

# Lint
npm run lint → exit 0 (no warnings)

# Build
npm run build → ✓ Compiled successfully, 46 static pages generated
```

## Scope Decision: Animation Tokens Untouched

The plan explicitly excludes `slide-in-from-left`, `slide-in-from-right`, `slide-out-to-left`, `slide-out-to-right` from the sweep. These appear in `NavigationMenuContent` className strings as animation state identifiers (paired with `data-[motion=from-start]` / `data-[motion=from-end]` selectors) — they are not positional layout classes. They do not produce `left:` or `right:` CSS rules. A future audit may revisit whether these animation directions should be swapped in RTL, but that is out of scope for F-Space-3 (positional layout leaks only).

## Decisions Made

- Animation slide-in/slide-out directional tokens preserved — they are transitions, not layout (scoped per plan)
- `border-r` / `border-l` on sheet side panels converted to `border-e` / `border-s` alongside the anchor conversions — RTL semantics are preserved: a left-side sheet's separator border remains on its inline-end side in any writing mode

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- F-Space-3 closed; shadcn primitives are RTL-safe at the primitive level
- Plan 11-04 (Navbar dark chrome flip) can inherit ShopDropdown's `start-0` fix without conflict
- All four files build clean — zero TS/lint/build errors introduced

---
*Phase: 11-storefront-ui-ux-polish-en*
*Completed: 2026-05-17*
