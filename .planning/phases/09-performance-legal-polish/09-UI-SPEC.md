---
phase: 9
slug: performance-legal-polish
status: draft
shadcn_initialized: true
preset: base-nova
created: 2026-05-10
---

# Phase 9 — UI Design Contract

> Visual and interaction contract for Phase 9 surfaces: Legal pages (`/[locale]/legal/{privacy,terms,cookies}`), branded error/404 pages (global + per-locale), OG fallback static asset, footer legal-link additions, and a future-proofing `<CookieBanner>` scaffold (built but unmounted).
>
> Reuses tokens, fonts, and patterns established in Phase 1. No net-new design system work — every value below is a confirmation of what already ships, plus disambiguation for the new surfaces.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | shadcn |
| Preset | `base-nova` (per `components.json`) |
| Component library | Radix primitives via shadcn (`button`, `sheet`, `separator`, `navigation-menu`, `dialog` already installed) |
| Icon library | lucide-react |
| Font (EN) | Geist (next/font, `--font-geist`) — applied via `:lang(en)` selector |
| Font (AR) | IBM Plex Sans Arabic 400/600 (next/font, `--font-ibm-plex-arabic`) — applied via `:lang(ar)` selector with optical-size bump to `1.0625rem` (~17px base) |
| Mode | Dark-first, `<html class="dark">` permanently on |
| Direction | `dir="ltr"` (en) or `dir="rtl"` (ar) set atomically with `lang` on `<html>` — see `src/app/[locale]/layout.tsx` |

---

## Spacing Scale

Declared values (4-point grid; reuses Tailwind defaults). Phase 9 surfaces stay inside this scale.

| Token | Value | Usage in Phase 9 |
|-------|-------|------------------|
| xs | 4px | Inline icon-text gaps, list-marker offsets in cookie tables |
| sm | 8px | Compact element gaps (eyebrow → heading inside legal section blocks) |
| md | 16px | Default body paragraph rhythm, footer link list `space-y-4` |
| lg | 24px | Section padding inside legal article body, `space-y-6` between definition list rows |
| xl | 32px | Layout gaps; `py-32` for legal page hero spacing on mobile |
| 2xl | 48px | Major section breaks inside legal MDX (`space-y-12`); error-page vertical rhythm |
| 3xl | 64px | Hero → body separation on legal pages; error-page top padding (`pt-24` + `pb-48` on existing about/contact pattern) |

**Exceptions:**
- Touch-target minimum **44×44px** (already enforced globally on `a, button, [role="button"]` in `globals.css`). Footer legal links inherit this — do not shrink below 44px tap area on mobile.
- AR optical-size bump (1.0625rem on `:lang(ar)`) is a typography rule, not a spacing rule — listed here only because it slightly increases vertical rhythm in Arabic legal copy. Do not compensate with tighter spacing.
- `app/error.tsx` and `app/not-found.tsx` (Client Components, outside `[locale]` segment): use the same scale, but center-stage layout is `min-h-[60vh] flex items-center justify-center` with internal `space-y-8`.

---

## Typography

ORKI's existing type ramp (Phase 1). Phase 9 surfaces re-use, no new tokens.

| Role | Size | Weight | Line Height | Tracking | Usage in Phase 9 |
|------|------|--------|-------------|----------|------------------|
| Display | `clamp(48px, 8vw, 100px)` (`text-6xl md:text-[100px]`) | 700 (bold) | `leading-none` (1.0) | `tracking-tighter` (-0.05em via `h*` rule + `-0.02em` global) | Legal page H1, error page primary message |
| Heading | 32px (`text-2xl md:text-4xl`) | 700 (bold) | 1.2 (`leading-tight`) | `-0.02em` | Legal section headings (H2 inside MDX articles) |
| Subheading | 20px (`text-xl`) | 600 (semibold) | 1.3 | normal | Legal H3 (subsection like "Cookies we set") |
| Body | 16px (`text-base`) | 400 (regular) | 1.6 (`leading-relaxed`) | normal | Legal body paragraphs, error-page body, cookie table cells |
| Body-large | 18px (`text-lg`) | 400 | 1.6 | normal | Legal article lead paragraph (first paragraph after H1) |
| Eyebrow | 10px (`text-[10px]`) | 700 (bold) | 1.0 | `tracking-[0.5em]` uppercase | Legal section numbering (`01 — Privacy`, `02 — Data Use`), reused from About page pattern |
| Caption | 12px (`text-xs`) | 600 (semibold) | 1.4 | normal | Footer legal links, "Last updated YYYY-MM-DD" timestamp on legal pages |
| Microcopy | 14px (`text-sm`) | 500 (medium) | 1.5 | normal | Cookie table column headers, error-page secondary action label |

**Weights declared this phase:** 400 (regular) and 700 (bold) — primary pair. 500/600 used sparingly for caption/microcopy as already established Phase 1.

**AR-specific rules:**
- IBM Plex Sans Arabic ships with weights **400 + 600** only (see `src/lib/fonts.ts`). Where EN uses 700, AR falls back to 600 — this is the existing Phase 1 contract and Phase 9 must respect it. Bold legal headings in AR will render at 600, not 700.
- AR `:lang(ar)` rule bumps base size from 16px to 17px (1.0625rem). All ratio-based sizes scale proportionally; no manual override needed in legal MDX.
- Formal legal Arabic register: avoid colloquial constructions, use `النص الكامل` style. Line-height stays at 1.6 (do NOT increase) — Plex Arabic already has generous diacritical clearance.

**Heading tracking exception:** Global `h1..h6` rule sets `letter-spacing: -0.02em`. Display sizes also apply `tracking-tighter` (-0.05em) in className, which composes. Do not apply both to the same element.

---

## Color

ORKI's locked black-and-white palette. Phase 9 introduces zero new colors.

| Role | Value | Usage in Phase 9 |
|------|-------|------------------|
| Dominant (60%) | `#000000` (`bg-black`, `--color-dominant`) | Page background for all legal pages, all error pages, OG fallback canvas |
| Secondary (30%) | `#111111` (`--color-secondary-surface`) | Cookie-table row stripe, "back to home" button card on error page, `<CookieBanner>` scaffold surface (when one day mounted) |
| Accent (10%) | `#FFFFFF` (`--color-accent-orki`, `text-white`) | Body text on dark, primary CTA fills, focus rings, hovered footer-link state |
| Border | `rgba(255,255,255,0.12)` (`--color-orki-border`, `border-white/10` ≈ same) | Cookie-table cell borders, legal-page hairline section dividers, error-page card border, footer top divider above legal-link group |
| Muted text | `rgba(255,255,255,0.6)` (`text-white/60`) | Legal body paragraphs (slightly recessed against pure-white headings), error-page secondary description |
| Whisper text | `rgba(255,255,255,0.4)` (`text-white/40`) | Eyebrow labels, "Last updated" timestamp, footer (Legal) group label |
| Faint text | `rgba(255,255,255,0.1)` (`text-white/10`) | Decorative ORKI watermark glyphs in legal-page hero (optional, mirroring About page pattern) |
| Destructive | `oklch(0.704 0.191 22.216)` (`--destructive` from theme) | **Not used in Phase 9** — no destructive flows ship this phase. Reserved for cart-item-remove (Phase 8) and admin order-cancel only. |

**Accent reserved for** (explicit list — never "all interactive elements"):
1. Primary CTA on error page: "Return home" / "العودة إلى الصفحة الرئيسية" — solid white-on-black inverted button.
2. Inline links inside legal copy (`<a>` tags) — underline + `text-white` on hover, `text-white/60` at rest.
3. Footer legal-link hover state — already-shipped pattern from Phase 1 Footer.
4. Focus ring on all keyboard-focusable elements — `outline-ring/50` set globally.

Accent is **not** used for: section headings (already pure-white), body text (already pure-white), eyebrow labels (white/40 by design), or background fills outside the explicit CTA case above.

---

## Copywriting Contract

Every Phase 9 surface needs both EN and AR strings. AR for legal pages uses the **formal legal register** (distinct from editorial AR used on home/about). All copy below is the source-of-truth — `messages/en.json` and `messages/ar.json` should match verbatim.

### Legal pages — page chrome (NOT body content; full body MDX is drafted by the executor per CONTEXT)

| Element | EN | AR (formal legal register) |
|---------|----|----------------------------|
| Privacy H1 | `Privacy Policy` | `سياسة الخصوصية` |
| Terms H1 | `Terms & Conditions` | `الشروط والأحكام` |
| Cookies H1 | `Cookie Policy` | `سياسة ملفات تعريف الارتباط` |
| Eyebrow above H1 | `(Legal)` | `(قانوني)` |
| "Last updated" label | `Last updated:` | `آخر تحديث:` |
| Date format | `10 May 2026` (long-form, EN locale) | `١٠ مايو ٢٠٢٦` rendered as `10 May 2026` per CLAUDE.md `'ar-SA-u-nu-latn'` rule (Western numerals) → final AR display: `10 مايو 2026` |
| Template disclaimer (footer of each legal page until lawyer-reviewed) | `This document is a template draft pending legal review. Contact us with questions.` | `هذه الوثيقة مسودة قابلة للمراجعة القانونية. تواصل معنا لأي استفسار.` |

### Error pages — `app/error.tsx` (global, Client Component) + `app/[locale]/error.tsx` (per-locale)

| Element | EN | AR |
|---------|----|----|
| Display heading | `Something broke.` | `حدث خطأ ما.` |
| Body | `We're working on it. Try again, or head back home.` | `نحن نعمل على إصلاحه. حاول مرة أخرى أو عُد إلى الصفحة الرئيسية.` |
| Primary CTA | `Try again` | `إعادة المحاولة` |
| Secondary CTA | `Return home` | `العودة إلى الرئيسية` |
| Optional digest line (dev only, hidden in prod) | `Error ID: {digest}` | `معرّف الخطأ: {digest}` |

### 404 pages — `app/not-found.tsx` (global) + `app/[locale]/not-found.tsx` (per-locale)

| Element | EN | AR |
|---------|----|----|
| Display heading | `404 — Lost in the noise.` | `٤٠٤ — ضاع في الضجيج.` (numerals stay Latin per project rule → render as `404 — ضاع في الضجيج.`) |
| Body | `This page doesn't exist or was moved. Try the shop instead.` | `هذه الصفحة غير موجودة أو تم نقلها. جرّب المتجر بدلاً من ذلك.` |
| Primary CTA | `Browse shop` | `تصفح المتجر` |
| Secondary CTA | `Return home` | `العودة إلى الرئيسية` |

### Section-degradation copy (per-route try/catch fallbacks per CONTEXT §5)

| Surface | EN | AR |
|---------|----|----|
| `/shop` catalog blip | `We're having trouble loading the catalog right now. Try again in a moment.` | `نواجه مشكلة في تحميل المتجر الآن. حاول مرة أخرى بعد قليل.` |
| `/checkout/confirmation` order-fetch blip | `We can't pull up your order right now — your payment is confirmed. Email us if you need help.` | `لا يمكننا عرض طلبك الآن — تم تأكيد الدفع. تواصل معنا إذا احتجت مساعدة.` |
| `/admin/orders` blip | `Order list temporarily unavailable.` | (admin pages stay EN-only — existing Phase 6 contract) |

### Footer legal-link additions (extends existing Phase 1 Footer)

The Phase 1 Footer already renders a `(Legal)` group with links to `/privacy` and `/terms`. Phase 9 must:

1. **Update existing links** to the new legal route shape: `/legal/privacy`, `/legal/terms`.
2. **Add a third link**: `Cookie Policy` → `/legal/cookies`.
3. **Localize labels** via the `Footer` namespace in `messages/{en,ar}.json`.

| Footer link | EN | AR (formal legal) |
|-------------|----|-------------------|
| Privacy link | `Privacy Policy` | `سياسة الخصوصية` |
| Terms link | `Terms & Conditions` | `الشروط والأحكام` |
| Cookies link (NEW) | `Cookie Policy` | `سياسة ملفات تعريف الارتباط` |
| Group eyebrow | `(Legal)` | `(قانوني)` |

### CookieBanner scaffold (built, NOT mounted this phase)

Visual contract for the future-flip moment. The component must compile and pass the type-checker, but `app/[locale]/layout.tsx` does NOT render it. Copy is locked here so the future flip is a one-line render change, not a copywriting exercise.

| Element | EN | AR |
|---------|----|----|
| Banner body | `We use strictly-necessary cookies to run the cart and checkout. No analytics or marketing cookies are set.` | `نستخدم ملفات تعريف ارتباط ضرورية فقط لتشغيل السلة والدفع. لا نستخدم ملفات تتبع تحليلية أو تسويقية.` |
| Primary CTA | `Got it` | `تم` |
| Secondary link | `Read our Cookie Policy` (links to `/[locale]/legal/cookies`) | `اقرأ سياسة الكوكيز` |

### Empty states (do not apply this phase)

Phase 9 has no empty-state surfaces — legal pages are always populated, error pages are not "empty," and the cookie scaffold is unmounted. Empty-state contract is **N/A this phase**.

### Destructive confirmations (do not apply this phase)

Phase 9 ships zero destructive actions. **N/A this phase.** The `<CookieBanner>` "decline" path is intentionally NOT in the scaffold (no analytics cookies exist to decline). When (and if) marketing cookies arrive, the future banner phase defines that contract.

---

## Component Inventory

Phase 9 surfaces and the components/primitives they pull from. **No new shadcn registry installs required** — every primitive needed is already installed.

| Surface | New file | Reuses | New component? |
|---------|----------|--------|----------------|
| Legal layout | `src/app/[locale]/legal/layout.tsx` | Existing root locale layout (Navbar + Footer wrap automatically) | No — just layout segment |
| Legal — Privacy | `src/app/[locale]/legal/privacy/page.tsx` | `LegalArticle` wrapper (new), MDX/i18n copy | New: `LegalArticle` shared chrome |
| Legal — Terms | `src/app/[locale]/legal/terms/page.tsx` | `LegalArticle` | — |
| Legal — Cookies | `src/app/[locale]/legal/cookies/page.tsx` | `LegalArticle`, `CookieTable` (new) | New: `CookieTable` (renders strictly-necessary cookies list) |
| Global error | `src/app/error.tsx` | shadcn `button` (Client Component — see Open Issues) | New: `BrandedErrorPage` shared component |
| Global 404 | `src/app/not-found.tsx` | shadcn `button` | Reuses `BrandedErrorPage` with 404 variant prop |
| Per-locale error | `src/app/[locale]/error.tsx` | `BrandedErrorPage` + `useTranslations` (next-intl client) | — |
| Per-locale 404 | `src/app/[locale]/not-found.tsx` | `BrandedErrorPage` + `getTranslations` (server) | — |
| Cookie scaffold | `src/components/CookieBanner.tsx` | shadcn `button`, `separator` | New (built, not mounted) |
| Cookie helper | `src/lib/cookie-consent.ts` | (no UI) | New utility |
| Footer legal links | `src/components/footer/Footer.tsx` (edit) | Existing footer | No new component |
| OG fallback | `public/og-default.png` | (static asset, 1200×630, logo on dark) | New asset |

**New components introduced:** `LegalArticle`, `CookieTable`, `BrandedErrorPage`, `CookieBanner`. All compose from already-installed shadcn primitives + native HTML — no third-party registries.

---

## Layout Patterns

Reuses Phase 1 patterns. Documenting only what's new or non-obvious for Phase 9.

### Legal page layout (`LegalArticle` wrapper)

```
<div class="min-h-screen bg-black pt-24 pb-48">
  <div class="max-w-[768px] mx-auto px-6">       ← narrower than About (1280) — legal copy reads better at ~70ch
    <header class="mb-24 space-y-6">
      <span class="eyebrow">(Legal) — 01</span>
      <h1 class="display">Privacy Policy</h1>
      <p class="text-xs text-white/40">Last updated: 10 May 2026</p>
    </header>
    <article class="prose-orki space-y-12">     ← MDX body, custom prose styling
      ...
    </article>
    <footer class="mt-32 pt-12 border-t border-white/10 text-xs text-white/40">
      Template disclaimer copy
    </footer>
  </div>
</div>
```

**Why max-w-[768px]:** Legal copy is dense paragraph text. About/Contact use 1280 because they have multi-column editorial grids; legal is single-column reading. ~768px = ~70 characters per line at 16px body, the legibility sweet spot.

### Error page layout (`BrandedErrorPage`)

```
<div class="min-h-[80vh] bg-black flex items-center justify-center px-6">
  <div class="max-w-md text-center space-y-8">
    <h1 class="display">Something broke.</h1>      ← display-size, single line
    <p class="text-lg text-white/60">{body}</p>
    <div class="flex gap-4 justify-center pt-4">
      <button class="primary-cta">Try again</button>
      <Link class="secondary-link">Return home</Link>
    </div>
  </div>
</div>
```

**Why centered, not full editorial:** Error pages are a dead-end — user needs a clear exit, not a brand moment. Display heading delivers the brand voice; everything else is functional.

### Footer addition (existing component edit)

The (Legal) group already exists in `Footer.tsx`. Phase 9 adds one `<li>` for the Cookie Policy link and updates the two existing links' `href` from `/privacy` → `/legal/privacy` and `/terms` → `/legal/terms`. Visual rhythm and `space-y-4` spacing carry over unchanged.

### CookieTable (cookies page only)

```
<table class="w-full text-sm border border-white/10">
  <thead class="bg-[#111111] text-white/40 text-xs uppercase tracking-widest">
    <tr><th>Name</th><th>Purpose</th><th>Duration</th><th>Type</th></tr>
  </thead>
  <tbody>
    <tr class="border-t border-white/10"><td>orki_sid</td><td>Cart persistence</td><td>30 days</td><td>Strictly necessary</td></tr>
    <tr class="border-t border-white/10"><td>sb-*</td><td>Admin authentication</td><td>Session</td><td>Strictly necessary</td></tr>
  </tbody>
</table>
```

**RTL note:** Table direction flips automatically via `dir="rtl"` on `<html>`. Column order remains semantically correct (name → purpose → duration → type). Use logical padding (`ps-4 pe-4`) on cells, never `pl-/pr-`.

### OG fallback asset spec

| Property | Value |
|----------|-------|
| Path | `public/og-default.png` |
| Dimensions | 1200 × 630 px (Open Graph standard 1.91:1) |
| Background | `#000000` (matches `--color-dominant`) |
| Foreground | ORKI wordmark, centered, white (`#FFFFFF`), ~280px tall (≈45% of canvas height) |
| Typography | Same Geist 700 used in Footer wordmark, `tracking-[-0.05em]` |
| Padding | 80px safe area on all sides |
| Format | PNG (Twitter previews PNG more reliably than WebP for OG) |
| File size target | ≤ 80KB (compress with TinyPNG / squoosh) |

Single static asset. NO dynamic per-page OG generation for non-product pages this phase.

---

## Animation & Motion

Phase 9 introduces zero new motion patterns. Reuses Phase 1 globals:

- `PageTransition` already wraps the locale layout — legal/error pages inherit fade-through.
- Global `prefers-reduced-motion` respect (already enforced via `useReducedMotion` from Phase 4).
- Legal pages get **no scroll-reveal animations** — they're documents, not editorial. ScrollReveal component is NOT applied.
- Error pages get NO motion. Static, immediate render.
- CookieBanner scaffold (when one day mounted) should slide up from `bottom-inline-end` with `transition: transform 200ms ease-out`. RTL flips the inline-end automatically. **Not animated this phase since not mounted.**

---

## Accessibility (WCAG 2.1 AA — extends Phase 1 contract)

| Surface | Requirement |
|---------|-------------|
| Legal pages | Single `<h1>` per page; `<h2>`/`<h3>` hierarchy without skips. Article body wrapped in `<article>` element with `aria-labelledby` pointing at H1 id. |
| Cookie table | Native `<table>` with `<thead>`/`<tbody>` (already in pattern above). No ARIA grid roles needed. |
| Error pages | Use `role="alert"` only on the per-locale `error.tsx` (so screen readers announce the failure). Global `not-found.tsx` does NOT use alert role (404 is not an exception event). |
| Footer legal links | Inherit existing 44px tap-target enforcement from `globals.css`. |
| Focus state | All CTAs use the global `outline-ring/50` ring — do not override with `outline-none` without a replacement. |
| Locale switch on legal pages | Language switcher must preserve the legal route segment (e.g. `/en/legal/privacy` ↔ `/ar/legal/privacy`). Already handled by next-intl + existing `LanguageSwitcher` — verify on each new route. |
| Color contrast | All declared text/background pairs already meet AA: white on black = 21:1; white/60 on black = 12.6:1; white/40 on black = 8.4:1 (AA passes for non-body text only — keep white/40 for eyebrows and timestamps, never for paragraph copy). |

---

## Open Issues (must be resolved in `/gsd-plan-phase 9`)

These are not contract gaps — every visual decision is locked. These are **implementation handoff notes** the planner needs to address.

1. **`app/error.tsx` is a Client Component.** It cannot call `getTranslations()` server-side. Two options for the planner to choose:
   - **(a) Hard-coded bilingual strings.** Component reads `document.documentElement.lang` on mount and toggles between two literal string objects. Pro: zero indirection. Con: copy lives outside `messages/*.json` for the global error file only.
   - **(b) Translations passed as props from a server boundary.** Wrap `app/error.tsx`'s render in a server-rendered context provider. Pro: single source of truth. Con: more moving parts at the topmost error boundary.
   - **Recommendation:** Option (a) for `app/error.tsx` (only 4 strings, lives outside `[locale]` segment so locale awareness is fragile anyway), Option (b) for `app/[locale]/error.tsx` and `app/[locale]/not-found.tsx` (already inside the locale segment, full next-intl access).

2. **Legal copy authorship.** UI-SPEC defines page chrome only. The 3 legal documents' body copy (Privacy / Terms / Cookies) is drafted by the executor per CONTEXT decision §1 (AI-drafted EN+AR MDX, KSA PDPL + GDPR aligned, user reviews before merge, marked revisable). UI-SPEC does NOT prescribe section structure of the legal text itself — that's a content decision delegated to the executor working from PDPL/GDPR templates.

3. **Footer link href migration.** Phase 1 Footer hard-codes `/privacy` and `/terms`. The planner must include a step to update those to `/legal/privacy` and `/legal/terms`, plus add the Cookie link. Existing Footer is a Server Component using next-intl `<Link>` from `@/i18n/navigation` — locale prefix is automatic.

4. **OG fallback asset.** UI-SPEC declares the spec; the asset itself must be produced (Figma export or programmatic via `@vercel/og` build-time once-only render). Either path is acceptable; output must match the spec table.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | (already installed: `button`, `sheet`, `separator`, `navigation-menu`, `dialog`) — Phase 9 installs nothing new | not required |
| Third-party registries | none | not applicable |

**No third-party registry use this phase.** All four new components (`LegalArticle`, `CookieTable`, `BrandedErrorPage`, `CookieBanner`) are hand-rolled compositions over already-installed shadcn primitives and native HTML. Registry vetting gate: not invoked.

---

## Pre-Population Sources

For traceability — every value in this contract was derived from an upstream artifact, not asked of the user.

| Section | Sourced from |
|---------|-------------|
| Design System table | `components.json`, `src/app/globals.css`, `src/lib/fonts.ts` |
| Spacing scale | Tailwind defaults (4-point grid) + existing About/Contact page patterns |
| Typography ramp | `src/app/[locale]/about/page.tsx`, `src/components/footer/Footer.tsx` (existing live patterns) |
| Color tokens | `src/app/globals.css` `@theme inline` block (`--color-dominant`, `--color-secondary-surface`, etc.) |
| Copywriting tone | `09-CONTEXT.md` §1 (formal legal AR register), CLAUDE.md (dark/minimal/editorial), Footer.tsx (existing voice) |
| Footer link contract | `src/components/footer/Footer.tsx` (existing structure) + 09-CONTEXT.md §1 (new route shape) |
| Error/404 copy | Drafted to match Phase 1 brand voice; locked by this UI-SPEC for executor consistency |
| OG fallback spec | 09-CONTEXT.md §4 (single static asset, 1200×630, logo on dark) |
| CookieBanner scaffold spec | 09-CONTEXT.md §2 (future-proofing only, not mounted) |
| RTL/i18n rules | CLAUDE.md (logical CSS only), 09-CONTEXT.md (atomic lang+dir) |

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
