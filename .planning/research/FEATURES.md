# Features: ORKI Ecommerce

**Domain:** Fashion / Streetwear DTC
**Researched:** 2026-05-06
**Confidence:** HIGH (domain expertise) — web tools unavailable; findings based on established fashion ecommerce patterns and RTL/bilingual implementation knowledge

---

## Table Stakes (users expect these — missing means users leave)

These are features shoppers consider non-negotiable regardless of brand prestige. Absence creates distrust or abandonment.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Product listing grid with category filter | Users navigate by category first | Low | Tops / Bottoms split already confirmed |
| Product image display (at least 1 image per product) | Visual inspection is the primary decision driver in fashion | Low | Placeholder system must carry this at launch |
| Product name, price, and currency | Basic purchase information | Low | SAR (Saudi Riyal) as primary currency |
| Size selector on PDP | Apparel cannot be purchased without size | Low | Dropdown or button group; must show OOS state |
| Add to Cart button | Entry point to purchase | Low | Single CTA; must be prominent |
| Cart summary (item count + line items) | Users need to confirm intent before paying | Low | Slide-out drawer is current standard |
| Cart quantity adjustment and item removal | Users make mistakes | Low | +/- controls and remove link |
| Checkout flow (contact, shipping, payment, confirmation) | The conversion funnel itself | Medium | Frontend: static form with correct field set |
| Order summary at checkout | Confirmation of what is being purchased | Low | Sticky sidebar or review step |
| Mobile-responsive layout | Saudi users are overwhelmingly mobile-first | Medium | Affects every component — not an afterthought |
| Page-level navigation (Home, Shop, Cart, About, Contact) | Orientation and discovery | Low | Confirmed pages per PROJECT.md |
| Footer with basic brand info | Trust signal; expected location for policies, contact | Low | Links: shipping policy, returns, contact |
| Shipping policy page or modal | Saudi shoppers expect to know shipping cost before paying | Low | Can be a modal or footer-linked page |
| Returns / exchange policy | Trust signal, especially for a new brand | Low | Static page or footer-linked modal |
| Contact method | Users need a support path | Low | Confirmed page; email or WhatsApp both expected in SA market |
| Out-of-stock indication | Prevents abandoned purchases and frustration | Low | Per size on PDP, not just product level |
| Loading / transition feedback | Users need to know the page is responding | Low | Especially important for cart add and checkout submit |

---

## Differentiators (competitive advantage for ORKI's positioning)

These features are not universally expected by all shoppers but are standard among premium streetwear brands. They reinforce the brand aesthetic and create emotional alignment with the target customer.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Full-bleed editorial hero section | Communicates brand world before product — sets ORKI apart from generic stores | Low | Static for now; product photography deferred |
| Immersive product imagery treatment | Dark, high-contrast, cropped or styled presentation vs. white-background commoditization | Low | Placeholder design must honor this — black-field placeholders not grey boxes |
| Scroll-triggered reveal animations | Gives the site expressive presence; signals care and craft | Medium | Subtle entry animations on product cards, hero text, section headers |
| Sticky header with cart count | Keeps navigation ambient without interrupting the reading experience | Low | Common on premium DTC; expected by brand-aware shoppers |
| Bold typographic hierarchy | Typography as design element — headline scale, letter-spacing, weight contrast | Low | Core to the Marion reference aesthetic |
| Category landing pages with editorial header | Shop/Tops and Shop/Bottoms feel curated, not just filtered | Low | Section headline + product grid vs. raw grid alone |
| Hover state product image swap | Second image on hover reveals styling context | Low | Standard on all credible fashion sites; relatively easy |
| Size guide (inline or modal) | Reduces returns; builds confidence in new brands shoppers don't know | Medium | Especially important when no physical presence exists |
| Product description as brand copy | Descriptions read as voice, not spec sheets | Low | Design/content decision, not an engineering feature |
| WhatsApp contact option | Saudi market standard; WhatsApp is the dominant customer support channel in KSA | Low | Static link on Contact page; no integration needed |
| Language toggle (EN / AR) persistent | Users expect their language preference to survive navigation | Low | Stored in localStorage or cookie; not a session preference |
| Smooth cart drawer (slide-in) | Cart as ambient overlay keeps user in browse flow rather than breaking navigation | Medium | Framer-standard pattern; important for conversion |
| "You might also like" / related products | Increases average order value and time on site | Medium | Can be static (hand-curated) at launch; backend-driven later |
| Clear brand story integration on About | ORKI's underground identity needs articulation — this is a trust and connection driver | Low | Static page; high impact for brand cohesion |

---

## Anti-Features (deliberately exclude in v1)

These are features that would dilute focus, add engineering complexity, or contradict ORKI's lean launch posture. Not building them is a deliberate product decision, not an oversight.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| User accounts / login | Adds auth complexity, session management, password reset flows — none of which contribute to v1 launch quality | Guest checkout only; email confirmation is sufficient |
| Wishlist / save for later | Requires user state persistence; unnecessary without accounts | Cart serves this purpose for intent-capturing |
| Product reviews / ratings | New brand — no reviews yet; empty review sections erode trust more than their absence | Omit entirely in v1; add post-launch once inventory exists |
| Search bar | Catalog is 20-60 items across 2 categories; search adds nav complexity without solving a real discovery problem at this scale | Category browse is sufficient; search can come at 100+ SKUs |
| Filter / sort controls (advanced) | Same reasoning — small catalog makes filtering noise, not signal | Category split (Tops/Bottoms) is the only filter needed at launch |
| Promotions / discount code system | Backend-dependent; adds checkout complexity | Defer until payment integration is live |
| Newsletter signup / email capture | Requires ESP integration (Mailchimp, Klaviyo, etc.); out of scope for frontend-first build | Can add a static placeholder form that does nothing v1 |
| Lookbook page | Explicitly out of scope per PROJECT.md | Home page editorial section serves this function aesthetically |
| Drop countdown / waitlist | Out of scope per PROJECT.md | Revisit if ORKI moves to drop model |
| Stock inventory display (quantity remaining) | Backend-dependent; "only 2 left" urgency mechanics need real data | OOS indicator (binary) is sufficient from static/seed data |
| Multi-currency or currency switcher | Adds complexity; SAR is correct for primary market | Single currency at launch |
| Size recommendation engine | Requires data and user input logic beyond scope | Clear size guide modal is sufficient |
| Live chat widget | Support overhead; requires staffing; visual clutter on a minimal aesthetic | WhatsApp link on Contact page is the correct pattern for KSA |
| Social feed embed (Instagram, TikTok) | Third-party dependency; slow loading; breaks design control | Curated editorial imagery is stronger for brand integrity |
| Headwear / accessories categories | Explicitly out of scope per PROJECT.md | Two categories: Tops, Bottoms |

---

## Frontend-Specific Features (UI/UX patterns critical to this aesthetic)

These are not product features in the traditional sense — they are design and interaction decisions that define whether the ORKI site feels like a premium streetwear brand or a template.

| Feature | Why It Matters | Complexity | Dependency |
|---------|---------------|------------|------------|
| Dark mode as default (not a toggle) | The brand palette is black/white; this is not a preference but the identity | Low | Sets baseline for all component styling |
| Placeholder image system with intentional design | No product photos at launch; placeholders must feel editorial, not provisional | Medium | Every product-dependent component |
| Fluid typography scaling (clamp / viewport units) | Headline-heavy design must look correct at every viewport width | Low | Typography system established early |
| Reduced motion support (prefers-reduced-motion) | Accessibility requirement; scroll animations need a no-animation fallback | Low | Required alongside animation implementation |
| Image aspect ratio containers | Prevents layout shift when images load; critical for product grid stability | Low | Grid and PDP components |
| Framer Motion or CSS animation system (defined once, applied globally) | Animation should be consistent and token-driven, not ad hoc | Medium | Architecture decision; affects all animated components |
| Snap scroll or scroll-jacking (home page only) | Used on Marion reference; appropriate for editorial hero sections | Medium | Only applicable to home page hero; avoid elsewhere |
| Black-and-white only image treatment | Product placeholders, UI icons, and brand assets must stay within palette | Low | Design constraint that touches every visual element |
| Touch-friendly tap targets (min 44x44px) | Mobile-first market; small tap targets cause high bounce on mobile | Low | All interactive elements: buttons, selectors, links |
| No visible scrollbars (custom or hidden) | Premium aesthetic expectation; default browser scrollbars break the design | Low | CSS-level; must be applied globally |
| Cart item thumbnail in drawer | Visual confirmation that the right product was added — reduces cart abandonment | Low | Requires image system to be functional |
| Size button group (not dropdown) | Physical button selectors are the standard pattern in fashion — more scannable and tactile | Low | Dropdown is the anti-pattern here |
| Sticky PDP Add to Cart on mobile | On long product pages, the CTA must follow the user | Medium | Mobile viewport only; desktop can use static placement |

---

## Arabic / RTL-Specific Features (what changes in the bilingual experience)

RTL is not just text flipping. It requires a systematic approach to layout mirroring, typography, and interaction patterns. These are engineering and design concerns that must be decided at architecture time, not retrofitted.

| Feature | Why Required | Complexity | Notes |
|---------|-------------|------------|-------|
| Full layout mirroring on lang="ar" | Flexbox, Grid, absolute positioning, and margin/padding all flip | High | Set `dir="rtl"` on `<html>` and use logical CSS properties (margin-inline-start, not margin-left) throughout |
| Arabic-appropriate typeface | Arabic script requires a specific font — Latin fonts do not render Arabic | Medium | Candidates: IBM Plex Arabic, Cairo, Tajawal — must pair with the chosen Latin font |
| Per-language font sizing | Arabic text at the same px as Latin often reads too small or too large; scale adjustments needed | Low | Likely 1-2px size bump on body copy in Arabic |
| RTL-aware icon mirroring | Directional icons (arrows, chevrons, back/forward) must flip; non-directional icons (cart, user) must not | Low | CSS `transform: scaleX(-1)` on `[dir="rtl"]` for directional icons only |
| RTL-aware animation direction | Slide-in drawers, page transitions, hover states that move horizontally must invert direction in RTL | Medium | Affects cart drawer open direction, any horizontal scroll elements |
| Number and currency formatting | Arabic-Indic numerals are used in some KSA contexts; SAR symbol placement differs per locale | Low | Use `Intl.NumberFormat` with locale; test both `ar-SA` and `en-SA` |
| Language toggle placement and behavior | Toggle must be visible and persistent; in RTL layout the toggle position itself shifts | Low | Component-level concern; must be placed in the header |
| Text alignment inheritance | Arabic body text is right-aligned; inline elements (badges, tags) must inherit correctly | Low | Set `text-align: start` globally (not `right` or `left`) to inherit from `dir` |
| Mixed-direction strings (brand name in Latin within AR text) | "ORKI" is a Latin brand name that will appear in Arabic-language content | Low | Use `unicode-bidi: isolate` or explicit `dir="ltr"` span around brand name in AR context |
| Form field direction in checkout | Name fields in Arabic should be RTL; phone/email fields should remain LTR | Medium | `dir="auto"` on input fields handles this in most cases; validate across browsers |
| WhatsApp and social links | In Saudi Arabia, WhatsApp is the expected support channel — Arabic speakers especially | Low | Static link; no integration required |
| Comma/period in Arabic decimal formatting | Arabic locale uses different decimal separators in some regions | Low | Handled by `Intl.NumberFormat` — do not hard-code separators |

---

## Feature Dependencies

```
Language toggle (persistent) → RTL layout mirroring → Arabic typeface → RTL animation direction
  └─ All RTL features depend on dir="rtl" being set at the html element level

Placeholder image system → Product grid → PDP hero image → Cart thumbnail
  └─ All product-visual features depend on the placeholder system being designed first

Size selector (button group) → Add to Cart → Cart drawer → Checkout form
  └─ Core purchase path; each step depends on the previous being functional

Category pages → Product card → PDP → Cart → Checkout
  └─ Full browse-to-purchase funnel; must be built in this order for testability

Animation system (tokens defined) → Scroll reveals → Cart drawer animation → Page transitions
  └─ Animation architecture decision must precede any motion implementation
```

---

## MVP Feature Priority

The following 12 features constitute a shippable v1 frontend that demonstrates the full purchase flow:

1. Dark-mode-first design system (color, type, spacing tokens)
2. Placeholder image system with editorial treatment
3. Home page with editorial hero + product preview
4. Category pages: Shop/Tops, Shop/Bottoms — product grid
5. Product detail page: images, name, price, size selector, Add to Cart
6. Cart drawer: line items, quantity, remove, subtotal
7. Checkout page: static form (contact + shipping + payment fields)
8. Order confirmation page (static — no backend)
9. About page with brand narrative
10. Contact page with WhatsApp link and email
11. Bilingual EN/AR with full RTL layout mirroring
12. Mobile-responsive at all confirmed breakpoints

**Defer to post-v1:**
- Hover image swap (nice to have, not blocking)
- Size guide modal (valuable but not launch-blocking)
- Related products section (requires product data structure to be stable)
- Scroll-snap on home hero (aesthetic enhancement)

---

## Sources

**Confidence note:** WebSearch and WebFetch were unavailable during this research session. All findings are drawn from:
- Strong training-data knowledge of fashion ecommerce UX patterns (HIGH confidence for table stakes)
- Established RTL/bilingual web implementation standards (HIGH confidence — W3C i18n + CSS logical properties are well-documented)
- Saudi Arabia market knowledge (MEDIUM confidence — WhatsApp dominance, mobile-first behavior, SAR currency are well-established; specific conversion patterns should be validated post-launch)
- PROJECT.md explicit constraints and out-of-scope declarations (HIGH confidence — directly from source)

**Recommended post-research validation:**
- Review marionshop.framer.website live to confirm interaction patterns reflected in Frontend-Specific section
- Validate Arabic font pairing recommendation against ORKI's Latin type choice once typography is selected
- Confirm WhatsApp business setup is available for the brand before including it as a hard dependency
