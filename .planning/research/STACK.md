# Stack: ORKI Ecommerce

**Project:** ORKI — Saudi streetwear DTC ecommerce
**Researched:** 2026-05-06
**Research method:** Training knowledge (cutoff Aug 2025). All external verification tools (Bash, WebSearch, WebFetch, Context7 MCP) were unavailable in this environment. Every version number must be confirmed via `npm info <pkg> version` before use. Confidence levels reflect this constraint.

---

## Recommended Stack (Summary)

| Layer | Choice | Version (verify) | Confidence |
|-------|--------|-----------------|-----------|
| Framework | Next.js (App Router) | 15.x | HIGH concept / LOW version |
| Styling | Tailwind CSS v4 | 4.x | HIGH concept / LOW version |
| UI primitives | shadcn/ui (headless, unstyled base) | latest | MEDIUM |
| Animation | Motion (formerly Framer Motion) | 11.x | HIGH concept / LOW version |
| Scroll animation | GSAP ScrollTrigger | 3.x | HIGH |
| i18n routing | next-intl | 3.x | HIGH |
| RTL CSS | Tailwind `dir` variant + logical properties | — | HIGH |
| Arabic font | IBM Plex Arabic or Noto Sans Arabic | — | HIGH |
| Cart/checkout state | Zustand | 4.x | HIGH |
| Ecommerce backend (future) | Medusa v2 | 2.x | HIGH concept / MEDIUM version |
| Payments (future) | Moyasar (Mada + STC Pay) | — | HIGH |
| CMS (optional) | Sanity v3 | 3.x | MEDIUM |
| Deployment | Vercel | — | HIGH |

---

## Frontend Framework

### Recommendation: Next.js 15 with App Router

**Why Next.js over alternatives:**

- **Framer (marionshop reference):** The user referenced marionshop.framer.website as aesthetic inspiration, not as a tech recommendation. Framer is a no-code/low-code visual builder — it cannot support the RTL layout switching, dynamic cart state, and custom payment integrations ORKI needs. It is the right reference point aesthetically, wrong tool for this project.
- **Remix:** Strong DX, but smaller ecosystem and fewer RTL/i18n primitives. No meaningful advantage over Next.js for this use case.
- **Vite + React SPA:** No SSR. Bad for SEO (product pages need to be indexed). Eliminates the option of adding SSR later.
- **Next.js:** The undisputed standard for React ecommerce in 2025. App Router enables React Server Components, which means product pages render server-side by default (good for SEO and initial paint). Streaming, layouts, and route groups make bilingual routing clean.

**Key App Router features ORKI will use:**
- `[locale]` route group for `/en` and `/ar` prefixed routes — handled natively via next-intl
- Server Components for product listing pages (static product data, no client JS overhead)
- Client Components only where interactivity is required (cart, language switcher, animations)
- `generateStaticParams` for pre-rendering all product pages at build time

**Confidence:** HIGH (concept). LOW (exact version — confirm `15.x` is current stable before project init).

---

## Styling / Design System

### Recommendation: Tailwind CSS v4 + shadcn/ui + CSS logical properties

**Tailwind CSS v4**

Tailwind v4 is the current major version as of mid-2025. The key change from v3: configuration moves from `tailwind.config.js` to a CSS-native `@theme` block. This is a breaking change from v3 — do not mix v3 docs with v4 projects.

Why Tailwind for ORKI:
- The black-and-white editorial palette is trivially expressed in utility classes.
- `dir="rtl"` variant support is first-class: `rtl:space-x-reverse`, `rtl:text-right`, etc.
- v4 introduces CSS logical properties as a first-class output mode, which is the correct way to handle bidirectional layouts (use `ms-4` instead of `ml-4` — "margin-inline-start" works correctly in both LTR and RTL).
- Tight integration with CSS variables makes dark editorial theming straightforward.

**shadcn/ui**

shadcn/ui is not a component library you install — it is a CLI that copies unstyled, accessible Radix UI primitives directly into your project. For ORKI:
- Zero visual opinions: every component is yours to style with Tailwind.
- Radix UI handles accessibility (focus management, ARIA, keyboard nav) correctly for RTL.
- Dialog, Sheet (drawer), Select, and Accordion are needed for cart sidebar, size selector, and mobile nav.
- You own the source — no dependency upgrade breaking your custom dark theme.

**What NOT to use for styling:**
- `Material UI (MUI)`: Opinionated design system built for Material Design. Fighting it for a raw underground aesthetic is slower than building from scratch.
- `Chakra UI`: Good RTL support but opinionated component styles. Same problem.
- `Ant Design`: Enterprise-oriented. Heavy. Chinese design language.
- `Bootstrap`: Not RTL-first. Grid system fights with Tailwind. Irrelevant in 2025 for custom brands.

**Confidence:** HIGH (Tailwind v4 concept, shadcn/ui approach). LOW (exact v4 version number — verify before init).

---

## Animation

### Recommendation: Motion (Framer Motion) for component animation + GSAP ScrollTrigger for scroll-driven reveals

**Motion (formerly Framer Motion) v11**

The package renamed from `framer-motion` to `motion` in 2024. Import path changes from `import { motion } from 'framer-motion'` to `import { motion } from 'motion/react'`. Both may still work but prefer the new package name.

Why Motion:
- Declarative animation API fits React component model perfectly.
- `AnimatePresence` handles page transitions and cart sidebar mount/unmount elegantly.
- Layout animations (`layoutId`) enable product image hero transitions between list and detail views — exactly the kind of polish the marionshop reference has.
- RTL direction has no bearing on most Motion animations (opacity, scale, y-axis) — the few that use x-axis need `dir`-aware values, which is a small and manageable surface.
- Excellent Next.js App Router compatibility when components are correctly marked `'use client'`.

**GSAP + ScrollTrigger**

Motion's scroll animation capabilities are functional but GSAP ScrollTrigger is significantly more powerful for the "bold scroll reveals" requirement:
- Pinning sections while scrubbing (e.g., product imagery pinned while text scrolls past).
- Staggered entrance animations tied to scroll position.
- Timeline sequencing across DOM elements.

Use pattern: Motion handles component-level interactivity (hover states, page transitions, cart open/close). GSAP handles page-level scroll choreography (hero sequences, product grid reveals).

**What NOT to use:**
- `react-spring`: Good physics, but API is harder to use and ecosystem momentum has shifted to Motion.
- `anime.js`: No React bindings maintained to the same standard.
- CSS animations alone: Cannot achieve the pinning and scroll-scrub effects required.
- `Lottie`: Use only for specific icon/illustration animations, not page choreography. Unnecessary here given the black-and-white static aesthetic.

**Confidence:** HIGH (Motion concept, GSAP concept). MEDIUM (version numbers — verify `motion` current major, GSAP 3.x still current or superseded by v4).

---

## Internationalization (i18n / RTL)

This is the most architecturally consequential decision in the entire stack. Get it wrong and it touches every component.

### Recommendation: next-intl v3 for routing + translation, Tailwind logical properties for CSS, dedicated Arabic font

**next-intl**

next-intl is the dominant Next.js i18n library as of 2025, designed specifically for the App Router. It provides:
- Middleware-based locale detection and routing (`/en/shop`, `/ar/shop`).
- Server Component support — translations are loaded server-side, not shipped as client JS bundles.
- Type-safe message keys with TypeScript.
- Plural rules and number/date formatting per locale (important for Arabic plural forms, which have 6 forms vs English's 2).

**RTL Layout Architecture (critical)**

Do not set RTL at the component level. Set it at the document level:

```html
<!-- in your root layout -->
<html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
```

This single attribute flips the entire page layout including:
- Tailwind's `rtl:` variant activates for every component
- Browser's native text directionality
- Flexbox/Grid row direction

**CSS Logical Properties (mandatory practice)**

Every developer on this project must use logical properties, not physical directional properties:

| Avoid (physical) | Use instead (logical) |
|-----------------|----------------------|
| `ml-4` / `margin-left` | `ms-4` / `margin-inline-start` |
| `pr-6` / `padding-right` | `pe-6` / `padding-inline-end` |
| `left-0` / `inset-left` | `start-0` / `inset-inline-start` |
| `text-left` | `text-start` |
| `border-l` | `border-s` |

Tailwind v4 has full logical property support. Using physical properties will break RTL and require a full audit to fix.

**Arabic Typography**

Font choice for Arabic is as important as font choice for English in a premium brand context.

- **IBM Plex Arabic** — clean, geometric, pairs well with modern sans-serif Latin fonts. Good for editorial contexts. Available on Google Fonts. Confidence: HIGH.
- **Noto Sans Arabic** — Google's universal fallback, excellent coverage, neutral. Safe but less personality.
- **Cairo** — widely used in Arab ecommerce, slightly more personality than Noto. Popular choice.

Recommended pairing for ORKI's dark editorial aesthetic:
- English: A geometric sans-serif (e.g., `Space Grotesk`, `Inter`, or `DM Sans`) — weight variety is important for editorial hierarchy.
- Arabic: IBM Plex Arabic — matches the geometric character of Space Grotesk family.

Font loading: Use `next/font` (Next.js built-in) for both. It self-hosts fonts, eliminates FOUT (Flash of Unstyled Text), and generates correct `font-display: swap` automatically.

**Do NOT use:**
- `react-i18next` / `i18next`: Works in React but not designed for Next.js App Router. Missing RSC support, middleware routing, and server-side message loading.
- `next-i18next`: The old Pages Router solution. Deprecated pattern for App Router projects.
- Manual `useEffect` locale detection: Causes hydration mismatches and layout shift.
- Google Translate overlay: Destroys RTL layout and custom typography.

**Confidence:** HIGH (next-intl approach, logical properties approach, font strategy). MEDIUM (specific font pairing recommendation — aesthetic judgment, not technical fact).

---

## Ecommerce Layer

### Phase 1 (current): Static data layer — no ecommerce backend needed

With 20-60 products, the frontend-first phase should use a static product data file:

```
/src/data/products.ts  — typed product objects with placeholder image URLs
```

This gives typed autocomplete, zero cost, zero infrastructure, and is trivially replaced by API calls later.

No ecommerce library is needed for Phase 1.

### Phase 2 (future): Medusa v2

**Why Medusa over Shopify:**

| Criterion | Medusa v2 | Shopify |
|-----------|-----------|---------|
| Control | Full — self-host, own your data | Limited — Shopify's platform |
| Cost | Free (self-host) + infra costs | $39-$399/mo + transaction fees |
| Saudi payment integration | Any provider via plugin API | Shopify Payments not available in KSA; workarounds cumbersome |
| Custom checkout | Build what you need | Checkout extensibility limited outside Plus |
| RTL / Arabic | Full control | Theme-level; Arabic support varies |
| Headless frontend | First-class JS SDK | Storefront API (GraphQL) — works but Shopify-flavored |

For Saudi Arabia specifically: Shopify Payments does not operate in KSA. You would need Shopify Plus with a third-party gateway, adding cost and complexity. Medusa gives a clean plugin API that Moyasar (the correct Saudi payment gateway) supports.

**Why Medusa v2 over Medusa v1:**
Medusa v2 (released 2024) is a complete rewrite. It is the current version. Do not start a new project on v1.

**Why NOT WooCommerce:** PHP stack creates a frontend/backend architectural split and worse DX than the JS-first stack recommended here.

**Why NOT Commerce.js:** Smaller community, less documentation, uncertain long-term maintenance.

### Saudi Payments: Moyasar

Moyasar is the correct payment gateway for the Saudi market. It supports:
- **Mada** — Saudi domestic debit network (mandatory for Saudi consumers, >70% of transactions)
- **STC Pay** — Saudi telecom wallet (popular with younger demographics = ORKI's target)
- Visa / Mastercard
- Apple Pay

Moyasar provides a React SDK. It integrates cleanly as a Medusa payment provider in Phase 2.

**Do NOT use:**
- Stripe: No Mada support as of training cutoff. Stripe operates in KSA but Mada is unsupported, which will reject the majority of Saudi consumer transactions.
- PayPal: Low adoption in Saudi Arabia.
- Raw Checkout.com or Tap Payments: Valid alternatives to Moyasar but require more custom integration. Tap Payments is another strong option for KSA — verify both before Phase 2 begins.

**Confidence:** HIGH (Medusa v2 recommendation, Moyasar for Mada/STC Pay). MEDIUM (Medusa version — verify v2 is current stable). LOW (Stripe Mada limitation — verify this has not changed before ruling it out).

---

## State Management

### Recommendation: Zustand for cart state

Cart state is the only persistent client-side state this application needs:
- Items in cart (product, variant, quantity)
- Cart open/closed (UI)
- Selected locale preference (supplementary to URL-based routing)

Zustand is the correct choice:
- Minimal API — 10 lines to create a cart store
- No boilerplate (compare: Redux requires actions, reducers, selectors)
- Works cleanly with Next.js App Router (pure client-side, no SSR hydration issues)
- Persist middleware for `localStorage` cart persistence (cart survives page refresh)

**What NOT to use:**
- Redux Toolkit: Overkill for a cart store. The boilerplate-to-value ratio is poor.
- React Context for cart: Context causes full re-renders of every consumer on every cart change. Fine for small apps, problematic as cart grows. Zustand's selector model prevents this.
- Jotai: Good alternative to Zustand but smaller ecosystem. Either works; Zustand is more commonly seen in ecommerce templates.
- Server state for cart (React Query / SWR): These are for server data fetching, not local UI state. Don't conflate them.

**Confidence:** HIGH.

---

## CMS (Optional)

### Recommendation: Sanity v3 if content editing is needed; skip it for Phase 1

For Phase 1 (frontend-only, placeholder data), a CMS adds zero value and real complexity.

If Phase 2 introduces a content editor (for managing product descriptions, homepage banners, about page copy in both EN and AR), Sanity v3 is the right choice:
- GROQ query language returns only the fields you request (no overfetching)
- Localization is first-class: a field can store both `{en: "...", ar: "..."}` values
- Real-time preview works with Next.js
- Free tier is generous for a 20-60 product catalog

**Do NOT use:**
- Contentful: More expensive than Sanity at the same feature level for a small catalog.
- Prismic: Weaker Arabic/RTL support in the visual editor.
- WordPress/WooCommerce as CMS: Introduces a PHP layer. Wrong architecture.

**Confidence:** MEDIUM (Sanity is well-established; specific version and tier details need confirmation).

---

## Deployment

### Recommendation: Vercel

Next.js on Vercel is the zero-config path. For ORKI:
- Automatic preview deployments per branch (show stakeholders before merging)
- Edge Network CDN — Vercel has CDN nodes in the Middle East (Bahrain region) which benefits Saudi users
- Built-in image optimization (`next/image`) — critical for placeholder-to-real-product-image transition later
- Analytics and Web Vitals included
- Free tier covers the frontend-first phase entirely

**Confidence:** HIGH.

---

## What NOT to Use (and Why)

| Technology | Category | Why Not |
|------------|----------|---------|
| Framer (framer.com) | Builder | No-code tool, cannot support custom RTL logic, cart state, or payment integration |
| Shopify | Ecommerce | Shopify Payments not in KSA; limited checkout control; transaction fees; Mada support poor |
| Next.js Pages Router | Framework | Legacy pattern; use App Router for all new projects |
| react-i18next / i18next | i18n | Not designed for App Router; missing RSC support |
| next-i18next | i18n | Pages Router only; deprecated pattern |
| MUI / Chakra UI | UI | Opinionated design systems that fight a custom dark underground aesthetic |
| Bootstrap | CSS | Not RTL-first; fights with Tailwind; irrelevant for custom brands |
| Ant Design | UI | Enterprise Chinese design language; wrong brand register |
| Redux Toolkit | State | Extreme overkill for a cart store |
| WordPress + WooCommerce | Platform | PHP stack; wrong architecture for a JS-first Next.js project |
| Stripe | Payments | No Mada support (verify before Phase 2 begins — this may change) |
| CSS physical properties (`ml-`, `pl-`, `left-`) | CSS practice | Breaks RTL; must use logical properties throughout |
| Google Translate overlay | i18n | Destroys RTL layout and custom typography |

---

## Open Questions

These must be resolved before or during Phase 2 (backend integration):

1. **Stripe Mada support** — Verify whether Stripe has added Mada support for KSA since training cutoff (Aug 2025). If yes, Stripe becomes viable and simplifies the payment stack considerably.

2. **Tap Payments vs Moyasar** — Both support Mada and STC Pay. Tap Payments has broader MENA coverage; Moyasar is Saudi-focused. Evaluate developer experience, fees, and documentation quality before committing.

3. **Medusa v2 stability** — Medusa v2 was a significant rewrite. Verify community stability, plugin ecosystem maturity, and hosting requirements (Node.js server vs serverless) before Phase 2 begins.

4. **Sanity necessity** — If product data never changes frequently or requires non-developer editing, skip Sanity entirely and keep products as typed TypeScript objects. The CMS adds indirection that may not pay off for a 20-60 product catalog.

5. **Motion package name** — Confirm whether the import is `motion/react` (new name) or `framer-motion` (legacy). Both may work but the project should be consistent. Check npm for current package status.

6. **All version numbers** — Every version listed in the summary table is training-data-derived and must be verified via `npm info <pkg> version` before `package.json` is committed.

---

## Verification Required Before Project Init

Run these before scaffolding:

```
npm info next version
npm info tailwindcss version
npm info motion version
npm info framer-motion version
npm info next-intl version
npm info zustand version
npm info gsap version
```

This file was written without live npm access. All version numbers are approximate based on training data (cutoff August 2025).
