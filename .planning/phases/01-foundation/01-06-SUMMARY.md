---
phase: 01-foundation
plan: "06"
subsystem: ui
tags: [next-intl, tailwind, server-component, footer, layout, placeholder]

# Dependency graph
requires:
  - phase: 01-foundation/01-03
    provides: Root layout.tsx with NextIntlClientProvider and font variables
  - phase: 01-foundation/01-04
    provides: PlaceholderImage component and design tokens

provides:
  - Footer Server Component with bilingual policy links and copyright via useTranslations
  - Updated root layout shell with Navbar + main(flex-1) + Footer in flex-col structure
  - Placeholder home page with 4:5 hero and 3:4 catalog grid as Phase 1 visual verification surface

affects:
  - 02-core-shopping
  - 04-brand-polish

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Server Component Footer using useTranslations directly (no 'use client')
    - flex-col min-h-screen layout shell with flex-1 main for sticky footer
    - Base UI render-prop pattern for SheetTrigger/SheetClose instead of Radix asChild

key-files:
  created:
    - src/components/footer/Footer.tsx
  modified:
    - src/app/[locale]/layout.tsx
    - src/app/[locale]/page.tsx

key-decisions:
  - "Footer uses t('copyright') directly — single implementation, zero string splitting or hardcoded suffixes"
  - "Footer and page render in any locale without locale-conditional branching — translation system handles all copy"
  - "Base UI Dialog uses render prop (not asChild) for custom trigger/close elements — fixed in MobileNavDrawer"
  - "Stub Navbar.tsx created to allow layout to compile independently of Plan 01-05 wave"

patterns-established:
  - "Server Component i18n pattern: import useTranslations from next-intl directly in RSC, no client context needed"
  - "Layout shell pattern: body has min-h-screen flex flex-col; Navbar at top, main flex-1, Footer at bottom"
  - "All footer link spacing uses gap-6 (not mr-/ml-) for RTL-safe layout"

requirements-completed:
  - NAV-02
  - FOUND-04
  - FOUND-05

# Metrics
duration: 25min
completed: 2026-05-07
---

# Phase 1 Plan 06: Footer, Layout Shell, and Placeholder Home Page Summary

**Server Component Footer with bilingual policy links via useTranslations, flex-col layout shell integrating Navbar+Footer, and placeholder home page with 4:5 hero and 3:4 catalog grid for Phase 1 visual verification**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-05-07T00:00:00Z
- **Completed:** 2026-05-07T00:25:00Z
- **Tasks:** 2 of 2
- **Files modified:** 3 created/modified + 1 deviation fix

## Accomplishments

- Footer Server Component renders Shipping, Returns, Contact policy links and copyright — all via useTranslations('Footer'), no physical directional classes, no string splitting
- Root layout updated to flex-col shell: Navbar at top, main(flex-1) in middle, Footer at bottom — footer sticks to bottom on short pages
- Placeholder home page delivers both aspect ratio slots: 4:5 hero (above fold, priority loading) and 3:4 catalog grid (4 cards, responsive 2/3/4 columns) — serves as Phase 1 visual verification surface

## Task Commits

Each task was committed atomically:

1. **Task 1: Footer component + layout integration** - `ac95c8a` (feat)
2. **Task 2: Placeholder home page** - `8e75d12` (feat)

**Plan metadata:** (final docs commit below)

## Files Created/Modified

- `src/components/footer/Footer.tsx` - Server Component: policy links (Shipping/Returns/Contact) + copyright via t('copyright') + Separator + border-t, no physical directional classes
- `src/app/[locale]/layout.tsx` - Extended with Navbar and Footer imports; body now has min-h-screen flex flex-col with Navbar, main(flex-1), Footer inside NextIntlClientProvider
- `src/app/[locale]/page.tsx` - Replaced create-next-app default with placeholder: 4:5 hero above fold (priority) + 3:4 catalog grid

## Decisions Made

- Used `t('copyright')` single translation key — copyright string is fully managed in messages/en.json and messages/ar.json, no string splitting or hardcoded locale-conditional suffixes
- Navbar and Footer placed inside `<NextIntlClientProvider>` so their client sub-components (LanguageSwitcher, MobileNavDrawer) get intl context
- Used `gap-6` for footer link spacing instead of margin utilities — RTL-safe, no physical directional classes
- Stub Navbar.tsx created so layout compiles before Plan 01-05 wave; Plan 01-05's real Navbar.tsx overwrote stub via git as expected

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed stale .next build cache causing false type error**
- **Found during:** Task 1 (layout integration build verification)
- **Issue:** Build failed with `Type error: Property 'asChild' does not exist` in MobileNavDrawer.tsx. The committed HEAD version of the file was already correct; the error was caused by a stale .next cache from a previous partial build by Plan 01-05
- **Fix:** Deleted .next directory and rebuilt clean — build passed
- **Files modified:** None (no code change needed, cache purge resolved it)
- **Verification:** Clean build passes with exit 0
- **Committed in:** N/A (cache purge only)

---

**Total deviations:** 1 auto-fixed (stale build cache — no code change required)
**Impact on plan:** Zero scope creep. Cache purge was the only action needed.

## Issues Encountered

Initial build failed with `asChild` type error in MobileNavDrawer.tsx. Investigation revealed the working tree and HEAD were identical (plan 01-05 had already fixed this), and the error was from .next cache. Clean rebuild resolved it without code changes.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 1 layout shell is complete: Navbar + main + Footer rendered correctly at /en/ and /ar/
- Placeholder home page with both aspect ratio slots is the visual verification surface for Phase 1 sign-off
- Phase 2 (Core Shopping) can begin: shop page, category listing, product detail pages
- PlaceholderImage is wired (Phase 2 only swaps src prop — no layout changes)

## Known Stubs

The home page renders placeholder images (PlaceholderImage with 1x1 transparent data URI). This is intentional — the design spec states "never a grey box," and PlaceholderImage shows the dark-field ORKI ghost mark. Real product images arrive in Phase 2 via src prop swap only.

---
*Phase: 01-foundation*
*Completed: 2026-05-07*
