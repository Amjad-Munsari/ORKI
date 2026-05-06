# Architecture: ORKI Ecommerce

**Domain:** Fashion / Streetwear DTC Ecommerce
**Researched:** 2026-05-06
**Overall confidence:** HIGH — patterns derived from well-established frontend ecommerce architecture; RTL specifics from Next.js i18n and CSS logical properties documentation

---

## System Overview

ORKI is a small-catalog DTC ecommerce site (20–60 products, 2 categories). At this scale, the correct architecture is a **monolithic frontend with a thin static data layer**, not a distributed headless CMS + microservices stack. The complexity ceiling for a site of this size is a single Next.js application with:

- Static product data (JSON or MDX) during frontend-first phase
- A simple backend API or third-party integration bolt-on when backend phase begins
- No separate CMS, no message queue, no search service

The site reads like an editorial brand experience. The goal of the architecture is to make page transitions feel instant, product pages feel premium, and the bilingual toggle feel native — not bolted on.

### Headless vs Monolith Decision

| Approach | Pros | Cons | Verdict for ORKI |
|----------|------|------|-----------------|
| Headless (Shopify + Next.js) | Production-grade cart/payments, CMS flexibility | Significant overhead, Shopify fees, complexity for 20-60 products | OVERKILL for v1 |
| Monolith (Next.js full-stack) | One repo, one deploy, fast iteration, full control | Must build cart + checkout logic | CORRECT for this scale |
| Static site + Stripe | Very simple, fast | No server-side cart, fragile at checkout | REASONABLE but limiting |

**Recommendation: Next.js monolith.** The frontend-first constraint actually makes this easier — build the UI in isolation, then wire up the API routes or an external provider (Shopify Storefront API, a custom backend) when ready. The architecture should make that seam clean.

---

## Frontend Architecture

### Page Map and Route Structure

```
app/
├── [locale]/                     ← locale segment (en | ar)
│   ├── layout.tsx                ← root layout: fonts, direction, cart provider
│   ├── page.tsx                  ← Home
│   ├── shop/
│   │   ├── page.tsx              ← Shop index (all products, filterable)
│   │   ├── tops/
│   │   │   └── page.tsx          ← Tops category
│   │   └── bottoms/
│   │       └── page.tsx          ← Bottoms category
│   ├── products/
│   │   └── [slug]/
│   │       └── page.tsx          ← Product Detail Page
│   ├── cart/
│   │   └── page.tsx              ← Cart review
│   ├── checkout/
│   │   └── page.tsx              ← Checkout form
│   ├── about/
│   │   └── page.tsx              ← Brand story
│   └── contact/
│       └── page.tsx              ← Contact form
└── middleware.ts                  ← Locale detection and redirect
```

The `[locale]` segment at root level is the correct pattern for Next.js App Router i18n. It keeps all routes locale-aware without client-side language switching hacks. `middleware.ts` handles the redirect from `/` to `/en` or `/ar` based on browser locale or a stored preference cookie.

### Rendering Strategy per Page

| Page | Strategy | Reason |
|------|----------|--------|
| Home | SSG (static) | Never changes at runtime; content is brand identity |
| Shop / Category pages | SSG + ISR | Product list is infrequently changing; static = fast |
| Product Detail | SSG + ISR | One page per product slug, static by default |
| Cart | Client-rendered | Cart state is 100% client-side (localStorage/Zustand) |
| Checkout | Client-rendered | Form state, payment intent, session-dependent |
| About | SSG | Static brand content |
| Contact | Client-rendered | Form submission is interactive |

ISR (Incremental Static Regeneration) allows rebuilding product pages when inventory or content changes without a full redeploy. During frontend-first phase, all pages are purely static — ISR becomes relevant when real data is wired in.

---

## Data Flow

### Product Data Flow

```
[Source]                  [During Frontend Phase]      [After Backend Integration]
Static JSON files    →    Direct import in page        Replaced by: API call / Shopify Storefront query
  /data/products.ts        component at build time       with same TypeScript interface contract
```

The critical insight: **define your TypeScript product interface before any data source exists.** Every component that renders product data depends on this contract, not on where the data comes from. Swapping static JSON for a real API is then a one-file change in the data fetching layer.

```typescript
// The interface is the contract — not the data source
interface Product {
  id: string
  slug: string
  name: { en: string; ar: string }        // bilingual strings baked into the type
  description: { en: string; ar: string }
  category: 'tops' | 'bottoms'
  price: number
  currency: 'SAR'
  sizes: Size[]
  images: string[]                         // placeholder URLs during frontend phase
  inStock: boolean
}
```

### Cart Data Flow

```
User action (Add to Cart)
    ↓
CartStore (Zustand) ← persisted to localStorage
    ↓
CartItem[] with: { product, selectedSize, quantity }
    ↓
Cart page reads CartStore directly
    ↓
Checkout page reads CartStore + submits to Payment API
    ↓
(On success) CartStore.clear()
```

Cart state never touches the server during frontend phase. Zustand with `persist` middleware writes to localStorage automatically. This makes the cart work across page navigations and browser refreshes without a backend.

### Language/Direction Data Flow

```
User toggles language
    ↓
LocaleStore (Zustand or React Context) updates locale: 'en' | 'ar'
    ↓
Next.js router pushes new URL: /ar/... or /en/...
    ↓
Root layout reads locale from URL segment
    ↓
<html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
    ↓
All CSS logical properties respond automatically (no JS needed)
    ↓
All text rendered from translation dictionaries
```

The `dir` attribute on `<html>` is the single source of truth for layout direction. CSS logical properties (`margin-inline-start` instead of `margin-left`, `padding-inline-end` instead of `padding-right`) then respond to it automatically everywhere. No component needs to know what direction it's rendering in.

### User Session Flow (Frontend Phase)

No authentication exists in v1. Session state is:
- Cart contents: Zustand + localStorage
- Language preference: cookie read by middleware
- Selected size on PDP: local component state (not persisted)

---

## Component Hierarchy

```
RootLayout (app/[locale]/layout.tsx)
├── Providers
│   ├── CartProvider (Zustand store context)
│   └── ThemeProvider (if needed for dark mode)
├── Navigation
│   ├── Logo
│   ├── NavLinks (Home, Shop, About, Contact)
│   ├── LanguageToggle (EN ↔ AR)
│   └── CartIcon (badge with item count from CartStore)
├── [Page Content] (varies by route)
└── Footer
    ├── FooterLinks
    ├── SocialLinks
    └── LanguageToggle (repeat for mobile accessibility)

Page-Level Components:

Home
├── HeroBanner (full-bleed, editorial)
├── FeaturedProducts (static selection of 4-6 products)
├── CategoryTeaser (Tops / Bottoms CTA blocks)
└── BrandStatement (copy + atmospheric imagery)

Shop / Category
├── CategoryHeader (title, filter controls)
├── ProductGrid
│   └── ProductCard (image, name, price)
│       └── (links to /products/[slug])
└── EmptyState (zero results feedback)

ProductDetail (PDP)
├── ProductImageGallery (placeholder system during frontend phase)
├── ProductInfo
│   ├── ProductName
│   ├── ProductPrice
│   ├── SizeSelector (S/M/L/XL + size guide)
│   └── AddToCartButton → CartStore.add()
└── ProductDescription
    └── (bilingual content from product data)

Cart
├── CartLineItems
│   └── CartItem (image, name, size, qty controls, remove)
├── CartSummary (subtotal, currency)
└── CheckoutCTA

Checkout
├── ShippingForm
├── OrderSummary (read from CartStore)
├── PaymentSection (placeholder during frontend phase)
└── PlaceOrderButton

About
├── BrandHero
├── BrandNarrative (editorial copy)
└── FounderNote (optional)

Contact
├── ContactForm (name, email, message)
└── ContactInfo (optional social/email)
```

---

## State Management Architecture

### What State Exists

| State | Scope | Where Managed | Persistence |
|-------|-------|--------------|-------------|
| Cart items | Global | Zustand store | localStorage |
| Current locale | Global | URL (Next.js router) + cookie | Cookie |
| Selected size (PDP) | Local | useState in PDP component | None |
| Form inputs (Checkout) | Local | useState / React Hook Form | None |
| Form inputs (Contact) | Local | useState / React Hook Form | None |
| Product data | Build-time | Static JSON → server component | N/A |

### Why Zustand for Cart (not Redux, not Context)

- **Redux:** Massive boilerplate for what is a simple list with add/remove/update operations
- **Context + useReducer:** Fine, but causes unnecessary re-renders on every cart change for any consumer; Zustand's selector-based subscriptions are more precise
- **Zustand:** ~1KB, zero boilerplate, built-in `persist` middleware for localStorage, works in both client components and outside React (useful for checkout form submission logic)

### Why URL for Locale (not Zustand)

URL-based locale (`/en/...` vs `/ar/...`) is the correct pattern because:
- Shareable links preserve language
- Server components can read locale without client-side state
- Browser back/forward works correctly
- Next.js middleware can enforce locale routing before React renders anything

Client-side state for locale creates a flash-of-wrong-direction on page load.

### State Dependencies

```
CartStore
  ├── consumed by: CartIcon (badge count)
  ├── consumed by: Cart page (full item list)
  └── consumed by: Checkout page (order summary + totals)

LocaleStore (URL)
  ├── consumed by: Root layout (sets html[dir])
  ├── consumed by: Every text-rendering component (selects en/ar string)
  └── consumed by: Navigation (highlights active language)
```

---

## Frontend-First Strategy

The frontend-first constraint is a feature, not a limitation. It forces clean interface boundaries.

### The Three Layers

```
Layer 1: Static Data (frontend phase)
  /data/products.ts     ← hand-written TypeScript objects matching Product interface
  /data/categories.ts   ← category metadata

Layer 2: Data Access (sealed interface)
  /lib/products.ts      ← getProduct(slug), getProducts(category), getAllProducts()
                           returns Product[] from static data during frontend phase
                           returns Product[] from API during backend phase
                           SAME FUNCTION SIGNATURES. Components don't change.

Layer 3: Components
  — import only from /lib/products.ts
  — never import from /data/products.ts directly
```

This is the seam. When backend integration begins, only Layer 2 changes. Every component, every page, every test stays unchanged.

### Placeholder Image System

Product photography is unavailable at build time. Do not use broken `<img>` tags or `Lorem Picsum`. Instead:

- Define a `PlaceholderImage` component that renders a styled `<div>` with a consistent dark gradient, the ORKI logo mark, and a subtle noise texture — this looks intentional, not broken
- All images in static product data point to `/images/placeholder-[aspect].svg` (portrait for apparel)
- The placeholder component receives `alt` text from product data, preserving accessibility
- When real photography arrives, replacing the `src` string in each product record is the only change needed

### Checkout Placeholder

Payment integration (Mada, STC Pay, international cards) is backend work. During frontend phase:

- Render the full checkout form UI with all fields
- Implement client-side form validation (React Hook Form + Zod)
- The "Place Order" button submits to a `/api/checkout` route that returns a `{ success: true, orderId: 'MOCK-001' }` mock
- Show a success confirmation page with order number
- This confirms the UX flow is complete without any real payment processing

---

## Suggested Build Order

Build order is driven by two rules: **shared dependencies before consumers**, and **low-complexity pages before high-complexity pages**.

### Phase 1: Foundation (nothing works without this)

1. Next.js project initialization with App Router and TypeScript
2. Root layout: `<html lang dir>`, font loading, global CSS reset
3. RTL CSS architecture: CSS variables, logical properties baseline, direction utilities
4. Product data schema: TypeScript interface + static JSON for all 20-60 products
5. Data access layer: `/lib/products.ts` with all query functions
6. Placeholder image component
7. Translation dictionary structure: `/locales/en.ts` and `/locales/ar.ts`
8. Navigation component (used by every page)
9. Footer component (used by every page)
10. Locale middleware and routing

### Phase 2: Core Shopping Pages

11. Shop index page (product grid)
12. ProductCard component
13. Category pages (Tops, Bottoms) — reuse product grid
14. Product Detail Page (depends on ProductCard patterns, data access)
15. SizeSelector component
16. AddToCart logic (CartStore initialization happens here)

### Phase 3: Cart and Checkout Flow

17. CartStore (Zustand, with persist)
18. CartIcon with badge (plugs into Navigation)
19. Cart page (CartLineItems, CartSummary)
20. Checkout page (form, order summary, mock submit)
21. Order confirmation page

### Phase 4: Brand and Supporting Pages

22. Home page (HeroBanner, FeaturedProducts, CategoryTeaser)
23. About page
24. Contact page (ContactForm with validation)

### Rationale for This Order

- Navigation and Footer are built first because every subsequent page needs them for visual QA
- Data layer before any page that renders products — avoids rewriting components when data shape changes
- Cart before Home because the Cart is a core flow dependency; Home is a brand page that can be polished last
- Checkout before About/Contact because checkout is higher risk (more interactions, more state) and benefits from earlier testing

---

## RTL Architecture Considerations

RTL is not a "translate the CSS" step — it must be designed into the architecture from day one. Retrofitting RTL after building LTR doubles the work.

### The dir Attribute is the Only Switch

```html
<!-- Root layout — this one attribute drives everything -->
<html lang="ar" dir="rtl">
  <!-- All child elements respond automatically via logical properties -->
</html>
```

### Use CSS Logical Properties Exclusively

Never use directional physical properties:

| Avoid (physical) | Use instead (logical) |
|------------------|-----------------------|
| `margin-left` | `margin-inline-start` |
| `margin-right` | `margin-inline-end` |
| `padding-left` | `padding-inline-start` |
| `padding-right` | `padding-inline-end` |
| `left: 0` | `inset-inline-start: 0` |
| `right: 0` | `inset-inline-end: 0` |
| `border-left` | `border-inline-start` |
| `text-align: left` | `text-align: start` |
| `flex-direction: row` | ← row is fine; `row-reverse` for RTL is a code smell |

Tailwind CSS v3+ ships with logical property utilities (`ms-`, `me-`, `ps-`, `pe-`) which map to inline-start and inline-end. Use these everywhere spacing is directional.

### Font Loading for Bilingual

Arabic and Latin scripts require separate fonts. Both must be loaded in the root layout:

```typescript
// Root layout
const geist = Geist({ subsets: ['latin'] })             // EN: editorial sans
const tajawal = Tajawal({ subsets: ['arabic'], weight: ['400', '700'] })  // AR: clean Arabic
```

The font stacks should be composed so each language renders its own typeface:

```css
:root {
  --font-latin: 'Geist', sans-serif;
  --font-arabic: 'Tajawal', sans-serif;
}

:lang(en) { font-family: var(--font-latin); }
:lang(ar) { font-family: var(--font-arabic); }
```

This means no component ever conditionally sets a font — the CSS `:lang()` selector handles it automatically.

### Bidirectional Animations

Animations that move content horizontally must respect direction:

- Slide-in from left in LTR = slide-in from right in RTL
- Use `translateX(var(--slide-offset))` where `--slide-offset` is set by:

```css
:root { --slide-offset: -100%; }
[dir="rtl"] { --slide-offset: 100%; }
```

- Icons that imply direction (arrows, chevrons, "back" indicators) must flip in RTL. Use `transform: scaleX(-1)` in `[dir="rtl"]`, or use separate icon variants
- Cart icon, nav chevrons, breadcrumb arrows: all must be tested in both directions

### Translation Dictionary Shape

```typescript
// /locales/en.ts
export const en = {
  nav: { shop: 'Shop', about: 'About', contact: 'Contact' },
  pdp: { addToCart: 'Add to Cart', selectSize: 'Select Size', outOfStock: 'Out of Stock' },
  cart: { empty: 'Your cart is empty', subtotal: 'Subtotal', checkout: 'Checkout' },
  // ...
}

// /locales/ar.ts
export const ar = {
  nav: { shop: 'المتجر', about: 'عن أوركي', contact: 'تواصل معنا' },
  pdp: { addToCart: 'أضف إلى السلة', selectSize: 'اختر المقاس', outOfStock: 'غير متوفر' },
  cart: { empty: 'سلة التسوق فارغة', subtotal: 'المجموع', checkout: 'الدفع' },
  // ...
}
```

Flat key/value with typed keys enforced by TypeScript — if a key exists in `en` it must exist in `ar` or TypeScript throws. Prevents missing translation bugs.

### Numbers and Currency

- Arabic numerals: use `toLocaleString('ar-SA')` for price formatting in AR locale
- Currency symbol placement: SAR abbreviation goes after the number in both locales (1,500 SAR)
- Do not hardcode currency position — use `Intl.NumberFormat` with `style: 'currency'`

---

## Key Architecture Decisions

| Decision | Chosen Approach | Rationale |
|----------|----------------|-----------|
| Framework | Next.js App Router | SSG+ISR+CSR in one framework; best RTL+i18n story |
| Routing | `[locale]` URL segment | Server-readable, shareable, no flash-of-wrong-direction |
| State | Zustand (cart) + URL (locale) | Right tool for each state type; minimal complexity |
| Data layer | Sealed `/lib/` interface | Frontend-first → backend swap requires zero component changes |
| CSS direction | Logical properties + `dir` on `<html>` | Single switch drives entire layout; no per-component RTL code |
| Rendering | SSG for content, CSR for interactive | Product pages are fast static; cart/checkout are dynamic |
| Headless vs Monolith | Next.js monolith | 20-60 products; headless overhead is unjustified |
| Image placeholder | Intentional design component | Placeholder must look editorial, not broken |

---

## Sources

- Next.js App Router documentation — i18n routing, middleware, rendering strategies (HIGH confidence)
- CSS Logical Properties specification — MDN Web Docs (HIGH confidence)
- Zustand documentation — persist middleware, selector subscriptions (HIGH confidence)
- Tailwind CSS v3 — logical property utility classes (ms-, me-, ps-, pe-) (HIGH confidence)
- Common DTC ecommerce frontend patterns — derived from Shopify, Medusa, and open-source storefront implementations (MEDIUM confidence)
