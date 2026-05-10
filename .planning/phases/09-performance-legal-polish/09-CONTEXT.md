---
phase: 9
phase_name: Performance, Legal & Polish
status: ready_for_research
created: 2026-05-10
locale: en
---

# Phase 9 Context — Performance, Legal & Polish

## Domain

Make ORKI compliant, fast, and indexable before launch. Four sub-domains:

1. **Legal** — Privacy Policy, Terms & Conditions, Cookie Policy pages (EN + AR), KSA PDPL + GDPR-aligned, no consent banner needed.
2. **Performance** — Achieve LCP < 2.5s / CLS < 0.1 / INP < 200ms via real-user measurement; image-loading strategy on shop grid + PDP hero.
3. **SEO** — Bilingual sitemap with hreflang, per-page metadata convention, branded OG fallback.
4. **Reliability** — N+1 guardrail (codebase already clean), branded graceful-degradation pages.

Phase boundary is FIXED by ROADMAP.md. Anything new (data export portal, full GDPR DSAR flow, vendor-managed legal, Lighthouse CI) belongs in Phase 9 follow-ups or new phases.

## Carried Forward (already-locked decisions)

| From | Decision | Affects Phase 9 |
|---|---|---|
| CLAUDE.md | RTL via logical CSS only (`ms-`, `me-`, `ps-`, `pe-`); both `lang` and `dir` set atomically | Legal pages, error pages, banners |
| CLAUDE.md | next-intl URL routing `/en/...` `/ar/...` | Legal route shape, sitemap URL pairs |
| CLAUDE.md | Dark/minimal aesthetic, no other palette | Error pages, legal page chrome, OG fallback |
| CLAUDE.md | Currency Western numerals via `'ar-SA-u-nu-latn'` | Reuse for any AR numeric output (e.g. data retention periods in legal) |
| Phase 5 (Drizzle + Postgres / Supabase) | All DB access via Drizzle relational queries | N+1 guardrail must preserve this pattern |
| Phase 8 (cart cookie `orki_sid` + Supabase auth cookies) | Strictly necessary classification | Cookie Policy page lists these; no banner required |
| ADR-001 (Supabase) | Live Supabase Postgres | Graceful degradation must handle Supabase outages |

## Decisions

### 1. Legal content sourcing & languages

- **Source:** Claude drafts Privacy / T&C / Cookie Policy as MDX (or i18n-string-bundled Markdown) using KSA PDPL + GDPR-aligned templates tailored to ORKI's actual data flows: cart cookie, checkout email, admin auth, Supabase processing, no analytics cookies, no marketing cookies, no third-party trackers.
- **Languages:** EN and AR ship together. Same source-of-truth structure, AR uses formal legal Arabic register, RTL layout via logical CSS.
- **Review:** User reviews drafts before merge. Marked **revisable** — may switch to vendor-hosted (Termly/Iubenda) or lawyer-supplied copy in a future phase if the AI draft proves insufficient.
- **Routes:** `/[locale]/legal/privacy`, `/[locale]/legal/terms`, `/[locale]/legal/cookies`. Footer links visible in both locales.

### 2. Cookie consent — NO BANNER

- **Decision:** Do NOT ship a consent banner.
- **Rationale:**
  - All current cookies are strictly necessary (cart + auth) — exempt from consent under GDPR Art. 5(3) and KSA PDPL.
  - Vercel Analytics + Speed Insights are cookieless and exempt from consent.
  - No GA4, no Meta Pixel, no retargeting in scope; no marketing cookies set.
  - Banner would clash with dark/minimal/editorial brand.
- **Cookie Policy page** still ships (LGL-02 requires the policy doc). It enumerates strictly-necessary cookies and explicitly states "no analytics or marketing cookies are set."
- **Future-proofing:** Scaffold a hidden, unmounted `<CookieBanner>` component + `cookie_consent` cookie helper utility. Not rendered. Ready to wire up in a future phase if GA4 / pixel is ever added.

### 3. Analytics + performance measurement

- **Analytics provider:** Vercel Analytics + Vercel Speed Insights. Both cookieless. Add `@vercel/analytics` and `@vercel/speed-insights` packages, mount in `app/[locale]/layout.tsx`.
- **Performance gating:** Real-user data only (Speed Insights). NO build-time Lighthouse gate this phase.
- **Rationale:** Real-user data from Saudi networks is more meaningful than synthetic Lighthouse runs from a US-region CI worker. Lighthouse CI can be added later if a regression actually ships.
- **Image-loading strategy:**
  - Shop grid: above-fold cards (first row, ~3-4) get `priority` on `next/image`. Everything below is lazy by default.
  - PDP hero: `priority`.
  - Skip blur placeholders / forced AVIF this phase — touches Phase 6 admin upload code (out of scope).

### 4. Sitemap + per-page metadata

- **Sitemap:** `app/sitemap.ts` reads products + categories from Drizzle at request time. Cached via `export const revalidate = 3600`. Emits paired EN/AR URLs for every public page (home, about, contact, legal/{privacy,terms,cookies}, every category, every product). Includes `<xhtml:link rel="alternate" hreflang="en"/ar"/x-default">` so Google understands locale pairs. Excludes admin routes.
- **`robots.ts`:** Allow all, disallow `/[locale]/admin/*` and `/[locale]/checkout/*`.
- **Title template:** `{Page} | ORKI` for every route. Home is custom (`ORKI — Saudi Streetwear`). Products: `{Product Name} | ORKI`. Categories: `{Category} | ORKI`. AR titles use Arabic page names (e.g. `هوديز | ORKI`).
- **Meta description:** Per-route, AR translated, ≤ 160 chars. Static for static pages, generated for product pages.
- **Open Graph:**
  - Default branded card (logo on dark) for non-product pages — single static image.
  - Product pages: keep existing dynamic OG (already implemented in PDP `generateMetadata`).
- **Tag length enforcement:** title ≤ 60 chars, description ≤ 160 chars. Verified by inspection during implementation; no automated check this phase.

### 5. Reliability

- **N+1 status:** Codebase audited 2026-05-10 and confirmed clean. All data-access uses Drizzle's relational query pattern (`db.query.X.findMany({ with: { ... } })`).
  - Verified clean: `src/lib/products.ts`, `src/lib/cart/server.ts`, `src/lib/orders/server.ts` (read paths).
  - One acceptable per-item loop: `transitionOrderStatus` stock-restoration at `src/lib/orders/server.ts:387-409` — admin action, transactional, bounded by items-per-order. Not refactored.
- **N+1 guardrail:**
  - Enable Drizzle `logger: true` in `src/lib/db/client.ts` for dev only (gate on `process.env.NODE_ENV !== 'production'`).
  - Add a one-page note `.planning/codebase/data-access-pattern.md`: "Always use `db.query.X.findMany({ with: ... })`; never `for (const x of list) { await db.query... }`."
  - Mark PERF-06 satisfied with a "reviewed clean as of 2026-05-10" note.
- **Graceful degradation:**
  - Custom `app/error.tsx` and `app/not-found.tsx`, dark/minimal/editorial, in EN + AR via `getTranslations`.
  - Per-route try/catch in server pages: a Supabase blip on `/shop` shows "We're having trouble loading the catalog right now — try again" instead of the Next default error page. Same for `/admin/orders`, `/checkout/confirmation`.
  - Analytics scripts use Vercel's official wrappers (already silent-fail by design).
  - Email already a no-op (Plan 08-07 deferred).

## Code Context

**Files to create (planned for Phase 9):**

| Area | File | Purpose |
|---|---|---|
| Legal | `src/app/[locale]/legal/layout.tsx` | Shared chrome for legal pages |
| Legal | `src/app/[locale]/legal/privacy/page.tsx` | Privacy Policy (MDX or i18n-string-rendered) |
| Legal | `src/app/[locale]/legal/terms/page.tsx` | Terms & Conditions |
| Legal | `src/app/[locale]/legal/cookies/page.tsx` | Cookie Policy (lists strictly-necessary cookies) |
| Legal | `messages/en.json` + `messages/ar.json` | Add `Legal.*` namespaces (or sibling MDX files per locale) |
| Cookie scaffold | `src/components/CookieBanner.tsx` | Hidden, unmounted future component |
| Cookie scaffold | `src/lib/cookie-consent.ts` | Future helper (no-op today) |
| Analytics | `src/app/[locale]/layout.tsx` | Mount `<Analytics />` + `<SpeedInsights />` |
| Sitemap | `src/app/sitemap.ts` | Bilingual sitemap with hreflang |
| Sitemap | `src/app/robots.ts` | Allow all, disallow admin + checkout |
| Metadata | `src/lib/seo.ts` | `buildMetadata({ titleKey, descriptionKey, locale })` helper |
| Metadata | OG fallback static asset `public/og-default.png` | Logo on dark background |
| Metadata | Each `src/app/[locale]/{about,contact,shop,legal/...}/page.tsx` | Wire up `generateMetadata` via the helper |
| Reliability | `src/app/error.tsx` | Branded global error |
| Reliability | `src/app/not-found.tsx` | Branded 404 |
| Reliability | `src/app/[locale]/error.tsx` | Per-locale branded error |
| Reliability | `src/app/[locale]/not-found.tsx` | Per-locale 404 |
| Reliability | `src/lib/db/client.ts` | Add `logger: process.env.NODE_ENV !== 'production'` |
| Reliability | `.planning/codebase/data-access-pattern.md` | N+1 guardrail doc |

**Reusable assets already in place:**

- `next/font` (Space Grotesk + IBM Plex Arabic) via `src/lib/fonts.ts`
- next-intl `getTranslations` for server components
- `src/app/[locale]/layout.tsx` already calls `setRequestLocale` and emits root metadata
- Tailwind v4 with logical-property utility classes
- Drizzle relational query pattern across all data-access files

## Canonical Refs (MUST READ BEFORE PLANNING)

| Path | Why |
|---|---|
| `.planning/PROJECT.md` | Project context, decisions log |
| `.planning/REQUIREMENTS.md` | LGL-01..04, PERF-03..06, SEO-02, SEO-03 — locked acceptance criteria |
| `.planning/ROADMAP.md` | Phase 9 success criteria |
| `CLAUDE.md` | RTL rules, currency formatting, design system, tech stack |
| `.planning/phases/08-cart-checkout-orders/08-CONTEXT.md` | Cart cookie classification + Saudi market context |
| `src/lib/db/client.ts` | Where Drizzle logger gets enabled |
| `src/lib/products.ts` | Existing data-access pattern to preserve |
| `src/lib/cart/server.ts` | Existing data-access pattern to preserve |
| `src/lib/orders/server.ts` | Existing data-access pattern; one acceptable loop documented |
| `src/app/[locale]/layout.tsx` | Existing metadata scaffold to extend |
| `src/app/[locale]/shop/[category]/[slug]/page.tsx` | Existing dynamic `generateMetadata` reference |
| `messages/en.json` + `messages/ar.json` | i18n string conventions |

External docs the researcher may want to consult:
- Vercel Analytics + Speed Insights setup docs
- Next.js 15 App Router `sitemap.ts` + `robots.ts` API
- Next.js 15 App Router `error.tsx` + `not-found.tsx` conventions
- KSA PDPL summary (2023 Saudi Personal Data Protection Law)
- GDPR Art. 5(3) cookie consent exemption rules

## Boundaries (out of scope this phase)

- Vendor-hosted legal copy (Termly / Iubenda) — alternative path if AI draft proves insufficient
- Lawyer-reviewed legal copy — out of automated scope
- Lighthouse CI in build pipeline (warn or block) — defer until first measured regression
- Read-only catalog fallback via Vercel KV / Edge Config — defer until scale demands
- Per-category granular cookie banner — defer until GA4 / Meta Pixel added
- Blur placeholders + forced AVIF — touches Phase 6 admin upload (out of scope)
- Custom ESLint rule for N+1 detection — false-positive risk too high for now
- Persistent middleware query counter — overkill at current scale
- Full GDPR DSAR (Data Subject Access Request) export portal — minimum viable LGL-04 covered by emailing the controller; full self-service portal is a future phase
- Authentication-gated cookie preferences UI — no auth in scope

## Deferred Ideas (captured for future phases)

- **Lighthouse CI gate:** add as a follow-up after first measured Speed Insights regression. Decide warn-vs-block then.
- **Vendor banner / vendor-hosted legal:** if KSA PDPL regulator updates push complexity past what AI templates can keep current with.
- **Catalog read-only fallback:** Vercel KV or Edge Config snapshot if Supabase availability becomes a concern.
- **Granular cookie banner:** if GA4 / Meta Pixel / retargeting added, build per-category preferences UI then.
- **Image upload pipeline upgrade:** blur hashes + forced AVIF in Phase 6 admin upload, paired with `placeholder="blur"` everywhere.
- **DSAR self-service portal:** full GDPR/PDPL data-export-and-delete UI, gated on auth phase.

## Risks / Watch-outs

- **Legal-content liability:** AI-drafted legal text is NOT lawyer-reviewed. Footer must include "This is a template — consult counsel for production use" until reviewed, OR omit until you've reviewed it line-by-line.
- **AR legal register:** Formal Arabic legal language differs from the editorial AR used elsewhere on the site. The translator (whether AI or human) must use the right register.
- **Sitemap freshness vs scale:** `revalidate = 3600` means new products take up to 1h to appear in the sitemap. Acceptable for current scale; revisit if catalog turnover accelerates.
- **Speed Insights data volume:** Real-user data only becomes reliable after ~thousands of page views. For low-traffic launch, supplement with one manual Lighthouse run per release until data accumulates.
- **`app/error.tsx` is a Client Component:** It can't `getTranslations` server-side. Either pass translations down via props from a server boundary, or hard-code minimal bilingual strings.
