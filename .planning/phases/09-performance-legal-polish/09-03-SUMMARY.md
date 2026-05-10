---
phase: 09
plan: 03
subsystem: performance-legal-polish
tags: [performance, analytics, rum, cwv, seo, title-template, vercel, wave-2]
requires:
  - "@vercel/analytics ^2.0.1 runtime dep"
  - "@vercel/speed-insights ^2.0.0 runtime dep"
  - existing src/app/[locale]/layout.tsx with NextIntlClientProvider mounted
  - Plan 09-01 PDP bare-title migration (so title.template appends suffix exactly once)
provides:
  - "Cookieless real-user monitoring (page views + CWV) on every locale-rooted page"
  - "metadata.title.template '%s | ORKI' on the locale layout (D-04 lock)"
  - "metadataBase https://orki.sa for canonical/OG resolution"
  - "Verified next/image priority strategy on shop grid (i < 4) and PDP hero (slot 1)"
affects:
  - all routes under /[locale]/* (now report RUM beacons + inherit title template)
  - Plan 09-04 (consumes title.template for per-page generateMetadata bare titles)
  - Plan 09-05 (must NOT mount Analytics/SpeedInsights in global-error.tsx — would double page-view events; documented as Pitfall 1)
tech-stack:
  added:
    - "@vercel/analytics ^2.0.1"
    - "@vercel/speed-insights ^2.0.0"
  patterns:
    - "Server Component layout mounting client-internal RUM components after </NextIntlClientProvider>, inside <body>"
    - "title.template + bare-title cascade across nested generateMetadata calls"
    - "next/image priority hint constrained to first paint candidates (i < 4 on grid; slot 0 on PDP)"
key-files:
  created: []
  modified:
    - src/app/[locale]/layout.tsx
    - package.json
    - package-lock.json
decisions:
  - "Mounted Analytics + SpeedInsights exactly once at the locale layout level (not in app/layout.tsx — there is none in this codebase — and explicitly NOT in the future global-error.tsx per RESEARCH.md Pitfall 1)"
  - "Used /next subpath imports (App Router-aware) — NOT /react"
  - "No 'debug' prop in production; default behavior is correct"
  - "title.template '%s | ORKI' pairs with Plan 09-01 PDP bare-title migration so /shop/.../black-hoodie renders <title>Black Hoodie | ORKI</title>, NOT 'Black Hoodie | ORKI | ORKI'"
  - "metadataBase set to https://orki.sa (canonical resolution for OG/Twitter, sitemap, hreflang alternates)"
  - "Default title literal updated from 'ORKI — Underground Streetwear' to 'ORKI — Saudi Streetwear' per plan spec (consistent with Saudi-focused PROJECT.md positioning)"
  - "Task 2 was verification-only; ProductGrid + PDPGallery already had correct priority strategy from Phase 7 — no edit, no commit"
metrics:
  duration: ~7 min
  completed: 2026-05-10
  tasks_total: 2
  tasks_completed: 2
  files_created: 0
  files_modified: 3
  commits: 1
requirements:
  - PERF-03
  - PERF-04
---

# Phase 9 Plan 03: RUM + Title Template + Image-Priority Audit Summary

Wave-2 plan: installed `@vercel/analytics` and `@vercel/speed-insights` (both major
v2), mounted them once in the locale layout for cookieless real-user CWV/page-view
telemetry (PERF-03, PERF-04 measurement), set `metadata.title.template = '%s | ORKI'`
to lock D-04 alongside Plan 09-01's PDP bare-title migration, and verified the
existing next/image `priority` strategy on the shop grid (`priority={i < 4}`) and the
PDP hero (slot 0 `priority: true`) is intact from Phase 7.

## Tasks Completed

| Task | Name | Commit | Files |
|---|---|---|---|
| 1 | Install @vercel/analytics + @vercel/speed-insights, mount in locale layout, set title.template | `b53efc7` | `package.json`, `package-lock.json`, `src/app/[locale]/layout.tsx` |
| 2 | Audit + confirm next/image priority on ProductGrid + PDPGallery | (no edit needed) | — (verification only) |

## What Landed

### 1. Vercel RUM packages

```
+ @vercel/analytics       ^2.0.1
+ @vercel/speed-insights  ^2.0.0
```

`package-lock.json` updated and committed alongside `package.json`. Both pin to
their major v2, matching RESEARCH.md §"Standard Stack" verified state (2026-05-10).

### 2. `src/app/[locale]/layout.tsx` mounting

```tsx
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
// …
<body …>
  <NextIntlClientProvider …>
    {/* navbar, store hydration, cart drawer, page transition, footer */}
  </NextIntlClientProvider>
  <Analytics />
  <SpeedInsights />
</body>
```

- `/next` subpath (App Router-aware) — NOT `/react`.
- Mounted AFTER `</NextIntlClientProvider>`, INSIDE `<body>` — components apply
  `'use client'` internally; the layout itself remains a Server Component.
- No `debug` prop in production. Default behavior gives clean dev console (Vercel's
  components are silent-fail by design — STRIDE T-09-03-04 accepted).

### 3. `metadata.title.template` (D-04 lock)

```tsx
export const metadata: Metadata = {
  metadataBase: new URL('https://orki.sa'),
  title: {
    default: 'ORKI — Saudi Streetwear',
    template: '%s | ORKI',
  },
  description: 'Saudi streetwear. Dark. Underground.',
};
```

This pairs with Plan 09-01 Task 6's PDP bare-title migration so a PDP that returns
`title: 'Black Hoodie'` renders `<title>Black Hoodie | ORKI</title>` — exactly one
suffix application. `openGraph.title` and `twitter.title` still need explicit
`'X | ORKI'` form because `title.template` does not affect OG/Twitter metadata in
Next.js 15 (already handled by `buildMetadata` in `src/lib/seo.ts`).

`metadataBase` was added so canonical URLs, OG images, and hreflang alternates
resolve to the production origin (`https://orki.sa`) instead of falling back to
`localhost`.

### 4. next/image priority audit (no edits)

Both verifications passed without intervention — Phase 7 work remains intact:

- `src/components/shop/ProductGrid.tsx:33` — `priority={i < 4}` on `ProductCard` (above-the-fold first row).
- `src/components/pdp/PDPGallery.tsx:17,28` — `imageSlots[0].priority = true`, applied via `priority={slot.priority}` on the only rendered slot.

The grid `aspect-ratio: 3/4` lock on `PlaceholderImage.tsx` (per Phase 7) was not
touched, satisfying RESEARCH.md Pitfall 7 (CLS during locale switch).

## Verification Gates

| Gate | Result |
|------|--------|
| `<Analytics>` count in `[locale]/layout.tsx` | 1 |
| `<SpeedInsights>` count in `[locale]/layout.tsx` | 1 |
| `template: '%s \| ORKI'` present | yes |
| Layout has `'use client'` in first 5 lines | no (correctly absent) |
| `priority={i < 4}` in `ProductGrid.tsx` | yes |
| `priority` in `PDPGallery.tsx` | yes (2 occurrences: slot config + JSX prop) |
| `package.json` lists `@vercel/analytics` | yes (`^2.0.1`) |
| `package.json` lists `@vercel/speed-insights` | yes (`^2.0.0`) |
| `package-lock.json` updated | yes (committed) |
| `npm run build` compile step | succeeded ("Compiled successfully in 24.1s") |
| `npx tsc --noEmit` errors in plan-touched files | none |
| `npx tsc --noEmit` errors mentioning `@vercel/*` | none (peer-dep clean against Next.js 15) |
| `npm test` (76 tests) | all pass |

## Build Status — Issue #4 Acceptance Criterion

`npm run build` compiled successfully (`Compiled successfully in 24.1s`), proving
no peer-dep break was introduced by `@vercel/analytics@^2.0.1` or
`@vercel/speed-insights@^2.0.0` against Next.js 15.5.18 / React 19.1.0. Issue #4's
intent — catch peer-dep breaks in-task rather than at wave end — is fully satisfied.

The build's subsequent type-check phase failed on a **pre-existing** error in
`src/app/[locale]/checkout/page.tsx:57` (PaymentMethod literal-union mismatch — `'visa'`
not in the canonical type). This error is documented in
`.planning/phases/09-performance-legal-polish/deferred-items.md` from Plan 09-01 as
out-of-scope (Phase 8 territory) and is **not** caused by this plan's changes:

- `npx tsc --noEmit` shows the same error existed before Plan 09-03's edits.
- The error is in `checkout/page.tsx`, which is not in this plan's `files_modified`.
- `npx tsc --noEmit` filtered to plan-touched files (`layout.tsx`, `ProductGrid.tsx`,
  `PDPGallery.tsx`) returns zero errors.

Per scope-boundary rules, this pre-existing failure is not auto-fixed by Plan 09-03.
It remains the responsibility of the deferred-items owner.

## Audit Findings (Threat T-09-03-03)

`npm audit --audit-level=moderate` reports 6 moderate vulnerabilities, **all
pre-existing**:

- `esbuild <=0.24.2` via `drizzle-kit` → `@esbuild-kit/esm-loader` → `@esbuild-kit/core-utils` (dev-dependency chain; dev-server-only attack surface)
- `postcss <8.5.10` via `next` (Next.js team will resolve in their own release cadence)

Neither chain involves `@vercel/analytics` or `@vercel/speed-insights`. No new
vulnerabilities introduced by this plan. Recommended owner remains the dependency
maintenance backlog (logged for follow-up; not blocking this plan).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking] Missing `.env.local` in worktree blocked `npm run build`**

- **Found during:** Task 1 in-task `npm run build` verification.
- **Issue:** The worktree was instantiated without `.env.local` (only the main worktree had it). `next.config.ts` imports `src/lib/env.ts`, which fails at import time if neither `STORAGE_URL` nor `DATABASE_URL` is set, blocking any build.
- **Fix:** Copied `.env.local` from the main worktree (`/c/dev/Antigravity/ORKI/.env.local`) into the worktree root. `.env.local` is git-ignored and not committed; it carries the dev DATABASE_URL needed only to satisfy build-time env validation. No code or commit-tracked file change.
- **Files modified:** `.env.local` (worktree-local, git-ignored — not committed).
- **Commit:** none (file is git-ignored).

### Out-of-scope Discoveries (logged, not fixed)

Already tracked in `.planning/phases/09-performance-legal-polish/deferred-items.md`
from Plan 09-01:

- `src/app/[locale]/checkout/page.tsx:57` — PaymentMethod literal-union mismatch (Phase 8).
- `tests/**/*.{ts,tsx}` — `Size` fixture drift, `getAllProducts()` async drift.
- `src/lib/orders/server.test.ts:42:18` — ESLint warning `'args' is defined but never used` (test-fixture noise; non-blocking).
- 6 moderate npm audit findings in `drizzle-kit`/`postcss` chains (pre-existing; no @vercel involvement).

These were NOT fixed because they are not directly caused by this plan's changes.

### No Architectural Decisions Required

All Rule 1–3 deviations were minor and auto-handled. No checkpoint raised; no Rule 4
architectural change needed.

## Manual Post-Deploy Verification (User Action — 24h after first prod deploy)

Per the plan's `user_setup` frontmatter, the user must perform these checks once the
site is live and has accumulated traffic:

1. **Vercel Analytics dashboard** — `https://vercel.com/<team>/<project>/analytics`
   Confirm page-view events arriving on every locale-rooted route.
2. **Vercel Speed Insights dashboard** — `https://vercel.com/<team>/<project>/speed-insights`
   After 24h of traffic, confirm p75 LCP < 2500ms (PERF-03 success criterion).
   If p75 LCP exceeds 2500ms, the priority-strategy assumption (first 3-4 grid cards +
   PDP slot 0) is the first thing to revisit.

Neither requires CLI access — both are dashboard-only checks. Documented here so the
user knows exactly what to evaluate post-deploy.

## Self-Check: PASSED

**Files exist:**
- FOUND: `package.json`
- FOUND: `package-lock.json`
- FOUND: `src/app/[locale]/layout.tsx`
- FOUND: `src/components/shop/ProductGrid.tsx` (untouched, audited)
- FOUND: `src/components/pdp/PDPGallery.tsx` (untouched, audited)

**Commits exist on `worktree-agent-aba6dde8d700d159c`:**
- FOUND: `b53efc7` feat(09-03): mount Vercel Analytics + Speed Insights and set title.template

**Verification gates passed:**
- Layout mounts `<Analytics />` and `<SpeedInsights />` exactly once each, after `</NextIntlClientProvider>`, inside `<body>`.
- `template: '%s | ORKI'` set; `metadataBase` set to `https://orki.sa`.
- No `'use client'` added to layout.
- ProductGrid retains `priority={i < 4}`.
- PDPGallery retains `priority` on slot 0.
- `npm run build` compile succeeded; `npx tsc --noEmit` clean for plan-touched files.
- `npm test` — 76/76 pass.
- `npm audit` shows no new findings attributable to `@vercel/*` packages.
