---
phase: 11-storefront-ui-ux-polish-en
plan: "04"
subsystem: ui
tags: [dark-mode, navbar, brand-chrome, tailwind, next-intl]

# Dependency graph
requires:
  - phase: 11-03
    provides: focus-visible ring tokens on Navbar/LanguageSwitcher/MobileNavDrawer/ShopDropdown/CartTrigger
  - phase: 11-02
    provides: ShopDropdown start-0 logical prop fix
provides:
  - Dark-first Navbar chrome (bg-black/80 backdrop-blur text-white border-white/[0.08])
  - LanguageSwitcher white-tinted text (text-white/60 hover:text-white)
  - MobileNavDrawer trigger white-tinted icon (text-white)
  - ShopDropdown panel chrome matching CategoryDropdown (bg-[var(--color-secondary-surface)] border-white/[0.12])
  - Search icon + import completely removed from DOM
affects: [11-16-visual-verification, any plan touching Navbar chrome or ShopDropdown]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Dark chrome cascade: parent bg-black/80 + text-white; children inherit via currentColor"
    - "ShopDropdown panel now mirrors CategoryDropdown: bg-[var(--color-secondary-surface)] border-white/[0.12] hover:bg-white/5"

key-files:
  created: []
  modified:
    - src/components/nav/Navbar.tsx
    - src/components/nav/LanguageSwitcher.tsx
    - src/components/nav/MobileNavDrawer.tsx
    - src/components/nav/ShopDropdown.tsx

key-decisions:
  - "Removed Search import (lucide-react) entirely from Navbar — no partial removal, no hidden element; the DOM is clean"
  - "ShopDropdown item links get explicit text-white (not relying on inheritance) to ensure contrast on the dark panel"
  - "CategoryDropdown uses bare #111111 hex; ShopDropdown uses var(--color-secondary-surface) — same value, token-first approach per plan spec"

patterns-established:
  - "Dark Navbar chrome pattern: bg-black/80 backdrop-blur text-white border-white/[0.08] — use for any fixed dark top chrome"
  - "Dark dropdown panel pattern: bg-[var(--color-secondary-surface)] border-white/[0.12] py-2 — use for any dark floating menu"

requirements-completed: [SC-3, SC-6]

# Metrics
duration: 12min
completed: 2026-05-17
---

# Phase 11 Plan 04: Dark Navbar Chrome + ShopDropdown Panel Summary

**Navbar flipped to dark-first chrome (bg-black/80 backdrop-blur), search icon removed from DOM, LanguageSwitcher/MobileNavDrawer trigger tokens updated to white, and ShopDropdown panel surface unified with CategoryDropdown's dark chrome**

## Performance

- **Duration:** 12 min
- **Started:** 2026-05-17T00:00:00Z
- **Completed:** 2026-05-17T00:12:00Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Navbar header chrome flipped from white-on-black to dark-first: `bg-black/80 backdrop-blur text-white border-b border-white/[0.08]`
- Search icon button and `Search` import from lucide-react removed entirely — zero DOM presence, zero dead import
- LanguageSwitcher text tokens updated: `text-black/60 hover:text-black` → `text-white/60 hover:text-white`
- MobileNavDrawer SheetTrigger render button updated: `text-black` → `text-white` (hamburger/X icons inherit via currentColor)
- ShopDropdown panel: `bg-white border-black/5` → `bg-[var(--color-secondary-surface)] border-white/[0.12]`; item hover: `hover:bg-black/5` → `hover:bg-white/5`; item text: added explicit `text-white`
- All focus-visible rings from Plan 11-03 preserved on every touched file (ring-white ring-offset-black)

## Task Commits

Each task was committed atomically:

1. **Task 1: Flip Navbar chrome dark + remove search button** - `4da457f` (feat)
2. **Task 2: Cascade dark tokens to LanguageSwitcher + MobileNavDrawer trigger** - `85dcb3a` (feat)
3. **Task 3: Flip ShopDropdown panel to dark, mirror CategoryDropdown** - `7658548` (feat)

## Files Created/Modified

- `src/components/nav/Navbar.tsx` — Dark header chrome, `Search` import removed, search button block removed
- `src/components/nav/LanguageSwitcher.tsx` — Button text tokens updated to white-tinted
- `src/components/nav/MobileNavDrawer.tsx` — SheetTrigger render button text-black → text-white
- `src/components/nav/ShopDropdown.tsx` — Panel surface and item hover states flipped to dark

## Decisions Made

- Removed `Search` import entirely rather than leaving a dead import — clean file, no lint warnings.
- Added explicit `text-white` to ShopDropdown item Links rather than relying on cascade inheritance — makes intent clear and prevents accidental reversion if the panel surface changes again.
- Used `bg-[var(--color-secondary-surface)]` (CSS var) on ShopDropdown while CategoryDropdown still uses bare `#111111` hex — both resolve to the same value; var-first approach on ShopDropdown aligns with the token collapse plan (11-01).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- F-Color-1 closed: Navbar dark chrome renders correctly
- F-Color-2 closed: ShopDropdown panel matches CategoryDropdown chrome
- F-Vis-4 closed: Search icon + import fully removed
- Plan 11-16 (visual verification) can now confirm dark Navbar at every viewport and Tab traversal order
- All focus rings from 11-03 confirmed preserved on Navbar, LanguageSwitcher, MobileNavDrawer, and ShopDropdown items

---
*Phase: 11-storefront-ui-ux-polish-en*
*Completed: 2026-05-17*
