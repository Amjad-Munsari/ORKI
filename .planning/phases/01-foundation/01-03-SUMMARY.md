---
phase: 01-foundation
plan: 03
subsystem: ui
tags: [next/font, tailwind-v4, next-intl, rtl, fonts, css-variables]

# Dependency graph
requires:
  - phase: 01-01
    provides: Next.js 15 scaffold with ESLint RTL physical class ban
  - phase: 01-02
    provides: next-intl routing, i18n request config, domain types
provides:
  - Bilingual font instances (Space Grotesk + IBM Plex Sans Arabic) with variable option for :lang() switching
  - Root locale layout with lang/dir atomic set on <html>, hasLocale guard, NextIntlClientProvider
  - Complete globals.css with ORKI design tokens, :lang() font rules, Arabic optical size adjustment
  - Placeholder home page consuming Meta.siteTitle translation
affects:
  - 01-04 (PlaceholderImage — inherits dark-field color tokens from globals.css)
  - 01-05 (Navbar/MobileNavDrawer — inherits font variables and :lang() rules)
  - 01-06 (Footer — inherits layout from root layout.tsx)

# Tech tracking
tech-stack:
  added: [next/font (Space_Grotesk, IBM_Plex_Sans_Arabic)]
  patterns: [":lang() CSS font switching", "next/font variable option (not className)", "hasLocale guard pattern", "atomic lang+dir on html"]

key-files:
  created:
    - src/lib/fonts.ts
    - src/app/[locale]/layout.tsx
    - src/app/[locale]/page.tsx
  modified:
    - src/app/globals.css

key-decisions:
  - "IBM_Plex_Arabic is not a valid next/font/google export — correct name is IBM_Plex_Sans_Arabic"
  - "globals.css Task 2 was not committed by agent — fixed separately with commit 5349d03"
  - "Removed @import 'shadcn/tailwind.css' (path doesn't exist) which was causing build failure"

patterns-established:
  - "Font switching via :lang(en) / :lang(ar) CSS selectors only — never via component className"
  - "Both lang and dir always set on the same <html> element from the same locale value"
  - "hasLocale() guard before any locale-dependent rendering — invalid locales return 404"
  - "dark class is permanent on <html> — no light mode toggle"
  - "next/font variable option injects CSS vars; @theme inline maps them for Tailwind utilities"

requirements-completed: [FOUND-01, FOUND-02, FOUND-03, FOUND-05]

# Metrics
duration: ~30min
completed: 2026-05-07
---

# Plan 01-03: Fonts, Root Layout, globals.css Summary

**Space Grotesk + IBM Plex Sans Arabic loaded via next/font with :lang() CSS font switching; root locale layout sets lang+dir atomically with hasLocale guard; globals.css adds ORKI design tokens**

## Performance

- **Duration:** ~30 min
- **Completed:** 2026-05-07
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Bilingual font instances created with `variable` option — enabling `:lang()` CSS-based switching without component-level font logic
- Root `src/app/[locale]/layout.tsx` created as async Server Component: awaits Promise params, hasLocale guard, lang+dir atomic update, permanent `dark` class, NextIntlClientProvider wrapping children
- `src/app/globals.css` updated with ORKI design system: `@theme inline` font/color tokens, `:lang()` font switching rules, Arabic 17px optical size adjustment, heading letter-spacing
- Stale `.next` cache cleared — resolved false build failure that was masking successful compilation

## Task Commits

1. **Task 1: fonts.ts + root layout** - `4494b84` (feat: fonts, locale layout with lang/dir/dark/NextIntlClientProvider)
2. **Task 2: globals.css ORKI design system** - `5349d03` (fix: remove invalid shadcn/tailwind.css import, add ORKI design system)

## Files Created/Modified
- `src/lib/fonts.ts` — Space_Grotesk and IBM_Plex_Sans_Arabic instances with variable option
- `src/app/[locale]/layout.tsx` — Root locale layout: await params, hasLocale, lang+dir, dark, NextIntlClientProvider
- `src/app/[locale]/page.tsx` — Placeholder home page using useTranslations('Meta')
- `src/app/globals.css` — Tailwind v4 + shadcn vars + ORKI design tokens + :lang() font rules

## Decisions Made
- `IBM_Plex_Arabic` is not a valid export from `next/font/google` — the correct export name is `IBM_Plex_Sans_Arabic`. Agent auto-detected and corrected during Task 1.
- `@import "shadcn/tailwind.css"` inserted by agent into globals.css doesn't exist in the shadcn package. Removed and ORKI design system added in separate fix commit.
- Deleted root `src/app/layout.tsx` and `src/app/page.tsx` (replaced by `[locale]` versions) — both locales now route through the locale-aware layout.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] IBM_Plex_Arabic → IBM_Plex_Sans_Arabic font export name**
- **Found during:** Task 1 (fonts.ts creation)
- **Issue:** The plan referenced `IBM_Plex_Arabic` but `next/font/google` only exports `IBM_Plex_Sans_Arabic`
- **Fix:** Agent corrected to `IBM_Plex_Sans_Arabic` before committing
- **Files modified:** src/lib/fonts.ts
- **Committed in:** 4494b84

**2. [Post-execution] globals.css ORKI additions not committed by agent**
- **Found during:** Progress check after session limit
- **Issue:** Agent committed Task 1 (fonts + layout) but globals.css Task 2 changes were incomplete — a bad `@import "shadcn/tailwind.css"` was left in and ORKI design system content was missing
- **Fix:** Removed invalid import, added full ORKI design system (`:lang()` rules, color tokens, touch targets, RTL flip utility)
- **Files modified:** src/app/globals.css
- **Committed in:** 5349d03

---

**Total deviations:** 2 auto-fixed (1 API name bug, 1 incomplete task patched post-run)
**Impact on plan:** Both deviations resolved with no scope creep. Build passes cleanly after `.next` cache clear.

## Issues Encountered
- Build appeared to fail with `Cannot read properties of undefined (reading 'length')` — turned out to be stale `.next` cache, not an actual error. Cleared with `rm -rf .next && npm run build` which succeeded.

## Next Phase Readiness
- Font CSS variables (`--font-space-grotesk`, `--font-ibm-plex-arabic`) are injected on `<html>` via next/font — ready for Plans 01-04 and 01-05
- `:lang()` CSS selectors active — font switches automatically when locale changes
- ORKI color tokens available: `--color-placeholder-bg: #0A0A0A` ready for PlaceholderImage in Plan 01-04
- No blockers for Wave 1 continuation (Plan 01-04)

---
*Phase: 01-foundation*
*Completed: 2026-05-07*
