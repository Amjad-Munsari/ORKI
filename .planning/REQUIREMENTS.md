# Requirements: ORKI Ecommerce

**Defined:** 2026-05-06
**Core Value:** A premium underground streetwear shopping experience that feels as intentional as the brand itself — dark, minimal, and unapologetically cultural.

---

## v1 Requirements

### Foundation

- [ ] **FOUND-01**: Site serves bilingual content with URL-based locale routing (`/en/...` and `/ar/...`)
- [ ] **FOUND-02**: Arabic locale renders full RTL layout using CSS logical properties throughout
- [ ] **FOUND-03**: English and Arabic typefaces load via next/font with FOUT prevention
- [ ] **FOUND-04**: Placeholder image system uses intentional dark-field editorial treatment with locked aspect ratios (3:4 catalog, 4:5 PDP hero)
- [ ] **FOUND-05**: All pages are mobile-responsive across standard breakpoints (375px, 768px, 1280px+)

### Navigation

- [ ] **NAV-01**: Global navigation includes category links (Tops, Bottoms), About, and a language switcher (EN/AR)
- [ ] **NAV-02**: Global footer includes policy links (Shipping, Returns) and Contact
- [ ] **NAV-03**: Cart icon in navigation displays live item count badge

### Shop

- [ ] **SHOP-01**: Shop index page displays all products in a grid with product cards
- [ ] **SHOP-02**: Separate category pages exist for Tops and Bottoms
- [ ] **SHOP-03**: ProductCard displays placeholder image, product name, and price (SAR)
- [ ] **SHOP-04**: Shop pages support filtering by category and sorting by Newest, Price: Low to High, Price: High to Low

### Product Detail

- [ ] **PDP-01**: Product detail page displays an image gallery (placeholder images with 4:5 aspect ratio)
- [ ] **PDP-02**: Product name and description render in the active locale (EN or AR)
- [ ] **PDP-03**: Price displays in SAR with locale-correct formatting via `Intl.NumberFormat`
- [ ] **PDP-04**: Size selector uses a button group (not a dropdown) with per-size out-of-stock state
- [ ] **PDP-05**: Add to Cart button is disabled until a size is selected; shows loading state on activation
- [ ] **PDP-06**: Size guide modal is accessible from the PDP and displays a measurements chart
- [ ] **PDP-07**: Return policy snippet appears below the Add to Cart button
- [ ] **PDP-08**: Related products row appears at the bottom of the PDP
- [ ] **PDP-09**: All three stock states are fully designed: in-stock, partially out-of-stock (some sizes sold out), fully out-of-stock
- [ ] **PDP-10**: JSON-LD Product schema is present on every product detail page

### Cart

- [ ] **CART-01**: Cart is a slide-out drawer that animates in from the correct edge (right in EN, left in AR)
- [ ] **CART-02**: Cart drawer displays all line items with quantity controls and a remove button
- [ ] **CART-03**: Cart contents persist to localStorage and survive page refresh
- [ ] **CART-04**: Cart drawer displays a subtotal in SAR

### Checkout

- [ ] **CHKOUT-01**: Checkout page contains a shipping form (contact details + delivery address)
- [ ] **CHKOUT-02**: Checkout page displays an order summary (line items + total) alongside the form
- [ ] **CHKOUT-03**: Payment section offers a method selector: Credit/Debit Card, Mada, STC Pay, Apple Pay, Cash on Delivery
- [ ] **CHKOUT-04**: All checkout error states are designed: card declined, network error, item out of stock at purchase time, address not serviceable
- [ ] **CHKOUT-05**: A mock order confirmation page is shown on successful checkout (uses mock API route)

### Brand Pages

- [ ] **BRAND-01**: Home page contains a full-bleed hero, a featured products section, and category teasers for Tops and Bottoms
- [ ] **BRAND-02**: About page communicates ORKI's brand identity and underground ethos
- [ ] **BRAND-03**: Contact page includes a contact form and a WhatsApp link

### Animation & Polish

- [ ] **ANIM-01**: Page transitions use Motion AnimatePresence for smooth enter/exit
- [ ] **ANIM-02**: Key sections use scroll-triggered reveal animations via GSAP ScrollTrigger
- [ ] **ANIM-03**: Interactive elements (product cards, buttons, links) have refined hover states
- [ ] **ANIM-04**: Cart drawer slide animation is direction-aware (respects RTL)
- [ ] **ANIM-05**: All animations respect `prefers-reduced-motion` with safe fallbacks

---

## v2 Requirements

### User Accounts
- **ACCT-01**: User can create an account and log in
- **ACCT-02**: User can view order history

### Discovery
- **DISC-01**: User can search products by name
- **DISC-02**: User can save products to a wishlist

### Social Proof
- **SOCL-01**: User can read and submit product reviews

### Marketing
- **MKTG-01**: User can subscribe to a newsletter
- **MKTG-02**: Drop countdown / waitlist page for upcoming releases
- **MKTG-03**: Lookbook editorial page
- **MKTG-04**: Discount and promo code support at checkout

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Backend API integration | Deferred — frontend must be complete first; backend is a separate milestone |
| Live payment processing | Frontend phase uses mock API only; gateway integration is backend phase |
| User authentication | Unnecessary complexity for v1 |
| Product reviews | New brand — empty reviews hurt rather than help |
| Headwear, bags, accessories | Not in ORKI's v1 catalog |
| Real product photography | Unavailable at build time; placeholder system used throughout |
| Inventory management UI | Backend concern |
| Multi-currency | SAR only for v1 |
| Real-time features (live chat, social embeds) | Performance cost + breaks design control |

---

## Traceability

Updated: 2026-05-06 (roadmap created, all 38 requirements mapped).

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 1 | Pending |
| FOUND-02 | Phase 1 | Pending |
| FOUND-03 | Phase 1 | Pending |
| FOUND-04 | Phase 1 | Pending |
| FOUND-05 | Phase 1 | Pending |
| NAV-01 | Phase 1 | Pending |
| NAV-02 | Phase 1 | Pending |
| NAV-03 | Phase 3 | Pending |
| SHOP-01 | Phase 2 | Pending |
| SHOP-02 | Phase 2 | Pending |
| SHOP-03 | Phase 2 | Pending |
| SHOP-04 | Phase 2 | Pending |
| PDP-01 | Phase 2 | Pending |
| PDP-02 | Phase 2 | Pending |
| PDP-03 | Phase 2 | Pending |
| PDP-04 | Phase 2 | Pending |
| PDP-05 | Phase 2 | Pending |
| PDP-06 | Phase 2 | Pending |
| PDP-07 | Phase 2 | Pending |
| PDP-08 | Phase 2 | Pending |
| PDP-09 | Phase 2 | Pending |
| PDP-10 | Phase 2 | Pending |
| CART-01 | Phase 3 | Pending |
| CART-02 | Phase 3 | Pending |
| CART-03 | Phase 3 | Pending |
| CART-04 | Phase 3 | Pending |
| CHKOUT-01 | Phase 3 | Pending |
| CHKOUT-02 | Phase 3 | Pending |
| CHKOUT-03 | Phase 3 | Pending |
| CHKOUT-04 | Phase 3 | Pending |
| CHKOUT-05 | Phase 3 | Pending |
| BRAND-01 | Phase 4 | Pending |
| BRAND-02 | Phase 4 | Pending |
| BRAND-03 | Phase 4 | Pending |
| ANIM-01 | Phase 4 | Pending |
| ANIM-02 | Phase 4 | Pending |
| ANIM-03 | Phase 2 | Pending |
| ANIM-04 | Phase 3 | Pending |
| ANIM-05 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 38 total
- Mapped to phases: 38
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-06*
*Last updated: 2026-05-06 after roadmap creation*
