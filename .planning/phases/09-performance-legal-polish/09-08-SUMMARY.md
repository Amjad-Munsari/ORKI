---
phase: 09-performance-legal-polish
plan: 08
subsystem: infra
tags: [next-intl, seo, legal, ci-guard, dev-loop, smoke-test, gap-closure]

# Dependency graph
requires:
  - phase: 09-performance-legal-polish
    provides: 09-01 buildMetadata helper; 09-02 legal pages; 09-04 robots/sitemap; 09-05 confirmation page; 09-06 cookie scaffold; 09-07 wave-1 gap closure
provides:
  - WR-04 (narrow): Footer benefit-bar SAR shipping threshold corrected (300 SAR)
  - WR-05: confirmation page lookupFailed flag removed (inline catch fallback)
  - WR-06: buildMetadata refactored to single getTranslations call (signature preserved)
  - IN-04: centralized legal lastUpdated constant + per-locale formatter (en-GB / ar-SA-u-nu-latn)
  - IN-05: legal/layout.tsx deleted (no-op pass-through); audit-trail addendum recorded
  - IN-01 + IN-02: scripts/check-legal-placeholders.cjs CI guard; launch-checklist.md
  - UAT helper: scripts/smoke-routes.cjs (DB-free local smoke runner for 5 routes)
affects: phase-10-auth, phase-11-launch, future-i18n-migration

# Tech tracking
tech-stack:
  added: []  # No new dependencies; pure refactor + Node.js CommonJS scripts
  patterns:
    - "Single source of truth for legal lastUpdated date with per-locale Intl.DateTimeFormat (Western numerals in AR via 'ar-SA-u-nu-latn' modifier)"
    - "CI guard scripts as plain CommonJS (.cjs) — no tsx warm-up required for fresh checkouts"
    - "Smoke runner spawns next dev with stub:// DB URLs that satisfy z.string().url() so src/lib/env.ts validation is untouched"

key-files:
  created:
    - src/lib/legal/last-updated.ts
    - scripts/check-legal-placeholders.cjs
    - scripts/smoke-routes.cjs
    - .planning/phases/09-performance-legal-polish/launch-checklist.md
    - .planning/phases/09-performance-legal-polish/notes/gap-closure-09-08-checks.md
  modified:
    - src/components/footer/Footer.tsx
    - src/app/[locale]/checkout/confirmation/page.tsx
    - src/lib/seo.ts
    - src/app/[locale]/legal/privacy/page.tsx
    - src/app/[locale]/legal/terms/page.tsx
    - src/app/[locale]/legal/cookies/page.tsx
    - package.json
    - .planning/phases/09-performance-legal-polish/deferred-items.md
    - .planning/phases/09-performance-legal-polish/notes/wave-0-checks.md
    - .planning/phases/09-performance-legal-polish/09-HUMAN-UAT.md
  deleted:
    - src/app/[locale]/legal/layout.tsx

key-decisions:
  - "Narrow WR-04 to currency-only fix; full Footer/About/ContactClient i18n migration explicitly deferred with recommended owner"
  - "Use en-GB date style for the legal lastUpdated EN render (preserves '10 May 2026' visual layout user already approved over en-US 'May 10, 2026')"
  - "Smoke set restricted to 5 DB-free routes; sitemap and shop categories remain preview-deploy-only (Drizzle-backed)"
  - "src/lib/env.ts UNTOUCHED — stub:// URLs satisfy zod URL parser without modifying validation"
  - "package.json scripts append after the existing 13 entries (alphabetical-by-namespace ordering not enforced; insertion ordering preserves audit/test grouping)"

patterns-established:
  - "Pre-launch CI guard pattern: plain Node CommonJS script + npm run wiring + tracked in launch-checklist.md with verification command + named owner"
  - "Local smoke-runner pattern: spawn next dev on a non-default port with stub env, poll readiness via loopback, assert HTTP 200 + content substring per route, kill child on exit"
  - "Single-source-of-truth date constant + Record<Locale, Intl.DateTimeFormat> pattern for build-time deterministic, locale-aware date rendering"

requirements-completed: [LGL-01, LGL-02, LGL-03, LGL-04, PERF-04, PERF-05, PERF-06, SEO-02, SEO-03]

# Metrics
duration: 22min
completed: 2026-05-10
---

# Phase 9 Plan 08: Gap Closure (hygiene + copy + dev-loop polish) Summary

**Closed 7 advisory findings (WR-04 narrow, WR-05, WR-06, IN-01, IN-02, IN-04, IN-05) and shipped a DB-free local smoke-runner that makes 09-HUMAN-UAT items 3, 4, 5 runnable without a Vercel preview deploy — without touching `src/lib/env.ts`.**

## Performance

- **Duration:** ~22 min
- **Started:** 2026-05-10T18:20:00Z
- **Completed:** 2026-05-10T18:42:00Z
- **Tasks:** 9 (Tasks 1–7 changed files; Task 8 was a no-op verification gate; Task 9 wrote the audit-trail note)
- **Files modified:** 10
- **Files created:** 5
- **Files deleted:** 1

## Accomplishments

- **WR-04 (narrow):** Footer benefit-bar shipping line now reads `Free shipping from 300 SAR` (was `$149`). Wrong-currency for KSA was a launch defect regardless of i18n status.
- **WR-05:** `lookupFailed` boolean removed from `checkout/confirmation/page.tsx` — the catch handler renders the fallback inline; `notFound()` runs only on the success-but-null branch.
- **WR-06:** `buildMetadata` now uses a single `getTranslations({ locale })` call instead of two namespace-scoped calls with redundant dotted-key splits. Public signature exactly preserved.
- **IN-04:** `src/lib/legal/last-updated.ts` ships `LEGAL_LAST_UPDATED` + `formatLegalLastUpdated(locale)`; the three legal pages consume the helper. AR renders `10 مايو 2026` (Arabic month + Western numerals via `ar-SA-u-nu-latn`); EN renders `10 May 2026` via `en-GB`.
- **IN-05:** Deleted `src/app/[locale]/legal/layout.tsx` (no-op pass-through). Audit-trail addendum recorded in `wave-0-checks.md` documenting the authorized regression of 09-01 must_have #5.
- **IN-01 + IN-02:** `scripts/check-legal-placeholders.cjs` CI guard + `npm run check:legal-placeholders` wiring. Verified to exit 1 today (proves it catches the current pre-launch placeholders). `launch-checklist.md` tracks the placeholder cleanup as an explicit owned item.
- **UAT helper:** `scripts/smoke-routes.cjs` boots `next dev` on :3030 with `STORAGE_URL=stub://...` and smokes `/robots.txt`, `/en/about`, `/en/contact`, `/en/legal/privacy`, `/en/legal/terms` — exits 0 with all 5 routes returning 200 + the expected substring. `09-HUMAN-UAT.md` items 3, 4, 5 annotated; items 1, 2, 6, 7, 8 unchanged.

## Task Commits

Each task was committed atomically:

1. **Task 1: WR-04 narrow Footer SAR shipping threshold** — `fcb8a97` (fix)
2. **Task 2: WR-05 confirmation page redundant flag** — `4d15238` (refactor)
3. **Task 3: WR-06 seo.ts single getTranslations** — `c24f8c3` (refactor)
4. **Task 4: IN-04 centralize legal lastUpdated** — `f896d0b` (feat)
5. **Task 5: IN-05 delete legal/layout.tsx + audit addendum** — `abfaf87` (chore)
6. **Task 6: IN-01+IN-02 placeholder guard + launch checklist** — `9ed8c96` (feat)
7. **Task 7: smoke:routes UAT helper** — `d433a48` (feat)
8. **Task 8: package.json scripts gate** — no-op (no collision; entries already correct from Tasks 6+7; verified inline)
9. **Task 9: gap-closure verification batch note** — `2eb0ca4` (docs)

## Files Created/Modified

### Created
- `src/lib/legal/last-updated.ts` — `LEGAL_LAST_UPDATED` constant + `formatLegalLastUpdated(locale)` helper
- `scripts/check-legal-placeholders.cjs` — CI guard for `[AR-LEGAL-REVIEW]` / `[USER-CONFIRM` substrings in `messages/{en,ar}.json`
- `scripts/smoke-routes.cjs` — Spawns `next dev` on :3030 with stub:// DB URLs, smokes 5 DB-free routes
- `.planning/phases/09-performance-legal-polish/launch-checklist.md` — Pre-launch placeholder cleanup tracking
- `.planning/phases/09-performance-legal-polish/notes/gap-closure-09-08-checks.md` — Per-task and whole-plan verification log

### Modified
- `src/components/footer/Footer.tsx` — `$149` → `300 SAR`; `TODO(i18n)` comment intact
- `src/app/[locale]/checkout/confirmation/page.tsx` — `lookupFailed` boolean dropped; inline catch render
- `src/lib/seo.ts` — Single `await getTranslations({ locale })` call; signature preserved
- `src/app/[locale]/legal/privacy/page.tsx` — Imports + uses `formatLegalLastUpdated(locale)`
- `src/app/[locale]/legal/terms/page.tsx` — Same
- `src/app/[locale]/legal/cookies/page.tsx` — Same
- `package.json` — Added `check:legal-placeholders` and `smoke:routes` (15 scripts total, was 13)
- `.planning/phases/09-performance-legal-polish/deferred-items.md` — Appended full benefit-bar/About/Contact i18n migration deferral
- `.planning/phases/09-performance-legal-polish/notes/wave-0-checks.md` — Appended IN-05 deletion approval addendum
- `.planning/phases/09-performance-legal-polish/09-HUMAN-UAT.md` — Items 3, 4, 5 annotated with `local:` lines

### Deleted
- `src/app/[locale]/legal/layout.tsx` — Authorized regression of 09-01 must_have #5; reconciled in `notes/wave-0-checks.md` (Addendum) and `notes/gap-closure-09-08-checks.md`

## Decisions Made

- **Narrow WR-04:** Currency-only fix; full Footer/About/ContactClient i18n migration deferred with explicit recommended owner in `deferred-items.md` (out of scope for Phase 9; not gated by any roadmap success criterion).
- **`en-GB` over `en-US` for EN date format:** Preserves `10 May 2026` visual layout already approved over `May 10, 2026`.
- **`ar-SA-u-nu-latn` for AR date:** Matches CLAUDE.md currency-numerals convention (Arabic month name + Western numerals).
- **`src/lib/env.ts` untouched:** Stub URLs (`stub://smoke-runner.local/db`) satisfy `z.string().url()` so the smoke-runner does not require any zod schema changes.
- **CommonJS (`.cjs`) for new scripts:** No tsx warm-up step required; `npm run smoke:routes` works in a fresh checkout without dev-dependency installation gymnastics.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Bumped smoke-routes per-request timeout from 15s to 60s**
- **Found during:** Task 7 (UAT smoke-routes) — first run failed with `request timeout` while next dev was first-compiling `/[locale]/about` (turbopack cold-start ≈ 11k modules).
- **Issue:** Plan specified `req.setTimeout(15000, ...)` which is too short for cold-start route compilation in development; the smoke would falsely fail on the FIRST run after a fresh `npm install`.
- **Fix:** Raised to `req.setTimeout(60000, ...)`. Subsequent run exits 0 with all 5 routes PASS.
- **Files modified:** `scripts/smoke-routes.cjs`
- **Verification:** `npm run smoke:routes` exits 0; all routes (`/robots.txt`, `/en/about`, `/en/contact`, `/en/legal/privacy`, `/en/legal/terms`) return 200 with the expected substring.
- **Committed in:** `d433a48` (Task 7 commit — the 60s value is what shipped)

---

**Total deviations:** 1 auto-fixed (Rule 1 — bug fix)
**Impact on plan:** Necessary for the smoke-runner's correctness. The 60s ceiling is well below the existing `waitForReady(60000)` outer deadline and matches the realistic cold-start time observed in this repo. No scope creep.

## Issues Encountered

- **`grep -c "lookupFailed"` returns 0 with `set -e`:** When chaining verification grep commands in a bash script, `grep -c` with zero matches returns exit 1 which terminates `set -e` scripts. Worked around by running each check separately. Did not affect any task verification — only an inline batch-check ergonomics observation.
- **`tsc --noEmit` exits 2 with pre-existing errors:** `tests/products.test.ts`, `tests/SizeSelector.test.tsx`, `vitest.config.ts`, and `src/app/[locale]/checkout/page.tsx:57` all carry pre-existing TypeScript errors enumerated in `deferred-items.md` (untouched by this plan). Production files modified by this plan all type-check cleanly.

## Reconciliation with 09-VERIFICATION.md

- **09-01 must_have #5** ("Legal route folder layout exists and renders children unmodified") — INTENTIONAL authorized regression. Audit trail recorded in `notes/wave-0-checks.md` ("Addendum: 09-08 IN-05 deletion approval") and `notes/gap-closure-09-08-checks.md`. Replacement verification: `npm run smoke:routes` proves `/en/legal/privacy` returns 200 without the layout.
- **09-01 must_have #1** (`buildMetadata` exists with alternates) — PRESERVED. Public signature unchanged; refactor is purely internal. All 09-01..06 callers continue to compile.
- **09-04 must_have** (legal-page lastUpdated rendering) — VISUALLY EQUIVALENT. EN renders `10 May 2026` (was hardcoded literal); AR now renders `10 مايو 2026` (was incorrectly hardcoded as the EN literal — a corrective improvement, not a regression).

All other 28 must-haves verified in 09-VERIFICATION.md remain unaffected.

## User Setup Required

None — no external service configuration required.

The two new npm scripts (`check:legal-placeholders` and `smoke:routes`) work against the existing checkout. `smoke:routes` uses stub:// DB URLs and never reaches a real database.

## Next Phase Readiness

- Phase 9 advisory backlog is now zero. Wave 5 (gap closure) is complete pending user UAT.
- The two pre-launch blocking items (`[AR-LEGAL-REVIEW]` and `[USER-CONFIRM` placeholder cleanup) are tracked as named-owner action items in `launch-checklist.md` with `npm run check:legal-placeholders` as the verification command.
- `npm run smoke:routes` provides a fast local sanity check for the title-cascade, robots.txt, and DB-free route surfaces before any preview deploy.
- Phase 9 still pauses for the human UAT pass on 09-HUMAN-UAT items 1, 2, 6, 7, 8 (preview-deploy-only). Items 3, 4, 5 partially covered locally now.

## Self-Check: PASSED

- Files created exist: `src/lib/legal/last-updated.ts`, `scripts/check-legal-placeholders.cjs`, `scripts/smoke-routes.cjs`, `.planning/phases/09-performance-legal-polish/launch-checklist.md`, `.planning/phases/09-performance-legal-polish/notes/gap-closure-09-08-checks.md` — all FOUND
- File deleted: `src/app/[locale]/legal/layout.tsx` — confirmed gone (`test ! -f` exits 0)
- Commits exist: `fcb8a97`, `4d15238`, `c24f8c3`, `f896d0b`, `abfaf87`, `9ed8c96`, `d433a48`, `2eb0ca4` — all in `git log`
- 12 plan-level `<verification>` checks: all PASS (tsc emits only pre-existing deferred errors; messages parse; npm test 14/14; check:legal-placeholders exit 1; smoke:routes exit 0; layout gone; SAR string present; lookupFailed gone; await getTranslations count = 1; lastUpdated literal count = 0; package.json scripts = 15; UAT items 3, 4, 5 annotated and items 1, 2, 6, 7, 8 unchanged with 8 `result: [pending]` lines)

---
*Phase: 09-performance-legal-polish*
*Plan: 08*
*Completed: 2026-05-10*
