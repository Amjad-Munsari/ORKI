# Phase 9 — Wave 0 Sanity Checks

**Date:** 2026-05-10
**Owner:** Plan 09-01 (Wave 0 foundation)

This file records the four reconciliations/checks performed in Wave 0 before any
downstream Phase 9 plan executes, plus the post-revision Phase 9 wave manifest.

---

## 1. vitest.config.ts presence (verified)

`vitest.config.ts` exists at the repo root (single source of truth for unit-test
configuration). Plan 09-01 does not modify it — tests authored in later Phase 9
plans (e.g. error-boundary smoke test in Plan 09-05) will inherit this config
unchanged. No action required in Wave 0.

## 2. PDP `generateMetadata` double-suffix fix (applied)

**Problem:** Plan 09-03 (Wave 2) will set `metadata.title = { default, template: '%s | ORKI' }`
in `[locale]/layout.tsx`. The existing PDP at `src/app/[locale]/shop/[category]/[slug]/page.tsx`
previously composed `const title = ${product.name[locale]} | ORKI` inline — once the
parent template lands, `<title>` would render as `Black Hoodie | ORKI | ORKI`
(double-suffix).

**Fix (this plan, Task 6):**
- `title` field returns BARE product name (`product.name[locale]`) so the root
  `title.template` appends `| ORKI` exactly once.
- `openGraph.title` and `twitter.title` use the explicit `${name} | ORKI` form —
  Next.js 15 `title.template` only affects the `<title>` element / `metadata.title`,
  NOT `openGraph.title` or `twitter.title`. Composing those explicitly preserves the
  full branded form in social cards.
- `alternates.languages` block added: `en`, `ar`, `x-default` keys all point at the
  product's category/slug path under each locale (was missing entirely before this
  plan).

PDP keeps its dynamic OG image (`product.images[0]`) — it does NOT route through the
new `buildMetadata` helper.

## 3. Returns-policy reconciliation (locked at 14 days)

Audit results before Wave 0:

| Surface | Value before | Value after |
|---|---|---|
| `Shop.returnPolicy` (EN PDP info) | 14 days | 14 days (unchanged) |
| `Shop.returnPolicy` (AR PDP info) | 14 يوماً | 14 يوماً (unchanged) |
| `Checkout.trust.returnsPolicy` (EN) | 30-Day Returns | **14-Day Returns** |
| `Checkout.trust.returnsPolicy` (AR) | إرجاع خلال 30 يوم | **إرجاع خلال 14 يوم** |
| `src/components/footer/Footer.tsx:17` (inline EN) | Easy returns within 30 days | **Easy returns within 14 days** |
| `src/components/pdp/PDPInfoPanel.tsx:78` (inline EN) | Free returns within 14 days | Free returns within 14 days (unchanged) |
| `src/components/pdp/PDPInfoPanel.tsx:77` (inline AR) | إرجاع مجاني خلال 14 يوماً | (unchanged) |

**Cart-cookie max-age is NOT a returns-policy surface.** The literal `30 days` at
`src/lib/cart/session.ts:17` is the `orki_sid` cookie's `Max-Age` (constant
`COOKIE_MAX_AGE = 60 * 60 * 24 * 30`) and the `orkiSidDuration` row in
`messages/{en,ar}.json` Cookie-Policy table that exposes the same value. Both are
explicitly out of scope for the 14-day returns reconciliation and are preserved as is.

Sitewide, all customer-facing returns mentions now read 14 days.

## 4. AR formal-legal-register flags

Plan 09-01 scaffolds the `Legal.{privacy,terms,cookies}.section*.body` keys with a
`[AR-LEGAL-REVIEW] [مسودة]` prefix in `messages/ar.json` for every section body
(Plan 09-02 owns the actual copy). The flag is a literal substring inside the JSON
value (JSON has no comment syntax). When Plan 09-02 fills in body copy, it MUST:

- Drop the `[AR-LEGAL-REVIEW]` prefix on each AR body it finalizes.
- Use formal Arabic legal register (per Pitfall 6 / RESEARCH §"AR formal legal register").
- Leave the prefix in place ONLY on bodies whose AR draft remains uncertain.

Flagged sections at the end of Plan 09-01: ALL privacy/terms/cookies section bodies
(every body is a placeholder).

## 5. error.tsx vs global-error.tsx (locked: global-error.tsx)

RESEARCH Pattern 6 recommends `app/global-error.tsx` (replaces the entire document
tree, including `<html>` and `<body>`). UI-SPEC initially mentioned `app/error.tsx`.
**Locked decision:** Plan 09-05 implements `src/app/global-error.tsx` (the canonical
Next.js 15 surface for catastrophic errors that bubble past the locale layout).
Per-locale `src/app/[locale]/error.tsx` and `src/app/[locale]/not-found.tsx` are
ALSO implemented in Plan 09-05 for normal in-app error / 404 boundaries.

## 6. Phase 9 wave manifest (post-revision, locked)

| Wave | Plans | Depends on |
|---|---|---|
| **Wave 1** | 09-01 (this plan — Wave 0 foundation) | (root) |
| **Wave 2** | 09-02 (legal pages), 09-03 (analytics + title.template), 09-06 (cookie scaffold) | 09-01 only — three plans run parallel |
| **Wave 3** | 09-04 (sitemap + robots + OG + per-page metadata wiring) | 09-01 + 09-03 (consumes title.template set by 09-03) |
| **Wave 4** | 09-05 (error boundaries + reliability hygiene) | 09-01 + 09-04 |

Same-wave plans have zero `files_modified` overlap. Plan 09-04 was bumped from
Wave 2 to Wave 3 to ensure Plan 09-03 sets `title.template` before 09-04 wires
per-page `generateMetadata` (otherwise smoke tests could observe partial state).
Plan 09-05 was bumped to Wave 4 to keep its `depends_on: ['09-01', '09-04']` graph
valid.
