# Phase 9 Gap Closure — Plan 09-07 verification batch

**Date:** 2026-05-10
**Plan:** 09-07 (visible defects + production reliability)
**Closes:** CR-01, CR-02, CR-03, WR-01, WR-02, WR-03

## Per-task automated verify

| Task | Finding | Verify exit | Notes |
|---|---|---|---|
| 1 | CR-01 PDP OG path | 0 | grep `/og-default.png` ≥1, `/images/og-default.png` =0 |
| 2 | CR-02 CookieBanner | 0 | grep `inset-inline-end-0` ≥1, bare `inline-end-0` =0 |
| 3 | CR-03 AR adminOrdersFailed | 0 | ar.json parses; key value matches AR formal copy `قائمة الطلبات غير متاحة مؤقتاً.` |
| 4 | WR-01 digest in prod | 0 | NODE_ENV guard removed; `{errorDigest && (` present; doc comment updated to mention non-reversible hash |
| 5 | WR-02 safeJsonLd | 0 (functional) / FAIL-as-written | helper present at top of PDP file; both PDP `<script>` sites call `safeJsonLd()`; helper functionally verified via standalone harness (round-trips through `JSON.parse` and emits no raw `<`, `>`, `&`, U+2028, U+2029). The plan's `node -e "..."` automated regex `/\\\\u003c/g` resolves via shell+JS source escaping to regex pattern `<` which is the unicode escape for `<` — it matches every `<` in TSX (17 occurrences) so the `length===1` clause is structurally impossible to satisfy on any TSX file. Source correctness verified via byte-level `indexOf` plus functional behavior test. Documented as Rule 1 deviation in SUMMARY. |
| 6 | WR-03 global-error pathname | 0 | `window.location.pathname.startsWith('/ar')` present; `document.documentElement.lang` absent (including comments); SupportedLang preserved |

## Whole-plan checks

- `npx tsc --noEmit`: exit 2; pre-existing deferred errors only (yes — `tests/products.test.ts`, `tests/SizeSelector.test.tsx`, `vitest.config.ts`, `src/app/[locale]/checkout/page.tsx:57` — all enumerated in `deferred-items.md` from Plan 09-01 / 09-06; none introduced by 09-07).
- `node -e "require('./messages/ar.json'); require('./messages/en.json')"`: exit 0
- `npm test`: exit 0 — 14 test files, 76 tests passed
- `test -f src/app/[locale]/legal/layout.tsx`: exit 0 — file STILL EXISTS (deletion deferred to Plan 09-08 per IN-05)

## Plan-level <verification> grep matrix (lines 565-577 of 09-07-PLAN.md)

| # | Check | Result |
|---|-------|--------|
| 1 | `npx tsc --noEmit` exits 0 (or only deferred errors) | PASS — only pre-existing test/config errors enumerated in deferred-items.md |
| 2 | `node -e "require(en+ar)"` exits 0 | PASS |
| 3 | `npm test` exits 0 | PASS (76/76) |
| 4 | `grep -nE "(^\|[^-])inline-end-0" src/components/CookieBanner.tsx` returns 0 | PASS |
| 5 | `grep -n "/images/og-default.png" "src/app/[locale]/shop/[category]/[slug]/page.tsx"` returns 0 | PASS |
| 6 | `grep -nE "JSON\\.stringify\\((product\|breadcrumb)JsonLd\\)\\.replace"` returns 0 | PASS |
| 7 | `grep -n "process.env.NODE_ENV" src/components/error/BrandedErrorPage.tsx` returns 0 | PASS |
| 8 | `grep -n "document.documentElement.lang" src/app/global-error.tsx` returns 0 | PASS |
| 9 | `grep -n "Order list temporarily unavailable" messages/ar.json` returns 0 | PASS (en.json still has the EN copy on line 403) |
| 10 | `test -f src/app/[locale]/legal/layout.tsx` exits 0 | PASS |

## Reconciliation with 09-VERIFICATION.md

None of the 28 must-haves verified in 09-VERIFICATION.md are regressed:

- **09-01 must_have #5** (legal route folder layout exists and renders children unmodified): file `src/app/[locale]/legal/layout.tsx` still present — this plan does not delete it. Plan 09-08 owns the IN-05 deletion.
- **09-01 must_have #1** (`buildMetadata` exists with alternates.languages): unchanged. 09-07 only touches PDP `generateMetadata` (the consumer-side OG fallback string and JSON-LD `<script>` injection); the `buildMetadata` helper itself is not modified.
- **09-04 must_have** (PDP OG image): now resolves to `/og-default.png` (the canonical path served at `public/og-default.png`) instead of the broken `/images/og-default.png` literal. The must_have asserted that PDP has metadata with OG/Twitter blocks; the OG block remains present, with a working asset path.
- **09-05 must_have** (BrandedErrorPage renders branded chrome): unchanged structural shape — same component, same heading/body/CTA layout, same role="alert" / no-role variant rules. Only the digest visibility flipped from dev-only to always-when-truthy. Doc comment updated to reflect the corrected understanding.
- **09-05 must_have** (global-error owns html/body, no useTranslations, no Analytics): unchanged. Locale detection now happens via `window.location.pathname` instead of `document.documentElement.lang` — both are client-side detections that don't depend on next-intl. The "owns html/body" property is preserved (`<html>` + `<body>` still render in the component).
- **09-02 must_have #6** (AR copy uses formal legal Arabic + flagged with [AR-LEGAL-REVIEW]): unaffected. CR-03 fixes `Errors.section.adminOrdersFailed` which lives outside the `Legal.*` namespace and was never an [AR-LEGAL-REVIEW]-prefixed legal body. The 30 [AR-LEGAL-REVIEW] flags in `messages/ar.json` are untouched.

## Findings closed

| Finding | Severity | Commit | File |
|---------|----------|--------|------|
| CR-01 | Critical | 24a0973 | `src/app/[locale]/shop/[category]/[slug]/page.tsx` |
| CR-02 | Critical | 5157e94 | `src/components/CookieBanner.tsx` |
| CR-03 | Critical | 4619926 | `messages/ar.json` |
| WR-01 | Warning | 574d26b | `src/components/error/BrandedErrorPage.tsx` |
| WR-02 | Warning | f2c27fc + eda27aa (TS-parser fix) | `src/app/[locale]/shop/[category]/[slug]/page.tsx` |
| WR-03 | Warning | e72382f | `src/app/global-error.tsx` |
