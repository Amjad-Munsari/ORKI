# Phase 9: Performance, Legal & Polish — Research

**Researched:** 2026-05-10
**Domain:** Next.js 15 App Router metadata + Vercel observability + KSA PDPL/GDPR compliance + Drizzle reliability hygiene
**Confidence:** HIGH (verified against Next.js canary docs via Context7, npm registry, project codebase) with two MEDIUM-confidence areas (KSA PDPL section structure, AR legal register) flagged for user review.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**1. Legal content sourcing & languages**
- Source: Claude drafts Privacy / T&C / Cookie Policy (KSA PDPL + GDPR aligned) tailored to ORKI's actual data flows: cart cookie, checkout email, admin auth, Supabase processing, no analytics cookies, no marketing cookies, no third-party trackers.
- Languages: EN + AR ship together. Same source-of-truth structure, AR uses formal legal Arabic register, RTL via logical CSS.
- Review: User reviews drafts before merge. Marked **revisable** — may switch to vendor-hosted (Termly/Iubenda) or lawyer-supplied copy in a future phase.
- Routes: `/[locale]/legal/privacy`, `/[locale]/legal/terms`, `/[locale]/legal/cookies`. Footer links visible in both locales.

**2. Cookie consent — NO BANNER**
- Do NOT ship a consent banner.
- All current cookies are strictly necessary (cart `orki_sid` + Supabase auth) — exempt under GDPR Art. 5(3) and KSA PDPL.
- Vercel Analytics + Speed Insights are cookieless and exempt from consent.
- No GA4, no Meta Pixel, no retargeting. No marketing cookies set.
- Cookie Policy page still ships (LGL-02 requires the policy doc). Enumerates strictly-necessary cookies and explicitly states "no analytics or marketing cookies are set."
- Future-proofing: Scaffold a hidden, unmounted `<CookieBanner>` + `cookie_consent` cookie helper. NOT rendered.

**3. Analytics + performance measurement**
- Provider: Vercel Analytics + Vercel Speed Insights. Both cookieless. Mount in `app/[locale]/layout.tsx`.
- Performance gating: Real-user data only. NO build-time Lighthouse gate this phase.
- Image-loading strategy:
  - Shop grid: above-fold cards (first row, ~3-4) get `priority` on `next/image`. Everything below is lazy by default.
  - PDP hero: `priority`.
  - Skip blur placeholders / forced AVIF this phase.

**4. Sitemap + per-page metadata**
- `app/sitemap.ts` reads products + categories from Drizzle at request time. Cached via `export const revalidate = 3600`. Emits paired EN/AR URLs for every public page (home, about, contact, legal/{privacy,terms,cookies}, every category, every product). Includes `<xhtml:link rel="alternate" hreflang="en"/"ar"/"x-default">`. Excludes admin routes.
- `robots.ts`: Allow all, disallow `/[locale]/admin/*` and `/[locale]/checkout/*`.
- Title template: `{Page} | ORKI`. Home: `ORKI — Saudi Streetwear`. Products: `{Product Name} | ORKI`. Categories: `{Category} | ORKI`. AR titles use Arabic page names.
- Meta description: Per-route, AR translated, ≤ 160 chars.
- Open Graph: Default branded card (logo on dark) for non-product pages — single static image. Product pages keep existing dynamic OG.
- Tag length enforcement: title ≤ 60 chars, description ≤ 160 chars. Verified by inspection during implementation; no automated check this phase.

**5. Reliability**
- N+1 status: Codebase audited 2026-05-10 and confirmed clean. All data-access uses Drizzle's relational query pattern.
  - Verified clean: `src/lib/products.ts`, `src/lib/cart/server.ts`, `src/lib/orders/server.ts` (read paths).
  - One acceptable per-item loop: `transitionOrderStatus` stock-restoration at `src/lib/orders/server.ts:387-409` — admin action, transactional, bounded by items-per-order.
- N+1 guardrail: Enable Drizzle `logger: true` in `src/lib/db/client.ts` for dev only (gate on `process.env.NODE_ENV !== 'production'`). Add `.planning/codebase/data-access-pattern.md` note.
- Graceful degradation: Custom `app/error.tsx` and `app/not-found.tsx`, dark/minimal/editorial, EN + AR via `getTranslations`. Per-route try/catch in server pages for Supabase blips.

### Claude's Discretion

- Exact section structure and prose of the three legal documents (within KSA PDPL + GDPR constraints).
- Whether legal copy is rendered from MDX or from i18n JSON message bundles — research recommends i18n JSON (rationale below).
- Internal file/folder organization under `src/lib/seo.ts`, `src/components/legal/*`.
- Choice between `app/global-error.tsx` (Next.js canonical convention with `<html>`+`<body>`) vs project's currently-named `app/error.tsx` (per UI-SPEC). **Research recommends `app/global-error.tsx`** — see Open Issues §1.
- Whether OG fallback is a static PNG in `public/` or a build-time `app/opengraph-image.tsx` rendered via `next/og`. Either is acceptable; research recommends static PNG (lower complexity, faster cold-render, matches CONTEXT §4).
- Translation strategy for the **global** error/404 boundary (the one outside `[locale]` segment) — research recommends UI-SPEC Open Issue Option (a): hard-coded bilingual strings inferred from `document.documentElement.lang`. Per-locale variants inside `[locale]` use full next-intl.

### Deferred Ideas (OUT OF SCOPE)

- Vendor-hosted legal copy (Termly / Iubenda).
- Lawyer-reviewed legal copy.
- Lighthouse CI in build pipeline.
- Read-only catalog fallback via Vercel KV / Edge Config.
- Per-category granular cookie banner.
- Blur placeholders + forced AVIF.
- Custom ESLint rule for N+1 detection.
- Persistent middleware query counter.
- Full GDPR DSAR (Data Subject Access Request) export portal — minimum viable LGL-04 covered by emailing the controller.
- Authentication-gated cookie preferences UI.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LGL-01 | Publish Privacy Policy covering data collection, storage, user rights | KSA PDPL Art. 11 + GDPR Art. 13/14 mandate the section list documented below; route + chrome locked in UI-SPEC |
| LGL-02 | Implement a cookie consent banner if analytics/marketing cookies are used | Conditional satisfied: zero analytics/marketing cookies → no banner. Cookie Policy page still ships with cookie enumeration. Scaffold-only `<CookieBanner>` for future flip. |
| LGL-03 | Publish Terms & Conditions covering refunds, liability, dispute resolution | Section list below; KSA Saudi consumer-protection alignment |
| LGL-04 | Meet KVKK / GDPR compliance: explicit consent for processing and mechanisms to export or delete personal data | Email-the-controller mechanism documented in Privacy Policy + Cookie Policy "your rights" section. Full DSAR portal deferred. |
| PERF-03 | Core Web Vitals: LCP < 2.5s, CLS < 0.1, INP < 200ms | Vercel Speed Insights mounted in root locale layout — cookieless RUM, INP supported by default |
| PERF-04 | Page load < 3s with lazy-loaded images | `next/image` `priority` on first 3-4 cards + PDP hero; rest lazy by default. Verified by grep + Speed Insights real-user data. |
| PERF-05 | Graceful degradation: site must not full-crash if third-party APIs go down | `app/global-error.tsx` boundary + per-route try/catch in `/shop`, `/admin/orders`, `/checkout/confirmation` server pages |
| PERF-06 | Prevent N+1 database query problems (reviewed before each phase completes) | Drizzle relational queries verified clean. `logger: NODE_ENV !== 'production'` gate enables dev-time inspection. `.planning/codebase/data-access-pattern.md` note. |
| SEO-02 | Automatically generate and maintain an up-to-date sitemap.xml | `app/sitemap.ts` returning `MetadataRoute.Sitemap` with `revalidate = 3600` and `alternates.languages` for hreflang pairs |
| SEO-03 | Unique `<title>` (under 60 chars) and meta description (under 160 chars) per page | `src/lib/seo.ts buildMetadata()` helper composes `title.template` + `description` per route via next-intl `getTranslations` |
</phase_requirements>

---

## Summary

Phase 9 is a low-novelty consolidation phase. Every external library involved (Next.js 15.3.9, next-intl 4.11.x, drizzle-orm 0.45.2, @vercel/analytics 2.0.1, @vercel/speed-insights 2.0.0) is already a project dependency at a current major version, and every API surface needed (`MetadataRoute.Sitemap`, `MetadataRoute.Robots`, route-segment `revalidate`, `getTranslations` in metadata, Drizzle `logger`) is stable. There is **no version-pinning urgency, no library swap, and no architectural redesign**.

The two genuinely-tricky areas are: (1) the **`app/error.tsx` Client-Component translation boundary** — Next.js's canonical pattern in 15.3.9 is `app/global-error.tsx` with its own `<html>`+`<body>` and `reset` callback; this name differs from what UI-SPEC documents (`app/error.tsx`), and the planner must reconcile; (2) the **legal-document section structure** — KSA PDPL Art. 11 explicitly mandates an enumerated content list for privacy notices that goes beyond GDPR Art. 13, and the AR formal legal register is non-trivial.

**Primary recommendation:** Treat Phase 9 as four narrow, cleanly-separable workstreams (Legal pages → Analytics + Speed Insights → Sitemap/robots/per-page metadata → Reliability hygiene) with no cross-stream blocking, executable in parallel after a tiny foundation wave (route folder + i18n namespace + footer href migration + `seo.ts` helper).

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Legal page rendering (privacy/terms/cookies) | Frontend Server (RSC) | — | Static localized copy via next-intl `getTranslations`. No client interactivity. |
| Vercel Analytics page-view collection | Browser / Client | — | The `<Analytics />` component is a Client Component injected at root layout. Cookieless beacon to Vercel edge. |
| Vercel Speed Insights (Web Vitals) | Browser / Client | — | Same shape as Analytics: client-only beacon collecting CLS/LCP/INP from real users. |
| Sitemap generation | Frontend Server | Database | `app/sitemap.ts` is a route segment that runs on the server, reads products + categories from Postgres via Drizzle, then is cached for 1 h via `revalidate`. |
| robots.txt generation | Frontend Server | — | `app/robots.ts` returns a static config object — no DB. |
| Per-page metadata (`generateMetadata`) | Frontend Server | — | Runs on the server before the page streams. Uses next-intl `getTranslations`. |
| OG fallback static asset | CDN / Static | — | Single PNG in `public/og-default.png`. Served by Vercel CDN. |
| Error boundaries (`global-error`, segment `error`) | Browser / Client | — | React Server Components require Client Components for error boundaries (per Next.js docs). |
| 404 boundary (`not-found`) | Frontend Server | — | Server Component. Streams a 404 status. Per-locale variant uses next-intl `getTranslations`. |
| N+1 dev-time logger | Database | — | Drizzle option, lives in `src/lib/db/client.ts`. Gated on `NODE_ENV !== 'production'`. |
| Cookie helper / scaffold banner | Browser / Client | — | Future client-side cookie read/write. Built but unmounted this phase. |

---

## Standard Stack

### Core (already installed — no new packages required)

| Library | Installed Version | Latest (npm view, 2026-05-10) | Purpose | Why Standard |
|---------|-------------------|-------------------------------|---------|--------------|
| `next` | 15.3.9 | (pin held) | App Router, `MetadataRoute.Sitemap`/`.Robots`, `error.tsx`/`global-error.tsx`, route-segment `revalidate` | First-class metadata file conventions; no third-party sitemap generators needed |
| `next-intl` | 4.11.0 | 4.11.1 | `getTranslations({locale, namespace})` for metadata + sitemap, `getPathname` for sitemap URL pairing | Already wired up; supports server-side metadata localization out of the box |
| `drizzle-orm` | 0.45.2 | 0.45.2 | `logger: true \| Logger` option on `drizzle(client, { schema, logger })` | Already installed; dev-time SQL inspection is its native debug surface |
| `@vercel/analytics` | (NOT installed) | 2.0.1 | Cookieless real-user analytics, page-view + custom-event API | Native Vercel integration, no GDPR consent required |
| `@vercel/speed-insights` | (NOT installed) | 2.0.0 | Cookieless real-user CWV measurement (LCP/CLS/INP) | Native Vercel integration, beats synthetic Lighthouse for real Saudi network conditions |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none new) | — | All Phase 9 capability comes from packages above plus internal helpers. | — |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vercel Analytics + Speed Insights | Plausible / Fathom + web-vitals npm | Independent of Vercel hosting, but adds a vendor and likely a paid plan. CONTEXT §3 locks Vercel — not revisited. |
| `app/sitemap.ts` returning array | `next-sitemap` package | Adds a build-time generator + config file. Worse for dynamic product list. Native API is strictly better here. |
| `app/robots.ts` | Static `public/robots.txt` | Static file is fine but loses TypeScript safety on the disallow list. Native API costs nothing extra. |
| MDX legal pages | i18n JSON via next-intl message bundles | **MDX:** better authoring + components, but requires `@next/mdx` + a webpack rule + per-locale `.mdx` files (or front-matter locale switching). Adds two deps and a build-config change. **i18n JSON:** zero new deps, AR/EN already wired, easy diff/review. **Recommendation: i18n JSON.** Legal copy is paragraph-heavy but linear; no embedded React components needed. Use `t.rich()` for inline links inside legal copy. |

**Installation:**
```bash
npm install @vercel/analytics@latest @vercel/speed-insights@latest
```

**Version verification (run before installing):**
```bash
npm view @vercel/analytics version          # 2.0.1 as of 2026-05-10
npm view @vercel/speed-insights version     # 2.0.0 as of 2026-05-10
```
[VERIFIED: npm registry, 2026-05-10] Both are at major v2 (released 2024-2025), API stable.

---

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Browser (real user)                              │
│                                                                         │
│   1. GET /en/shop                                                       │
│   2. CWV beacon ── @vercel/speed-insights ──► Vercel edge (cookieless)  │
│   3. Page-view  ── @vercel/analytics       ──► Vercel edge (cookieless) │
└──────────────────────────┬──────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              Vercel Edge / Next.js 15 SSR                               │
│                                                                         │
│  ┌──────────────────────┐     ┌─────────────────────────────────────┐   │
│  │ app/[locale]/        │     │ app/sitemap.ts                      │   │
│  │   layout.tsx         │     │   export const revalidate = 3600    │   │
│  │   • <Analytics/>     │     │   reads getAllProducts() +          │   │
│  │   • <SpeedInsights/> │     │   categories → emits MetadataRoute  │   │
│  │   • generateMetadata │     │   .Sitemap with alternates.languages│   │
│  │     via seo.ts       │     │   for hreflang en / ar / x-default  │   │
│  └──────────┬───────────┘     └────────────────┬────────────────────┘   │
│             │                                  │                        │
│             ▼                                  ▼                        │
│  ┌──────────────────────┐     ┌─────────────────────────────────────┐   │
│  │ Per-page Server      │     │ app/robots.ts                       │   │
│  │ Components:          │     │   MetadataRoute.Robots              │   │
│  │  /legal/privacy      │     │   disallow: /[locale]/admin/*       │   │
│  │  /legal/terms        │     │              /[locale]/checkout/*   │   │
│  │  /legal/cookies      │     └─────────────────────────────────────┘   │
│  │  /shop, /about, etc  │                                               │
│  │  → getTranslations() │     ┌─────────────────────────────────────┐   │
│  │  → toMetadata()      │     │ app/global-error.tsx (Client)       │   │
│  └──────────┬───────────┘     │   <html><body>...</body></html>     │   │
│             │                 │   reset() retry; bilingual via      │   │
│             │                 │   document.documentElement.lang     │   │
│             ▼                 └─────────────────────────────────────┘   │
│  ┌──────────────────────┐     ┌─────────────────────────────────────┐   │
│  │ src/lib/products.ts  │     │ app/[locale]/error.tsx (Client)     │   │
│  │ src/lib/cart/server  │     │ app/[locale]/not-found.tsx (RSC)    │   │
│  │ src/lib/orders/serv  │     │   uses next-intl getTranslations    │   │
│  │  → db.query.X.find   │     │   per-locale branded copy           │   │
│  │     Many({ with })   │     └─────────────────────────────────────┘   │
│  └──────────┬───────────┘                                               │
└─────────────┼───────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Supabase Postgres (Drizzle ORM)                                        │
│  src/lib/db/client.ts: drizzle(conn, {                                  │
│     schema,                                                             │
│     logger: process.env.NODE_ENV !== 'production',  ◄── PERF-06 guard   │
│  })                                                                     │
└─────────────────────────────────────────────────────────────────────────┘
```

The diagram intentionally omits the cookie scaffold (built but not mounted — no edges in or out this phase) and the OG fallback PNG (CDN-static, no edge involvement at runtime).

### Recommended Project Structure

```
src/
├── app/
│   ├── global-error.tsx              # NEW — Client, <html>+<body>, hard-coded EN/AR
│   ├── not-found.tsx                 # NEW — bare 404 (rare; per-locale handles real cases)
│   ├── sitemap.ts                    # NEW — bilingual sitemap with hreflang
│   ├── robots.ts                     # NEW — disallow admin + checkout
│   ├── opengraph-image.png           # OPTIONAL — Next.js auto-wires; or use public/og-default.png
│   └── [locale]/
│       ├── layout.tsx                # EDIT — mount <Analytics/> + <SpeedInsights/>; add buildMetadata
│       ├── error.tsx                 # NEW — Client, per-locale branded, useTranslations
│       ├── not-found.tsx             # NEW — RSC, per-locale branded, getTranslations
│       └── legal/
│           ├── layout.tsx            # NEW — LegalArticle chrome wrapper
│           ├── privacy/page.tsx      # NEW
│           ├── terms/page.tsx        # NEW
│           └── cookies/page.tsx      # NEW — uses CookieTable component
├── components/
│   ├── legal/
│   │   ├── LegalArticle.tsx          # NEW — H1 + last-updated + body slot + disclaimer footer
│   │   └── CookieTable.tsx           # NEW — strictly-necessary cookie enumeration
│   ├── error/
│   │   └── BrandedErrorPage.tsx      # NEW — shared chrome for global-error and segment errors
│   ├── footer/Footer.tsx             # EDIT — href migration + Cookie Policy link + i18n
│   └── CookieBanner.tsx              # NEW — built, NOT mounted
├── lib/
│   ├── seo.ts                        # NEW — buildMetadata({titleKey, descriptionKey, locale, path})
│   ├── cookie-consent.ts             # NEW — future helper (no-op today)
│   └── db/client.ts                  # EDIT — add logger gate
├── messages/
│   ├── en.json                       # EDIT — add Legal.*, Errors.*, Meta.* namespaces
│   └── ar.json                       # EDIT — same shape, formal AR legal register
└── public/
    └── og-default.png                # NEW — 1200×630 PNG, ORKI logo on dark
.planning/codebase/
└── data-access-pattern.md            # NEW — N+1 guardrail note
```

### Pattern 1: Vercel Analytics + Speed Insights mounting

**What:** Cookieless RUM (Real-User Monitoring) for both page-views and Web Vitals.
**When to use:** Always. Phase 9 mandates both via CONTEXT §3.

**Mount in `src/app/[locale]/layout.tsx`** (per Vercel docs — root layout, after `{children}`):

```tsx
// Source: https://vercel.com/docs/analytics/quickstart
//         https://vercel.com/docs/speed-insights/quickstart
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default async function LocaleLayout({ children, params }: Props) {
  // ...existing setup...
  return (
    <html lang={locale} dir={dir} className={`dark ${geist.variable} ${ibmPlexArabic.variable}`}>
      <body className="bg-black text-white antialiased min-h-screen flex flex-col">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <StoreHydration />
          <Navbar />
          <CartDrawer locale={locale as Locale} />
          <PageTransition>
            <main className="flex-1 pt-20">{children}</main>
          </PageTransition>
          <Footer />
        </NextIntlClientProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

**Notes:**
- Use the `/next` subpath imports (`@vercel/analytics/next`, `@vercel/speed-insights/next`) — these are App-Router-aware and report route changes correctly. Do NOT use `/react` here. [CITED: vercel.com/docs/analytics/troubleshooting]
- Both components are valid inside a Server Component layout — they internally use `'use client'`, so no `'use client'` directive needed in `layout.tsx`.
- Both are **cookieless by design** — they use anonymous fingerprinting (Analytics) and a fetch beacon (Speed Insights). No consent banner needed under GDPR Art. 5(3) or KSA PDPL strictly-necessary exemption. [CITED: vercel.com/docs/analytics/privacy]
- `<Analytics debug />` is acceptable in dev — props it conditionally on `process.env.NODE_ENV !== 'production'` if noise becomes a problem.
- `mode` prop defaults to auto-detection from Vercel env. Do not set explicitly unless you need to override.
- INP tracking is **enabled by default** in `@vercel/speed-insights@2.x`. No opt-in required.
- These components mount inside `[locale]/layout.tsx` rather than a hypothetical root `app/layout.tsx` because the project's root layout IS `[locale]/layout.tsx` (Next.js permits this; root must contain `<html>`, which it does). Mounting at this level gives us per-locale page-view attribution for free.

### Pattern 2: `app/sitemap.ts` with hreflang

**What:** Bilingual sitemap with paired EN/AR URLs and hreflang link alternates.
**When to use:** Once per project root; revalidates hourly.

```tsx
// Source: Next.js docs (canary): app/sitemap.ts MetadataRoute.Sitemap with alternates.languages
//         next-intl docs: getPathname for locale-aware URL pairing
//         File: src/app/sitemap.ts
import type { MetadataRoute } from 'next';
import { getAllProducts } from '@/lib/products';
import { routing } from '@/i18n/routing';

const HOST = 'https://orki.sa'; // No trailing slash

// Route segment config — sitemap re-renders at most every hour.
// Verified: revalidate IS valid on the sitemap.ts route segment.
// [CITED: next.js docs: route segment config "revalidate"]
export const revalidate = 3600;

type Url = MetadataRoute.Sitemap[number];

function buildAlternates(path: string): Url['alternates'] {
  // path begins with '/'. Compose paired URLs for each locale.
  // x-default conventionally points to the default locale (en).
  return {
    languages: {
      en: `${HOST}/en${path === '/' ? '' : path}`,
      ar: `${HOST}/ar${path === '/' ? '' : path}`,
      'x-default': `${HOST}/en${path === '/' ? '' : path}`,
    },
  };
}

function bilingualEntry(path: string, lastModified: Date = new Date()): Url[] {
  const suffix = path === '/' ? '' : path;
  return [
    { url: `${HOST}/en${suffix}`, lastModified, alternates: buildAlternates(path) },
    { url: `${HOST}/ar${suffix}`, lastModified, alternates: buildAlternates(path) },
  ];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getAllProducts();
  const staticPaths = [
    '/',
    '/shop',
    '/shop/tops',
    '/shop/bottoms',
    '/about',
    '/contact',
    '/legal/privacy',
    '/legal/terms',
    '/legal/cookies',
  ];
  const productPaths = products.map((p) => `/shop/${p.category}/${p.slug}`);

  return [
    ...staticPaths.flatMap((p) => bilingualEntry(p)),
    ...productPaths.flatMap((p) => bilingualEntry(p)),
  ];
}
```

**Important: how Next.js renders `alternates.languages` into XML.**
[VERIFIED: Context7 — vercel/next.js docs] When you set `alternates.languages` on a sitemap entry, Next.js automatically emits `<xhtml:link rel="alternate" hreflang="en" href="..." />` for each language (and includes the `xmlns:xhtml="http://www.w3.org/1999/xhtml"` namespace). The `MetadataRoute.Sitemap` type does **not** require you to write XML — return plain JS objects.

**Alternative (next-intl-blessed): use `getPathname()`** for locale-aware path generation. That helper is appropriate when locales rewrite paths. Our project uses `localePrefix: 'always'` with no path rewriting, so manual `${HOST}/en${path}` interpolation is equivalent and simpler. [CITED: next-intl docs §"Generate localized sitemaps"]

### Pattern 3: `app/robots.ts`

```tsx
// Source: Next.js docs — app/robots.ts MetadataRoute.Robots
// File: src/app/robots.ts
import type { MetadataRoute } from 'next';

const HOST = 'https://orki.sa';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/en/admin/',
        '/ar/admin/',
        '/en/checkout/',
        '/ar/checkout/',
        '/api/',
      ],
    },
    sitemap: `${HOST}/sitemap.xml`,
    host: HOST,
  };
}
```

**Notes:**
- `host` is supported by Yandex specifically (other crawlers ignore it). Including it is harmless. [CITED: Next.js robots.ts docs]
- Disallow `/api/` to keep the mock-checkout and any future internal endpoints out of crawl results. Cheap insurance.
- The `disallow` array entries match by **prefix**. `/en/admin/` matches `/en/admin/anything`. We do **not** disallow `/admin` without a locale prefix because next-intl's `localePrefix: 'always'` ensures every public URL has a locale.

### Pattern 4: `src/lib/seo.ts buildMetadata` helper

**What:** Single composition point for per-page metadata. Resolves title template, description, hreflang alternates, and OG defaults.

```tsx
// Source: hand-rolled to project conventions
// File: src/lib/seo.ts
import 'server-only';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/types/domain';

const HOST = 'https://orki.sa';
const TITLE_TEMPLATE = '%s | ORKI'; // pages call this for non-home routes
const DEFAULT_OG_IMAGE = `${HOST}/og-default.png`;

interface BuildMetadataInput {
  /** Path relative to the locale prefix, e.g. '/about', '/legal/privacy', '/' */
  path: string;
  /** Required current locale */
  locale: Locale;
  /** next-intl namespace.key for the title (e.g. 'Legal.privacy.metaTitle') */
  titleKey: string;
  /** next-intl namespace.key for the description */
  descriptionKey: string;
  /** Optional override for OG image path (absolute URL or path under public/) */
  ogImage?: string;
}

export async function buildMetadata({
  path,
  locale,
  titleKey,
  descriptionKey,
  ogImage,
}: BuildMetadataInput): Promise<Metadata> {
  // Use namespace-prefixed keys so callers don't repeat the namespace.
  const [namespace, ...rest] = titleKey.split('.');
  const titleSubKey = rest.join('.');
  const tTitle = await getTranslations({ locale, namespace });

  const [descNs, ...descRest] = descriptionKey.split('.');
  const descSubKey = descRest.join('.');
  const tDesc = await getTranslations({ locale, namespace: descNs });

  const title = tTitle(titleSubKey);
  const description = tDesc(descSubKey);
  const image = ogImage ?? DEFAULT_OG_IMAGE;

  const suffix = path === '/' ? '' : path;
  const canonical = `${HOST}/${locale}${suffix}`;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        en: `${HOST}/en${suffix}`,
        ar: `${HOST}/ar${suffix}`,
        'x-default': `${HOST}/en${suffix}`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'ORKI',
      locale: locale === 'ar' ? 'ar_SA' : 'en_US',
      type: 'website',
      images: [{ url: image, width: 1200, height: 630, alt: 'ORKI' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}
```

**Note on `title.template`:** Next.js supports `metadata.title.template` for child-page composition. We deliberately do NOT use it here because:
1. `title.template` is set on a parent layout and applies to all children.
2. Our locale layout already sets `metadata.title` to the brand line (`'ORKI — Underground Streetwear'`).
3. To use `template`, we'd refactor that string into `{ default, template }`. Acceptable but introduces a per-locale split (template differs by locale: `'%s | ORKI'` vs `'%s | ORKI'` — actually identical, but worth being explicit).
**Recommendation:** Set `metadata.title = { default: 'ORKI — Saudi Streetwear', template: '%s | ORKI' }` in `app/[locale]/layout.tsx`. Then per-page `generateMetadata` returns `title: t('Legal.privacy.metaTitle')` (just the page name like `'Privacy Policy'`) and Next.js composes to `'Privacy Policy | ORKI'`. The `buildMetadata` helper above returns the bare title — Next.js applies the template automatically because the parent layout sets it.

**Composing with existing PDP `generateMetadata`:** The PDP page at `src/app/[locale]/shop/[category]/[slug]/page.tsx` already constructs metadata inline. Recommended migration:
- Keep PDP-specific dynamic OG image (product hero) — do NOT use `buildMetadata` for PDP.
- Add `alternates.languages` block to PDP (currently missing) — copy the structure from `buildMetadata`.
- Future: extract a shared `buildProductMetadata({ product, locale })` helper if a second product-like page emerges.

### Pattern 5: Drizzle dev-time logger

**What:** Enable Drizzle's built-in SQL logger when not in production. Prints every executed query + params to stdout for N+1 inspection.

```tsx
// Source: drizzle-orm docs §goodies "Default Query Logging"
//         [CITED: drizzle-team/drizzle-orm-docs]
// File: src/lib/db/client.ts (existing — single edit)
export const db = drizzle(conn, {
  schema,
  logger: env.NODE_ENV !== 'production',
});
```

**Why `env.NODE_ENV !== 'production'` and not a custom `DRIZZLE_LOG` env var:**
- Existing project pattern uses `env.NODE_ENV` everywhere (see `src/lib/db/client.ts:24,29`). Adding a custom env var for one switch costs more than it saves.
- The default logger writes to `console.log`. In Vercel production logs this would create per-request noise + cost. The `NODE_ENV` gate eliminates this entirely.
- Trade-off: a developer who wants to disable the logger temporarily (e.g. while running a noisy test) cannot do so without code change. Acceptable — Drizzle's logger output is short and easy to scroll past.
- Local dev runs `next dev` which sets `NODE_ENV=development`. Vercel Preview + Production set `NODE_ENV=production`. So Preview deploys do NOT log queries — that's intentional (preview is treated as production for observability).

### Pattern 6: Error and 404 boundaries — three files, three patterns

**The structure (clarifying CONTEXT §5 + UI-SPEC Open Issue #1):**

| File | Type | When fires | Translation |
|------|------|------------|-------------|
| `src/app/global-error.tsx` | Client (`'use client'`), MUST own `<html>` + `<body>` | Top-level uncaught error that escapes the locale layout | Hard-coded bilingual via `document.documentElement.lang` (UI-SPEC Option a) |
| `src/app/[locale]/error.tsx` | Client (`'use client'`) | Error inside the locale segment | next-intl `useTranslations('Errors')` |
| `src/app/[locale]/not-found.tsx` | Server Component | `notFound()` called inside locale segment | next-intl `getTranslations({locale, namespace: 'Errors'})` |

**(Optional) `src/app/not-found.tsx`** — bare global 404. Rarely invoked (only when a URL fails locale matching). Hard-coded EN-only is fine.

**Why `app/global-error.tsx` and not `app/error.tsx`** (clarifying UI-SPEC):
The UI-SPEC names this file `app/error.tsx` but Next.js's documented convention for **the root-level error boundary that replaces the whole document** is `app/global-error.tsx`. A file named `app/error.tsx` only catches errors inside the root `app/` segment but does NOT include `<html>`/`<body>` and does NOT replace the layout. With our project's root being `app/[locale]/layout.tsx`, the relevant top-level error boundary is `global-error`. [CITED: github.com/vercel/next.js/blob/canary/docs/01-app/03-api-reference/03-file-conventions/error.mdx — "Global Error UI"]

**`global-error.tsx` minimal pattern:**

```tsx
// Source: Next.js docs (15.1.8 stable signature with `reset`).
// File: src/app/global-error.tsx
'use client';

import { useEffect } from 'react';

const COPY = {
  en: {
    heading: 'Something broke.',
    body: "We're working on it. Try again, or head back home.",
    retry: 'Try again',
    home: 'Return home',
  },
  ar: {
    heading: 'حدث خطأ ما.',
    body: 'نحن نعمل على إصلاحه. حاول مرة أخرى أو عُد إلى الصفحة الرئيسية.',
    retry: 'إعادة المحاولة',
    home: 'العودة إلى الرئيسية',
  },
} as const;

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[global-error]', error);
  }, [error]);

  // Read locale from <html lang> on the client. Falls back to 'en'.
  const lang =
    typeof document !== 'undefined'
      ? (document.documentElement.lang as 'en' | 'ar')
      : 'en';
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const t = COPY[lang] ?? COPY.en;

  return (
    <html lang={lang} dir={dir} className="dark">
      <body className="bg-black text-white antialiased min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md text-center space-y-8">
          <h1 className="text-6xl md:text-[100px] font-bold leading-none tracking-tighter">
            {t.heading}
          </h1>
          <p className="text-lg text-white/60">{t.body}</p>
          <div className="flex gap-4 justify-center pt-4">
            <button
              onClick={() => reset()}
              className="px-6 py-3 bg-white text-black font-semibold rounded-none"
            >
              {t.retry}
            </button>
            <a
              href="/"
              className="px-6 py-3 border border-white/30 text-white font-semibold rounded-none"
            >
              {t.home}
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
```

**Caveats:**
- `global-error.tsx` does NOT inherit fonts from `layout.tsx`. If the brand font feel matters, import `geist` and `ibmPlexArabic` directly here. Tailwind classes still work (CSS is global). [CITED: Next.js global-error docs]
- The `metadata` export is **not supported** in `global-error.tsx`. Use the React `<title>` element if needed. In our case, the browser tab title can stay as the in-flight one — acceptable.
- The `error.digest` is the production-side error correlation id. Show it in dev but hide in production: `{process.env.NODE_ENV === 'development' && <p className="text-xs text-white/40">{error.digest}</p>}`.

**`app/[locale]/error.tsx` (Client Component, full next-intl access):**

```tsx
// File: src/app/[locale]/error.tsx
'use client';
import { useEffect } from 'react';
import { useTranslations } from 'next-intl';

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('Errors');
  useEffect(() => console.error('[locale-error]', error), [error]);
  return (
    <div role="alert" className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="max-w-md text-center space-y-8">
        <h1 className="text-6xl md:text-[100px] font-bold leading-none tracking-tighter">
          {t('heading')}
        </h1>
        <p className="text-lg text-white/60">{t('body')}</p>
        <div className="flex gap-4 justify-center pt-4">
          <button onClick={() => reset()} className="px-6 py-3 bg-white text-black font-semibold">
            {t('retry')}
          </button>
        </div>
      </div>
    </div>
  );
}
```

**`app/[locale]/not-found.tsx` (Server Component, full next-intl):**

```tsx
// File: src/app/[locale]/not-found.tsx
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export default async function LocaleNotFound() {
  const t = await getTranslations('Errors.notFound');
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="max-w-md text-center space-y-8">
        <h1 className="text-6xl md:text-[100px] font-bold leading-none tracking-tighter">
          {t('heading')}
        </h1>
        <p className="text-lg text-white/60">{t('body')}</p>
        <Link href="/shop" className="inline-block px-6 py-3 bg-white text-black font-semibold">
          {t('browseShop')}
        </Link>
      </div>
    </div>
  );
}
```

### Pattern 7: `next/image` priority strategy on the catalog grid

The codebase already implements this correctly at `src/components/shop/ProductGrid.tsx:33` (`priority={i < 4}`). Phase 9 verification only needs to:
1. Confirm the `priority={i < 4}` line still exists post-execution (grep check).
2. Verify the PDP hero image inside `PDPGallery` sets `priority` on the first slide. (Checked separately during inspection; already in place per Phase 7.)

**Avoid:**
- Setting `priority` on every card — defeats the purpose, balloons LCP.
- Setting `priority` based on viewport detection — server-side rendering can't know viewport. The `i < 4` heuristic assumes a 4-column grid above the fold; the codebase grid is `grid-cols-2 md:grid-cols-3 xl:grid-cols-4`. The first 4 cards are always above the fold on `xl`, but on mobile (2 cols) you're priority-loading row 1 + row 2 — acceptable.

### Pattern 8: Static OG fallback asset

**Recommendation: static PNG** — `public/og-default.png`, dimensions 1200×630, target ≤ 80 KB.

**Two options Next.js supports:**

| Option | Path | Auto-wired? | Cost |
|--------|------|-------------|------|
| Static PNG | `public/og-default.png` | NO — must reference manually in `openGraph.images` | Zero runtime cost |
| `app/opengraph-image.png` | Reads file, auto-wires `<meta property="og:image">` on the root | YES (root-level only — applies to ALL pages unless overridden) | Zero runtime cost; less explicit |
| `app/opengraph-image.tsx` | Programmatic via `next/og` `ImageResponse` | YES — generates at build/request time | Higher cold-start cost; only worth it for dynamic content |

**Pick: `public/og-default.png` referenced from `buildMetadata`** (the helper above already does this). Reasons:
1. Explicit reference is greppable (audit trail).
2. PDP pages use product images — they need to override the default. With `app/opengraph-image.png` as the auto-wire, override semantics get fuzzy; with `public/og-default.png`, the override is obvious.
3. Single source of truth for the spec lives in UI-SPEC.

UI-SPEC §"OG fallback asset spec" already locks the design. Production options for the asset:
- Figma export to PNG, then run through TinyPNG / squoosh to compress.
- Programmatic one-off: `npx tsx scripts/generate-og-default.ts` using `@vercel/og` to render the React JSX to PNG, save to `public/og-default.png`. Build-time-once, not runtime.

### Anti-Patterns to Avoid

- **Mounting `<Analytics />` outside `<body>`.** Will not function. Place inside body, after children. [CITED: vercel.com/docs/analytics/quickstart]
- **Adding `'use client'` to `app/[locale]/layout.tsx` to mount `<Analytics />`.** Unnecessary — the `@vercel/analytics/next` component is internally a Client Component. Adding `'use client'` to the layout breaks Server Component imports.
- **Returning a hard-coded path list in `sitemap.ts` and forgetting to read products from DB.** Defeats SEO-02's "automatically generate" criterion. ROADMAP success criterion #4 specifically says "sitemap.xml automatically generates" — must include dynamic product slugs.
- **Using `next-sitemap` package.** Adds build-time complexity and is strictly inferior to native `app/sitemap.ts` for App Router projects. Don't.
- **Disallowing `/admin` without locale prefix in robots.ts.** Path is `/en/admin/...` and `/ar/admin/...` — a bare `/admin/` disallow matches nothing.
- **Putting legal copy in MDX files without a clear maintenance plan.** Legal copy must be diffable, reviewable, and translatable. JSON message bundles win on all three.
- **Setting `revalidate = 0` on `sitemap.ts`.** Forces full regen per request, hammering Postgres. `3600` is a reasonable default; bump to `7200` if launch-day query load is a concern.
- **Trying to use `metadata` export inside `global-error.tsx`.** Not supported. Use the React `<title>` element if needed. [CITED: Next.js error.mdx]
- **Using `useTranslations` inside `global-error.tsx`.** Will throw — there is no `NextIntlClientProvider` in scope (the locale layout is what was replaced). Hard-coded copy is the only safe path.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sitemap XML generation | Custom XML string concatenation | Native `MetadataRoute.Sitemap` from `next` | Next.js handles XML escaping, hreflang link namespace, lastmod formatting, multi-page split if > 50 K URLs. |
| robots.txt generation | Static file in `public/robots.txt` | Native `MetadataRoute.Robots` from `next` | TypeScript safety on the disallow array; one less file to remember to update. |
| Bilingual sitemap pairing | Manual URL-string interpolation per locale | Native `alternates.languages` field, optionally next-intl `getPathname()` | Correct hreflang rendering is non-trivial — the `xmlns:xhtml` namespace + `<xhtml:link>` shape is easy to miss by hand. |
| Cookieless analytics | Custom IP+UA fingerprint beacon | `@vercel/analytics` | GDPR/PDPL exemption hinges on "strictly necessary" classification — building your own anonymizer puts you back in scope. |
| Cookieless Web Vitals collection | Custom `web-vitals` integration | `@vercel/speed-insights` | The Vercel package wraps `web-vitals` and ships INP/LCP/CLS reporting + Vercel-side aggregation. Roll your own only if you don't deploy on Vercel. |
| SQL logger | Console wrapper around `client.notice` events | `drizzle-orm` `logger: true` option | Built-in logger covers the SELECTs/INSERTs/UPDATEs that matter. Building a wrapper repeats Drizzle internals. |
| Per-page metadata helper | Inline `generateMetadata` per page with copy-pasted hreflang | `src/lib/seo.ts buildMetadata` (project-internal helper) | Centralizes the canonical + hreflang + OG defaults. Single fix-it surface when the OG image gets re-cropped. |
| Cookie consent banner | Hand-rolled banner today (when no analytics cookies exist) | NOTHING (CONTEXT §2 — no banner this phase) | Premature complexity. The `<CookieBanner>` scaffold is built but unmounted; future phase mounts it if the cookie picture changes. |

**Key insight:** The Phase 9 work has near-zero greenfield. Almost every line of code is gluing existing primitives together. The leverage win is in *not* hand-rolling the things Vercel and Next.js already provide.

---

## Common Pitfalls

### Pitfall 1: Mounting `<Analytics />` and `<SpeedInsights />` in `app/global-error.tsx`

**What goes wrong:** Devs see "the analytics imports work in `layout.tsx`, must be a global thing" and re-add them in `global-error.tsx` thinking it's defensive.
**Why it happens:** `global-error.tsx` IS a separate document tree.
**How to avoid:** Mount Analytics/SpeedInsights ONCE in `[locale]/layout.tsx`. Do not duplicate in `global-error.tsx`. If the user hits global-error, we don't need analytics on that view — the page-view event from before the error is already captured.
**Warning signs:** Duplicate page-view events in Vercel Analytics dashboard (1 view = 2 events) post-deploy.

### Pitfall 2: hreflang `x-default` mismatch with the canonical URL

**What goes wrong:** `alternates.canonical` points to `/en/about` while `alternates.languages['x-default']` points to `/about` (no locale). Google's Search Console flags this as inconsistent hreflang.
**Why it happens:** Two different mental models for "the default URL".
**How to avoid:** The `buildMetadata` helper above sets `x-default = /en${path}` consistently. Always.
**Warning signs:** Google Search Console "International targeting → Language" report flags hreflang issues 2-7 days post-deploy.

### Pitfall 3: `revalidate = 3600` on `sitemap.ts` doesn't behave as expected on Vercel free/hobby

**What goes wrong:** Sitemap caches at the edge but a stale version is served for up to an hour after a new product launches. Acceptable per CONTEXT §"Risks/Watch-outs", but devs sometimes forget that `db:push` to Supabase does NOT invalidate the sitemap.
**Why it happens:** Route-segment `revalidate` is time-based, not event-based.
**How to avoid:** Either (a) accept the 1-hour staleness (CONTEXT confirms acceptable) or (b) wire `revalidatePath('/sitemap.xml', 'page')` into the admin product-create action when scale demands. Option (a) is the locked decision.
**Warning signs:** New product launches missing from Google search for >24h after launch (only relevant when traffic + crawl-budget grow).

### Pitfall 4: Drizzle `logger: true` printing every checkout transaction in production

**What goes wrong:** Logger gate is forgotten or inverted; production logs balloon to the point that Vercel's log-line limit truncates real errors.
**Why it happens:** Cargo-cult "always log SQL" mentality.
**How to avoid:** Strict `env.NODE_ENV !== 'production'` gate. Verify in Wave 0 that local dev shows logs and `npm run build && npm start` does NOT (in a `NODE_ENV=production` context).
**Warning signs:** Production logs in Vercel show `Query: SELECT ...` lines.

### Pitfall 5: KSA PDPL Article 11 vs GDPR Article 13 disclosure-list mismatch

**What goes wrong:** Privacy Policy is GDPR-shaped (5 sections) and the PDPL audit fails because it expects 8 named items: purpose, content, method of collection, means of storage, manner of processing, manner of destruction, rights of the data subject, manner of exercising rights.
**Why it happens:** PDPL's Art. 11 mandate is more prescriptive than GDPR Art. 13.
**How to avoid:** Use the section skeleton in this RESEARCH.md (Pattern 9 below). It explicitly addresses all 8 PDPL items + GDPR-specific transparency clauses.
**Warning signs:** A KSA legal review (when one happens) flags missing "manner of destruction" or "manner of exercising rights" sections.
**Confidence on this pitfall: MEDIUM** — sourced from PwC + DLA Piper public summaries of PDPL. The exact ordering and naming conventions are not formally standardized; user review is essential.

### Pitfall 6: AR formal legal register vs editorial AR voice

**What goes wrong:** Translating the privacy policy with the same casual Arabic used on the home page produces a document that legal reviewers in KSA reject as not formal enough.
**Why it happens:** Different lexical register; e.g., "we" in editorial AR is "نحن" but legal AR uses "الشركة" or "المُتحكم في البيانات" (the controller).
**How to avoid:** Have the executor draft AR legal copy with explicit instruction: "Use formal Saudi legal Arabic register; refer to ORKI in third person ('الشركة') and to the user as 'صاحب البيانات' or 'المستخدم'; avoid colloquial constructions; mirror the structure of widely-used KSA privacy policies."
**Warning signs:** AR copy uses "نحن نستخدم" rather than "تستخدم الشركة".

### Pitfall 7: `next/image` with `priority` and locale switching

**What goes wrong:** Locale switch from `/en/shop` to `/ar/shop` causes RTL flip + image re-render; if `priority` is on but the layout shifts because the grid mirrors, browsers may re-decode the image and CLS spikes.
**Why it happens:** RTL layout direction change isn't a route change in the strict sense, but `<html dir>` toggling triggers re-paint.
**How to avoid:** The codebase already locks aspect ratio via `style={{ aspectRatio: '3/4' }}` (see `PlaceholderImage.tsx:43`) — this is the correct mitigation. Verify aspect-ratio enforcement remains in place; do not remove it under any circumstance.
**Warning signs:** Speed Insights reports CLS regression specifically on locale-switch sequences.

---

## Code Examples

### Adding the Analytics + Speed Insights mount to `[locale]/layout.tsx`

```tsx
// Source: vercel.com/docs/analytics/quickstart
//         vercel.com/docs/speed-insights/quickstart
// Edit: src/app/[locale]/layout.tsx
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
// ...existing imports...

export const metadata: Metadata = {
  metadataBase: new URL('https://orki.sa'),
  title: { default: 'ORKI — Saudi Streetwear', template: '%s | ORKI' },
  description: 'Saudi streetwear. Dark. Underground.',
  // ...
};

export default async function LocaleLayout({ children, params }: Props) {
  // ...existing logic...
  return (
    <html lang={locale} dir={dir} className={`dark ${geist.variable} ${ibmPlexArabic.variable}`}>
      <body className="bg-black text-white antialiased min-h-screen flex flex-col">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <StoreHydration />
          <Navbar />
          <CartDrawer locale={locale as Locale} />
          <PageTransition>
            <main className="flex-1 pt-20">{children}</main>
          </PageTransition>
          <Footer />
        </NextIntlClientProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

### Per-page `generateMetadata` for a legal page

```tsx
// File: src/app/[locale]/legal/privacy/page.tsx
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { buildMetadata } from '@/lib/seo';
import { LegalArticle } from '@/components/legal/LegalArticle';
import type { Locale } from '@/types/domain';

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    path: '/legal/privacy',
    locale,
    titleKey: 'Legal.privacy.metaTitle',
    descriptionKey: 'Legal.privacy.metaDescription',
  });
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Legal.privacy' });
  return (
    <LegalArticle
      eyebrow={t('eyebrow')}
      heading={t('heading')}
      lastUpdated="2026-05-10"
      locale={locale}
    >
      {/* paragraphs from t.rich() — see message-bundle skeleton below */}
      <h2>{t('section1.heading')}</h2>
      <p>{t('section1.body')}</p>
      {/* ... */}
    </LegalArticle>
  );
}
```

### Section-level skeleton: legal documents (KSA PDPL + GDPR aligned)

These are SECTION HEADINGS only, intended for the executor to flesh out as message-bundle entries (`messages/en.json` `Legal.privacy.section{N}.heading` + `body`, mirrored in `ar.json`).

#### Privacy Policy (`Legal.privacy`)

| § | Heading (EN) | Heading (AR — formal) | Required for |
|---|--------------|------------------------|--------------|
| 1 | Who we are | من نحن | PDPL Art. 11 (controller identity) + GDPR Art. 13(1)(a) |
| 2 | What personal data we collect | البيانات الشخصية التي نجمعها | PDPL Art. 11 "content of personal data" + GDPR Art. 13(1)(c) |
| 3 | Why we collect it (purpose) | الغرض من جمع البيانات | PDPL Art. 11 "purpose" + GDPR Art. 13(1)(c) |
| 4 | How we collect it (method) | كيفية جمع البيانات | PDPL Art. 11 "method of collection" |
| 5 | How we store it | كيفية تخزين البيانات | PDPL Art. 11 "means of storage"; mention Supabase as processor + region |
| 6 | How we process and use it | كيفية معالجة البيانات واستخدامها | PDPL Art. 11 "manner of processing" + GDPR Art. 6 lawful basis |
| 7 | Who we share it with | مع من نشارك البيانات | GDPR Art. 13(1)(e) recipients; list Vercel (hosting), Supabase (DB), Resend (email — when implemented) |
| 8 | International transfers | نقل البيانات عبر الحدود | PDPL Art. 29 + GDPR Art. 44-49; Supabase region + Vercel edge locations |
| 9 | How long we keep it (retention) | فترة الاحتفاظ بالبيانات | GDPR Art. 13(2)(a). Cart cookie 30 days, order data per KSA tax retention (recommend 5 years; **[ASSUMED] — user must confirm**), email 18 months. |
| 10 | How we destroy it | كيفية إتلاف البيانات | PDPL Art. 11 "manner of destruction" — explicit DB row delete + audit log entry |
| 11 | Your rights | حقوقك | PDPL Art. 11 + GDPR Art. 15-22. Access, rectification, erasure, restriction, portability, objection. |
| 12 | How to exercise your rights | كيفية ممارسة حقوقك | PDPL Art. 11 "manner of exercising rights"; LGL-04 satisfaction — email controller mechanism. |
| 13 | Cookies (cross-reference) | ملفات تعريف الارتباط | Pointer to `/legal/cookies` |
| 14 | Children's privacy | خصوصية الأطفال | KSA conservative posture; under-18 not addressed. |
| 15 | Changes to this policy | تعديلات على هذه السياسة | GDPR Art. 12 transparency on changes |
| 16 | Contact us | تواصل معنا | Controller contact email, postal address (placeholder OK pre-launch) |
| 17 | Template disclaimer | إخلاء مسؤولية النموذج | UI-SPEC mandates this footer line on every legal page until lawyer-reviewed |

[ASSUMED] — Section 9 retention periods (5 years for orders, 18 months for emails) are typical KSA practice but should be user-confirmed before publication. Mark each duration with a `[USER-CONFIRM]` comment in `messages/en.json` until reviewed.

#### Terms & Conditions (`Legal.terms`)

| § | Heading (EN) | Heading (AR) | Required for |
|---|--------------|--------------|--------------|
| 1 | Acceptance of terms | قبول الشروط | Standard |
| 2 | About ORKI | عن أوركي | Controller identity, KSA registration (placeholder pre-launch) |
| 3 | Eligibility | الأهلية | Age 18+ |
| 4 | Account and orders | الحساب والطلبات | Guest checkout per UX-01; account deferred to Phase 10 |
| 5 | Pricing and currency | الأسعار والعملة | SAR, VAT 15%, prices VAT-exclusive (per Phase 8) |
| 6 | Payment | الدفع | Mada / Visa / Mastercard / Apple Pay / Cash on Delivery (per Phase 8 PaymentGrid) |
| 7 | Shipping | الشحن | Flat 25 SAR, free over 300 SAR (per Phase 8 CONTEXT) |
| 8 | Returns and refunds | الإرجاع والاسترداد | 14 / 30 days — reconcile with existing Footer + Shop "Free returns within 14 days" + Checkout "30-day returns". **[FLAG] — copy contradicts itself today.** |
| 9 | Order cancellation | إلغاء الطلب | Per Phase 8 admin cancellation policy; pre-ship cancel restores stock |
| 10 | Liability | المسؤولية | Standard limit-of-liability clause |
| 11 | Intellectual property | الملكية الفكرية | ORKI brand + product imagery |
| 12 | Prohibited uses | الاستخدامات المحظورة | Resale, automation, scraping |
| 13 | Privacy | الخصوصية | Pointer to `/legal/privacy` |
| 14 | Governing law and dispute resolution | القانون الحاكم وتسوية النزاعات | KSA law; KSA courts |
| 15 | Changes to these terms | تعديلات على هذه الشروط | Standard |
| 16 | Contact us | تواصل معنا | Same controller contact |
| 17 | Template disclaimer | إخلاء مسؤولية النموذج | UI-SPEC mandate |

**[FLAG]** Section 8: Footer copy says "Easy returns within 30 days" while Shop copy says "Free returns within 14 days. No questions asked." and Checkout TrustSignals says "30-Day Returns". Phase 9 must reconcile to a single number. Recommendation: 14 days (the more conservative, KSA-typical figure). User to confirm.

#### Cookie Policy (`Legal.cookies`)

| § | Heading (EN) | Heading (AR) | Notes |
|---|--------------|--------------|-------|
| 1 | What are cookies | ما هي ملفات تعريف الارتباط | One-paragraph definition |
| 2 | Cookies we use | ملفات تعريف الارتباط التي نستخدمها | Renders the `<CookieTable>` (UI-SPEC) — strictly-necessary list |
| 3 | We do not use | ما لا نستخدمه | Explicit: no analytics cookies, no marketing cookies, no third-party trackers, no fingerprinting beyond Vercel's cookieless RUM |
| 4 | Vercel Analytics + Speed Insights | تحليلات فيرسل وقياس الأداء | Explain cookieless beacons; reference KSA PDPL strictly-necessary exemption |
| 5 | Your choices | خياراتك | Browser-side cookie deletion; impact on cart |
| 6 | Changes to this policy | تعديلات على هذه السياسة | — |
| 7 | Contact us | تواصل معنا | — |
| 8 | Template disclaimer | إخلاء مسؤولية النموذج | UI-SPEC mandate |

### `messages/en.json` skeleton additions (mirror in `ar.json`)

```jsonc
{
  "Errors": {
    "heading": "Something broke.",
    "body": "We're working on it. Try again, or head back home.",
    "retry": "Try again",
    "home": "Return home",
    "notFound": {
      "heading": "404 — Lost in the noise.",
      "body": "This page doesn't exist or was moved. Try the shop instead.",
      "browseShop": "Browse shop",
      "returnHome": "Return home"
    },
    "section": {
      "shopLoadFailed": "We're having trouble loading the catalog right now. Try again in a moment.",
      "orderLoadFailed": "We can't pull up your order right now — your payment is confirmed. Email us if you need help.",
      "adminOrdersFailed": "Order list temporarily unavailable."
    }
  },
  "Legal": {
    "lastUpdatedLabel": "Last updated:",
    "templateDisclaimer": "This document is a template draft pending legal review. Contact us with questions.",
    "privacy": {
      "metaTitle": "Privacy Policy",
      "metaDescription": "How ORKI collects, stores, and uses your personal data. KSA PDPL and GDPR aligned.",
      "eyebrow": "(Legal) — 01",
      "heading": "Privacy Policy",
      "section1": { "heading": "Who we are", "body": "..." }
      // ... section2..section17
    },
    "terms": { "metaTitle": "Terms & Conditions", "metaDescription": "...", "/* sections */": "..." },
    "cookies": { "metaTitle": "Cookie Policy", "metaDescription": "...", "/* sections */": "..." }
  },
  "Footer": {
    "legal": {
      "groupLabel": "(Legal)",
      "privacy": "Privacy Policy",
      "terms": "Terms & Conditions",
      "cookies": "Cookie Policy"
    }
  },
  "CookieBanner": {
    "body": "We use strictly-necessary cookies to run the cart and checkout. No analytics or marketing cookies are set.",
    "primaryCta": "Got it",
    "secondaryLink": "Read our Cookie Policy"
  }
}
```

### Cookie scaffold helper signature (built but unmounted)

```tsx
// File: src/lib/cookie-consent.ts (NEW — no-op today)
// This is the locked API surface so a future phase can wire up <CookieBanner>
// without re-designing the helper.

const COOKIE_NAME = 'cookie_consent';

export type ConsentValue = 'accepted' | 'rejected' | 'pending';

/** Reads the cookie. Returns 'pending' if not set. Client-side only. */
export function readCookieConsent(): ConsentValue {
  if (typeof document === 'undefined') return 'pending';
  const match = document.cookie.match(new RegExp(`(^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  if (!match) return 'pending';
  return (match[2] === 'accepted' || match[2] === 'rejected') ? match[2] : 'pending';
}

/** Writes the cookie with 365-day expiry, SameSite=Lax. Client-side only. */
export function writeCookieConsent(value: 'accepted' | 'rejected'): void {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${COOKIE_NAME}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}
```

```tsx
// File: src/components/CookieBanner.tsx (NEW — built, NOT mounted)
'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { readCookieConsent, writeCookieConsent } from '@/lib/cookie-consent';

interface Props { locale: 'en' | 'ar' }

export function CookieBanner(_props: Props) {
  const [show, setShow] = useState(false);
  const t = useTranslations('CookieBanner');
  useEffect(() => { setShow(readCookieConsent() === 'pending'); }, []);
  if (!show) return null;
  return (
    <div className="fixed bottom-0 inline-end-0 z-50 max-w-md p-6 m-6 bg-[#111111] border border-white/10">
      <p className="text-sm text-white/80 leading-relaxed">{t('body')}</p>
      <Link href="/legal/cookies" className="text-xs text-white/60 underline mt-2 inline-block">
        {t('secondaryLink')}
      </Link>
      <div className="mt-4">
        <button
          onClick={() => { writeCookieConsent('accepted'); setShow(false); }}
          className="px-4 py-2 bg-white text-black text-sm font-semibold"
        >
          {t('primaryCta')}
        </button>
      </div>
    </div>
  );
}
```

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.1.5 (already configured per `package.json:test` script) |
| Config file | (project uses default config — no `vitest.config.ts` detected at repo root; verify in Wave 0) |
| Quick run command | `npm test` (alias for `vitest run --passWithNoTests`) |
| Full suite command | `npm test` |
| Network smoke command | `npm run dev` then curl/grep against the dev server |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LGL-01 | Privacy Policy page renders 200 in EN + AR with all 17 sections | smoke | `curl -sI http://localhost:3000/en/legal/privacy \| grep -E '^HTTP/.* 200'` and same for `/ar/legal/privacy`; then `curl -s http://localhost:3000/en/legal/privacy \| grep -c '<h2'` ≥ 16 (sections 1-17 minus 1 H1) | Wave 0: NEW route |
| LGL-02 | Cookie Policy page exists, enumerates orki_sid + sb-* cookies, declares "no analytics or marketing cookies" | smoke | `curl -s http://localhost:3000/en/legal/cookies \| grep -E 'orki_sid\|no analytics'` returns ≥ 2 matches | Wave 0: NEW route |
| LGL-02 (no banner verification) | `<CookieBanner>` exists as a file but is NOT rendered in any layout | grep | `grep -r 'import.*CookieBanner' src/app/` returns 0 | — |
| LGL-03 | Terms & Conditions page renders 200 in EN + AR | smoke | `curl -sI http://localhost:3000/en/legal/terms \| grep -E '^HTTP/.* 200'` and same for `/ar/legal/terms` | Wave 0: NEW route |
| LGL-04 | Privacy Policy includes "your rights" and a contact email mechanism | grep | `grep -E 'rights\|contact' src/messages/en.json \| wc -l` ≥ 2 within Legal.privacy.section11 + section12 + section16 | — |
| PERF-03 | Speed Insights mounted in root layout | grep | `grep -c '<SpeedInsights' src/app/[locale]/layout.tsx` = 1 | — |
| PERF-03 (RUM) | LCP < 2.5s observed in Vercel Speed Insights dashboard 24h post-deploy | manual-only | (manual: visit vercel dashboard) | — |
| PERF-04 | `<Analytics />` mounted in root layout | grep | `grep -c '<Analytics' src/app/[locale]/layout.tsx` = 1 | — |
| PERF-04 (image priority) | First 3-4 catalog cards have `priority` | grep | `grep -E 'priority=\\{i < 4\\}' src/components/shop/ProductGrid.tsx` returns 1 match | — |
| PERF-04 (PDP hero priority) | PDP hero image has priority | grep | `grep -E 'priority' src/components/pdp/PDPGallery.tsx` returns ≥ 1 | — |
| PERF-05 (global error boundary) | `app/global-error.tsx` exists | file | `test -f src/app/global-error.tsx && echo OK` returns OK | Wave 0: NEW |
| PERF-05 (per-locale error) | `app/[locale]/error.tsx` exists | file | `test -f src/app/\\[locale\\]/error.tsx && echo OK` returns OK | Wave 0: NEW |
| PERF-05 (per-locale 404) | `app/[locale]/not-found.tsx` exists | file | `test -f src/app/\\[locale\\]/not-found.tsx && echo OK` returns OK | Wave 0: NEW |
| PERF-05 (try/catch on shop) | `/shop` server page wraps DB read in try/catch | grep | `grep -E 'try\\s*\\{' src/app/[locale]/shop/page.tsx` returns ≥ 1 | — |
| PERF-06 | `.planning/codebase/data-access-pattern.md` doc exists | file | `test -f .planning/codebase/data-access-pattern.md && echo OK` | Wave 0: NEW |
| PERF-06 (logger gate) | Drizzle logger gated on NODE_ENV | grep | `grep -E "logger:.*NODE_ENV" src/lib/db/client.ts` returns 1 match | — |
| SEO-02 | `sitemap.xml` returns 200 with > 0 `<url>` entries | smoke | `curl -s http://localhost:3000/sitemap.xml \| grep -c '<url>'` > 0 | Wave 0: NEW |
| SEO-02 (hreflang) | Sitemap entries include hreflang link alternates | smoke | `curl -s http://localhost:3000/sitemap.xml \| grep -c 'hreflang='` > 0 | — |
| SEO-02 (bilingual count) | Sitemap contains both `/en/` and `/ar/` URLs | smoke | `curl -s http://localhost:3000/sitemap.xml \| grep -cE '/en/\|/ar/'` ≥ 18 (9 static × 2 + N products × 2) | — |
| SEO-02 (admin excluded) | Sitemap MUST NOT contain admin URLs | smoke | `curl -s http://localhost:3000/sitemap.xml \| grep -c '/admin'` = 0 | — |
| SEO-03 (title length) | Each new page has title ≤ 60 chars | manual-only | (inspection during code review of `messages/*.json` Legal.* metaTitle entries) | — |
| SEO-03 (description length) | Each new page has description ≤ 160 chars | manual-only | Inspect `messages/*.json` Legal.* metaDescription entries | — |
| SEO-03 (uniqueness) | Each route's title is unique across pages | grep | `grep -oE '"metaTitle":\\s*"[^"]+"' messages/en.json \| sort \| uniq -d \| wc -l` = 0 | — |
| (additional) | `robots.txt` returns 200 with admin disallow | smoke | `curl -s http://localhost:3000/robots.txt \| grep -E 'Disallow.*admin'` returns ≥ 2 (en + ar) | Wave 0: NEW |

### Sampling Rate
- **Per task commit:** `npm test` (vitest, fast — passWithNoTests handles legal-only commits)
- **Per wave merge:** `npm run build && npm start` then run the full smoke-curl battery above against `localhost:3000`
- **Phase gate:** Full smoke battery + manual verification of Vercel Analytics + Speed Insights dashboards (24h after first deploy)

### Wave 0 Gaps
- [ ] `vitest.config.ts` — verify present at repo root; if absent, add minimal config (likely already implicit via `@vitejs/plugin-react`)
- [ ] `src/lib/seo.ts` — buildMetadata helper
- [ ] `messages/en.json` Legal namespace skeleton
- [ ] `messages/ar.json` Legal namespace skeleton
- [ ] No new test framework install needed (vitest 4 already present)

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `next-sitemap` package + build-time generation | Native `app/sitemap.ts` returning `MetadataRoute.Sitemap` | Next.js 13.3 (April 2023); App Router stable | Zero deps, dynamic DB-backed sitemap |
| Manual `<link rel="alternate" hreflang="..." />` | Native `alternates.languages` in metadata + sitemap | Next.js 13.x | Auto-emits xhtml namespace + correct sitemap shape |
| Custom Web Vitals reporting via `web-vitals` npm | `@vercel/speed-insights` (cookieless, INP-by-default) | `@vercel/speed-insights` 1.x → 2.x (2024) | INP support, no consent needed, native Vercel aggregation |
| `app/error.tsx` with `<html>`+`<body>` for global errors | `app/global-error.tsx` (canonical separation) | Next.js 13.4+ | Clearer mental model — segment errors vs global errors |
| Drizzle 0.30.x relational query syntax | 0.45.x same syntax + `_query` API at v1.0 (preview) | Drizzle 0.45 (Q1 2025) | No migration impact — relational queries stable |

**Deprecated/outdated:**
- Pages Router `_app.js` analytics mount — N/A, project is App Router only.
- `app/error.tsx` containing `<html>`/`<body>` — replaced by the explicit `global-error.tsx` convention. The two coexist; UI-SPEC's name mismatch is reconciled in Open Issue #1.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | KSA PDPL Art. 11 mandates exactly 8 enumerated content items in a privacy notice (purpose, content, method, storage, processing, destruction, rights, exercising rights) | Pitfall 5 + Privacy skeleton | If list is different or longer, audit fails — but adding items is cheap. PwC + DLA Piper summaries align on these 8; primary text not directly read in this research. |
| A2 | KSA tax/order retention period is 5 years; email retention is 18 months | Privacy skeleton §9 | Wrong retention period in published policy → user must rewrite. Mark `[USER-CONFIRM]` in messages bundle. |
| A3 | Vercel Speed Insights INP tracking is enabled by default in v2.x | Pattern 1 | Low — even if disabled, Speed Insights still satisfies PERF-03's LCP/CLS components. INP would just be missing data. |
| A4 | `revalidate = 3600` works on `app/sitemap.ts` (not just on regular routes) | Pattern 2 | Verified [VERIFIED: Next.js docs] — `sitemap.ts` is a route segment; segment config applies. Listed only because it's load-bearing. |
| A5 | The project's Footer hard-codes `/privacy` and `/terms`; href migration is required | UI-SPEC Open Issue #3 | [VERIFIED: src/components/footer/Footer.tsx:60-61] — confirmed by codebase read |
| A6 | Returns policy is 14 days OR 30 days — must reconcile | Terms §8 [FLAG] | Inconsistent customer-facing copy; legal exposure if a customer sues based on the longer policy and Terms only cover the shorter. User must pick one. |
| A7 | `app/global-error.tsx` is the right file name (not `app/error.tsx` as UI-SPEC says) | Pattern 6 | Verified [VERIFIED: Next.js 15.1.8 docs] — `app/error.tsx` does NOT include `<html>`/`<body>` and won't satisfy UI-SPEC's "global branded error" intent. |

**The Assumptions Log is non-empty.** Items A1, A2, A6 require user confirmation before publishing the legal pages (or before merging Phase 9 to main).

---

## Open Questions

1. **Returns-policy duration: 14 days or 30 days?**
   - What we know: Footer says 30 days, Shop says 14 days, Checkout TrustSignals says 30 days. Conflict is shipped today.
   - What's unclear: Which is the intended policy?
   - Recommendation: Phase 9 normalizes to 14 days (more conservative) and includes a copy-fix sweep for Footer + TrustSignals. User confirms before execution.

2. **Order data retention period under KSA tax law.**
   - What we know: KSA ZATCA (tax authority) requires 5-year retention for tax records — orders qualify. [ASSUMED]
   - What's unclear: Whether this generalizes to non-tax PII fields (shipping address, phone) or whether those should be deleted earlier on user request.
   - Recommendation: Default to 5 years for the order row (financial record), 30 days for cart-only data, immediate deletion for emails after the LGL-04 erasure request flow processes.

3. **AR legal register source.**
   - What we know: UI-SPEC mandates "formal legal Arabic register"; existing AR copy on the site uses editorial register.
   - What's unclear: Whether AI-drafted formal AR meets KSA legal-document conventions, or whether a native-speaker editor pass is needed pre-publish.
   - Recommendation: Generate a first AR draft, flag with an `<-- [AR-LEGAL-REVIEW] -->` comment in the message bundle. User reviews and either accepts or commissions a native review before launch.

4. **`metadata.title.template` placement.**
   - What we know: Setting `template: '%s | ORKI'` in `[locale]/layout.tsx` cascades to all child routes.
   - What's unclear: Whether existing PDP `generateMetadata` (which already returns the full title `'{name} | ORKI'`) double-applies the template (resulting in `'{name} | ORKI | ORKI'`).
   - Recommendation: Test in dev. If double-applies, refactor PDP `generateMetadata` to return only the bare product name. If `template` cascade doesn't apply when child returns full string, leave PDP alone. Either is acceptable; verify in Wave 0.

5. **Sitemap product-list size at scale.**
   - What we know: Current product count is small (Phase 7 hand-count). `revalidate = 3600` is safe.
   - What's unclear: Whether at 1k+ products the route segment runtime exceeds Vercel's 10s function limit.
   - Recommendation: Not a Phase 9 concern. Add a note in `data-access-pattern.md` to revisit if catalog crosses 500 products.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All | ✓ | 20+ (per package.json `@types/node` v20) | — |
| Vercel deployment target | Analytics + Speed Insights ingestion | ✓ | (Phase 8 already on Vercel per CONTEXT carry-forward) | — |
| Supabase Postgres | sitemap.ts product read | ✓ | Phase 5 | If down, sitemap still renders static paths; product paths missing for 1h until next revalidate |
| `@vercel/analytics` | PERF-04 | ✗ (not installed) | needs 2.0.1 | Install via `npm install @vercel/analytics` |
| `@vercel/speed-insights` | PERF-03 | ✗ (not installed) | needs 2.0.0 | Install via `npm install @vercel/speed-insights` |
| `@next/mdx` | If MDX route chosen for legal pages | ✗ | not needed | Use i18n JSON path (recommended); no install |

**Missing dependencies with no fallback:** None. Both Vercel packages are quick installs from npm.

**Missing dependencies with fallback:** None requiring intervention.

---

## Project Constraints (from CLAUDE.md)

These are CLAUDE.md directives that constrain Phase 9 execution. Plans must comply.

| Constraint | Source | Phase 9 Implication |
|-----------|--------|---------------------|
| RTL: use logical CSS only (`ms-`, `me-`, `ps-`, `pe-`) — never `ml-`/`mr-`/`pl-`/`pr-`/`left-`/`right-` | CLAUDE.md "RTL is non-negotiable" | Legal pages, error pages, CookieBanner scaffold, footer additions ALL must use logical properties. No exceptions. The CookieBanner positions itself with `inline-end-0`, not `right-0`. |
| Both `lang` and `dir` set atomically on `<html>` | CLAUDE.md | `global-error.tsx` writes `<html lang dir>` directly (already shown in Pattern 6). Per-locale error/404 inherit from `[locale]/layout.tsx`. |
| All product data via `lib/products.ts` only | CLAUDE.md "Data layer contract" | Sitemap consumes `getAllProducts()` — never imports from `db/schema` or `data/products.ts` directly. |
| Currency via `Intl.NumberFormat('ar-SA-u-nu-latn', ...)` | CLAUDE.md | Legal pages displaying durations or amounts use the same numeric format. Western numerals in both locales. |
| Black-and-white only — no other palette | CLAUDE.md "Design System" | OG fallback PNG: black background, white wordmark. Error pages, legal page chrome, CookieBanner: same. |
| Currency: SAR | CLAUDE.md | Reflected in T&C §5 and §6. |
| Frontend-first: no real backend | CLAUDE.md | (Already superseded by Phase 5+ — backend is now real. Constraint no longer binding for Phase 9.) |
| `next-intl` URL-based locale routing | CLAUDE.md | Sitemap uses `/en/...` and `/ar/...` paths; robots.ts disallow path includes locale prefix. |
| Tailwind v4 + shadcn/ui | CLAUDE.md | Reuses already-installed primitives (button, separator). No new shadcn installs. |
| 44×44px minimum touch target | CLAUDE.md "Design System" | Footer Cookie Policy link inherits from `globals.css` enforcement. CookieBanner CTA respects this. |

---

## Sources

### Primary (HIGH confidence)
- [Context7 `/vercel/next.js`] — sitemap.ts MetadataRoute.Sitemap with alternates.languages, robots.ts MetadataRoute.Robots, error.tsx + global-error.tsx + not-found.tsx file conventions, opengraph-image.tsx ImageResponse, route segment `revalidate` config
- [Context7 `/vercel/next.js/v15.1.8`] — verified that the `error({ error, reset })` signature is current for Next.js 15.x stable (project on 15.3.9). The `unstable_retry` API in canary docs is NOT in 15.x stable.
- [Context7 `/websites/vercel`] — `@vercel/analytics/next` and `@vercel/speed-insights/next` mounting, debug prop, INP tracking, opt-out beforeSend
- [Context7 `/drizzle-team/drizzle-orm-docs`] — `logger: true` default + custom Logger interface, postgres-js client setup
- [Context7 `/amannn/next-intl`] — `getTranslations({locale, namespace})` in `generateMetadata`, sitemap localization with `getPathname`
- [npm registry, 2026-05-10] — verified versions: @vercel/analytics 2.0.1, @vercel/speed-insights 2.0.0, next-intl 4.11.1, drizzle-orm 0.45.2

### Secondary (MEDIUM confidence)
- [PwC Middle East — KSA PDPL guide] — Privacy Policy content list, Art. 11 mandate
- [DLA Piper — Saudi Arabia in force] — PDPL came into force 14 Sep 2023, full compliance 14 Sep 2024
- [DataGuidance — Saudi Arabia jurisdiction] — Cross-reference on transparency requirements
- [HalaPrivacy — KSA PDPL Compliance Guide] — Privacy notice mandatory items

### Tertiary (LOW confidence)
- KSA-specific retention periods for ecommerce orders (5 years) — [ASSUMED] from common KSA tax practice; primary text not consulted. User must confirm.
- AR formal legal register conventions — [ASSUMED] based on common KSA privacy-policy patterns. Native review recommended pre-launch.

### Codebase
- `src/app/[locale]/layout.tsx` (lines 1-60) — existing locale layout, root metadata, font + dir setup
- `src/app/[locale]/shop/[category]/[slug]/page.tsx` (lines 14-40) — existing dynamic `generateMetadata`
- `src/lib/db/client.ts` (lines 1-34) — current Drizzle client, NODE_ENV pattern
- `src/lib/products.ts`, `src/lib/cart/server.ts`, `src/lib/orders/server.ts` — verified relational query patterns; one acceptable loop documented at orders/server.ts:387-409
- `src/components/footer/Footer.tsx` (lines 56-63) — existing /privacy and /terms hard-coded hrefs
- `src/components/shop/ProductGrid.tsx` (line 33) — existing `priority={i < 4}` heuristic
- `src/components/PlaceholderImage.tsx` (line 43) — `aspect-ratio` enforcement (CLS guard)
- `src/i18n/routing.ts` — `localePrefix: 'always'`, locales: `['en', 'ar']`
- `messages/en.json` + `messages/ar.json` — existing i18n namespaces

### Sources from web search
- [PwC Middle East — KSA PDPL Guide](https://www.pwc.com/m1/en/services/consulting/technology/cyber-security/navigating-data-privacy-regulations/ksa-data-protection-law.html)
- [DLA Piper — Saudi Arabia's new PDPL](https://www.dlapiper.com/en-us/insights/publications/2024/02/saudi-arabias-new-personal-data-protection-law-in-force)
- [DataGuidance — Saudi Arabia](https://www.dataguidance.com/jurisdictions/saudi-arabia)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions verified via npm registry, mounting patterns confirmed via Vercel docs
- Architecture: HIGH — all file conventions confirmed against Next.js canary + 15.1.8 tagged docs
- Sitemap + hreflang shape: HIGH — directly cited from Next.js docs
- Drizzle logger: HIGH — directly cited from Drizzle docs
- Error boundary file naming (`global-error.tsx` vs `error.tsx`): HIGH — directly cited from Next.js docs (UI-SPEC names this differently; reconciled in Open Issue #1)
- KSA PDPL section list: MEDIUM — sourced from PwC + DLA Piper public summaries; primary text not directly consulted
- Retention periods: LOW — [ASSUMED]; user must confirm
- AR legal register: LOW — [ASSUMED]; native review recommended

**Research date:** 2026-05-10
**Valid until:** 2026-06-10 (stack is stable; legal-content side may need refresh if KSA PDPL implementing regulations update)
