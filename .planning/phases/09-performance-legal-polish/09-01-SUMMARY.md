---
phase: 09
plan: 01
subsystem: performance-legal-polish
tags: [seo, i18n, legal, footer, pdp, hreflang, wave-0]
requires:
  - next-intl getTranslations server API
  - existing src/types/domain.ts Locale type
  - existing src/i18n/navigation Link
provides:
  - src/lib/seo.ts buildMetadata({path, locale, titleKey, descriptionKey, ogImage?}) helper
  - i18n namespaces Legal / Errors / Meta / Footer.legal / CookieBanner / Shop.categories (EN + AR)
  - src/app/[locale]/legal/ route folder with pass-through layout
  - PDP generateMetadata returning bare title with alternates.languages
  - .planning/phases/09-performance-legal-polish/notes/wave-0-checks.md
affects:
  - all Phase 9 wave 2+ plans (consume buildMetadata, Legal/Errors/Meta namespaces, legal segment)
tech-stack:
  added: []
  patterns:
    - "server-only import on lib/seo.ts"
    - "next-intl namespace cast to never for dynamic 'ns.key' helper APIs"
    - "title.template-aware bare-title pattern in generateMetadata"
key-files:
  created:
    - src/lib/seo.ts
    - src/app/[locale]/legal/layout.tsx
    - .planning/phases/09-performance-legal-polish/notes/wave-0-checks.md
    - .planning/phases/09-performance-legal-polish/deferred-items.md
  modified:
    - messages/en.json
    - messages/ar.json
    - src/components/footer/Footer.tsx
    - src/app/[locale]/shop/[category]/[slug]/page.tsx
decisions:
  - "Returns-policy duration locked at 14 days sitewide (cart-cookie max-age remains 30 days, separate concern)"
  - "Reliability boundary locked: app/global-error.tsx (per RESEARCH Pattern 6) — implemented in Plan 09-05"
  - "PDP migrates to bare-title pattern; root title.template lands in Plan 09-03"
  - "Footer is async Server Component using getTranslations; benefit-bar i18n is deferred and explicitly flagged"
metrics:
  duration: ~9 min
  completed: 2026-05-10
  tasks_total: 6
  tasks_completed: 6
  files_created: 4
  files_modified: 4
  commits: 6
requirements:
  - SEO-03
  - LGL-01
  - LGL-02
  - LGL-03
---

# Phase 9 Plan 01: Wave 0 Foundation Summary

Wave-0 foundation for Phase 9: ships the `buildMetadata` SEO helper, full Legal /
Errors / Meta / Footer.legal / CookieBanner / Shop.categories i18n skeletons in EN
and AR, the `/[locale]/legal` route segment layout, the footer href migration with
the new Cookie Policy link and i18n labels, the sitewide returns-policy
reconciliation to 14 days, and the PDP `generateMetadata` migration to bare-title
form (with hreflang `alternates`). Unblocks all Wave 2+ plans without forcing them
to re-scaffold infrastructure.

## Tasks Completed

| Task | Name | Commit | Files |
|---|---|---|---|
| 1 | Create `src/lib/seo.ts` `buildMetadata` helper | `9853687` | `src/lib/seo.ts` |
| 2 | i18n namespace skeleton (EN + AR) | `82fc62c` | `messages/en.json`, `messages/ar.json` |
| 3 | Footer legal links migration + benefit-bar TODO | `e9e6e24` | `src/components/footer/Footer.tsx` |
| 4 | Returns-policy reconciliation gate (verification only) | (folded into Tasks 2+3) | — |
| 5 | `/[locale]/legal` segment layout | `8b95829` | `src/app/[locale]/legal/layout.tsx` |
| 6 | PDP bare-title fix + hreflang + Wave-0 notes | `a1282e9` | `src/app/[locale]/shop/[category]/[slug]/page.tsx`, `notes/wave-0-checks.md` |
| (fix) | Type widen for next-intl dynamic namespace + deferred-items log | `9a882f0` | `src/lib/seo.ts`, `deferred-items.md` |

## Reconciliations Locked

1. **Returns-policy duration: 14 days everywhere customer-facing.**
   - `Checkout.trust.returnsPolicy` updated EN `30-Day Returns` → `14-Day Returns`,
     AR `إرجاع خلال 30 يوم` → `إرجاع خلال 14 يوم`.
   - `Footer.tsx:17` benefit bar: `Easy returns within 30 days` → `Easy returns within 14 days`.
   - `Shop.returnPolicy` (EN/AR) and `PDPInfoPanel.tsx` already at 14 days; left unchanged.
   - **Cart-cookie max-age (30 days) explicitly out of scope.** `src/lib/cart/session.ts:17`
     (`COOKIE_MAX_AGE = 60 * 60 * 24 * 30`) and the Cookie-Policy `orkiSidDuration`
     row that mirrors it remain `30 days` — that is the cookie lifetime, not a
     returns policy.

2. **`global-error.tsx` over `error.tsx` for catastrophic boundary.** Plan 09-05
   implements `src/app/global-error.tsx` (per RESEARCH Pattern 6). Per-locale
   `[locale]/error.tsx` and `[locale]/not-found.tsx` are also Plan 09-05's
   responsibility for in-app boundary cases.

3. **PDP bare-title pattern.** `generateMetadata` returns `product.name[locale]`
   bare, so the root layout's `title.template = '%s | ORKI'` (set by Plan 09-03)
   appends the suffix exactly once — preventing a `Black Hoodie | ORKI | ORKI`
   double-suffix the moment 09-03 lands. `openGraph.title` and `twitter.title` use
   the explicit `${name} | ORKI` form because `title.template` does not affect
   OG/Twitter metadata in Next.js 15.

4. **Footer is an async Server Component.** No `'use client'`; uses
   `getTranslations('Footer.legal')` directly. Parent locale layout already supports
   awaited child components via JSX.

## i18n Highlights

- **`Shop.categories.{tops,bottoms}.{title,description}` in BOTH locales** —
  consumed by Plan 09-04 Task 4 for `/shop/[category]` `generateMetadata`.
  Unique titles per page (verified: 8 distinct metaTitles across Meta + Legal +
  Shop.categories).
- **`Errors.section.adminOrdersFailed` is intentionally identical EN/AR** — admin
  pages stay EN-only per UI-SPEC.
- **AR legal section bodies prefixed `[AR-LEGAL-REVIEW] [مسودة]`** — Plan 09-02
  drafts the bodies and removes the prefix where AR copy is finalized in formal
  legal register.
- **All metaTitles ≤ 60 chars, all metaDescriptions ≤ 160 chars** (manual code
  review).

## Benefit-bar i18n TODO Marker (Issue #1 fix)

`src/components/footer/Footer.tsx` now carries an explicit
`/* TODO(i18n) benefit-bar: ... */` comment above the four EN-only benefit-bar
lines (shipping / returns / payments / support). Phase 9 reconciles ONLY the
returns-policy duration value within those four lines. Full i18n keying is
deferred and explicitly flagged so future planners do not silently inherit the gap.
Greppable with `grep -E "TODO\(i18n\).*benefit"`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] next-intl namespace TypeScript overload mismatch in `src/lib/seo.ts`**

- **Found during:** Task 6 batch type-check (`npx tsc --noEmit`).
- **Issue:** `getTranslations({ locale, namespace: titleNs })` failed TS2769 because
  next-intl types `namespace` as a literal union derived from the messages manifest;
  passing a dynamic `string` extracted from `titleKey.split('.')` is by design but
  doesn't satisfy the typed overload.
- **Fix:** Cast `titleNs`, `descNs`, `titleSubKey`, `descSubKey` to `never` at the
  call sites. The helper accepts `'ns.key'` strings dynamically by API contract;
  the cast widens the type system to match runtime behavior. Documented inline.
- **Files modified:** `src/lib/seo.ts`.
- **Commit:** `9a882f0`.

### Out-of-scope Discoveries (logged, not fixed)

See `.planning/phases/09-performance-legal-polish/deferred-items.md`:

- `src/app/[locale]/checkout/page.tsx:57` — pre-existing `PaymentMethod` literal-union
  mismatch (`'visa'` not in canonical type). Phase 8 territory.
- `tests/**/*.{ts,tsx}` — pre-existing fixture drift (`Size` missing `id`/`stock`)
  and stale assumption that `getAllProducts()` is synchronous.

These were NOT fixed because they are not directly caused by this plan's changes.

## Self-Check: PASSED

**Files exist:**
- FOUND: `src/lib/seo.ts`
- FOUND: `messages/en.json`
- FOUND: `messages/ar.json`
- FOUND: `src/components/footer/Footer.tsx`
- FOUND: `src/app/[locale]/legal/layout.tsx`
- FOUND: `src/app/[locale]/shop/[category]/[slug]/page.tsx`
- FOUND: `.planning/phases/09-performance-legal-polish/notes/wave-0-checks.md`

**Commits exist on `worktree-agent-a5fed4c4dd5f96501`:**
- FOUND: `9853687` feat(09-01): add buildMetadata helper with hreflang alternates
- FOUND: `82fc62c` feat(09-01): add Legal/Errors/Meta/Footer.legal/CookieBanner i18n namespaces
- FOUND: `e9e6e24` feat(09-01): migrate footer legal links and reconcile returns to 14 days
- FOUND: `8b95829` feat(09-01): add /[locale]/legal segment layout (pass-through)
- FOUND: `a1282e9` feat(09-01): fix PDP title double-suffix + add hreflang alternates + Wave 0 notes
- FOUND: `9a882f0` fix(09-01): widen next-intl namespace type for buildMetadata + log deferred items

**Verification gates passed:**
- Task 1: `seo.ts` has all four key strings (`'server-only'`, `buildMetadata`, `alternates`, `'x-default'`, `og-default.png`).
- Task 2: EN+AR both parse; Legal/Errors/Meta/Footer.legal/CookieBanner namespaces present; `Checkout.trust.returnsPolicy` includes `14`; `Shop.categories.{tops,bottoms}.{title,description}` present; 8 metaTitles all unique.
- Task 3: Footer has `/legal/{privacy,terms,cookies}` hrefs (3 matches); old `/privacy`/`/terms` removed; `Easy returns within 14 days` present, 30-days variant absent; `getTranslations` imported; `TODO(i18n) benefit` comment present; no `'use client'`.
- Task 4: TrustSignals reads `returnsPolicy` from i18n; PDPInfoPanel reads `Free returns within 14 days`; no 30-day variants in src/messages (only the cart-cookie max-age comment + cookie-policy table row, both allowlisted).
- Task 5: legal/layout.tsx has `LegalLayout` async function, no `<html>`/`<body>`/Navbar/Footer.
- Task 6: PDP has `alternates`, `'x-default'`, `const title = product.name[locale]`; old double-suffix line removed; notes file mentions `global-error`, `14 days`, `Wave 4`.
- `tsc --noEmit` is clean for all plan files (single remaining error is pre-existing in `checkout/page.tsx`, logged in deferred-items.md).
