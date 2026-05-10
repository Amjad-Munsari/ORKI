---
phase: 09-performance-legal-polish
plan: 07
subsystem: ui
tags: [seo, jsonld, rtl, tailwind-v4, error-boundary, i18n, security, xss-hardening]

# Dependency graph
requires:
  - phase: 09-performance-legal-polish
    provides: Plans 09-01..06 — root metadata helper, legal pages, viewport split, PDP metadata, error boundaries, perf-cookie scaffolding
provides:
  - PDP OG/Twitter fallback path corrected to canonical /og-default.png
  - CookieBanner uses canonical Tailwind v4 logical positioning (inset-inline-end-0)
  - AR Errors.section.adminOrdersFailed translated to formal Arabic
  - BrandedErrorPage surfaces errorDigest in production for support reference
  - PDP JSON-LD hardened via inline safeJsonLd helper escaping <, >, &, U+2028, U+2029 at both injection sites
  - global-error.tsx detects locale from window.location.pathname instead of stale document.documentElement.lang
affects: [phase-10, future-cookie-banner-mount, future-pdp-cms]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Inline safeJsonLd helper co-located with JSON-LD injection sites (extraction is premature when only one file calls it)"
    - "Pathname-based locale detection for client-side boundaries that fire after the locale layout has been replaced"

key-files:
  created:
    - .planning/phases/09-performance-legal-polish/notes/gap-closure-09-07-checks.md
  modified:
    - src/app/[locale]/shop/[category]/[slug]/page.tsx
    - src/components/CookieBanner.tsx
    - messages/ar.json
    - src/components/error/BrandedErrorPage.tsx
    - src/app/global-error.tsx

key-decisions:
  - "safeJsonLd kept inline in PDP file (only call site) — promote to src/lib/safe-json-ld.ts only when a second consumer appears"
  - "errorDigest is rendered in production: Next.js digest is a non-reversible hash, surfacing it is the intended Next.js contract"
  - "global-error locale detection uses URL pathname (next-intl localePrefix='always' guarantees /en/ or /ar/) rather than the unreliable post-crash <html lang> attribute"
  - "Regex literals in safeJsonLd use \\u2028 / \\u2029 unicode escapes (not raw chars) so TypeScript can parse them"

patterns-established:
  - "Bare 'inline-end-0' class is NOT a Tailwind v4 utility — always use canonical 'inset-inline-end-0' (matches StockStateBadge convention)"
  - "JSON-LD <script type='application/ld+json'> bodies must escape <, >, &, U+2028, U+2029 — partial escaping (only <) is insufficient once content becomes user-influenced"

requirements-completed: [LGL-01, LGL-02, LGL-03, LGL-04, PERF-04, PERF-05, PERF-06, SEO-02, SEO-03]

# Metrics
duration: 11min
completed: 2026-05-10
---

# Phase 9 Plan 07: Gap Closure Wave 1 Summary

**Closed all six advisory review findings (3 Critical + 3 production-facing Warnings) via 5 file edits and a verification batch note — no must-have regressed.**

## Performance

- **Duration:** ~11 min
- **Started:** 2026-05-10T15:08:49Z
- **Completed:** 2026-05-10T15:19:06Z
- **Tasks:** 7 / 7
- **Files modified:** 5 source files + 1 audit note created

## Accomplishments

- **CR-01:** PDP `generateMetadata` OG/Twitter image fallback now resolves to the canonical `/og-default.png` (matches `src/lib/seo.ts` `DEFAULT_OG_IMAGE`); the broken `/images/og-default.png` literal that returned 404 to social crawlers is gone.
- **CR-02:** `CookieBanner` uses Tailwind v4 canonical `inset-inline-end-0`. Bare `inline-end-0` produced no rule (not a Tailwind utility); a future mount would now position correctly in both LTR and RTL on first paint.
- **CR-03:** `messages/ar.json` `Errors.section.adminOrdersFailed` translated from English placeholder to formal-AR `قائمة الطلبات غير متاحة مؤقتاً.` matching sibling translations' register.
- **WR-01:** `BrandedErrorPage` removes the `process.env.NODE_ENV === 'development'` guard around `errorDigest`. Production users now see `Error ID: <digest>` for support reference. JSDoc updated to document why the digest is safe to expose (non-reversible hash by Next.js design).
- **WR-02:** PDP JSON-LD now hardened through an inline `safeJsonLd` helper that escapes `<`, `>`, `&`, U+2028, U+2029 at both `<script type="application/ld+json">` injection sites. Replaces the prior partial `JSON.stringify(...).replace(/</g, '<')` pattern that escaped only `<`.
- **WR-03:** `global-error.tsx` detects locale from `window.location.pathname.startsWith('/ar')` instead of `document.documentElement.lang`. The `<html lang>` attribute may be empty/stale when global-error fires (locale layout has been replaced); URL pathname is the only post-crash source-of-truth, and next-intl's `localePrefix: 'always'` guarantees the `/[locale]/` prefix.
- **Audit trail:** `.planning/phases/09-performance-legal-polish/notes/gap-closure-09-07-checks.md` records per-task verify results, whole-plan checks (tsc, JSON parse, npm test 76/76, legal layout existence), and explicit reconciliation against 09-VERIFICATION.md's 28 must-haves (none regressed).

## Task Commits

Each task was committed atomically:

1. **Task 1 — CR-01 PDP OG fallback path** — `24a0973` (fix)
2. **Task 2 — CR-02 CookieBanner inset-inline-end-0** — `5157e94` (fix)
3. **Task 3 — CR-03 AR adminOrdersFailed translation** — `4619926` (fix)
4. **Task 4 — WR-01 errorDigest in production** — `574d26b` (fix)
5. **Task 5 — WR-02 safeJsonLd helper** — `f2c27fc` (fix), with TS-parser fix `eda27aa` (Rule 1 deviation)
6. **Task 6 — WR-03 global-error pathname detection** — `e72382f` (fix)
7. **Task 7 — Verification batch note** — `6321ce4` (docs)

## Files Created/Modified

- `src/app/[locale]/shop/[category]/[slug]/page.tsx` — Fixed OG fallback path; added `safeJsonLd` helper at top of file; both PDP `<script>` injection sites now call `safeJsonLd()`; obsolete inline replace-pattern comment updated.
- `src/components/CookieBanner.tsx` — `inline-end-0` → `inset-inline-end-0` (line 36).
- `messages/ar.json` — `Errors.section.adminOrdersFailed` translated to formal AR.
- `src/components/error/BrandedErrorPage.tsx` — Removed dev-only NODE_ENV guard around errorDigest; JSDoc updated to describe Next.js digest as non-reversible hash.
- `src/app/global-error.tsx` — Locale detection switched from `document.documentElement.lang` to `window.location.pathname.startsWith('/ar')`.
- `.planning/phases/09-performance-legal-polish/notes/gap-closure-09-07-checks.md` — New audit-trail note recording every verify exit code.

## Decisions Made

- **Inline vs. extracted `safeJsonLd`:** Co-located in the PDP file because the only call sites are the two `<script>` injections in this file. Promotion to `src/lib/safe-json-ld.ts` is deferred until a second consumer appears (premature abstraction otherwise).
- **`errorDigest` visibility:** Surfaced unconditionally when truthy. Next.js documents `digest` as a non-reversible hash specifically intended for production-user support quotes; hiding it defeats its purpose. Threat-register entry T-09-07-02 marks this as `accept` (no internal data leak).
- **`global-error` locale fallback to `'en'` during SSR:** Acceptable because `global-error.tsx` is a Client Component (`'use client'`) and Next.js renders it on the client after hydration recovery; the user sees hydrated AR within a tick. Documented inline in the component.
- **Regex literal escapes for U+2028/U+2029:** Required by `tsc 5.x` (TS1161 forbids raw line separators inside regex literals). Use ` ` / ` ` escapes; replacement strings unchanged.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript parser rejected raw U+2028/U+2029 in regex literals**

- **Found during:** Task 5 (WR-02 safeJsonLd helper) follow-up tsc run
- **Issue:** Initial helper used raw U+2028 / U+2029 chars inside `/.../g` regex literals. `npx tsc --noEmit` reported TS1161 'Unterminated regular expression literal' at the helper site.
- **Fix:** Switched the U+2028 / U+2029 regex literals to unicode-escape form: `/ /g` and `/ /g`. Semantically identical (same code points), parses cleanly under tsc.
- **Files modified:** `src/app/[locale]/shop/[category]/[slug]/page.tsx`
- **Verification:** Re-ran `npx tsc --noEmit` — only pre-existing deferred errors remain (tests/products.test.ts, tests/SizeSelector.test.tsx, vitest.config.ts, src/app/[locale]/checkout/page.tsx:57 — all enumerated in `deferred-items.md`). Functional behavior of the helper verified via standalone harness (round-trips through `JSON.parse`; emits no raw `<`, `>`, `&`, U+2028, U+2029).
- **Committed in:** `eda27aa`

**2. [Rule 1 - Plan defect] Plan-supplied verify regex for Task 5 is structurally impossible to satisfy**

- **Found during:** Task 5 verify
- **Issue:** Plan line 406 specifies `(c.match(/\\\\u003c/g)||[]).length===1`. After bash double-quote reduction (`\\\\` → `\\`) and JS regex parsing (`\\u003c` → unicode escape for `<`), the regex matches every `<` character in the TSX file. A real TSX has many JSX-tag `<` chars (this PDP has 17), so `length === 1` cannot hold on any TSX file.
- **Fix:** Verified WR-02 via two alternative methods: (a) byte-level `indexOf` of the literal 6-char sequence backslash + `u003c` in source (count = 1, in the helper only), and (b) standalone functional harness exercising `safeJsonLd` on a payload containing all five dangerous chars and confirming JSON output contains no raw dangerous chars and round-trips through `JSON.parse`. Plan-level verifications #4–9 (the file-level grep checks at lines 570-576) all PASS, including #6 (`JSON.stringify(*JsonLd).replace` removed). The Task 5 acceptance criteria on plan lines 408-414 (helper present, both call sites, old pattern gone, all five escape patterns present) are all satisfied.
- **Files modified:** None (plan defect; documented only).
- **Verification:** See `notes/gap-closure-09-07-checks.md` Task 5 row for full reasoning trail.
- **Committed in:** `f2c27fc` (helper itself), documented in `6321ce4`.

---

**Total deviations:** 2 auto-fixed (1 bug fix, 1 plan-verify-defect documented)
**Impact on plan:** Plan goals achieved exactly. The TS-parser fix was a one-line adjustment to the same helper added in Task 5 — no scope creep. The plan-verify defect is documentation-only; the underlying source and behavior are correct.

## Issues Encountered

- The plan's Task 5 automated verify regex `/\\\\u003c/g` cannot be satisfied on any TSX file (it semantically matches every `<` char, not the literal 6-char escape sequence). Resolved by using indexOf-based byte counting and a standalone functional harness, then documenting the discrepancy in both the verification batch note and this Summary.
- Initial `safeJsonLd` helper draft used raw U+2028/U+2029 chars in regex literals; tsc 5.x rejects this. Fixed in a one-line follow-up commit (`eda27aa`).

## User Setup Required

None — all changes are source-only with no external service or environment-variable changes.

## Next Phase Readiness

- All six advisory review findings (CR-01..03, WR-01..03) closed with grep-verifiable evidence.
- 09-VERIFICATION.md's 28 must-haves remain intact (no regression).
- `src/app/[locale]/legal/layout.tsx` STILL EXISTS — its deletion (IN-05) is owned by Plan 09-08, not this plan.
- The 30 [AR-LEGAL-REVIEW] flags in `messages/ar.json` are untouched here (Plan 09-08 owns the CI guard).
- Phase 9 is now ready for Plan 09-08 (the remaining gap-closure wave: IN-01..IN-08 informational findings + AR-LEGAL-REVIEW CI guard).

## Self-Check: PASSED

All 8 referenced files exist; all 9 task/metadata commits (24a0973, 5157e94, 4619926, 574d26b, f2c27fc, eda27aa, e72382f, 6321ce4, 825579d) are reachable from `main`.

---
*Phase: 09-performance-legal-polish*
*Completed: 2026-05-10*
