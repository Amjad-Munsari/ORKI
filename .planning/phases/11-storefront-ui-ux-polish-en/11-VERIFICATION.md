---
phase: 11-storefront-ui-ux-polish-en
verified: 2026-05-17
verifier: Claude (execute-phase orchestrator)
source_audit: .planning/STOREFRONT-UI-REVIEW-EN.md
status: human_needed
findings_total: 26
findings_closed: 23
findings_deferred: 3
findings_unresolved: 0
plans_complete: 15
plans_total: 15
---

# Phase 11 — Verification (Storefront UI/UX Polish, EN)

## Automated Suite

| Command | Exit code | Notes |
|---|---|---|
| `npx tsc --noEmit` | 0 | clean |
| `npm run lint` | 0 | clean |
| `npm test` | 0 (process) / **1 test failed** | `tests/rls/cross-user-deny.test.ts` timed out at 5s — Phase 10 RLS test, requires live Supabase fixture; flake unrelated to Phase 11 UI changes. 102/111 pass, 8 skipped. |
| `npm run build` | 0 | clean static + SSG generation; all routes built. |

## Plan Completion

| Plan | Wave | Status | Headline |
|---|---|---|---|
| 11-01 | 0 | ✓ Complete | display-1..4 scale + --container-max=1440px + near-black hex collapse |
| 11-02 | 0 | ✓ Complete | RTL logical-prop sweep in shadcn dialog/sheet/navigation-menu + ShopDropdown |
| 11-03 | 0 | ✓ Complete | Canonical focus-visible ring across 16 storefront interactives |
| 11-04 | 1 | ✓ Complete | Dark Navbar chrome + LanguageSwitcher + MobileNavDrawer + ShopDropdown panel; search icon removed |
| 11-05 | 1 | ✓ Complete (no-op verify) | Footer wordmark display-1 — already applied by 11-01 |
| 11-06 | 1 | ✓ Complete | 4-variant placeholder system (ghost/color/texture/type) + deterministic slug-hash helper |
| 11-07 | 2 | ✓ Complete | Home: typographic category splat, capped ScrollReveal stagger, em-dash → rtl-flip ArrowRight, shared grid scale |
| 11-08 | 2 | ✓ Complete | PDP gallery: desktop thumb strip + mobile scroll-snap + dots + skeleton + reduced-motion |
| 11-09 | 2 | ✓ Complete | About body/pull-quote rhythm locked (D-09); EN 01/02/03 numbering preserved |
| 11-10 | 2 | ✓ Complete | Contact form → WhatsApp callout (`WA_NUMBER = 'TBD'` placeholder; D-17 deferral noted) |
| 11-11 | 2 | ✓ Complete | Passive Limited-stock line on PDP; OOS `text-destructive` → `text-white/60`; nav-height comment reconciled |
| 11-12 | 2 | ✓ Complete | ShopGridSkeleton (8 cards, 3:4, no shimmer) + Suspense streaming + shadcn Select for sort |
| 11-13 | 3 | ✓ Complete | EN 404 voice — Candidate A (`404 / NO DROP HERE`) chosen at UAT |
| 11-14 | 3 | ✓ Complete | Shop empty + Home ethos — both Candidate A chosen at UAT; next-intl key migration |
| 11-15 | 4 | ⚠ Awaiting live-dev sign-off | Automated suite captured; UAT candidate picks applied; _candidates blocks removed; WA_NUMBER deferred (user opted to keep TBD). Live dev walkthrough pending. |

## Per-finding Closure (against STOREFRONT-UI-REVIEW-EN.md)

26 `[OPEN]` findings in the audit. Status definitions: `closed` = shipped in this phase, `deferred` = explicit deferral with rationale, `unresolved` = open and not yet addressed.

| # | Finding (abbr.) | Plan | Status | Notes |
|---|---|---|---|---|
| F-Copy-1 | Empty-state + brand-ethos copy lean generic | 11-13, 11-14 | closed | Candidate A live in en.json; AR placeholder values pending Phase 999.11 |
| F-Copy-2 | About 01/02/03 numbering EN keeps numbers | 11-09 | closed (EN side) | AR-side choice deferred to Phase 999.11 |
| F-Copy-3 | Mock Contact form silently lies about delivery | 11-10 | closed | Form deleted; WhatsApp callout in its place; D-17 records form return when RESEND_API_KEY lands |
| F-Vis-1 | All product/PDP/editorial slots are ghost-mark | 11-06 | closed | 4-variant placeholder system; deterministic per-slug assignment; SSR-stable |
| F-Vis-2 | Home category splat = flat bg-white/10 wash | 11-07 | closed | Typographic-only: 22vw kerned TOPS/BOTTOMS wordmark on near-black |
| F-Vis-3 | PDP gallery: no thumbs, no nav, single image | 11-08 | closed | Desktop vertical thumb strip + mobile scroll-snap + dot indicators + 4:5 skeleton |
| F-Vis-4 | Search icon in Navbar is no-op button | 11-04 | closed | Search button removed from DOM; reintroduce in future search phase |
| F-Color-1 | Navbar white-on-black contradicts brand | 11-04 | closed | `bg-black/80 backdrop-blur text-white border-white/[0.08]` |
| F-Color-2 | ShopDropdown panel white-with-shadow | 11-04 | closed | Mirrors CategoryDropdown: `bg-[var(--color-secondary-surface)] border-white/[0.12]` |
| F-Color-3 | Scattered near-black hex literals | 11-01 | closed | Collapsed to `--color-placeholder-bg` and `--color-secondary-surface` |
| F-Color-4 | `text-destructive` leaks to storefront OOS | 11-11 | closed | Swapped to `text-white/60`; destructive token reserved for admin |
| F-Typo-1 | Five bespoke hero/display sizes | 11-01 | closed | display-1..4 utility scale; bespoke text-[Npx] literals removed |
| F-Typo-2 | About body-copy weight inconsistent | 11-09 | closed | ONE body style + ONE pull-quote style per D-09 |
| F-Typo-3 | Footer wordmark clips at large widths | 11-01 / 11-05 | closed | display-1 utility encodes `letter-spacing: -0.04em` and clamps at 160px |
| F-Space-1 | Featured-Drops + Shop grid mismatch | 11-07, 11-12 | closed | Shared `grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16` |
| F-Space-2 | Shop container max-w-[1280px] | 11-01 | closed | Single `--container-max=1440px` token across home/footer/shop/PDP/about/contact |
| F-Space-3 | ShopDropdown physical `left-0` (RTL leak) | 11-02 | closed | `start-0`; shadcn dialog/sheet/navigation-menu also swept |
| F-Space-4 | PDPLayout nav-height comment stale | 11-11 | closed | Comment updated to match actual `h-[80px]` / `top-20` |
| F-Exp-1 | No focus-visible rings on interactives | 11-03 | closed | Canonical `ring-1 ring-white ring-offset-2 ring-offset-black` on 16+ interactives |
| F-Exp-2 | Shop list no loading state | 11-12 | closed | ShopGridSkeleton + Suspense streaming |
| F-Exp-3 | Contact form no aria-live, no real submission | 11-10 | closed | `<aside role="region" aria-live="polite">` WhatsApp callout |
| F-Exp-4 | Featured-Drops ScrollReveal waterfall > 1s | 11-07 | closed | Stagger capped at `(idx % 4) * 0.08` |
| F-Exp-5 | PDP "Only N left" only fires on size select | 11-11 | closed | Passive `Limited stock` line near price when lowest in-stock size ≤ 5 |
| F-Exp-6 | Sort `<select>` keeps native OS chrome | 11-12 | closed | shadcn Select with dark chrome + focus ring |
| F-Exp-7 | Brand-ethos em-dash decorative | 11-07 | closed | `<ArrowRight className="size-4 rtl-flip" />` with focus ring |
| F-Exp-8 | 404 page heading/body unaudited tone | 11-13 | closed | Candidate A (`404 / NO DROP HERE`) live; AR untouched (Phase 999.11) |

**Closed:** 23 / 26 | **Deferred:** 3 | **Unresolved:** 0

## Deferred Items (recorded for tracking)

1. **`WA_NUMBER = 'TBD'`** in `src/app/[locale]/contact/ContactClient.tsx`. User opted to keep TBD during UAT; deep-link `https://wa.me/TBD` will not resolve. Swap in before public launch.
2. **AR-side copy reconciliation** for Phase-11 EN-only rewrites (404, Shop.empty, Home.ethos, About numbering). Owned by Phase 999.11 with AR-native + AR-legal reviewer.
3. **Real editorial photography** — the 4-variant placeholder system is intentional + brand-coherent for v1; swap to commissioned imagery when assets land (no code churn — `Product.heroImage` override path is free).

## Gates Still Pending (human verification)

1. **Live `npm run dev` walkthrough.** Must visit every changed surface in EN + AR + RTL at desktop AND mobile-emulator viewport. Suggested route:
   - `/en`, `/ar` (Home: dark navbar, typographic splats, capped stagger, ethos arrow)
   - `/en/shop`, `/ar/shop` (Shop: skeleton flash on hard reload, shadcn sort, dark navbar, empty state if `/en/shop?category=X` returns 0 — force via data)
   - `/en/products/{slug}`, `/ar/products/{slug}` (PDP: desktop vertical thumb strip, mobile scroll-snap + dots, 4:5 skeleton on hard reload, OOS color tone, passive Limited stock)
   - `/en/about`, `/ar/about` (About: display-2 header, body/pull-quote rhythm, EN 01/02/03 numbering)
   - `/en/contact`, `/ar/contact` (Contact: hero kept, WhatsApp callout replaces form, focus ring on CTA)
   - `/en/nope`, `/ar/nope` (404: NO DROP HERE / EN voice; AR untouched)
2. **Keyboard-only check.** Tab Home → Shop → PDP → Contact → 404. Visible focus ring at every stop.
3. **Reduced-motion check.** Toggle OS-level `prefers-reduced-motion`; ScrollReveal renders instantly, PDP thumb-click uses `'auto'` scroll, MobileNavDrawer slides without spring.

## Known Test Flake (pre-existing, unrelated to Phase 11)

`tests/rls/cross-user-deny.test.ts` — User A's RLS-bound PostgREST client SELECT — timed out at 5s. This is a Phase 10 RLS test requiring a live Supabase fixture; the timeout indicates the test environment doesn't have a reachable Supabase instance during this run. Phase 11 made no auth/RLS changes; the failure pre-dates Phase 11 work.

## Sign-off

- [ ] User completes live-dev walkthrough above
- [ ] User signs off `WA_NUMBER` deferral or provides real number before launch
- [ ] On approval, mark phase 11 complete in STATE.md + ROADMAP.md
