---
audit_type: storefront-cross-phase
scope: en-locale + structural
audit_date: 2026-05-16
split_date: 2026-05-16
overall_score: 14/24
pillars:
  copywriting: 2
  visuals: 2
  color: 3
  typography: 2
  spacing: 3
  experience_design: 2
total_findings: 23
blockers: 4
majors: 11
minors: 6
cosmetics: 2
out_of_scope: [checkout, cart, admin, auth, account, ar-copy-reconciliation]
status_legend:
  - "[CLOSED]: shipped in cited commit"
  - "[OPEN]: in scope for Phase 11"
sibling_file: STOREFRONT-UI-REVIEW-AR.md
---

# Storefront UI Review — ORKI (EN scope)

Cross-phase visual audit of the public storefront: Home, Shop (+ category), PDP, About, Contact, global Navbar, global Footer, and per-locale 404. Code-only audit (no live dev server in audit session). EN-leaning and structural findings live here; pure AR-copy reconciliation moved to `STOREFRONT-UI-REVIEW-AR.md`.

Each finding is tagged `[CLOSED]` or `[OPEN]` to drive Phase 11 planning.

## Score Card
| Pillar | Score | One-line rationale |
|--------|-------|--------------------|
| Copywriting | 2/4 | Editorial pages read like Lorem Ipsum streetwear; key chrome (Footer benefit bar, three Footer columns) is hardcoded English; home H1 is generic "Timeless Essentials for the Season" — not underground. |
| Visuals | 2/4 | PDP gallery only renders one image despite an array contract; every product/PDP/about/hero image is the ghost-mark placeholder, so the storefront currently reads as a placeholder kit, not a brand. |
| Color | 3/4 | Genuine black-and-white discipline holds across storefront pages. Single brand-mode break: the global Navbar is white-on-black, not the dark-first chrome the brand promises. |
| Typography | 2/4 | CLAUDE.md mandates Space Grotesk; code ships Geist. `--font-sans` referenced in `@theme` but never defined (silent fallback to system sans). Display-size scale is loose (`text-[90px]`, `text-[120px]`, `text-[160px]`, `text-[100px]`) — five different bespoke hero sizes. |
| Spacing | 3/4 | Logical-property hygiene is good in storefront chrome; a few imported shadcn primitives keep `left-`/`right-`/`pl-`/`pr-` which leaks into ShopDropdown (`top-full left-0`). Featured-Drops grid and Shop grid don't share a column system. |
| Experience Design | 2/4 | PageTransition ignores `prefers-reduced-motion`; storefront has no `focus-visible` rings (browser default suppressed by `outline-ring/50` reset); no skeleton/loading state for the shop list; Contact form is mock-only with `setTimeout` and no announcement. |

**Overall:** 14/24

## Findings

### Copywriting

- **[CLOSED in pivot commit] [BLOCKER] Footer benefit bar and three of four footer link groups are hardcoded English.**
  - Evidence: `src/components/footer/Footer.tsx:19,23,27,31` + `:53-77`.
  - Fix: Moved every footer string into `Footer.benefits.*`, `Footer.nav.*`, `Footer.help.*` in `messages/{en,ar}.json` and consumed via `getTranslations`. AR-side keys are placeholder; AR copy quality covered in `STOREFRONT-UI-REVIEW-AR.md`.

- **[CLOSED in pivot commit] [BLOCKER] Home hero copy is generic streetwear filler, not ORKI's "dark / underground / Saudi" voice.**
  - Evidence: `src/app/[locale]/page.tsx:43-46`.
  - Fix: EN hero now `"Made in the noise of Riyadh."` with eyebrow `(SS26 — Drop 01)` and sub-line `"Wear what the city sounds like."`. AR draft landed alongside; AR-native review tracked in sibling AR file.

- **[CLOSED in pivot commit] [MAJOR] PDP info panel never shows the product description.**
  - Evidence: `src/components/pdp/PDPInfoPanel.tsx:26-83`.
  - Fix: Added a `<p>` after price rendering `product.description[locale]` (`PDPInfoPanel.tsx` updated).

- **[OPEN] [MAJOR] Empty-state copy on Shop and the home brand-ethos line lean generic.**
  - Evidence: `src/components/shop/ProductGrid.tsx:14-22`; `src/app/[locale]/page.tsx:94-95`.
  - Fix: Empty state branded ("No drops in this category yet — check back Friday" or similar). Brand-ethos line should reference Riyadh / Najd / specific scene cues.

- **[OPEN] [MINOR] About page uses `01 — Vision / 02 — Heritage / 03 — Quality` numbering in EN, but AR drops the number.**
  - Evidence: `src/app/[locale]/about/page.tsx:39,58,80`.
  - EN-side decision: drop numbering in EN OR adopt numbering in AR. Defer the AR-side choice to AR file.

- **[OPEN] [MINOR] Mock Contact form silently lies about delivery.**
  - Evidence: `src/app/[locale]/contact/ContactClient.tsx:15-22`.
  - Fix: Add `aria-live="polite"` to the success block + a visible "We're still wiring this up — message us on WhatsApp" callout instead of pretending to deliver. (Aligns with EXP-Contact finding below.)

### Visuals

- **[CLOSED in pivot commit] [BLOCKER] PDP gallery only ever renders one image, regardless of how many the product has.**
  - Evidence: `src/components/pdp/PDPGallery.tsx:11-18,20-31`.
  - Fix: Now maps over `images` clamped to `MAX_GALLERY_IMAGES = 6`; `priority` only on the first slot.

- **[OPEN] [BLOCKER] Every product image, hero, and editorial slot is the ghost-mark placeholder.**
  - Evidence: `src/components/PlaceholderImage.tsx:13-14,54-66`; home (`page.tsx:27-34`), About (`about/page.tsx:47-54, 69-76`), home category splat (`page.tsx:115-122`).
  - Fix: Either (a) seed real or licensed editorial imagery into `data/products.ts` for the showcase milestone, or (b) introduce 4–6 distinct placeholder treatments (color blocks, texture, ghost mark, silhouette).

- **[OPEN] [MAJOR] Home category splat overlays a flat `bg-white/10` wash that disappears on hover.**
  - Evidence: `src/app/[locale]/page.tsx:114-123`.
  - Fix: Ship a real category image OR commit to a typographic-only treatment (massive wordmark, kerned, drop-shadowed).

- **[OPEN] [MAJOR] PDP gallery has no thumbnails, no zoom, no navigation.**
  - Evidence: `src/components/pdp/PDPGallery.tsx` (whole file).
  - Fix: Stacked images for desktop + a thumbnail strip or lightbox on click; mobile should be a horizontal swiper with dot indicators.

- **[OPEN] [MINOR] Search icon in Navbar is a no-op button.**
  - Evidence: `src/components/nav/Navbar.tsx:61-66`.
  - Fix: Hide until search ships OR wire to a search drawer/route.

### Color

- **[OPEN] [MAJOR] Global Navbar is white-on-black, contradicting "dark, underground" brand voice.**
  - Evidence: `src/components/nav/Navbar.tsx:23`; `LanguageSwitcher.tsx:23`; `MobileNavDrawer.tsx:62`.
  - Fix: Flip the navbar to `bg-black/80 backdrop-blur text-white border-white/[0.08]` (matches MobileNavDrawer's panel `bg-black border-s border-white/[0.12]`). Update LanguageSwitcher and MobileNavDrawer trigger color tokens accordingly.

- **[OPEN] [MAJOR] ShopDropdown panel is white-with-black-shadow — inconsistent with CategoryDropdown (`bg-[#111111] border-white/[0.12]`).**
  - Evidence: `src/components/nav/ShopDropdown.tsx:50` vs `src/components/nav/CategoryDropdown.tsx:29`.
  - Fix: Once navbar flips dark, mirror CategoryDropdown chrome.

- **[OPEN] [MINOR] Scattered hex literals (`#0a0a0a`, `#0d0d0d`, `#050505`, `#111111`) alongside CSS vars that already encode them.**
  - Evidence: `globals.css:54-59` defines tokens; `page.tsx:27,90,115`, `about/page.tsx:47,69`, `PlaceholderImage.tsx:48` hardcode hex.
  - Fix: Use the CSS variables (`bg-[var(--color-placeholder-bg)]`) and collapse `#050505 / #0a0a0a / #0d0d0d` to a single near-black token.

- **[OPEN] [MINOR] `text-destructive` (warm red-orange) leaks into storefront on PDP OOS.**
  - Evidence: `src/components/shop/StockStateBadge.tsx:55`.
  - Fix: Use `text-white` or `text-white/60`; rely on copy + disabled CTA for the signal.

### Typography

- **[CLOSED in pivot commit] [BLOCKER] Font contract drift: brand spec said Space Grotesk, code ships Geist; `--font-sans` referenced but never defined.**
  - Evidence (closed): `src/app/globals.css:9-10` now `--font-sans: var(--font-geist)`; CLAUDE.md typography table reconciled to Geist + IBM Plex Sans Arabic (commit `bcb9ff9`).

- **[OPEN] [MAJOR] Five different bespoke hero/display sizes across home, about, contact, footer — no shared scale.**
  - Evidence: `page.tsx:43` → `text-[90px]`; `about/page.tsx:29` → `text-[120px]`; `contact/ContactClient.tsx:29` → `text-[100px]`; `footer/Footer.tsx:41` → `text-[160px]`; `page.tsx:92` → `text-7xl` (~72px).
  - Fix: Define a display scale (e.g. `display-1: 160px`, `display-2: 120px`, `display-3: 96px`) in Tailwind theme or as utility classes.

- **[OPEN] [MAJOR] Body-copy weight inconsistent on the About page.**
  - Evidence: `about/page.tsx:40` vs `about/page.tsx:60,82`.
  - Fix: Lock in one body style and one pull-quote style and stick to them.

- **[OPEN] [MINOR] Footer wordmark `text-8xl md:text-[160px]` paired with `tracking-[-0.05em]` clips at large widths.**
  - Evidence: `src/components/footer/Footer.tsx:41-43`.
  - Fix: Tighten to `tracking-[-0.04em]`, cap at `text-9xl` (~128px); consider reduced opacity for editorial restraint.

- **[CLOSED in pivot commit] [MINOR] Arabic body font-size bump was applied blanket to every element.**
  - Evidence (closed): `globals.css` AR bump now scoped to `:lang(ar) :is(p, li, dd, dt, label, blockquote, td, th, figcaption, input, textarea, select, button)` (display sizes excluded). Structural fix; AR readability sign-off lives in the AR file.

### Spacing

- **[OPEN] [MAJOR] Featured-Drops grid and Shop product grid don't share column or gap scale.**
  - Evidence: `src/app/[locale]/page.tsx:66` vs `src/components/shop/ProductGrid.tsx:27`.
  - Fix: Define one storefront product grid (probably `grid-cols-2 md:grid-cols-3 xl:grid-cols-4` with `gap-x-8 gap-y-16`) and use in both places.

- **[OPEN] [MAJOR] Shop container width is `max-w-[1280px]`; home/footer use `max-w-[1440px]`.**
  - Evidence: shop/category/PDP/about/contact all `max-w-[1280px]`; home + Footer `max-w-[1440px]`.
  - Fix: Pick one container token and apply globally.

- **[OPEN] [MINOR] `ShopDropdown` uses physical `left-0` — RTL leak.**
  - Evidence: `src/components/nav/ShopDropdown.tsx:50`. Also check shadcn `ui/dialog.tsx:56,68`, `ui/sheet.tsx:56,68`, `ui/navigation-menu.tsx:87,111`.
  - Fix: Replace `left-0` with `start-0` (Tailwind v4 logical). Structural — included here even though it primarily benefits AR.

- **[OPEN] [MINOR] PDPLayout doc-comment says `Navbar height = h-16` but actual Navbar is `h-[80px]`.**
  - Evidence: `src/components/pdp/PDPLayout.tsx:16` comment vs `src/components/nav/Navbar.tsx:24` vs `src/app/[locale]/layout.tsx:57`.
  - Fix: Align all three to a single `--nav-height` CSS variable OR fix the stale comment.

### Experience Design

- **[CLOSED in pivot commit] [BLOCKER] `PageTransition` ignores `prefers-reduced-motion`.**
  - Evidence (closed): `src/components/PageTransition.tsx` now uses `useReducedMotion()` and short-circuits opacity-only with `duration: 0`.

- **[OPEN] [MAJOR] No `focus-visible` rings on any storefront interactive element.**
  - Evidence: Contact inputs use `focus:outline-none focus:border-white`; Navbar links only `hover:opacity-60`; LanguageSwitcher, CartTrigger, search button, mobile drawer trigger, Shop tab buttons, sort `<select>` — none declare `focus-visible:*`.
  - Fix: Add `focus-visible:ring-1 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black` to every interactive in the storefront.

- **[OPEN] [MAJOR] Shop list has no loading state.**
  - Evidence: `src/app/[locale]/shop/page.tsx:33-52`; `Suspense fallback={null}` at `shop/page.tsx:79`.
  - Fix: Add a card-grid skeleton (8 placeholder cards at 3:4 aspect ratio, `bg-white/[0.03]`) as the Suspense fallback. PDP sticky info panel should also have a loading shell.

- **[OPEN] [MAJOR] Contact form has no real submission, no validation feedback, no `aria-live` announcement.**
  - Evidence: `ContactClient.tsx:15-22,52-99`.
  - Fix: Add `aria-live="polite"` to the `sent` block. Use the existing `Field` component for inline validation. If backend isn't wired this phase, render a visible WhatsApp callout instead of mocking delivery.

- **[OPEN] [MAJOR] Featured-Drops grid mounts with per-card ScrollReveal stagger that waterfalls > 1s.**
  - Evidence: `src/app/[locale]/page.tsx:67-70` — `delay={idx * 0.1}` (no cap). `ProductGrid.tsx:29` is capped (OK).
  - Fix: Cap home stagger at `(idx % 4) * 0.08` and tighten ScrollReveal duration from 800ms to ~500ms.

- **[OPEN] [MINOR] PDP "Only N left" only fires when `selectedSize` is chosen.**
  - Evidence: `src/components/pdp/PDPInfoPanel.tsx:42-54`.
  - Fix: Surface the lowest in-stock count across sizes as a passive line near the price (e.g. "Limited stock") and keep the per-size gated version on selection.

- **[OPEN] [MINOR] Sort `<select>` keeps native OS chrome.**
  - Evidence: `src/components/shop/ShopHeader.tsx:88-99`.
  - Fix: Use shadcn `Select` (already in project) or `appearance-none` + explicit chevron.

- **[OPEN] [COSMETIC] Brand-ethos em-dash trail (`Read Our Story —`) is decorative-only.**
  - Evidence: `src/app/[locale]/page.tsx:102-103`.
  - Fix: Use a logical-aware glyph or `<ArrowRight class="rtl-flip">` using the existing `.rtl-flip` utility (`globals.css:189-191`).

- **[OPEN] [COSMETIC] 404 page heading/body copy uses `Errors.notFound.*` keys — unaudited tone.**
  - Evidence: `src/app/[locale]/not-found.tsx:11-26`.
  - Fix: EN side: rewrite to brand voice (e.g. "404 / NO DROP HERE"). AR rewrite covered in sibling file.

## Top Fixes — remaining EN scope (priority order)

1. **[BLOCKER] Replace placeholder imagery OR introduce varied placeholder treatments** — `data/products.ts` + `PlaceholderImage.tsx` + home hero/category/about frames.
2. **[MAJOR] Flip Navbar to dark chrome** — `Navbar.tsx:23`, `LanguageSwitcher.tsx:23`, `MobileNavDrawer.tsx:62`, plus `ShopDropdown.tsx:50` panel chrome alignment.
3. **[MAJOR] Add `focus-visible` rings to every storefront interactive** — Navbar links, Contact inputs, ShopHeader buttons/select, LanguageSwitcher, CartTrigger, MobileNavDrawer trigger.
4. **[MAJOR] Unify storefront container widths + product-grid columns** — pick one container token and one column/gap system; apply across home Featured-Drops and `/shop`.
5. **[MAJOR] Add shop-list and PDP-image skeletons** — `shop/page.tsx` Suspense + PDP gallery loading shell.
6. **[MAJOR] Rewrite remaining generic copy** — empty-state on Shop, brand-ethos line on home, About body-weight rhythm.
7. **[MAJOR] Wire Contact form properly OR replace with WhatsApp callout** — also add `aria-live` and Field-component validation.
8. **[MAJOR] Define a display-size scale** — replace bespoke `text-[90px]/[100px]/[120px]/[160px]` with `display-1/2/3` utilities.
9. **[MAJOR] Tame Featured-Drops ScrollReveal waterfall** — cap stagger, shorten duration.
10. **[MINOR] Replace native sort `<select>` with shadcn Select.**
11. **[MINOR] Fix `ShopDropdown` `left-0` → `start-0` (and audit shadcn primitives for the same leak).**
12. **[MINOR] Surface passive "Limited stock" on PDP without requiring size selection.**
13. **[MINOR] Collapse near-black hex literals to a single CSS var.**
14. **[MINOR] Replace `text-destructive` on storefront OOS with white/60.**
15. **[MINOR] Reconcile PDP `nav-height` doc comment.**
16. **[MINOR] Footer wordmark tracking/cap (`tracking-[-0.04em]`, cap `text-9xl`).**
17. **[MINOR] Hide or wire the no-op search icon.**
18. **[COSMETIC] Brand-ethos em-dash → logical-aware glyph or rtl-flip icon.**
19. **[COSMETIC] Branded 404 copy (EN).**

## Closed in pivot commit (pre-Phase-11 head start)

- BLOCKER Footer i18n keys
- BLOCKER Home hero voice (EN)
- BLOCKER PDP gallery multi-image
- BLOCKER PageTransition reduced-motion
- BLOCKER Font contract (CLAUDE.md + globals.css)
- MAJOR PDP description display
- MINOR AR body font-size bump scoping (structural)

## What's Working

The product-card hover choreography (image scale + name underline on `group-hover`, motion-safe gated, RTL-friendly) is well-built. The bilingual currency formatter (`Intl.NumberFormat('ar-SA-u-nu-latn', { currency: 'SAR' })`) and the SizeSelector's pseudo-element strikethrough for OOS sizes are correct. The `getStockState` → `StockStateBadge` two-context split (card vs PDP) is the right architecture.

## Out of Scope

Checkout, cart drawer, admin pages, auth flows, account pages — deferred per user direction 2026-05-16. Pure AR copy reconciliation and AR-native review — deferred to `STOREFRONT-UI-REVIEW-AR.md` (future sibling phase).
