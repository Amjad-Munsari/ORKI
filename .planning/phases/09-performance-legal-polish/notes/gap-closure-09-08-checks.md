# Phase 9 Gap Closure — Plan 09-08 verification batch

**Date:** 2026-05-10
**Plan:** 09-08 (hygiene + copy + dev-loop polish)
**Closes:** WR-04 (narrow), WR-05, WR-06, IN-01, IN-02, IN-04, IN-05; ships UAT smoke-routes helper

## Per-task automated verify

| Task | Finding/Item | Verify exit | Notes |
|---|---|---|---|
| 1 | WR-04 narrow Footer SAR | 0 | $149 → 300 SAR; remainder deferred in deferred-items.md |
| 2 | WR-05 confirmation page | 0 | lookupFailed flag removed; behavior identical |
| 3 | WR-06 seo.ts refactor | 0 | Single getTranslations; signature unchanged |
| 4 | IN-04 lastUpdated centralized | 0 | New lib file + 3 page edits + AR formatter |
| 5 | IN-05 layout deletion | 0 | File gone; wave-0-checks.md addendum present |
| 6 | IN-01+IN-02 placeholder guard | 0 | Script runs and exits 1 today (proof it works) |
| 7 | UAT smoke-routes | 0 | 5 DB-free routes; src/lib/env.ts untouched |
| 8 | package.json scripts | 0 | 15 keys total; 2 added; no-op gate (no collision) |

## Whole-plan checks

- `npx tsc --noEmit`: 2 — only pre-existing errors enumerated in `deferred-items.md` (`src/app/[locale]/checkout/page.tsx:57` payment-method literal union; tests/* fixture drift; vitest.config.ts `forks` overload). NO new errors introduced by Tasks 1–7. Production files modified by this plan (`src/components/footer/Footer.tsx`, `src/app/[locale]/checkout/confirmation/page.tsx`, `src/lib/seo.ts`, `src/lib/legal/last-updated.ts`, `src/app/[locale]/legal/{privacy,terms,cookies}/page.tsx`) all type-check cleanly.
- `node -e "require('./messages/ar.json'); require('./messages/en.json')"`: 0
- `npm test`: 0 — 14 files / 76 tests pass
- `npm run check:legal-placeholders`: 1 — proves guard works (catches current placeholders that still exist by design pre-launch); MUST be 1 today
- `npm run smoke:routes`: 0 — local UAT loop functional. All 5 routes return 200 with the expected substring (`/robots.txt` contains `Disallow:`; `/en/about`, `/en/contact`, `/en/legal/privacy`, `/en/legal/terms` contain `| ORKI</title>`)

## Reconciliation with 09-VERIFICATION.md

Two must-haves require explicit reconciliation:

1. **09-01 must_have #5** ("Legal route folder layout exists and renders children unmodified")
   — INTENTIONALLY regressed by Plan 09-08 Task 5. The original gating concern was
   Wave-0 unblocker for Plan 09-02 (legal pages). Once those pages shipped and the
   build proved Next.js does not require a per-segment layout, the file became dead
   code (IN-05). Audit-trail addendum recorded in
   `.planning/phases/09-performance-legal-polish/notes/wave-0-checks.md` (section
   "Addendum: 09-08 IN-05 deletion approval"). The smoke-runner (Task 7) verifies
   `/en/legal/privacy` returns 200 without the layout.

2. **09-01 must_have #1** (`buildMetadata` exists with alternates) — public signature
   UNCHANGED by Task 3. All Phase 9 callers compile against the same destructure shape
   (`{ path, locale, titleKey, descriptionKey, ogImage }`). The refactor is internal:
   single `getTranslations({ locale })` call instead of two namespace-scoped calls.

All other 28 must-haves verified in 09-VERIFICATION.md remain unaffected.
