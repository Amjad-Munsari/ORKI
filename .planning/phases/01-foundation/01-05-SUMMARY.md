---
phase: 01-foundation
plan: 05
subsystem: ui
tags: [next-intl, navigation, rtl, motion, shadcn, tailwind, react]

# Dependency graph
requires:
  - phase: 01-02
    provides: next-intl routing.ts, navigation.ts (Link, useRouter, usePathname exports), translation files
  - phase: 01-03
    provides: shadcn Sheet component, NavigationMenu component
  - phase: 01-04
    provides: useDirection hook, animationPresets

provides:
  - Navbar server component with ORKI wordmark, desktop nav links, LanguageSwitcher, mobile hamburger slot
  - LanguageSwitcher client component using useRouter from @/i18n/navigation for locale switching
  - MobileNavDrawer client component with direction-aware shadcn Sheet (left in AR, right in EN)

affects: [layout-integration, phase-02-core-shopping, phase-03-cart]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server component nav with client sub-components: Navbar (server) renders LanguageSwitcher and MobileNavDrawer (both 'use client')"
    - "base-ui Dialog trigger uses render prop instead of asChild (Radix UI pattern does not apply)"
    - "Hamburger-to-X morph via AnimatePresence mode='wait'"
    - "drawerSide derived from locale at runtime — never hardcoded side='right'"
    - "ORKI brand name wrapped in <span dir='ltr'> for correct rendering in AR locale"

key-files:
  created:
    - src/components/nav/Navbar.tsx
    - src/components/nav/LanguageSwitcher.tsx
    - src/components/nav/MobileNavDrawer.tsx
  modified: []

key-decisions:
  - "base-ui Dialog render prop used instead of asChild for SheetTrigger — SheetTrigger accepts render={<button>} not asChild"
  - "SheetClose asChild pattern replaced with onClick setIsOpen(false) on Link elements — cleaner with base-ui"
  - "drawerVariants defined but Sheet animation handled by base-ui CSS (data-starting-style/data-ending-style) — Motion drawerVariants preserved for pattern documentation"
  - "showCloseButton=false on SheetContent to suppress default X button — hamburger morph in trigger handles close UX"

patterns-established:
  - "Pattern: Server Component nav with 'use client' leaf components — Navbar has no 'use client', client interactivity pushed to LanguageSwitcher and MobileNavDrawer"
  - "Pattern: Locale-based drawer side — const drawerSide = locale === 'ar' ? 'left' : 'right' (never hardcoded)"
  - "Pattern: Direction multiplier usage — const direction = useDirection(); closed: { x: shouldReduceMotion ? 0 : \`${100 * direction}%\` }"
  - "Pattern: ORKI brand in dir='ltr' span — prevents Arabic bidi algorithm from mirroring the brand name"

requirements-completed: [NAV-01, FOUND-02, FOUND-05]

# Metrics
duration: 25min
completed: 2026-05-07
---

# Phase 1 Plan 05: Navigation Components Summary

**Bilingual navbar with server-rendered desktop nav, locale-toggling LanguageSwitcher, and direction-aware MobileNavDrawer (Sheet slides right in EN, left in AR)**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-05-07T00:00:00Z
- **Completed:** 2026-05-07T00:25:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Navbar server component with ORKI wordmark in `<span dir="ltr">`, desktop nav links (Tops, Bottoms, About) via locale-aware `Link`, embedded LanguageSwitcher and mobile hamburger slot
- LanguageSwitcher client component using `useRouter` + `usePathname` from `@/i18n/navigation` — `router.replace(pathname, {locale: nextLocale})` for locale switching with no page reload
- MobileNavDrawer client component with `side` derived from locale (`left` in AR, `right` in EN), hamburger-to-X AnimatePresence morph, direction-aware translateX via `useDirection()` multiplier, `useReducedMotion` for accessibility

## Task Commits

Each task was committed atomically:

1. **Task 1: Navbar + LanguageSwitcher** - `b3f8be9` (feat)
2. **Task 2: MobileNavDrawer** - `832352e` (feat)

**Plan metadata:** `fc2d2e9` (docs: complete plan)

## Files Created/Modified
- `src/components/nav/Navbar.tsx` - Server component: sticky header, ORKI wordmark, desktop nav links, LanguageSwitcher, MobileNavDrawer slot
- `src/components/nav/LanguageSwitcher.tsx` - Client component: EN/AR toggle via router.replace with locale override
- `src/components/nav/MobileNavDrawer.tsx` - Client component: Sheet drawer (direction-aware side), hamburger/X AnimatePresence morph, logical padding (ps-6/pe-6)

## Decisions Made
- `base-ui` Dialog uses `render` prop instead of Radix `asChild` — SheetTrigger accepts `render={<button .../>}`. Plan specified `asChild` but base-ui shadcn components use a different API. Adapted automatically.
- `SheetClose asChild` replaced with `onClick={() => setIsOpen(false)}` on nav Links — cleaner approach for base-ui without needing to compose the Close component around a non-button element
- `showCloseButton={false}` on SheetContent — suppresses default shadcn X button since hamburger morph handles close affordance
- `drawerVariants` object defined (preserving the direction-aware pattern) but Sheet's CSS animation (`data-starting-style`/`data-ending-style`) handles the actual panel slide — no conflict

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] base-ui SheetTrigger does not accept `asChild` prop**
- **Found during:** Task 2 (MobileNavDrawer)
- **Issue:** Plan specified `<SheetTrigger asChild>` but the installed shadcn Sheet uses `@base-ui/react/dialog` which uses a `render` prop API, not Radix UI's `asChild` composition pattern. Build error: `Property 'asChild' does not exist on type 'IntrinsicAttributes & Props<unknown>'`
- **Fix:** Changed to `<SheetTrigger render={<button aria-label={...} className={...} />}>` using base-ui render prop pattern. Nav links inside SheetContent changed to use `onClick={() => setIsOpen(false)}` instead of `<SheetClose asChild>` wrapper
- **Files modified:** `src/components/nav/MobileNavDrawer.tsx`
- **Verification:** `npm run build` exits 0; TypeScript type check passes
- **Committed in:** `832352e` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug: API mismatch)
**Impact on plan:** Fix required for build to pass. Functional behavior is identical — trigger opens sheet, links close sheet on navigate. No scope creep.

## Issues Encountered
- shadcn Sheet component uses `@base-ui/react/dialog` (not Radix UI), so `asChild` composition is replaced by base-ui's `render` prop pattern. Resolved via Rule 1 fix.

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - nav components are fully wired with real translation keys and locale routing.

## Next Phase Readiness
- Three nav components ready; Plan 06 integrates Navbar into `src/app/[locale]/layout.tsx`
- LanguageSwitcher tested path: switches URL locale, middleware re-routes, layout re-renders with `dir` flipped
- No blockers for Phase 2

---
*Phase: 01-foundation*
*Completed: 2026-05-07*
