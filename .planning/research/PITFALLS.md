# Pitfalls: ORKI Ecommerce

**Project:** ORKI -- Saudi streetwear brand
**Researched:** 2026-05-06
**Confidence:** MEDIUM -- research tools restricted; findings drawn from documented RTL/ecommerce failure patterns with high community consensus

---

## RTL / Bilingual Pitfalls

### P-RTL-1: CSS `left`/`right` instead of `inset-inline-start`/`inset-inline-end`

**What goes wrong:** Hardcoding `left` and `right` in CSS positions, padding, margin, and `text-align` means those values do not flip when the document direction changes. A hamburger menu icon aligned `right: 1rem` stays on the right in Arabic instead of moving to the left.

**Why it happens:** The default mental model is LTR. Developers write `margin-left: 1rem` as muscle memory, and it passes visual QA in the default language, so it ships broken in Arabic.

**Consequences:** Every component that uses directional CSS properties breaks independently. This compounds multiplicatively -- 30 components each with 3-5 directional rules means 90-150 individual breakages discovered after the full site is built.

**Warning signs:**
- Any `margin-left`, `padding-right`, `left:`, `right:`, `text-align: left` in component CSS
- Utility classes like `ml-4`, `pr-2` in Tailwind (directional, not logical)

**Prevention:** Use CSS logical properties exclusively from day one:
- `margin-inline-start` / `margin-inline-end` instead of `margin-left` / `margin-right`
- `padding-inline-start` / `padding-inline-end`
- `inset-inline-start` / `inset-inline-end` for positioned elements
- `text-align: start` / `text-align: end` instead of `left` / `right`
- In Tailwind: use `ms-*`, `me-*`, `ps-*`, `pe-*` utilities (logical variants)

**Phase:** Address in Phase 1 (project setup). Establish a lint rule (`eslint-plugin-css-logical` or Tailwind config) that flags directional utilities before a single component is written.

---

### P-RTL-2: SVG icons and UI glyphs not mirrored for RTL

**What goes wrong:** Directional icons -- arrows, chevrons, cart icons with handles, progress indicators -- look wrong in RTL because they point the wrong way. A "next" arrow pointing right in LTR should point left in RTL to indicate forward progression.

**Why it happens:** Icons are treated as decoration, not as directional semantics. The LTR version looks correct, so the icon is assumed to be language-neutral.

**Consequences:** Checkout step indicators pointing backwards, carousel arrows reversed in meaning, "back to shop" links with arrows pointing toward the product -- all erode trust with Arabic-native users.

**Warning signs:**
- Arrow, chevron, breadcrumb, and slider control icons that are purely decorative SVGs
- Icons imported as static assets rather than as components with direction awareness

**Prevention:**
- Maintain an explicit list of icons that require mirroring
- Apply `[dir="rtl"] .icon-directional { transform: scaleX(-1); }` globally for the mirror class
- For icon libraries (Lucide, Heroicons), wrap directional icons in a `<DirectionalIcon>` component that auto-applies the transform

**Phase:** Address in Phase 1 (design system / component foundation). Document which icons are directional in the icon inventory before implementing nav and UI chrome.

---

### P-RTL-3: Font stack not providing Arabic fallback

**What goes wrong:** The English typeface is specified but the `font-family` stack has no Arabic-capable fallback. The browser renders Arabic text in a default system font (Times New Roman or system-ui) that clashes completely with the editorial dark aesthetic.

**Why it happens:** Font selection is done for the Latin glyphs. Arabic coverage is assumed to "just work" via system fonts, but system fonts on mobile especially are inconsistent and ugly.

**Consequences:** Typography -- which is the primary brand signal for a minimal dark editorial site -- breaks entirely in Arabic. The page looks unfinished and amateurish to Arabic speakers.

**Warning signs:**
- Font-family declaration that references only a Latin typeface
- No `@font-face` or Google Fonts import that includes Arabic Unicode ranges

**Prevention:**
- Choose a type pairing strategy early: either a single typeface with full Arabic support (IBM Plex Arabic, Noto Sans Arabic, Cairo) or a deliberate EN/AR pairing
- Load Arabic font explicitly with `unicode-range` restricted to Arabic block so it does not inflate page weight for English visitors
- Validate Arabic rendering on Android Chrome (worst-case baseline) before declaring typography done

**Phase:** Phase 1 (design system). Typography decisions must include Arabic before any components are built.

---

### P-RTL-4: `direction` applied to `<body>` without `lang` attribute on `<html>`

**What goes wrong:** RTL is triggered by toggling a class or setting `direction: rtl` on body, but the `<html lang="ar">` attribute is not updated. Search engines, screen readers, and the browser's built-in bidirectional algorithm all use `lang` to make correct decisions.

**Why it happens:** The visual switch works (direction swaps), so the `lang` attribute is treated as optional metadata.

**Consequences:** Screen readers mispronounce or refuse to switch language mode. SEO sees all content as the same language. The browser's `<q>` quotes, `<ol>` counters, and other locale-sensitive elements render incorrectly. Arabic-locale users on iOS get incorrect autocorrect behavior in form fields.

**Prevention:**
- Language switching must always update both `document.documentElement.lang` and `document.documentElement.dir`
- Implement as a single atomic operation in the i18n provider -- never one without the other
- Test with a screen reader (NVDA + Chrome on Windows, VoiceOver on iOS) before phase sign-off

**Phase:** Phase 1 (i18n setup). This is an architectural constraint, not a styling detail.

---

### P-RTL-5: Translation strings using LTR-biased string formatting

**What goes wrong:** English strings with embedded numbers or brand names use positional formatting like `"${count} items in your cart"`. In Arabic, number placement and grammatical number agreement (singular/dual/plural) follows different rules. Arabic grammatical number has six plural forms (zero, one, two, few, many, other); most content teams only provide one translation string.

**Why it happens:** Developers test the happy path (1 item, multiple items) in English only. Arabic plural complexity is not visible until Arabic strings are actually written.

**Consequences:** Grammatically incorrect Arabic on cart badges, product counts, and pagination -- immediately noticeable to native speakers as machine-generated or careless.

**Prevention:**
- Use an i18n library with CLDR plural rules support (next-intl, react-i18next with i18next-icu)
- Require plural variants in Arabic translation files: `zero`, `one`, `two`, `few`, `many`, `other`
- Put all count-bearing strings through a translator, not a developer with Google Translate

**Phase:** Phase 1 (i18n setup) for library choice. Phase 2+ for content as Arabic strings are written.

---

### P-RTL-6: Animations and transitions not direction-aware

**What goes wrong:** Slide-in animations hardcoded to `translateX(-100%)` (slide from left) are correct for LTR menus but wrong for RTL, where the menu should slide from the right. Scroll reveal animations that animate `x: -20px` (left offset) feel backwards in Arabic.

**Why it happens:** Animation direction is treated as a design decision that happens once in LTR. RTL is added later and the animations are not revisited.

**Consequences:** Menus and drawers slide in from the wrong edge. The overall motion language contradicts spatial layout. This is subtle but accumulates into a feeling that "something is off" for Arabic users.

**Prevention:**
- Parameterize all translational animations relative to reading direction
- In Framer Motion / GSAP: derive `x` values from a `useDirection()` hook that returns `1` for LTR and `-1` for RTL, then multiply offset values
- Test all animations with `dir="rtl"` active before phase sign-off

**Phase:** Phase 2 (animation implementation). Flag animations for direction review in the animation system design doc.

---

## Fashion Ecommerce UX Pitfalls

### P-FASHION-1: No out-of-stock UX strategy -- the silent dead end

**What goes wrong:** Products are shown in the catalog when all sizes are sold out, with no indication of status until the user reaches the product page and discovers nothing is purchasable. Or worse: the size selector shows all sizes, the user picks one, and "Add to Cart" silently fails or shows an error after the click.

**Why it happens:** Small catalog sites build the happy path (items in stock) and discover OOS handling only when it actually happens.

**Consequences:** Users lose trust in the site, interpret OOS as a broken product page, and leave. Return rates for users who hit OOS dead ends are near zero -- they rarely come back.

**Warning signs:**
- Size selector with no disabled state
- "Add to Cart" button with no loading or error state
- No visual differentiation between in-stock and out-of-stock catalog cards

**Prevention:**
- Design all three states explicitly: in-stock, partially OOS (some sizes gone), fully OOS
- Disabled size buttons with strikethrough for unavailable sizes
- Fully OOS products: greyed card in catalog with "Sold Out" overlay, non-clickable or redirected to a "notify me" state
- This is a frontend design decision -- build placeholder states for all three even before backend provides real stock data

**Phase:** Phase 2 (product and PDP). Requires a size availability data model defined in the frontend contract before backend integration.

---

### P-FASHION-2: Size guide as afterthought

**What goes wrong:** Sizes are displayed as S/M/L/XL with no measurement reference. Streetwear sizing is often intentionally oversized; Saudi consumers who are unfamiliar with the brand's fit convention pick wrong sizes and return items.

**Why it happens:** The developer builds size selection as a UI pattern (radio buttons or chips) without considering the informational need behind it.

**Consequences:** High return rates. Customer service load increases. For a small brand, high returns erode margins and damage the "premium" positioning.

**Warning signs:**
- Size display is a static list of labels with no linked guide
- No "fit" or "sizing" tab/section on the PDP

**Prevention:**
- Build a size guide component (modal or expandable section) from day one on the PDP
- Include both measurement chart AND fit description (e.g., "oversized -- size down for a fitted look")
- Even if initial sizes are placeholder, the component and copy structure must be designed to receive real data

**Phase:** Phase 2 (PDP). Size guide is a required PDP component, not an optional enhancement.

---

### P-FASHION-3: Photography expectations vs. placeholder reality

**What goes wrong:** The site is built with placeholder imagery. When real photography arrives, it does not match the aspect ratios, color grading, or cropping assumptions the layouts were designed around. Product grids break because real photos are portrait where the design assumed square, or the hero is designed for moody dark editorial shots but the brand delivers clean-background studio photos.

**Why it happens:** Designers (and AI agents) design for ideal photography. Real-world photo delivery rarely matches this ideal without explicit direction.

**Consequences:** A complete layout revision is required to accommodate actual photography. Alternatively, the photography is cropped badly and the editorial quality the brand paid for is destroyed.

**Warning signs:**
- Placeholder images in a single fixed aspect ratio with no art direction notes
- No communication with the photographer/creative director about required crops and compositions

**Prevention:**
- Define aspect ratio constraints per image slot in the design: catalog card (e.g., 3:4 portrait), PDP hero (e.g., 4:5 or full-bleed), about page (freeform editorial)
- Document these in an "image spec" note for whoever delivers photography
- Build image containers with `object-fit: cover` and explicit focal point support so minor crop differences are handled gracefully
- Use `next/image` with the `placeholder="blur"` prop and a blurred base64 of the placeholder -- this means the swap to real images requires no layout changes

**Phase:** Phase 1 (design system). Aspect ratios and image treatment must be standardized before any component uses images.

---

### P-FASHION-4: Cart that does not persist across sessions

**What goes wrong:** Cart state lives only in React component state. Refreshing the page, closing the browser, or switching devices clears the cart entirely. The user spends two minutes building a cart, gets distracted, comes back, and starts from zero.

**Why it happens:** Frontend-first development builds the cart as a UI exercise without thinking about persistence, which is treated as "a backend problem."

**Consequences:** Lost conversions. Streetwear audiences often spend time deciding -- they browse on mobile, add to cart, and complete purchase on desktop or later. Ephemeral carts break this behavior.

**Prevention:**
- Persist cart to `localStorage` from day one on the frontend
- Use a cart state manager (Zustand, Jotai) with a `persist` middleware configured to serialize to `localStorage`
- Hydrate cart from storage on app mount with an effect that handles SSR correctly (avoid hydration mismatch in Next.js)
- This is a frontend-only concern -- no backend required for persistence at this stage

**Phase:** Phase 3 (cart). Cart state persistence is a Phase 3 requirement, not a backend-phase task.

---

### P-FASHION-5: No visual feedback on size selection before add-to-cart

**What goes wrong:** The "Add to Cart" button is active even when no size is selected. Clicking it shows an error after the fact rather than guiding the user to select a size first. This is especially bad on mobile where the button may be far below the size selector.

**Why it happens:** The button state is not tied to form completion state.

**Prevention:**
- "Add to Cart" button is disabled until a size is selected
- When the button is clicked with no size selected (if not disabled), auto-scroll to size selector and show an inline prompt
- Selected size should have a clear active/selected visual state (border, fill, scale)

**Phase:** Phase 2 (PDP). This is a UX detail that must be in the design spec, not discovered during QA.

---

## Frontend-First Architecture Pitfalls

### P-FF-1: Placeholder data that becomes structural debt

**What goes wrong:** The frontend is built with hardcoded placeholder product arrays in a `data.ts` file. By the time backend integration arrives, the shape of the real API response does not match the shape the frontend was built around. The integration phase becomes a refactor, not a plug-in.

**Why it happens:** The frontend developer defines whatever data shape is convenient for the UI without consulting API design principles or what a real ecommerce backend (Shopify, WooCommerce, custom) would actually return.

**Consequences:** Integration phase takes 3x longer than estimated. Component prop types must be updated everywhere. The "frontend-first" advantage (parallel work) is destroyed by rework.

**Warning signs:**
- Product shape has non-standard field names (`productName` instead of `name`, `imgUrl` instead of `image.url`)
- No defined TypeScript interface file that separates domain types from UI props
- Placeholder data arrays embedded directly in page files rather than in a centralized data layer

**Prevention:**
- Define a canonical `Product`, `CartItem`, `Category` TypeScript interface in a `/types/domain.ts` file before building any component
- Mirror what a Shopify Storefront API or standard REST API would return (use their shape even for placeholder data)
- All placeholder data must conform to these interfaces
- Centralize placeholder data in a `/lib/placeholder-data.ts` file -- a single swap point for real API calls
- Never import placeholder data directly in page or component files; always go through a data-access function

**Phase:** Phase 1 (project setup). Type definitions and data access patterns must be established before the first component is built.

---

### P-FF-2: API contract not documented during frontend build

**What goes wrong:** The frontend is built without documenting what it needs from the backend. When backend work begins, the developer has to reverse-engineer what the frontend expects by reading component code. Assumptions made silently during frontend build become hidden requirements the backend must match.

**Why it happens:** "We'll figure out the API later" is treated as acceptable because backend is deferred. The frontend developer is focused on UI, not on defining contracts.

**Consequences:** Backend integration requires reading all frontend code to understand data requirements. Bugs appear because the backend returns data in a format that differs from silent frontend assumptions.

**Prevention:**
- Maintain an `API_CONTRACT.md` document updated as frontend is built
- For each page/feature, document: what data is needed, what shape, what pagination/filtering expectations
- This is a living document that becomes the backend spec
- Endpoints, payloads, and response shapes defined here before integration begins

**Phase:** Phase 2+ (ongoing during all frontend phases). Start in Phase 1, update continuously.

---

### P-FF-3: Checkout flow built as UI only with no error state design

**What goes wrong:** The checkout form is built as a happy-path UI exercise. No error states, no loading states, no payment failure flows, no address validation failures are designed. When the backend is integrated, all of these states appear and require design and development work that was not planned.

**Why it happens:** The checkout "works" in the frontend-only phase because there is no actual payment processing to fail.

**Consequences:** Integration phase reveals 10-15 undesigned states that must be built. The checkout redesign often introduces regressions in the happy path.

**Prevention:**
- Design and build all checkout states during the frontend phase, even with placeholder behavior:
  - Loading state (payment processing)
  - Card declined / payment failure
  - Network error / retry
  - Address not serviceable
  - Out of stock at purchase time
- Use a state machine approach (XState or a simple enum) to manage checkout step state -- this makes integration a matter of wiring real events to state transitions

**Phase:** Phase 4 (checkout). State machine spec required before checkout UI build begins.

---

### P-FF-4: No design for empty states

**What goes wrong:** The site looks great with products in the catalog and items in the cart. With zero products, zero search results, or an empty cart, the layout collapses into an unstyled void or displays a raw "No items found" text string.

**Why it happens:** Developers test with populated data. Empty states are edge cases that only appear in production or during integration.

**Prevention:**
- Design all empty states as first-class screens: empty cart, empty category (OOS), no search results
- For ORKI's aesthetic, empty states are a branding opportunity (dark editorial, minimal copy with brand voice)
- Treat empty states as required components alongside their populated counterparts

**Phase:** All product/cart phases. Empty state design should be included in the component spec for each feature.

---

### P-FF-5: Animation library choice not made at setup -- added mid-project

**What goes wrong:** Basic CSS transitions are used in early phases because "we'll add real animations later." Mid-project, an animation library (Framer Motion) is added. Components built with CSS transitions must be partially rewritten to use the library's model. The mix of CSS and library animations creates inconsistent behavior and bundle size overhead from both approaches.

**Prevention:**
- Decide on the animation library in Phase 1 and install it immediately, even if no animations are built yet
- Establish animation presets (duration, easing, enter/exit patterns) in a central config before the first animated component
- All motion uses the library from day one -- no mixing CSS keyframes for some things and library for others

**Phase:** Phase 1 (project setup). Animation library is an architectural decision.

---

## Performance Pitfalls (Image-Heavy Editorial Sites)

### P-PERF-1: Unoptimized images destroying Core Web Vitals

**What goes wrong:** Editorial fashion sites rely on large, high-quality images. Without optimization, a single above-the-fold hero image can be 3-8MB. A product catalog with 8 visible items could load 15-40MB of images on page load. LCP (Largest Contentful Paint) scores above 4 seconds make the site feel broken.

**Why it happens:** Images are added by dropping files into the project. Next.js does optimize images via `next/image`, but only if used correctly -- many developers use plain `<img>` tags and lose all optimization.

**Warning signs:**
- Any `<img>` tags in the codebase instead of `next/image`
- Images without explicit `width` and `height` props (causes layout shift)
- Hero images without `priority` prop (causes LCP delay)
- No `sizes` attribute on responsive images (browser downloads full-size on mobile)

**Prevention:**
- Enforce `next/image` usage via ESLint (`@next/next/no-img-element` rule, enabled by default in Next.js ESLint config)
- Hero images and above-the-fold images: always use `priority` prop
- Catalog images: use `loading="lazy"` (default in `next/image`) and correct `sizes` string matching the CSS grid breakpoints
- Set a maximum source image size budget: 2MB raw input max, never add uncompressed originals
- Configure `next.config.js` image `formats: ['image/avif', 'image/webp']` for modern format delivery

**Phase:** Phase 1 (project setup) for ESLint rules and `next/image` enforcement. Phase 2 for image sizing specs.

---

### P-PERF-2: Layout shift from images without reserved dimensions

**What goes wrong:** Images load after the surrounding content, causing the layout to jump. On a product grid, cards resize as images load in, making the page visually unstable. CLS (Cumulative Layout Shift) score tanks. Google penalizes high CLS in search ranking.

**Why it happens:** `width` and `height` props are omitted because the developer does not know the image dimensions at build time (placeholder system, dynamic content).

**Prevention:**
- All `next/image` usages must have either explicit `width`/`height` OR use the `fill` prop inside a positioned container with explicit `aspect-ratio`
- Define aspect ratios per slot type (catalog card: 3:4, hero: 16:9 or full-height) and use `aspect-ratio` CSS on the container
- For the placeholder system: use consistent aspect ratios so real images slot in without layout change

**Phase:** Phase 1 (design system). Aspect ratio definitions prevent layout shift before a single image is added.

---

### P-PERF-3: Loading all product images on catalog page

**What goes wrong:** A 60-item catalog renders all product images immediately. Even with lazy loading, the browser queues all image requests and the page stutters during scroll. On a 4G connection common in Saudi Arabia, this is perceivably slow.

**Prevention:**
- Trust `loading="lazy"` on catalog images -- do not override this
- Implement intersection-observer-based virtualization if the catalog exceeds 20 visible items (react-virtual or similar)
- Use a low-quality image placeholder (LQIP) for catalog images: a 10px blurred base64 version that renders immediately while the full image loads
- Limit initial catalog view to one category at a time (Tops OR Bottoms) rather than all items at once

**Phase:** Phase 2 (catalog). Virtualization decision should be made when designing the catalog component.

---

### P-PERF-4: Custom fonts causing FOUT / FOIT

**What goes wrong:** A display typeface is loaded asynchronously. Before it loads, the browser either shows a flash of unstyled text (FOUT) or hides text entirely (FOIT). On a dark editorial site, the brief moment where the heading renders in Times New Roman before the custom font arrives looks catastrophic.

**Prevention:**
- Use `font-display: swap` for body text (acceptable FOUT, fast render)
- Use `font-display: optional` for display/heading fonts -- the browser only uses the custom font if it loads within the first render; otherwise falls back. This eliminates visual flash.
- Preload critical font files in `<head>` using `<link rel="preload" as="font">`
- Next.js `next/font` handles this automatically with `display: 'swap'` -- use it instead of manual `@font-face`
- Subset fonts to only the Unicode ranges needed (Latin + Arabic only, not all of Unicode)

**Phase:** Phase 1 (design system). Font loading strategy is an architectural decision.

---

### P-PERF-5: Framer Motion animations blocking the main thread

**What goes wrong:** Scroll-triggered animations that animate `opacity`, `scale`, and `y` properties are GPU-accelerated and performant. Animations that trigger layout changes (`width`, `height`, `margin`, `top`) force browser reflow on every frame and cause jank, especially on mid-range phones common in the Saudi market.

**Prevention:**
- Animate only `opacity`, `transform` (translate, scale, rotate) -- never layout-triggering properties
- Use `will-change: transform` on elements that animate, applied before animation starts
- Use `useReducedMotion()` hook from Framer Motion to disable animations for users who have set their OS preference -- also a legal accessibility requirement in some jurisdictions
- Test all animations on a mid-range Android device (Chrome DevTools throttling: "Mid-tier mobile" preset) before each phase sign-off

**Phase:** Phase 2+ (any phase introducing animations). Establish the "transform only" rule in the animation system spec.

---

## Saudi Market / Regional Pitfalls

### P-SA-1: Missing Mada and STC Pay integration -- the sales killer

**What goes wrong:** The site ships with international payment methods only (Stripe + Visa/Mastercard credit cards). Saudi consumers predominantly use Mada (Saudi debit card network, issued by all Saudi banks) and STC Pay (the dominant mobile wallet). A customer with only a Mada card cannot complete checkout.

**Why it happens:** The developer uses the most familiar payment gateway (Stripe) without verifying Saudi market payment method support. Stripe supports Mada via its Bahrain entity, but this requires specific configuration and regional account setup -- it is not automatic.

**Consequences:** The majority of potential Saudi customers cannot complete a purchase. Conversion rate is near zero for the Saudi market despite high traffic.

**Warning signs:**
- Payment gateway chosen solely based on developer familiarity (Stripe default)
- No research done on which Saudi gateways support Mada natively

**Prevention:**
- Use a Saudi-native or Gulf-region payment gateway that bundles Mada and STC Pay natively: Moyasar, HyperPay, or Tap Payments are the standard choices for Saudi ecommerce
- Moyasar is developer-friendly with good documentation and supports Mada, STC Pay, ApplePay, and credit cards in a single integration
- This is a backend-phase decision but must be documented as a constraint in the frontend contract (payment form component must support multiple methods)
- Plan for the payment UI to show method selection: card vs. Mada vs. STC Pay vs. ApplePay

**Phase:** Frontend Phase: document payment method UI requirements. Backend Phase: gateway selection and integration.

---

### P-SA-2: SAR formatting and Arabic numeral confusion

**What goes wrong:** Prices formatted with `toLocaleString('en-US')` show as `$12.00` or `12.00 SAR` rather than the correct regional format. Worse: when the site is in Arabic mode, prices may display in Eastern Arabic numerals automatically depending on the browser locale, creating inconsistency if the product price formatting is done in JavaScript.

**Why it happens:** Currency formatting is treated as a backend concern. The frontend developer hardcodes `$` or uses the wrong locale string.

**Prevention:**
- Use `Intl.NumberFormat` with explicit locale and currency options:
  - English mode: `new Intl.NumberFormat('en-SA', { style: 'currency', currency: 'SAR' })` produces `SAR 240.00`
  - Arabic mode: `new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' })` produces the price in Eastern Arabic numerals with the SAR symbol
- Decide explicitly whether to use Eastern Arabic numerals in AR mode or keep Western (0-9) -- inconsistency is worse than either choice
- For a streetwear/urban brand targeting Saudi youth, Western numerals in both languages is an acceptable and common choice -- use `'ar-SA-u-nu-latn'` as the locale string to force Latin numerals in Arabic mode

**Phase:** Phase 1 (i18n setup). Price formatting is a locale decision made at setup, not at payment.

---

### P-SA-3: Delivery expectations not communicated

**What goes wrong:** The checkout flow has no delivery estimate. Saudi consumers are accustomed to next-day or same-day delivery from Amazon.sa and Noon. A fashion brand that shows no delivery information or implies long waits loses the sale to marketplace alternatives.

**Why it happens:** Small brands do not have the logistics infrastructure of marketplaces and often do not prominently display fulfillment timelines.

**Consequences:** Cart abandonment at checkout due to uncertainty. Post-purchase anxiety and support tickets asking "where is my order?"

**Prevention:**
- Display estimated delivery prominently on PDP and checkout: even if approximate ("3-5 business days within Saudi Arabia")
- In the frontend, build a delivery estimate component as a required PDP element alongside price and size
- If fulfillment is variable (Riyadh faster than other cities), build a region-based delivery estimate UI
- Free shipping threshold (if applicable) should be visible in cart before checkout

**Phase:** Phase 2 (PDP) for delivery estimate component. Phase 4 (checkout) for checkout delivery display.

---

### P-SA-4: No COD (Cash on Delivery) consideration

**What goes wrong:** Saudi ecommerce has historically high COD usage, particularly for fashion. Customers who are uncertain about sizing or product quality prefer to pay on delivery. A site that offers only prepaid checkout loses a significant segment of first-time buyers who have not yet established trust in the brand.

**Why it happens:** COD is logistically complex and unfamiliar to developers building for global markets. It is treated as an "old" payment method.

**Consequences:** First-time customer acquisition is harder. Saudi consumers who have been burned by small brands before will not prepay without brand recognition. COD removes this barrier.

**Prevention:**
- The frontend checkout must be designed to support COD as a payment option from the beginning -- a radio button between "Pay Now" and "Cash on Delivery" that changes the form and button behavior
- COD implementation is a logistics and backend problem, but the UI must be ready for it
- Document as a checkout UI requirement: the checkout flow supports both prepaid and COD paths (even if COD is not yet functional in the frontend phase)

**Phase:** Phase 4 (checkout UI). Backend COD integration is a future-phase backend concern.

---

### P-SA-5: RTL checkout form field ordering

**What goes wrong:** Checkout forms in Arabic mode have fields laid out in a confusing order. Multi-column form rows (first name | last name) that are visually reversed in RTL become (last name | first name) reading left-to-right, which is correct -- but many implementations reverse the labels without reversing the logical order, creating a mismatch.

**Prevention:**
- In RTL, form field visual order should be: right-side first (which is the reading start in Arabic)
- Validation error messages should appear at the `inline-start` of the field
- Use flexbox or grid with `direction: inherit` rather than hardcoded row ordering
- Test every checkout form layout with `dir="rtl"` active before phase sign-off

**Phase:** Phase 4 (checkout). Include RTL form layout as an explicit acceptance criterion.

---

## General Ecommerce Pitfalls

### P-GEN-1: No canonical URL strategy -- duplicate content across language variants

**What goes wrong:** The English and Arabic versions of the same page are served at identical URLs (toggled via state) rather than distinct paths. Search engines cannot index both language versions independently. Alternatively, both `/` and `/ar/` exist but lack `hreflang` link tags, so Google cannot associate them as alternate versions of the same content.

**Prevention:**
- Use distinct URL paths per locale: `/` for English, `/ar/` for Arabic (Next.js App Router with `[lang]` segment, or i18n routing config)
- Add `<link rel="alternate" hreflang="ar" href="/ar/[path]">` and `<link rel="alternate" hreflang="en" href="/[path]">` to all pages
- Arabic pages indexed independently benefit Saudi Google search traffic
- `x-default` hreflang should point to the English root

**Phase:** Phase 1 (routing setup). URL structure cannot be changed after content is indexed without SEO damage.

---

### P-GEN-2: No structured data for products

**What goes wrong:** Google cannot display rich results (price, availability, reviews) for product pages because no JSON-LD schema is present. The brand's products appear as plain blue links in search results instead of product cards with price and stock status.

**Prevention:**
- Add `Product` schema (JSON-LD) to all PDPs: name, image, description, price, currency, availability
- Next.js: inject via `<Script type="application/ld+json">` in the page's metadata or layout
- This is a frontend-phase task -- structured data uses the same placeholder product data as the component

**Phase:** Phase 2 (PDP). Required component in the PDP spec.

---

### P-GEN-3: Mobile checkout not tested on touch devices

**What goes wrong:** The checkout is designed and tested on desktop. On mobile (where a large percentage of Saudi consumers will shop), the checkout has keyboard overlap issues, tiny tap targets on payment method selectors, and form fields that jump when the virtual keyboard appears.

**Prevention:**
- Test checkout flow on an actual iOS Safari and Android Chrome device at least once per sprint
- Tap targets must be minimum 44x44px (Apple HIG) / 48dp (Material)
- Use `inputmode` attributes on number fields (e.g., `inputmode="numeric"` for CVV, `inputmode="tel"` for phone)
- `viewport-fit=cover` and safe area insets for iPhone notch/Dynamic Island

**Phase:** Phase 4 (checkout). Mobile checkout testing is a required acceptance criterion.

---

### P-GEN-4: Overly aggressive scroll animations breaking accessibility

**What goes wrong:** Heavy scroll-reveal animations on every element create a jarring, flicker-heavy experience for users with vestibular disorders. WCAG 2.1 criterion 2.3.3 (Motion from Interactions) requires that animations can be disabled.

**Prevention:**
- Wrap all non-essential animations in a `prefers-reduced-motion` media query check
- In Framer Motion: use the `useReducedMotion()` hook to zero out variant transitions when the user preference is set
- "Intentional presence" (per the project brief) means the animations should feel considered, not excessive -- every animation must justify its existence

**Phase:** All animation phases. Establish the pattern in Phase 1 animation system, apply consistently throughout.

---

### P-GEN-5: Social proof gap for an unknown brand

**What goes wrong:** A new brand with no reviews, no social following visible on site, and no trust signals (return policy, secure payment badges) faces high abandonment. Saudi consumers are brand-conscious and skeptical of unknown DTC brands.

**Prevention:**
- Build placeholder components for: return policy snippet (PDP), secure payment trust bar (cart/checkout), social proof section (home page)
- Even if reviews are not a launch feature, design the review component slot on the PDP so it can be activated without layout changes
- Display explicit return policy and shipping policy on the PDP -- not just in a footer link

**Phase:** Phase 2 (PDP) for trust signals. Phase 3 (cart) for checkout trust bar. Phase 5 (home) for social proof section.

---

## Phase-Specific Warning Matrix

| Phase | Topic | Highest-Risk Pitfall | Mitigation |
|-------|-------|---------------------|------------|
| 1 -- Setup | i18n architecture | P-RTL-4: `dir` without `lang` update | Implement language switch as atomic `lang` + `dir` operation |
| 1 -- Setup | CSS direction | P-RTL-1: Directional CSS properties | Tailwind logical variants enforced from day one; ESLint rule |
| 1 -- Setup | Typography | P-RTL-3: No Arabic font | Choose EN/AR font pairing before first component |
| 1 -- Setup | Image system | P-PERF-2: Layout shift | Define aspect ratios for all image slots before first image |
| 1 -- Setup | Routing | P-GEN-1: No locale URLs | Use Next.js i18n routing with `/ar/` path prefix |
| 2 -- Catalog/PDP | OOS handling | P-FASHION-1: Silent dead end | Design all three stock states before PDP build |
| 2 -- Catalog/PDP | Photography | P-FASHION-3: Aspect ratio mismatch | Document image specs for photographer |
| 2 -- Catalog/PDP | Performance | P-PERF-1: Unoptimized images | ESLint `no-img-element` enforced; `next/image` only |
| 2 -- Catalog/PDP | SEO | P-GEN-2: No structured data | JSON-LD product schema is a required PDP component |
| 3 -- Cart | State persistence | P-FASHION-4: Ephemeral cart | Zustand persist middleware to localStorage from day one |
| 4 -- Checkout | Payment methods | P-SA-1: Missing Mada/STC Pay | Document gateway requirement; plan multi-method UI |
| 4 -- Checkout | COD | P-SA-4: No COD path | Build UI for both prepaid and COD from checkout spec |
| 4 -- Checkout | Error states | P-FF-3: No error state design | State machine with all failure states before checkout build |
| 4 -- Checkout | RTL forms | P-SA-5: Form field order | RTL checkout review is explicit acceptance criterion |
| All -- Animations | Motion direction | P-RTL-6: LTR-only animations | Direction-aware animation values via `useDirection()` hook |
| All -- Animations | Accessibility | P-GEN-4: Vestibular disorders | `useReducedMotion()` applied to all non-essential animations |

---

*Confidence: MEDIUM -- Research tools (WebSearch, Bash/Context7 CLI) were restricted in this session. Findings are drawn from well-documented RTL implementation patterns, established ecommerce UX research, and Saudi market ecommerce conventions. Web verification was not possible; validate P-SA-1 (gateway options) and P-SA-4 (COD prevalence) with current market research before committing to payment architecture.*
