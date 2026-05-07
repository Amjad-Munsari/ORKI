---
phase: 01-foundation
plan: "04"
subsystem: ui
tags: [next-image, motion, animation, rtl, placeholder, hooks, next-intl]

requires:
  - phase: 01-foundation plan 01
    provides: Next.js 15 scaffolding, Tailwind v4, ESLint with physical class ban
  - phase: 01-foundation plan 02
    provides: next-intl routing, locale context, NextIntlClientProvider, useLocale available

provides:
  - PlaceholderImage component with dark-field editorial treatment and aspect-ratio lock
  - animation-presets.ts with exact UI-SPEC easing values for Motion
  - useDirection hook returning direction multiplier (1 LTR / -1 RTL)

affects:
  - 01-foundation plan 05 (MobileNavDrawer — uses useDirection and animationPresets)
  - 01-foundation plan 06 (placeholder home page — uses PlaceholderImage)
  - All future phases that render images or animate components

tech-stack:
  added: []
  patterns:
    - "PlaceholderImage pattern: dark-field #0A0A0A bg + ghost ORKI mark at 15% opacity + next/image fill wired for Phase 2 src swap"
    - "Animation presets pattern: all Motion transitions reference animationPresets — no ad-hoc duration/easing values"
    - "useDirection pattern: direction multiplier hook for locale-aware motion translate offsets"

key-files:
  created:
    - src/components/PlaceholderImage.tsx
    - src/lib/animation-presets.ts
    - src/hooks/useDirection.ts
  modified: []

key-decisions:
  - "Data URI placeholder src (transparent 1x1 GIF) satisfies next/image non-empty src requirement in Phase 1 without rendering visible content"
  - "opacity-0 on the Image element hides the transparent data URI while the dark-field div provides the actual visual — Phase 2 removes opacity-0 when real src is wired"
  - "animationPresets typed as const with as const tuple assertions so easing arrays infer as readonly tuples, preserving exact type for Motion transition consumers"

patterns-established:
  - "PlaceholderImage: aspectRatio prop ('3/4' | '4/5') converted to CSS via .replace('/', ' / ') for aspect-ratio property"
  - "All image slots use next/image with fill inside a positioned container — never raw img tags, never explicit width/height for fill mode"
  - "Animation values: always reference animationPresets from src/lib/animation-presets.ts — no inline values"
  - "Direction-aware motion: useDirection() hook returns 1|−1 multiplier, used as: x: \`\${100 * direction}%\`"

requirements-completed:
  - FOUND-04
  - FOUND-05

duration: 4min
completed: "2026-05-07"
---

# Phase 1, Plan 04: Shared UI Primitives Summary

**Dark-field PlaceholderImage with aspect-ratio lock, Motion animation presets matching UI-SPEC exactly, and locale-aware useDirection hook for RTL-correct nav animations**

## Performance

- **Duration:** 4 min
- **Started:** 2026-05-07T06:50:53Z
- **Completed:** 2026-05-07T06:54:20Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- PlaceholderImage renders dark editorial treatment (#0A0A0A, ORKI ghost at 15% opacity) — next/image with fill wired for zero-change Phase 2 src swap
- animation-presets.ts exports exact UI-SPEC values (navEnter 200ms, navExit 160ms, fadeIn 200ms, fadeOut 150ms with cubic-bezier easing)
- useDirection hook returns 1 (LTR) or -1 (RTL) via useLocale(), ready for MobileNavDrawer direction-aware translateX

## Task Commits

Each task was committed atomically:

1. **Task 1: Create PlaceholderImage component** - `13e8e43` (feat)
2. **Task 2: Create animation-presets.ts and useDirection hook** - `1ed90e4` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `src/components/PlaceholderImage.tsx` — Dark-field editorial placeholder; aspectRatio prop, next/image fill, priority forwarded, ghost ORKI mark
- `src/lib/animation-presets.ts` — Motion animation preset config; navEnter/navExit/fadeIn/fadeOut with exact UI-SPEC durations and easing arrays
- `src/hooks/useDirection.ts` — Direction multiplier hook; returns 1 for EN/LTR, -1 for AR/RTL using useLocale()

## Decisions Made

- Transparent 1×1 GIF data URI used as next/image placeholder src in Phase 1 (satisfies non-empty src requirement without rendering visible content)
- `opacity-0` on the Image element during Phase 1 — the dark-field div provides the visual; Phase 2 removes `opacity-0` when real product image src is wired
- `as const` on easing arrays in animationPresets so TypeScript infers readonly tuples rather than `number[]`, preserving exact Motion transition type compatibility

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Plan 05 (MobileNavDrawer) can import `useDirection` from `@/hooks/useDirection` and `animationPresets` from `@/lib/animation-presets`
- Plan 06 (placeholder home page) can import `PlaceholderImage` from `@/components/PlaceholderImage`
- All three primitives pass `npm run lint && npm run build` — no blockers

---
*Phase: 01-foundation*
*Completed: 2026-05-07*
