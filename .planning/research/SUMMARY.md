# Research Summary: ORKI Ecommerce

## TL;DR

- **RTL is an architectural constraint, not a feature.** CSS logical properties, `dir="rtl"` on `<html>`, and direction-aware animations must be baked in from the first line of code — retrofitting them doubles the work.
- **Frontend-first is clean only if the data contract is defined first.** A TypeScript `Product` interface in `/types/domain.ts` must exist before any component is built. The data access layer (`/lib/products.ts`) is the only seam between static placeholders and a real backend — components never touch raw data files directly.
- **Shopify and Stripe are both wrong for the Saudi market.** Shopify Payments is unavailable in KSA; Stripe does not support Mada natively. Moyasar (or Tap Payments) is the correct gateway — covers Mada, STC Pay, and Apple Pay in one integration.
- **The placeholder system is a design requirement.** No product photography exists at launch. Placeholders must look intentional (dark-field editorial treatment, consistent aspect ratios) — broken grey boxes will tank brand credibility before a single product ships.
- **Phase 1 sets the ceiling for everything else.** Routing, RTL architecture, CSS logical properties, animation library selection, font loading, and image aspect ratios must all be decided and implemented before the first page is built. These decisions are not revisitable cheaply.

---

## Recommended Stack

| Layer | Choice | Confidence |
|-------|--------|------------|
| Framework | Next.js 15 (App Router) | HIGH concept / verify version |
| Styling | Tailwind CSS v4 + CSS logical properties | HIGH concept / verify version |
| UI primitives | shadcn/ui (Radix UI base, unstyled) | HIGH |
| Animation | Motion (formerly Framer Motion) v11 | HIGH concept / verify package name |
| Scroll animation | GSAP + ScrollTrigger | HIGH |
| i18n + routing | next-intl v3 | HIGH |
| Cart state | Zustand v4 + persist middleware | HIGH |
| EN font | Space Grotesk or DM Sans (geometric sans) | MEDIUM — aesthetic judgment |
| AR font | IBM Plex Arabic | MEDIUM — aesthetic judgment |
| Font loading | next/font (self-hosted, FOUT prevention) | HIGH |
| Ecommerce backend (future) | Medusa v2 | HIGH concept / verify stability |
| Payments (future) | Moyasar (Mada + STC Pay + Apple Pay) | HIGH |
| Deployment | Vercel | HIGH |

**What NOT to use:** Shopify (no KSA Payments), Stripe (no native Mada), Framer the builder (no-code, cannot support RTL or payment logic), react-i18next / next-i18next (Pages Router only), MUI/Chakra/Bootstrap (fight the dark underground aesthetic), physical CSS properties (`ml-`, `pl-`, `left-`, `right-`).

> Verify all versions before project init: `npm info next version`, `npm info tailwindcss version`, `npm info motion version`, `npm info next-intl version`, `npm info zustand version`, `npm info gsap version`

---

## Build Order

### Phase 1 — Foundation
Nothing else works without this. Deliver a running Next.js app with RTL routing, bilingual type system, image containers, and a typed product data layer.

- Next.js project init with App Router + TypeScript
- Root layout: `<html lang dir>`, next/font for EN + AR typefaces, global CSS reset
- RTL CSS architecture: logical properties baseline, ESLint rule blocking physical directional utilities
- Animation library installed (Motion + GSAP) — presets defined even if no animations built yet
- `[locale]` routing with next-intl middleware
- Translation dictionary: typed `/locales/en.ts` and `/locales/ar.ts`
- TypeScript domain interfaces: `Product`, `CartItem`, `Category` in `/types/domain.ts`
- Static product data in `/data/products.ts`
- Data access layer: `/lib/products.ts` — components import only from here
- PlaceholderImage component: dark editorial treatment, locked aspect ratios (catalog: 3:4, PDP: 4:5)
- Navigation + Footer (used by every page)
- hreflang tags and canonical URL structure

### Phase 2 — Core Shopping Pages
Full browse-to-add-to-cart flow with bilingual rendering and all stock states.

- Shop index page + ProductCard component
- Category pages: /tops, /bottoms
- Product Detail Page: image gallery, bilingual content, price formatting
- SizeSelector: button group (not dropdown), disabled OOS sizes
- Size guide modal
- AddToCart with loading/error states
- CartStore initialization (Zustand + persist) — set up before cart page exists
- All three stock states: in-stock / partially OOS / fully OOS
- JSON-LD Product schema on PDPs

### Phase 3 — Cart and Checkout
Complete purchase flow with all error states and COD path scaffolded.

- CartIcon + badge in Navigation
- Cart drawer (direction-aware slide animation) + Cart page
- Checkout: ShippingForm + OrderSummary + PaymentSection
- Payment method UI: Card / Mada / STC Pay / Apple Pay / COD (mock in frontend phase)
- All error states: card declined, network error, OOS at purchase, address not serviceable
- Mock `/api/checkout` route returning `{ success: true, orderId: 'MOCK-001' }`
- Order confirmation page
- Mobile checkout testing: iOS Safari + Android Chrome

### Phase 4 — Brand and Supporting Pages
Editorial home page, brand narrative, contact, and full animation integration.

- Home page: HeroBanner, FeaturedProducts, CategoryTeaser, BrandStatement
- Scroll-triggered reveals via GSAP ScrollTrigger + `prefers-reduced-motion` fallback
- Page transitions via Motion AnimatePresence
- About page: BrandHero, BrandNarrative
- Contact page: form (React Hook Form + Zod) + WhatsApp link
- `API_CONTRACT.md` finalized for backend integration
- Full RTL animation audit

---

## Table Stakes Features

| Feature | Phase |
|---------|-------|
| Product grid with Tops / Bottoms categories | 2 |
| Product name, price (SAR), placeholder images | 2 |
| Size selector (button group, per-size OOS) | 2 |
| Add to Cart (disabled until size selected) | 2 |
| Cart drawer persisted to localStorage | 3 |
| Checkout form + order confirmation | 3 |
| Bilingual EN/AR with full RTL layout | 1 |
| Mobile-responsive at all breakpoints | All |
| Out-of-stock per-size indication | 2 |
| Footer: policy links, contact | 1 |

**Deliberate v1 exclusions:** user accounts, wishlist, reviews, search, filters, discount codes, newsletter signup, lookbook, drop countdowns, multi-currency, live chat, social embeds.

---

## Top Pitfalls to Avoid

**1. CSS physical directional properties (Phase 1 — highest multiplier)**
`ml-4`, `pr-2`, `left-0` anywhere in the codebase breaks every component in Arabic. Install the ESLint rule blocking physical directional Tailwind utilities before the first component is written.

**2. No Arabic font at setup (Phase 1)**
Without an explicit Arabic font via `next/font`, the browser falls back to system fonts that destroy the editorial aesthetic. EN/AR pairing must be decided before any component is built.

**3. Language switch not atomic (Phase 1)**
Setting `dir` without `lang` (or vice versa) breaks screen readers, iOS autocorrect, and SEO. Both must update in a single operation.

**4. Placeholder data shape doesn't match API expectations (Phase 1)**
Arbitrary field names in placeholder data turn backend integration into a refactor. Define TypeScript interfaces mirroring standard API shapes before writing any component.

**5. Missing Mada and STC Pay in checkout UI (Phase 3)**
Stripe alone means most Saudi consumers cannot pay. The frontend payment selector (Card / Mada / STC Pay / Apple Pay / COD) must be designed from the start.

**6. Ephemeral cart (Phase 3)**
Cart in React state only is wiped on refresh. Zustand `persist` to localStorage must be configured at CartStore initialization.

**7. No out-of-stock UX strategy (Phase 2)**
All three stock states must be designed before building the PDP — not discovered in production.

**8. Aspect ratio mismatch (Phase 1)**
Define and enforce fixed aspect ratios per image slot before building the placeholder component. Document required crops for the photographer now — this cannot be fixed later without a layout revision.

---

## Key Decisions Required Before Phase 1

| Decision | Recommendation |
|----------|----------------|
| EN/AR font pairing | IBM Plex Arabic + Space Grotesk — load both via `next/font` |
| Animation library | Motion + GSAP — install in Phase 1, define presets upfront |
| Numeral style in Arabic mode | Western numerals in both locales (`'ar-SA-u-nu-latn'`) |
| Image aspect ratios | 3:4 for catalog cards, 4:5 for PDP hero |
| COD in checkout UI | Design the toggle in Phase 3 — retrofitting checkout layout is expensive |
| Price formatting | `Intl.NumberFormat` with explicit locale — never hardcode currency position |

---

## Open Questions

| Question | Impact | When to Resolve |
|----------|--------|-----------------|
| Stripe KSA / Mada current status | High — changes gateway selection | Before backend phase |
| Moyasar vs Tap Payments | Medium | Before backend phase |
| Medusa v2 stability and ecosystem | High | Before backend phase |
| COD prevalence in Saudi fashion ecommerce | Medium | Before Phase 3 |
| All npm package versions | Medium | Before project init |
| WhatsApp Business account availability | Low | Before Phase 4 |

---

*Synthesized from: STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md*
*Project: ORKI Ecommerce — 2026-05-06*
