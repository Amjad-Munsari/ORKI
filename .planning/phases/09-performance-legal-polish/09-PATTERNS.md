# Phase 9: Performance, Legal & Polish — Pattern Map

**Mapped:** 2026-05-10
**Files analyzed:** 22 (16 new, 6 modified)
**Analogs found:** 19 / 22

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/app/[locale]/legal/layout.tsx` | layout | request-response | `src/app/[locale]/layout.tsx` | role-match (sub-segment layout) |
| `src/app/[locale]/legal/privacy/page.tsx` | page (RSC) | request-response | `src/app/[locale]/about/page.tsx` | exact (static localized server page) |
| `src/app/[locale]/legal/terms/page.tsx` | page (RSC) | request-response | `src/app/[locale]/about/page.tsx` | exact |
| `src/app/[locale]/legal/cookies/page.tsx` | page (RSC) | request-response | `src/app/[locale]/about/page.tsx` + new `CookieTable` | exact |
| `src/lib/seo.ts` | utility (server-only) | request-response | `src/app/[locale]/shop/[category]/[slug]/page.tsx` `generateMetadata` | partial (extracts inline pattern) |
| `src/app/sitemap.ts` | route handler | request-response | `src/app/api/seed/route.ts` (export style) + `src/lib/products.ts` (Drizzle pattern) | NO direct analog — Next.js metadata file |
| `src/app/robots.ts` | route handler | request-response | (none) | NO analog — Next.js metadata file |
| `src/app/global-error.tsx` | client error boundary | event-driven | `src/app/[locale]/layout.tsx` (html+body+font handling) | partial (locale layout html structure) |
| `src/app/[locale]/error.tsx` | client error boundary | event-driven | `src/components/checkout/TrustSignals.tsx` (`'use client'` + `useTranslations`) | role-match |
| `src/app/[locale]/not-found.tsx` | server boundary | request-response | `src/app/[locale]/checkout/confirmation/page.tsx` (`getTranslations` + `Link`) | role-match |
| `src/app/not-found.tsx` (optional) | server boundary | request-response | (none — bare global) | NO analog |
| `src/components/CookieBanner.tsx` | component (client) | event-driven | `src/components/cart/CartDrawer.tsx` (Sheet primitive use, `'use client'`) | role-match |
| `src/lib/cookie-consent.ts` | utility (client-safe) | request-response | `src/lib/cart/session.ts` (cookie helper convention) | role-match |
| `src/components/legal/LegalArticle.tsx` | component (RSC chrome) | request-response | `src/app/[locale]/about/page.tsx` (header + section pattern) | role-match |
| `src/components/legal/CookieTable.tsx` | component (RSC) | request-response | (UI-SPEC §"CookieTable" inline spec) | NO direct analog — design-spec driven |
| `src/components/error/BrandedErrorPage.tsx` | component | request-response | `src/app/[locale]/about/page.tsx` (centred chrome + display heading) | partial |
| `public/og-default.png` | static asset | n/a | (none) | NO analog — design asset |
| `src/app/[locale]/layout.tsx` (EDIT) | layout | request-response | self (extend in place) | n/a — file already exists |
| `src/lib/db/client.ts` (EDIT) | infrastructure | request-response | self | n/a — single-line edit |
| `src/components/footer/Footer.tsx` (EDIT) | component | request-response | self (existing legal-link group) | n/a — href migration |
| `src/app/[locale]/about/page.tsx` (EDIT) | page | request-response | self (add `generateMetadata`) | n/a — wire-up only |
| `src/app/[locale]/contact/page.tsx` (EDIT) | page | request-response | self (add `generateMetadata`) | n/a — wire-up only |
| `messages/{en,ar}.json` (EDIT) | i18n | request-response | self (existing namespace shape) | n/a — additive |

---

## Pattern Assignments

### `src/app/[locale]/legal/{privacy,terms,cookies}/page.tsx` (page, RSC, request-response)

**Analog:** `src/app/[locale]/about/page.tsx`

**Imports + Props pattern** (`about/page.tsx:1-5`):
```tsx
interface AboutPageProps {
  params: Promise<{ locale: string }>
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale } = await params
  const isRtl = locale === 'ar'
```

**Page-shell layout** (`about/page.tsx:10-13`):
```tsx
return (
  <div className="min-h-screen bg-black pt-24 pb-48">
    <div className="max-w-[1280px] mx-auto px-6">
      <header className="mb-32">
```

**Eyebrow + section pattern** (`about/page.tsx:21-24`) — re-use verbatim for Legal section numbering:
```tsx
<span className="text-[10px] uppercase tracking-[0.5em] text-white/40 font-bold">
  {isRtl ? 'رؤيتنا' : '01 — Vision'}
</span>
```

**What to reuse:** `params: Promise<{locale}>` shape, `await params`, `isRtl` derivation, `min-h-screen bg-black pt-24 pb-48` shell, eyebrow micro-typography.
**What to change:** narrow inner container to `max-w-[768px]` (UI-SPEC §"Legal page layout"); replace `isRtl ? 'AR' : 'EN'` ternaries with `getTranslations('Legal.privacy')`/`(.terms)`/`(.cookies)` (i18n JSON, not inline); add `generateMetadata` at top of file using `buildMetadata` from `src/lib/seo.ts`.

---

### `src/app/[locale]/legal/layout.tsx` (layout, request-response)

**Analog:** `src/app/[locale]/layout.tsx` (root locale layout — sibling layout pattern)

**Layout signature** (`[locale]/layout.tsx:15-22`):
```tsx
type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
```

**What to reuse:** the `Props` shape with `params: Promise<{locale: string}>`; awaiting `params` if needed.
**What to change:** legal layout is a thin pass-through wrapping `<LegalArticle>` chrome. No `<html>`, no `<body>`, no Navbar/Footer (those are owned by the parent locale layout). Probably just `export default function LegalLayout({children}) { return <>{children}</> }` plus optional `generateMetadata` for the segment.

---

### `src/lib/seo.ts` (utility, server-only) — NEW HELPER

**Analog:** existing inline `generateMetadata` at `src/app/[locale]/shop/[category]/[slug]/page.tsx:14-40` — extract this pattern + add hreflang.

**Existing PDP pattern to mirror** (`shop/[category]/[slug]/page.tsx:14-40`):
```tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params
  const product = await getProductBySlug(slug)

  if (!product) return {}

  const title = `${product.name[locale]} | ORKI`
  const description = product.description[locale]
  const image = product.images[0] || '/images/og-default.png'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [image],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  }
}
```

**`server-only` import convention** (`src/lib/products.ts:17`):
```ts
import 'server-only';
```

**What to reuse:** the `{ title, description, openGraph, twitter }` Metadata shape; `'server-only'` import; `${HOST}/og-default.png` fallback (note: PDP currently uses `/images/og-default.png` — Phase 9 migrates to `/og-default.png` in `public/` per CONTEXT §4).
**What to change:** add `alternates: { canonical, languages: { en, ar, 'x-default' } }` (PDP currently lacks this — research §Pattern 4 covers gap); accept `path`, `locale`, `titleKey`, `descriptionKey` inputs instead of inline product data; resolve titles via `getTranslations({locale, namespace})`.

**Title-template note:** RESEARCH §Pattern 4 recommends setting `metadata.title = { default, template: '%s | ORKI' }` in `[locale]/layout.tsx`. PDP currently builds full string `${name} | ORKI` inline; once template is set in parent, helper returns bare page title and Next.js composes.

---

### `src/app/sitemap.ts` (route handler, request-response) — NO DIRECT ANALOG

**Closest export-style analog:** `src/app/api/seed/route.ts` (default-export-async-function pattern is similar shape).
**Closest data-access analog:** `src/lib/products.ts:70-80` (`getAllProducts` with Drizzle relational query).

**Drizzle data-access pattern to call** (`src/lib/products.ts:70-80`):
```ts
export async function getAllProducts(): Promise<Product[]> {
  const result = await db.query.products.findMany({
    with: {
      sizes: true,
      images: {
        orderBy: (images, { asc }) => [asc(images.sortOrder)],
      },
    },
  });

  return result.map(toProduct);
```

**i18n routing primitives available** (`src/i18n/routing.ts:3-7`):
```ts
export const routing = defineRouting({
  locales: ['en', 'ar'],
  defaultLocale: 'en',
  localePrefix: 'always',
});
```

**What to reuse:** call `getAllProducts()` from `@/lib/products` (preserves the data-layer contract — CLAUDE.md mandates this); import `routing` from `@/i18n/routing` to enumerate locales.
**What to change:** this is a Next.js metadata file (`MetadataRoute.Sitemap` return type), not an API route. Use the canonical Next.js 15 pattern from RESEARCH §Pattern 2:

```tsx
// Recommended canonical pattern (RESEARCH 09-RESEARCH.md:312-368):
import type { MetadataRoute } from 'next';
import { getAllProducts } from '@/lib/products';

const HOST = 'https://orki.sa';
export const revalidate = 3600;

function buildAlternates(path: string) {
  return {
    languages: {
      en: `${HOST}/en${path === '/' ? '' : path}`,
      ar: `${HOST}/ar${path === '/' ? '' : path}`,
      'x-default': `${HOST}/en${path === '/' ? '' : path}`,
    },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getAllProducts();
  // ... emit bilingual entries with alternates
}
```

---

### `src/app/robots.ts` (route handler, request-response) — NO ANALOG

This is a net-new Next.js metadata file. Use canonical Next.js 15 pattern from RESEARCH §Pattern 3:

```tsx
import type { MetadataRoute } from 'next';
const HOST = 'https://orki.sa';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/en/admin/', '/ar/admin/', '/en/checkout/', '/ar/checkout/', '/api/'],
    },
    sitemap: `${HOST}/sitemap.xml`,
    host: HOST,
  };
}
```

**Locale-prefix gotcha:** project uses `localePrefix: 'always'` (see `src/i18n/routing.ts:6`). All admin/checkout URLs are prefixed — disallow rules must include both `/en/` and `/ar/` variants. RESEARCH Pitfall §Pattern 3 confirms this.

---

### `src/app/global-error.tsx` (client error boundary, event-driven)

**Analog:** `src/app/[locale]/layout.tsx` for the `<html>`+`<body>`+font-class structure (since global-error replaces the whole document tree).

**Locale layout html structure** (`[locale]/layout.tsx:39-46`):
```tsx
return (
  <html
    lang={locale}
    dir={dir}
    className={`dark ${geist.variable} ${ibmPlexArabic.variable}`}
  >
    <body className="bg-black text-white antialiased min-h-screen flex flex-col">
      <NextIntlClientProvider locale={locale} messages={messages}>
```

**`'use client'` + bilingual inline pattern reference:** `src/app/[locale]/contact/page.tsx:1-13` shows current project convention for bilingual inline strings (no i18n JSON):
```tsx
'use client'
import { use, useState } from 'react'
// ...
const { locale } = use(params)
const isRtl = locale === 'ar'
```

**What to reuse:** `<html lang dir className="dark ${geist.variable} ${ibmPlexArabic.variable}">` chrome; `bg-black text-white antialiased min-h-screen` body classes.
**What to change:** No `NextIntlClientProvider` available (locale layout is what crashed). Read `lang` from `document.documentElement` per RESEARCH §Pattern 6 + UI-SPEC Open Issue #1 Option (a). Hard-code 4 strings (`heading`, `body`, `retry`, `home`) per UI-SPEC §"Error pages" copy table. Drop Navbar/Footer/PageTransition. Use centred layout `min-h-screen flex items-center justify-center px-6` with `max-w-md text-center space-y-8`.

---

### `src/app/[locale]/error.tsx` (client error boundary, event-driven)

**Analog:** `src/components/checkout/TrustSignals.tsx` (representative `'use client'` + `useTranslations` pattern).

**Client + useTranslations pattern** (`TrustSignals.tsx:1-8`):
```tsx
'use client';

import { useTranslations } from 'next-intl';
import { Lock, RotateCcw, ShieldCheck } from 'lucide-react';

export function TrustSignals() {
  const t = useTranslations('Checkout.trust');
```

**What to reuse:** `'use client'` directive; `useTranslations('Errors')` for namespace access; existing global RTL via `dir` on `<html>` (no manual `isRtl` needed).
**What to change:** add `error: Error & { digest?: string }, reset: () => void` props (Next.js error-boundary signature, RESEARCH §Pattern 6); call `reset()` from primary CTA; wrap container with `role="alert"` per UI-SPEC §Accessibility row "Error pages"; centred chrome `min-h-[80vh] flex items-center justify-center` per UI-SPEC §"Error page layout".

---

### `src/app/[locale]/not-found.tsx` (server boundary, request-response)

**Analog:** `src/app/[locale]/checkout/confirmation/page.tsx:1-29` — the canonical RSC + `getTranslations` + i18n `<Link>` pattern.

**Server + getTranslations + Link pattern** (`checkout/confirmation/page.tsx:1-30`):
```tsx
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
// ...
export default async function ConfirmationPage({ params, searchParams }: Props) {
  const { locale } = await params;
  // ...
  const t = await getTranslations('Order');
  const isRtl = locale === 'ar';
```

**Centred display layout reference** (`checkout/confirmation/page.tsx:33-34`):
```tsx
<div className="min-h-screen bg-black flex items-center justify-center py-24 px-6">
  <div className="max-w-xl w-full text-center space-y-12">
```

**What to reuse:** `getTranslations` server-side import path (`'next-intl/server'`); `Link` from `@/i18n/navigation` (auto-locale-prefixed); centred dark layout chrome.
**What to change:** namespace `Errors.notFound` instead of `Order`; primary CTA → `<Link href="/shop">` (per UI-SPEC §"404 pages"); secondary CTA → `<Link href="/">`; do NOT add `role="alert"` per UI-SPEC §Accessibility ("404 is not an exception event").

---

### `src/components/CookieBanner.tsx` (client component, built but NOT mounted)

**Analog:** `src/components/cart/CartDrawer.tsx` for the `'use client'` + Sheet/dialog primitive composition.

**Client component + dialog primitive pattern** (`CartDrawer.tsx:1-30`):
```tsx
'use client'

import { useCartStore } from '@/store/cartStore'
import {
  Sheet,
  SheetContent,
  // ...
} from '@/components/ui/sheet'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/types/domain'

interface CartDrawerProps {
  locale: Locale
}

export function CartDrawer({ locale }: CartDrawerProps) {
  const { items, isDrawerOpen, setDrawerOpen } = useCartStore()
  // ...
  const isRtl = locale === 'ar'
```

**What to reuse:** `'use client'` + named-export convention; logical-property classes (`ms-auto`, etc.); `Link` from `@/i18n/navigation` for the "Read our Cookie Policy" link.
**What to change:** drop Zustand store dependency (no `useCartStore` analog needed — banner state is local `useState`); use shadcn `Button` + `Separator` instead of `Sheet` (UI-SPEC §"Component Inventory"); position via `fixed bottom-0 inline-end-0` (logical property) per UI-SPEC §"Animation" note about RTL flip; component is exported but `app/[locale]/layout.tsx` does NOT render it (CONTEXT §2).

---

### `src/lib/cookie-consent.ts` (utility, no-op today)

**Analog:** `src/lib/cart/session.ts` — closest cookie-helper convention in the codebase.

**Pattern:** small typed module, exports named functions for cookie read/write. Pair with `src/lib/env.ts` style: pure functions, no React.

**What to reuse:** named-function exports; type-safe API surface; `'server-only'` if any helper runs server-side.
**What to change:** all functions return `null`/no-op placeholders this phase (CONTEXT §2 — scaffold only). Cookie name constant `cookie_consent` (UI-SPEC §"CookieBanner scaffold"). API surface should match what a future `<CookieBanner>` will call: `getConsent()`, `setConsent('accepted' | 'rejected')`, `hasConsent()`.

---

### `src/components/legal/LegalArticle.tsx` (RSC chrome wrapper)

**Analog:** `src/app/[locale]/about/page.tsx` (header + space-y rhythm).

**Header pattern** (`about/page.tsx:13-17` — adapt for legal narrower layout):
```tsx
<header className="mb-32">
  <h1 className="text-6xl md:text-[120px] font-bold uppercase tracking-tighter leading-none text-white">
    {isRtl ? 'أوركي / القصة' : 'ORKI / THE STORY'}
  </h1>
</header>
```

**What to reuse:** display-class h1 (`text-6xl md:text-[120px] font-bold uppercase tracking-tighter leading-none text-white`); `bg-black pt-24 pb-48` outer shell; section spacing scale.
**What to change:** narrow container to `max-w-[768px]` (UI-SPEC §"Legal page layout"); add `space-y-6` header block with eyebrow + h1 + last-updated timestamp; render children slot (the article body); footer with template disclaimer (UI-SPEC §Copywriting).

---

### `src/components/legal/CookieTable.tsx` — UI-SPEC DRIVEN

**No code analog.** UI-SPEC §"CookieTable (cookies page only)" provides the full markup. Notable RTL rule from UI-SPEC: use logical padding (`ps-4 pe-4`) on cells, never `pl-/pr-`. Two rows hard-coded for Phase 9: `orki_sid` (cart, 30 days) and `sb-*` (Supabase auth, session). Both labelled "Strictly necessary".

---

### `src/components/error/BrandedErrorPage.tsx` (shared chrome)

**Analog:** `src/app/[locale]/about/page.tsx` for display heading and `min-h-screen bg-black` shell + `src/app/[locale]/checkout/confirmation/page.tsx:33-34` for centred-layout pattern.

**Centred dark layout** (`checkout/confirmation/page.tsx:33-34`):
```tsx
<div className="min-h-screen bg-black flex items-center justify-center py-24 px-6">
  <div className="max-w-xl w-full text-center space-y-12">
```

**What to reuse:** centred flex layout; display heading classes from About; `space-y-8` rhythm.
**What to change:** support `variant: '404' | 'error'` prop to swap copy + CTA target; accept `reset?: () => void` prop (only error variant has retry); per UI-SPEC `min-h-[80vh]` instead of `min-h-screen` (error/404 still allow Navbar+Footer to render around them).

---

## Cross-cutting Edits (modifications to existing files)

### `src/app/[locale]/layout.tsx` (EDIT — mount Analytics + SpeedInsights + title.template)

**Current full file** (`[locale]/layout.tsx:1-60`) — provided in full above; insertion points:

1. **Add imports at top** (insert after line 13):
   ```tsx
   import { Analytics } from '@vercel/analytics/next';
   import { SpeedInsights } from '@vercel/speed-insights/next';
   ```

2. **Update `metadata` export** (lines 24-27) to use `title.template`:
   ```tsx
   export const metadata: Metadata = {
     title: { default: 'ORKI — Saudi Streetwear', template: '%s | ORKI' },
     description: 'Saudi streetwear. Dark. Underground.',
     metadataBase: new URL('https://orki.sa'),
   };
   ```

3. **Add `<Analytics />` and `<SpeedInsights />` inside `<body>`** (insert after line 56 `</NextIntlClientProvider>`, still inside `<body>`):
   ```tsx
   </NextIntlClientProvider>
   <Analytics />
   <SpeedInsights />
   </body>
   ```

**Anti-pattern reminder** (RESEARCH Pitfall §1): Do NOT mount these components inside `global-error.tsx` — they live ONLY here.

---

### `src/lib/db/client.ts` (EDIT — single-line logger gate)

**Current file** (`db/client.ts:33`):
```ts
export const db = drizzle(conn, { schema });
```

**Replace with:**
```ts
export const db = drizzle(conn, {
  schema,
  logger: env.NODE_ENV !== 'production',
});
```

**Why this gate:** matches existing `env.NODE_ENV` checks at `db/client.ts:24,29`. RESEARCH §Pattern 5 + Pitfall §4 cover rationale. `env` is already imported at line 14.

---

### `src/components/footer/Footer.tsx` (EDIT — href migration + Cookie link + i18n)

**Current legal-link group** (`Footer.tsx:56-63`):
```tsx
{/* Group 2: Legal */}
<div className="space-y-6">
  <span className="text-xs font-semibold text-white/40 block">(Legal)</span>
  <ul className="space-y-4">
    <li><Link href="/privacy" className="...">Privacy Policy</Link></li>
    <li><Link href="/terms" className="...">Terms of Service</Link></li>
  </ul>
</div>
```

**What to change:**
1. `/privacy` → `/legal/privacy`
2. `/terms` → `/legal/terms` (and rename label to "Terms & Conditions" per UI-SPEC §Copywriting)
3. Add new `<li>` for `/legal/cookies` "Cookie Policy"
4. Replace hard-coded EN labels with `useTranslations('Footer.legal')` — but Footer is currently a Server Component (no `'use client'` at top), so use `getTranslations` or pass via props. UI-SPEC §"Open Issues" #3 confirms Footer is RSC.

**Note:** existing footer copyright label `Footer.copyright` is in `messages/{en,ar}.json` (`messages/en.json:15-20`) — same file, add new keys under `Footer` namespace.

---

### `src/app/[locale]/{about,contact,shop}/page.tsx` (EDIT — wire `generateMetadata`)

**Existing PDP `generateMetadata`** is the canonical reference (`shop/[category]/[slug]/page.tsx:14-40`, full excerpt in §`src/lib/seo.ts` above).

**For about/contact:** add at top of file:
```tsx
import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import type { Locale } from '@/types/domain';

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    path: '/about',
    locale,
    titleKey: 'Meta.about.title',
    descriptionKey: 'Meta.about.description',
  });
}
```

**For shop** (`src/app/[locale]/shop/page.tsx:7-12`) — already has `Props` shape; just add `generateMetadata` above `export default`.

**For PDP (`shop/[category]/[slug]/page.tsx`):** keep dynamic OG (product hero); ADD `alternates.languages` block per RESEARCH §Pattern 4 — currently missing.

---

## i18n string conventions (representative entries)

**`messages/en.json:1-26`** — namespace shape to mirror:
```json
{
  "Nav": { "shop": "Shop", "tops": "Tops", ... },
  "Footer": {
    "shipping": "Shipping",
    "returns": "Returns",
    "contact": "Contact",
    "copyright": "© 2026 ORKI. All rights reserved."
  },
  "Meta": { "siteTitle": "ORKI — Underground Streetwear" },
  "Shop": { "tabAll": "All", "tabTops": "Tops", ... },
  "Checkout": { "title": "Checkout", "step1": "Shipping Information", ... }
}
```

**`messages/ar.json:1-26`** — mirror shape exactly:
```json
{
  "Nav": { "shop": "المتجر", ... },
  "Footer": { "shipping": "الشحن", ..., "copyright": "© 2026 ORKI. جميع الحقوق محفوظة." },
  "Meta": { "siteTitle": "أوركي — ملابس الشوارع" },
  ...
}
```

**Key conventions observed:**
- **Top-level namespace = page or feature** (Nav, Footer, Shop, Checkout, Meta).
- **One level of nesting only** for most keys (flat-ish). Checkout has a sub-object `trust.{secureCheckout,returnsPolicy,sslEncryption}` showing nested groups are acceptable.
- **camelCase keys** throughout.
- **Plurals/interpolation:** `{count} Products` ICU style (e.g. `Shop.productCount`).
- **AR file mirrors EN file 1:1** — same key set, same nesting, only values differ.

**Phase 9 namespaces to add** (mirror this shape in BOTH files):
```json
{
  "Legal": {
    "common": { "lastUpdated": "Last updated:", "disclaimer": "..." },
    "privacy": { "title": "Privacy Policy", "metaTitle": "...", "metaDescription": "...", "section01": { "heading": "...", "body": "..." } },
    "terms":   { "title": "Terms & Conditions", ... },
    "cookies": { "title": "Cookie Policy", "tableHeaders": { "name": "...", "purpose": "...", "duration": "...", "type": "..." } }
  },
  "Errors": {
    "heading": "Something broke.",
    "body": "We're working on it. Try again, or head back home.",
    "retry": "Try again",
    "home": "Return home",
    "notFound": { "heading": "404 — Lost in the noise.", "body": "...", "browseShop": "Browse shop" },
    "shopBlip": "We're having trouble loading the catalog right now. Try again in a moment.",
    "orderBlip": "We can't pull up your order right now — your payment is confirmed. ..."
  },
  "Meta": {
    "siteTitle": "ORKI — Saudi Streetwear",  // existing key, value updated per CONTEXT §4
    "about":   { "title": "About", "description": "..." },
    "contact": { "title": "Contact", "description": "..." },
    "shop":    { "title": "Shop", "description": "..." },
    "legal":   { "privacy": { "title": "Privacy Policy", "description": "..." }, "terms": {...}, "cookies": {...} }
  },
  "Footer": {
    /* existing keys preserved */
    "legal": { "groupLabel": "(Legal)", "privacy": "Privacy Policy", "terms": "Terms & Conditions", "cookies": "Cookie Policy" }
  }
}
```

---

## Shared Patterns

### `'server-only'` import convention
**Source:** `src/lib/products.ts:17`, `src/lib/db/client.ts:10`
**Apply to:** `src/lib/seo.ts` (server-only helper).
```ts
import 'server-only';
```

### `params: Promise<{ locale: ... }>` (Next.js 15 async params)
**Source:** `src/app/[locale]/about/page.tsx:2-7`, `src/app/[locale]/shop/page.tsx:7-14`, `src/app/[locale]/shop/[category]/[slug]/page.tsx:10-15`
**Apply to:** every new page in `src/app/[locale]/legal/**/*.tsx`, every new `generateMetadata` function.
```tsx
type Props = { params: Promise<{ locale: Locale }> }
const { locale } = await params  // RSC
const { locale } = use(params)   // Client Component (see contact/page.tsx:12)
```

### i18n `<Link>` (auto-locale-prefixed)
**Source:** `src/i18n/navigation.ts:1-5`; consumed in `src/components/footer/Footer.tsx:1`, `src/components/cart/CartDrawer.tsx:12`, `src/app/[locale]/checkout/confirmation/page.tsx:3`.
**Apply to:** all internal links in legal pages, error pages, CookieBanner, footer additions. NEVER use plain `next/link` — locale prefix is automatic only via `@/i18n/navigation`.
```ts
import { Link } from '@/i18n/navigation'
```

### Locale + RTL derivation
**Source:** `src/app/[locale]/about/page.tsx:7-8`, `src/components/cart/CartDrawer.tsx:24`
**Apply to:** any new page/component that branches on direction.
```tsx
const isRtl = locale === 'ar'
const dir = locale === 'ar' ? 'rtl' : 'ltr'
```
**RTL/CSS rule (CLAUDE.md):** never `ml-`, `mr-`, `pl-`, `pr-`, `left-`, `right-`. Use `ms-`, `me-`, `ps-`, `pe-`, `inline-start`, `inline-end`. Verified in CartDrawer (`ms-auto` at line 36).

### Drizzle relational query pattern (preserve, don't break — PERF-06 guardrail)
**Source:** `src/lib/products.ts:70-80`
**Apply to:** `src/app/sitemap.ts` data fetch — must call `getAllProducts()` from `@/lib/products`, not query Drizzle directly.
```ts
const result = await db.query.products.findMany({
  with: { sizes: true, images: { orderBy: ... } },
});
```

### `'use client'` + `useTranslations` for client components
**Source:** `src/components/checkout/TrustSignals.tsx:1-8`, `src/components/nav/LanguageSwitcher.tsx:1-13`
**Apply to:** `src/app/[locale]/error.tsx`, `src/components/CookieBanner.tsx`.
```tsx
'use client'
import { useTranslations } from 'next-intl'
const t = useTranslations('Errors')
```

### Server-side `getTranslations`
**Source:** `src/app/[locale]/checkout/confirmation/page.tsx:3,28`
**Apply to:** `src/app/[locale]/not-found.tsx`, `src/lib/seo.ts`.
```tsx
import { getTranslations } from 'next-intl/server'
const t = await getTranslations('Errors.notFound')
const tMeta = await getTranslations({ locale, namespace: 'Meta.legal' })
```

### Font-class composition (for `global-error.tsx` only)
**Source:** `src/app/[locale]/layout.tsx:7,43`
```tsx
import { geist, ibmPlexArabic } from '@/lib/fonts';
// ...
<html ... className={`dark ${geist.variable} ${ibmPlexArabic.variable}`}>
<body className="bg-black text-white antialiased min-h-screen flex flex-col">
```
**Apply to:** `src/app/global-error.tsx` (it owns its own `<html>`/`<body>` and does NOT inherit from the locale layout — RESEARCH Pattern §6 caveats).

---

## No Analog Found

| File | Role | Reason |
|---|---|---|
| `src/app/sitemap.ts` | metadata route file | Net-new Next.js convention — use canonical `MetadataRoute.Sitemap` pattern from RESEARCH §Pattern 2. Drizzle data-fetch reuses `getAllProducts()`. |
| `src/app/robots.ts` | metadata route file | Net-new — use canonical `MetadataRoute.Robots` pattern from RESEARCH §Pattern 3. |
| `src/app/not-found.tsx` (optional global) | bare global 404 | No analog, rarely invoked. RESEARCH §Pattern 6 lists this as optional; bare EN-only acceptable. |
| `public/og-default.png` | static design asset | Design deliverable, not a code file. Spec locked in UI-SPEC §"OG fallback asset spec" (1200×630, dark, ORKI wordmark, ≤80KB). |
| `src/components/legal/CookieTable.tsx` | UI-spec-driven component | No code analog; full markup in UI-SPEC §"CookieTable". |
| `.planning/codebase/data-access-pattern.md` | documentation | Plain markdown note, no code analog. |

---

## Metadata

**Analog search scope:** `src/app/`, `src/components/`, `src/lib/`, `src/i18n/`, `messages/`, `src/app/api/`
**Files scanned:** ~60 (all Phase 1-8 deliverables)
**Pattern extraction date:** 2026-05-10
