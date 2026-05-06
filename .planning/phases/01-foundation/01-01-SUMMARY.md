---
phase: 01-foundation
plan: 01
subsystem: infra
tags: [nextjs, tailwindcss, postcss, eslint, next-intl, motion, phosphor-icons, gsap]

requires: []

provides:
  - Next.js 15.5.16 project scaffold with App Router and TypeScript
  - Tailwind v4 configured via @import 'tailwindcss' + @tailwindcss/postcss PostCSS plugin
  - next-intl v4.11.0 installed and wired as Next.js plugin (withNextIntl)
  - ESLint rules blocking physical directional Tailwind classes (ml-/mr-/pl-/pr-/border-l-/border-r-) in Literal classNames
  - ESLint no-img-element rule enforced via next/core-web-vitals
  - AVIF/WebP image formats declared in next.config.ts
  - Minimal i18n stubs (routing.ts, request.ts, en.json, ar.json) to enable build

affects: [02-shadcn-and-globals, 03-i18n-routing, 04-fonts, 05-nav, 06-footer, 07-placeholder]

tech-stack:
  added:
    - next@15.5.16 (^15.3.9 pinned)
    - react@19.1.0
    - react-dom@19.1.0
    - next-intl@^4.11.0
    - motion@^12.38.0
    - "@phosphor-icons/react@^2.1.10"
    - gsap@^3.15.0 (devDependency)
    - tailwindcss@^4 + @tailwindcss/postcss@^4
  patterns:
    - Tailwind v4 CSS-only config (@import 'tailwindcss' + @theme inline in globals.css — no tailwind.config.js)
    - PostCSS uses @tailwindcss/postcss (not tailwindcss + autoprefixer)
    - next-intl plugin wraps NextConfig via withNextIntl()
    - ESLint flat config with no-restricted-syntax for RTL class enforcement
    - .agents/.claude/.planning directories excluded from ESLint scope

key-files:
  created:
    - package.json
    - package-lock.json
    - tsconfig.json
    - next.config.ts
    - postcss.config.mjs
    - eslint.config.mjs
    - src/app/globals.css
    - src/app/layout.tsx
    - src/app/page.tsx
    - src/i18n/routing.ts
    - src/i18n/request.ts
    - messages/en.json
    - messages/ar.json
    - .gitignore
  modified: []

key-decisions:
  - "Scaffolded into temp orki-scaffold/ then copied to ORKI/ — create-next-app@15 rejects capital-letter project names"
  - "Added minimal next-intl i18n stubs (routing.ts, request.ts, messages/) as Rule 3 fix — withNextIntl plugin fails build without request config module"
  - "Added .agents/.claude/.planning to ESLint ignores — without these, lint errors in GSD tooling files fail the lint check"
  - "No tailwind.config.js created — Tailwind v4 CSS-only configuration"
  - "Next.js 15.5.16 installed (satisfies ^15.3.9 pin) — npm latest is v16 which breaks next-intl middleware"

patterns-established:
  - "Pattern: ESLint no-restricted-syntax targets JSXAttribute > Literal only — TemplateLiteral selector intentionally absent to allow font variable injection"
  - "Pattern: Physical direction class ban (ml-/mr-/pl-/pr-/border-l-/border-r-) enforced from first commit via ESLint"
  - "Pattern: i18n config lives in src/i18n/ (routing.ts + request.ts), messages in messages/{locale}.json"

requirements-completed: [FOUND-01, FOUND-02, FOUND-05]

duration: 7min
completed: 2026-05-07
---

# Phase 1 Plan 01: Scaffold and Toolchain Summary

**Next.js 15.5.16 scaffold with Tailwind v4, next-intl plugin, and ESLint rules enforcing RTL-safe logical CSS properties from first commit**

## Performance

- **Duration:** 7 min
- **Started:** 2026-05-06T21:05:48Z
- **Completed:** 2026-05-06T21:12:48Z
- **Tasks:** 2
- **Files created:** 14

## Accomplishments

- Next.js 15.5.16 project scaffolded with TypeScript, Tailwind v4, App Router, and src/ directory
- All Phase 1 runtime dependencies installed: next-intl, motion, @phosphor-icons/react, gsap
- ESLint configured to block physical Tailwind direction classes (ml-/mr-/pl-/pr-) in Literal classNames, with no TemplateLiteral selector (avoids false positives on font variable injection)
- next.config.ts wired with withNextIntl plugin and AVIF/WebP image format declarations
- npm run lint and npm run build both exit 0

## Task Commits

1. **Task 1: Scaffold Next.js 15 and install Phase 1 dependencies** - `925799a` (feat)
2. **Task 2: Configure ESLint to enforce RTL-safe CSS and no raw img tags** - `e06535b` (feat)

## Files Created/Modified

- `package.json` - Project config with pinned next@^15.3.9 and all Phase 1 dependencies
- `next.config.ts` - withNextIntl plugin wrapper + AVIF/WebP image formats
- `postcss.config.mjs` - @tailwindcss/postcss (Tailwind v4 plugin)
- `eslint.config.mjs` - RTL class ban + no-img-element + .agents/.claude/.planning ignores
- `tsconfig.json` - TypeScript config with @/* import alias
- `src/app/globals.css` - @import 'tailwindcss' (v4 pattern) + @theme inline block
- `src/app/layout.tsx` - Root layout (scaffolded; will be updated in Plan 03)
- `src/app/page.tsx` - Default home page (scaffolded; replaced in Phase 4)
- `src/i18n/routing.ts` - defineRouting stub for EN/AR locales
- `src/i18n/request.ts` - getRequestConfig with hasLocale validation
- `messages/en.json` - English translation messages (Nav, Footer, Placeholder, Meta)
- `messages/ar.json` - Arabic translation messages
- `.gitignore` - Excludes node_modules, .next, env files

## Decisions Made

- **Scaffold workaround:** create-next-app@15 rejected "ORKI" (capital letters) — scaffolded into `orki-scaffold/` then copied files over manually
- **i18n stubs required:** withNextIntl plugin requires `src/i18n/request.ts` at build time; added minimal stubs so `npm run build` passes (Plan 03 will expand these into full routing)
- **ESLint ignore scope:** Added `.agents`, `.claude`, `.planning` to ESLint ignores — GSD tooling files in those directories would otherwise fail the next/typescript ESLint rules

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added minimal next-intl i18n stubs to unblock build**
- **Found during:** Task 1 (build verification)
- **Issue:** `npm run build` failed with "Could not locate request configuration module" — withNextIntl plugin requires `src/i18n/request.ts` to exist at build time
- **Fix:** Created `src/i18n/routing.ts`, `src/i18n/request.ts`, `messages/en.json`, `messages/ar.json` as minimal stubs
- **Files modified:** src/i18n/routing.ts, src/i18n/request.ts, messages/en.json, messages/ar.json
- **Verification:** `npm run build` exits 0
- **Committed in:** 925799a (Task 1 commit)

**2. [Rule 3 - Blocking] Added .agents/.claude/.planning to ESLint ignores**
- **Found during:** Task 2 (npm run lint verification)
- **Issue:** ESLint scanned GSD tooling directories containing CommonJS and non-React files, producing hundreds of errors on files outside project scope
- **Fix:** Added `.agents/**`, `.claude/**`, `.planning/**` to ESLint ignore patterns
- **Files modified:** eslint.config.mjs
- **Verification:** `npm run lint` exits 0 cleanly
- **Committed in:** e06535b (Task 2 commit)

**3. [Rule 2 - Missing Critical] Added .gitignore**
- **Found during:** Task 1 (pre-commit git status check)
- **Issue:** No .gitignore existed; node_modules and .next would be committed to git
- **Fix:** Created standard Next.js .gitignore excluding node_modules, .next, env files, build artifacts
- **Files modified:** .gitignore
- **Verification:** git status shows node_modules and .next excluded
- **Committed in:** 925799a (Task 1 commit)

---

**Total deviations:** 3 auto-fixed (2 blocking, 1 missing critical)
**Impact on plan:** All three fixes were necessary for correctness. The i18n stubs are intentional scaffolding for Plan 03 to expand. No scope creep.

## Issues Encountered

- create-next-app@15 rejects capital-letter project names — worked around by scaffolding in a separate lowercase directory then copying files over

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Next.js 15 scaffold complete and both lint and build pass
- Tailwind v4 configured (no tailwind.config.js)
- next-intl installed and wired; minimal i18n stubs in place for build
- ESLint RTL enforcement active from this commit forward
- Plan 02 (shadcn init) can proceed immediately — components.json does not exist yet

---
*Phase: 01-foundation*
*Completed: 2026-05-07*
