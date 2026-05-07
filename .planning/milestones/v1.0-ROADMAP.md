# Roadmap: ORKI Ecommerce

**4 phases | 38 requirements | Frontend-complete milestone**

---

## Overview

ORKI's frontend is built in four sequential phases, each phase unblocking the next. Phase 1 sets the RTL and i18n architecture that every other phase depends on. Phase 2 delivers the full browse-to-add-to-cart flow. Phase 3 completes the purchase path. Phase 4 adds the brand editorial pages and full animation polish. The milestone ends with a frontend that is 100% complete and ready for backend integration.

---

## Phases

- [x] **Phase 1: Foundation** - RTL architecture, i18n routing, fonts, placeholder system, nav, and footer
- [x] **Phase 2: Core Shopping** - Shop, category, and product detail pages — full bilingual browse-to-cart flow
- [x] **Phase 3: Cart & Checkout** - Cart drawer, CartStore, full checkout flow with all payment methods and error states
- [ ] **Phase 4: Brand & Polish** - Home page, About, Contact, page transitions, scroll animations, reduced-motion

---

## Phase Details

### Phase 1: Foundation
**Goal**: A running Next.js app with bulletproof RTL/i18n architecture, bilingual fonts, intentional placeholder images, and site-wide nav and footer — the prerequisite every other phase builds on.
**Depends on**: Nothing (first phase)
**Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-04, FOUND-05, NAV-01, NAV-02
**Success Criteria** (what must be TRUE):
  1. Switching the URL from `/en/` to `/ar/` rotates the entire layout — including navigation, any content visible on the page, and the footer — to full RTL using CSS logical properties throughout.
  2. Both the English and Arabic typefaces render correctly with no flash of unstyled text on first load in either locale.
  3. A placeholder image slot at any aspect ratio (3:4 catalog, 4:5 PDP hero) renders an intentional dark-field editorial treatment — never a broken grey box or empty container.
  4. The global navigation displays category links (Tops, Bottoms), About, and a working EN/AR language switcher. The footer displays policy links and Contact. Both adapt correctly to RTL.
  5. All pages are inspectable at 375px, 768px, and 1280px+ without layout breakage.
**Plans**: 7 (01-01 through 01-07)

**Wave 0:**
- [ ] 01-01-PLAN.md — Scaffold Next.js 15, Tailwind v4, PostCSS, ESLint (physical class ban + no-img-element)

**Wave 1** *(blocked on Wave 0)*:
- [x] 01-02-PLAN.md — next-intl routing, middleware, translation files, TypeScript types, data stubs, shadcn init
- [x] 01-03-PLAN.md — Fonts (Space Grotesk + IBM Plex Arabic), root layout (lang/dir/dark), globals.css
- [x] 01-04-PLAN.md — PlaceholderImage component, animation-presets.ts, useDirection hook

**Wave 2** *(blocked on Wave 1)*:
- [x] 01-05-PLAN.md — Navbar, LanguageSwitcher, MobileNavDrawer (direction-aware Sheet)
- [x] 01-06-PLAN.md — Footer, layout integration (Navbar+Footer), placeholder home page

**Wave 3** *(blocked on Wave 2)*:
- [x] 01-07-PLAN.md — Lint + build gate, browser verification (RTL, fonts, placeholders, nav, responsive)

**Cross-cutting constraints:**
- ESLint physical class ban established in Wave 0 — applies to all waves
- `lang` + `dir` set atomically on `<html>` — set in 01-03, inherited by all subsequent phases
- `next/image` only — ESLint rule from 01-01 covers all component additions in Waves 1–2

**UI hint**: yes

### Phase 2: Core Shopping
**Goal**: Users can browse by category, view product detail pages with full bilingual content, select sizes, and add items to cart — with all three stock states handled and hover polish applied.
**Depends on**: Phase 1
**Requirements**: SHOP-01, SHOP-02, SHOP-03, SHOP-04, PDP-01, PDP-02, PDP-03, PDP-04, PDP-05, PDP-06, PDP-07, PDP-08, PDP-09, PDP-10, ANIM-03
**Success Criteria** (what must be TRUE):
  1. A user can open the shop index, filter to Tops or Bottoms, and sort by Newest or Price — the product grid updates without a page reload and every product card shows a placeholder image, name, and SAR price.
  2. A user can navigate to a product detail page, view an image gallery with 4:5 placeholder images, read the product name and description in the active locale (EN or AR), and see the price formatted correctly via `Intl.NumberFormat`.
  3. The size selector shows individual size buttons — not a dropdown — with out-of-stock sizes visually disabled and unselectable. The Add to Cart button stays disabled until a size is chosen.
  4. All three stock states are visually distinct and fully designed: in-stock, partially out-of-stock (some sizes sold out), and fully out-of-stock.
  5. The size guide modal opens from the PDP and displays a measurements chart. JSON-LD Product schema is present in page source on every PDP. Related products appear at the bottom of the PDP.
**Plans**: 8 plans (02-01 through 02-08)

**Wave 1** *(no dependencies — run in parallel)*:
- [ ] 02-01-PLAN.md — Product data (6 products), lib/products.ts extensions (getStockState, getRelatedProducts), animation presets (4 new), i18n Shop namespace
- [ ] 02-02-PLAN.md — Test infrastructure (vitest install, vitest.config.ts, tests/setup.ts, unit test stubs for products/formatPrice/cartStore)

**Wave 2** *(blocked on Wave 1)*:
- [ ] 02-03-PLAN.md — CartStore (Zustand + persist + skipHydration), StoreHydration, layout wiring, shadcn dialog install

**Wave 3** *(blocked on Wave 1 + Wave 2)*:
- [ ] 02-04-PLAN.md — Shop components: ProductCard (hover zoom+underline), ProductGrid, StockStateBadge, ShopHeader (filter/sort Client Component)
- [ ] 02-05-PLAN.md — Shop pages: /shop index (searchParams filter+sort) and /shop/[category] (pre-filtered)

**Wave 4** *(blocked on Wave 3)*:
- [ ] 02-06-PLAN.md — PDP components: PDPGallery, PDPLayout, SizeSelector (OOS aria), SizeGuideModal, AddToCartButton (AnimatePresence), RelatedProducts

**Wave 5** *(blocked on Wave 4)*:
- [ ] 02-07-PLAN.md — PDP page route (JSON-LD, PDPInfoPanel Client Component), CategoryDropdown (NavigationMenu), CartBadge, Navbar update

**Wave 6** *(blocked on Wave 5)*:
- [ ] 02-08-PLAN.md — Verification gate: vitest run + lint + build + browser verification (7 flows)

**UI hint**: yes

### Phase 3: Cart & Checkout
**Goal**: Users can open the cart drawer, manage line items, and complete a full checkout flow — including all Saudi payment methods and every error state — ending on a mock order confirmation page.
**Depends on**: Phase 2
**Requirements**: NAV-03, CART-01, CART-02, CART-03, CART-04, CHKOUT-01, CHKOUT-02, CHKOUT-03, CHKOUT-04, CHKOUT-05, ANIM-04
**Success Criteria** (what must be TRUE):
  1. The cart icon in the navigation displays a live item count badge that updates immediately when an item is added from the PDP.
  2. Opening the cart drawer slides it in from the right in EN and from the left in AR. The drawer lists all line items with quantity controls, a remove button, and a SAR subtotal.
  3. Refreshing the page preserves all cart contents — line items, quantities, and selected sizes persist to localStorage.
  4. The checkout page shows a shipping form, an order summary, and a payment method selector offering Credit/Debit Card, Mada, STC Pay, Apple Pay, and Cash on Delivery.
  5. All four checkout error states are rendered and styled: card declined, network error, item out of stock at purchase time, and address not serviceable. Completing a mock checkout shows the order confirmation page.
**Plans**: 4 plans (03-01 through 03-04)

**Wave 1:**
- [x] 03-01-PLAN.md — Cart Infrastructure & Badge
- [x] 03-02-PLAN.md — Cart Drawer UI
- [x] 03-03-PLAN.md — Checkout Flow
- [x] 03-04-PLAN.md — Payment & Mock Completion

**UI hint**: yes

### Phase 4: Brand & Polish
**Goal**: The home page communicates ORKI's brand identity and drives product discovery. About and Contact pages are complete. Page transitions and scroll-triggered animations bring the editorial aesthetic to life — with full reduced-motion support.
**Depends on**: Phase 3
**Requirements**: BRAND-01, BRAND-02, BRAND-03, ANIM-01, ANIM-02, ANIM-05
**Success Criteria** (what must be TRUE):
  1. The home page renders a full-bleed hero, a featured products section, and Tops and Bottoms category teasers — all communicating ORKI's dark, underground streetwear identity.
  2. Navigating between pages produces a smooth Motion AnimatePresence enter/exit transition with no visual flash or layout jump.
  3. Scrolling through key sections triggers GSAP ScrollTrigger reveal animations that feel expressive without being distracting.
  4. With `prefers-reduced-motion: reduce` active, all transform-based scroll and page animations are replaced with safe opacity fallbacks — no layout motion occurs.
  5. The About page communicates ORKI's brand ethos. The Contact page contains a working form and a visible WhatsApp link.
**Plans**: TBD
**UI hint**: yes

---

## Milestone: Frontend Complete

The frontend-complete milestone is reached when all four phases pass their success criteria:

- Every page exists in both `/en/` and `/ar/` with full RTL layout switching
- A user can browse Tops or Bottoms, select a size, add to cart, and reach the order confirmation page
- The cart persists across refresh
- All checkout error states are designed and visible
- Brand pages (Home, About, Contact) are complete and on-brand
- Page transitions and scroll animations are live with reduced-motion fallbacks
- No backend integration is required — all data flows through the static placeholder layer

At this point, the project is ready to hand off for backend integration (Medusa v2 + Moyasar).

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 7/7 | Complete | 2026-05-07 |
| 2. Core Shopping | 8/8 | Complete | 2026-05-07 |
| 3. Cart & Checkout | 4/4 | Complete | 2026-05-07 |
| 4. Brand & Polish | 4/4 | Complete | 2026-05-07 |
