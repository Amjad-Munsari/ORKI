---
phase: 01-foundation
plan: 02
subsystem: infra
tags: [next-intl, shadcn, typescript, tailwindcss, rtl, i18n]

requires:
  - phase: 01-01
    provides: Next.js 15 scaffold with Tailwind v4, next-intl plugin, minimal i18n stubs

provides:
  - next-intl locale routing middleware (src/middleware.ts) intercepting all non-asset routes
  - defineRouting with locales ['en', 'ar'] and localePrefix always in src/i18n/routing.ts
  - createNavigation exports (Link, redirect, usePathname, useRouter, getPathname) in src/i18n/navigation.ts
  - getRequestConfig with requestLocale and hasLocale validation in src/i18n/request.ts
  - Complete EN and AR translation files (Nav, Footer, Placeholder, Meta keys) in messages/
  - TypeScript domain types: Product, CartItem, Size, Locale, Direction in src/types/domain.ts
  - TypeScript augmentation for type-safe translations in src/types/next-intl.d.ts
  - Data access layer stub getAllProducts/getProductBySlug/getProductsByCategory in src/lib/products.ts
  - Static product data stub (empty array) in src/data/products.ts
  - shadcn/ui initialized with components.json (base-nova preset, Tailwind v4, dark mode)
  - Sheet, NavigationMenu, Separator shadcn components in src/components/ui/

affects: [01-03-root-layout, 01-04-fonts, 01-05-nav, 01-06-footer, 01-07-placeholder, all-phases]

tech-stack:
  added:
    - shadcn@4.7.0 (CLI — init and component add)
    - tw-animate-css (shadcn Tailwind v4 dependency)
    - clsx + tailwind-merge (via shadcn init)
    - @radix-ui/react-dialog, @radix-ui/react-navigation-menu, @radix-ui/react-separator (via shadcn components)
  patterns:
    - next-intl createMiddleware(routing) intercepts all non-asset routes via matcher config
    - requestLocale (v4 stable) used in getRequestConfig — NOT unstable_setRequestLocale (v3 pattern)
    - hasLocale() guard validates locale values; invalid locales fall back to defaultLocale
    - createNavigation(routing) exports locale-aware Link/useRouter/usePathname from src/i18n/navigation.ts
    - All product data access flows through src/lib/products.ts only — components never import from src/data/products.ts directly
    - shadcn base-nova preset with @custom-variant dark (&:is(.dark *)) — permanent dark class strategy

key-files:
  created:
    - src/middleware.ts
    - src/i18n/navigation.ts
    - messages/ar.json (updated with UI-SPEC exact translations)
    - src/types/domain.ts
    - src/types/next-intl.d.ts
    - src/data/products.ts
    - src/lib/products.ts
    - src/lib/utils.ts (shadcn cn() utility)
    - components.json
    - src/components/ui/sheet.tsx
    - src/components/ui/navigation-menu.tsx
    - src/components/ui/separator.tsx
    - src/components/ui/button.tsx (shadcn dependency)
  modified:
    - src/app/globals.css (shadcn CSS variables, tw-animate-css import, dark mode vars)
    - package.json (shadcn dependencies added)

key-decisions:
  - "shadcn --defaults uses base-nova preset which adds @import 'shadcn/tailwind.css' to globals.css — resolved via shadcn exports map which exposes shadcn/tailwind.css via style export condition, processed by @tailwindcss/postcss"
  - "navigation-menu.tsx ml-1 fixed to ms-1 to comply with RTL logical property requirement"
  - "stale .next cache caused uncaughtException on repeat builds — cleared with rm -rf .next before final verification; not a code issue"
  - "routing.ts and request.ts stubs from Plan 01 already matched Plan 02 spec exactly — no changes needed"

patterns-established:
  - "Pattern: All message file translations follow UI-SPEC Copywriting Contract exactly — switchToAr and switchToEn are 'AR' and 'EN' in both locales (shows TARGET locale, not current)"
  - "Pattern: shadcn components installed via npx shadcn@latest add — components.json must exist first (shadcn init gate)"
  - "Pattern: Any shadcn component with physical direction classes must be patched to use logical equivalents (ml-1 → ms-1)"

requirements-completed: [FOUND-01, FOUND-02, FOUND-03, FOUND-04]

duration: 6min
completed: 2026-05-07
---

# Phase 1 Plan 02: i18n Routing, Types, and shadcn Summary

**next-intl middleware with localePrefix always, complete EN/AR translations, TypeScript domain contracts, data access layer, and shadcn/ui initialized with Sheet + NavigationMenu + Separator**

## Performance

- **Duration:** 6 min
- **Started:** 2026-05-06T21:14:56Z
- **Completed:** 2026-05-06T21:21:15Z
- **Tasks:** 2
- **Files created:** 14
- **Files modified:** 2

## Accomplishments

- next-intl locale routing wired: middleware intercepts all non-asset routes, routing.ts enforces /en/ and /ar/ prefixes, request.ts loads messages by locale with hasLocale() guard
- Complete bilingual translation files: en.json and ar.json with Nav, Footer, Placeholder, and Meta keys matching UI-SPEC Copywriting Contract exactly
- TypeScript domain type contract established: Product, CartItem, Size, Locale, Direction types serve as the contract between frontend and future Medusa v2 backend
- Data access layer created: src/lib/products.ts is the only file components should import for product data; src/data/products.ts is the static data store
- shadcn initialized with base-nova preset (Tailwind v4, dark mode, neutral palette); Sheet, NavigationMenu, and Separator components added

## Task Commits

1. **Task 1: Wire next-intl middleware, navigation, and AR translations** - `4828117` (feat)
2. **Task 2: Domain types, data stubs, shadcn initialized with Phase 1 components** - `e7d929f` (feat)

## Files Created/Modified

- `src/middleware.ts` - next-intl createMiddleware(routing) with route matcher config
- `src/i18n/navigation.ts` - createNavigation exports: Link, redirect, usePathname, useRouter, getPathname
- `messages/ar.json` - Updated to UI-SPEC exact Arabic translations (المتجر, الأعلى, الأسفل, عن أوركي)
- `src/types/domain.ts` - Product, CartItem, Size, Locale, Direction TypeScript interfaces
- `src/types/next-intl.d.ts` - TypeScript augmentation: AppConfig with Locale and Messages types
- `src/data/products.ts` - Empty Product[] stub (populated in Phase 2)
- `src/lib/products.ts` - Data access layer: getAllProducts, getProductBySlug, getProductsByCategory
- `src/lib/utils.ts` - shadcn cn() utility (clsx + tailwind-merge)
- `components.json` - shadcn configuration (base-nova style, Tailwind v4, CSS variables)
- `src/components/ui/sheet.tsx` - Mobile navigation drawer component
- `src/components/ui/navigation-menu.tsx` - Desktop navigation component (patched: ml-1 → ms-1)
- `src/components/ui/separator.tsx` - Footer divider component
- `src/components/ui/button.tsx` - Button component (shadcn dependency, installed alongside Sheet)
- `src/app/globals.css` - shadcn CSS variables, tw-animate-css import, dark mode vars added

## Decisions Made

- routing.ts and request.ts stubs from Plan 01 already matched Plan 02 spec exactly — no changes needed
- shadcn --defaults flag selects base-nova preset (not the "Default" style from the interactive wizard); this generates @import 'shadcn/tailwind.css' resolved via the shadcn package's exports map style condition, which @tailwindcss/postcss processes correctly
- stale .next cache causes `uncaughtException [TypeError: Cannot read properties of undefined (reading 'length')]` on repeat builds on Windows — always `rm -rf .next` before final verification

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed physical direction class in shadcn NavigationMenu component**
- **Found during:** Task 2 (npm run lint after shadcn component add)
- **Issue:** shadcn-generated `src/components/ui/navigation-menu.tsx` contained `ml-1` on the ChevronDownIcon (line 74) — a physical margin-left class that breaks RTL layout
- **Fix:** Replaced `ml-1` with `ms-1` (logical inline-start margin) to comply with CLAUDE.md RTL requirement and ESLint no-restricted-syntax rule
- **Files modified:** src/components/ui/navigation-menu.tsx
- **Verification:** `npm run lint` exits 0 cleanly after fix
- **Committed in:** e7d929f (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug in shadcn-generated component)
**Impact on plan:** Required for RTL correctness. shadcn generates physical direction classes; any new shadcn component add must be checked with `npm run lint` immediately.

## Issues Encountered

- Stale `.next` cache on Windows causes `uncaughtException [TypeError: Cannot read properties of undefined (reading 'length')]` on repeated builds. Resolution: `rm -rf .next` before final verification. This is a known Next.js Windows cache issue and not a code defect.

## Known Stubs

- `src/data/products.ts` exports `products: Product[] = []` — intentional empty stub. Phase 2 (Core Shopping) populates this array with static product data.
- `src/lib/products.ts` returns empty arrays from all functions — correct behavior for Phase 1; data is absent by design.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- next-intl locale routing fully wired: Plan 03 (root layout) can immediately use `hasLocale()`, `routing.locales`, and `NextIntlClientProvider`
- TypeScript domain types defined: Plan 05 (nav) and Plan 06 (footer) can import from `@/types/domain`
- shadcn components available: Plan 05 can use `<Sheet>` and `<NavigationMenu>` directly
- Translation files complete: Plan 05 and Plan 06 can use `useTranslations('Nav')` and `useTranslations('Footer')` with full type safety
- Data access layer ready: Phase 2 only needs to populate `src/data/products.ts` and all components automatically receive data

---
*Phase: 01-foundation*
*Completed: 2026-05-07*
