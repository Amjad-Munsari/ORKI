---
phase: 09-performance-legal-polish
reviewed: 2026-05-10T00:00:00Z
depth: standard
files_reviewed: 30
files_reviewed_list:
  - messages/ar.json
  - messages/en.json
  - scripts/generate-og-default.ts
  - src/app/[locale]/about/page.tsx
  - src/app/[locale]/admin/orders/page.tsx
  - src/app/[locale]/checkout/confirmation/page.tsx
  - src/app/[locale]/contact/ContactClient.tsx
  - src/app/[locale]/contact/page.tsx
  - src/app/[locale]/error.tsx
  - src/app/[locale]/layout.tsx
  - src/app/[locale]/legal/cookies/page.tsx
  - src/app/[locale]/legal/layout.tsx
  - src/app/[locale]/legal/privacy/page.tsx
  - src/app/[locale]/legal/terms/page.tsx
  - src/app/[locale]/not-found.tsx
  - src/app/[locale]/shop/[category]/[slug]/page.tsx
  - src/app/[locale]/shop/[category]/page.tsx
  - src/app/[locale]/shop/page.tsx
  - src/app/global-error.tsx
  - src/app/robots.ts
  - src/app/sitemap.ts
  - src/components/CookieBanner.tsx
  - src/components/error/BrandedErrorPage.tsx
  - src/components/footer/Footer.tsx
  - src/components/legal/CookieTable.tsx
  - src/components/legal/LegalArticle.tsx
  - src/lib/cookie-consent.ts
  - src/lib/db/client.ts
  - src/lib/seo.ts
findings:
  critical: 3
  warning: 6
  info: 5
  total: 14
status: issues_found
---

# Phase 9: Code Review Report

**Reviewed:** 2026-05-10
**Depth:** standard
**Files Reviewed:** 30
**Status:** issues_found

## Summary

Phase 9 delivers SEO scaffolding, legal pages (EN+AR), Vercel Analytics/Speed Insights, sitemap+robots+OG image, branded error pages, and an unmounted CookieBanner scaffold. Overall the implementation is solid, but three correctness defects ship that will be visible to users and search crawlers:

1. The PDP OG/Twitter image fallback points to a path that does not exist (`/images/og-default.png`) — the asset is actually at `/og-default.png`. Any product without images will produce a broken OG card.
2. The (currently unmounted) CookieBanner uses an invalid Tailwind class `inline-end-0` that produces no horizontal positioning, so when the banner is eventually mounted it will dock at the left edge in BOTH locales — silently violating the RTL contract from CLAUDE.md.
3. The Arabic translation for `Errors.section.adminOrdersFailed` is left in English, so AR admins see English fallback copy.

The remaining warnings are i18n gaps (Footer benefit bar / About page / Contact form are hardcoded strings rather than next-intl keys), missing `metadataBase` for OG image absolute-URL resolution on the PDP, an XSS surface on the PDP JSON-LD that is partial (`<` is escaped, `>` and `&` are not), and a cosmetic but high-likelihood failure in `BrandedErrorPage.errorDigest` (rendered only in dev — defeats the entire purpose of `digest`, which exists to give support a key in production).

## Critical Issues

### CR-01: PDP OG/Twitter image fallback points to a non-existent path

**File:** `src/app/[locale]/shop/[category]/[slug]/page.tsx:25`
**Issue:** The fallback path `/images/og-default.png` does not exist in the repo. The actual OG asset committed by Plan 09-04 lives at `public/og-default.png` and is served as `/og-default.png` (this is the path used in `src/lib/seo.ts:7` `DEFAULT_OG_IMAGE`). Any product whose `images` array is empty will render OG/Twitter cards that reference a 404 image. Verified with `Glob`: `public/images/` contains `products/`, `categories/` but no `og-default.png`. The Phase 9 PATTERNS doc even calls this out (`09-PATTERNS.md:111` — "Phase 9 migrates to `/og-default.png`"), but the migration was missed.

**Fix:**
```ts
// Before
const image = product.images[0] || '/images/og-default.png'

// After — match the path lib/seo.ts uses
const image = product.images[0] || '/og-default.png'
```

Bonus: also use the absolute-URL form (`https://orki.sa/og-default.png`) or set `metadataBase` for this route so social-card validators that reject relative URLs continue to work. The root layout sets `metadataBase: new URL('https://orki.sa')`, so relative resolves correctly — but only for child routes that inherit metadata. `generateMetadata` returns its own object here, so the resolver still walks back up — verify in production by hitting the Twitter card validator.

### CR-02: CookieBanner uses `inline-end-0`, which is not a valid Tailwind class — banner will dock at left edge in BOTH LTR and RTL when mounted

**File:** `src/components/CookieBanner.tsx:36`
**Issue:** `<div className="fixed bottom-0 inline-end-0 ...">`. The class `inline-end-0` is not a Tailwind v4 utility. The canonical Tailwind v4 logical positioning utility is `end-0` (sets `inset-inline-end`); the long form is `inset-inline-end-0`. The codebase already uses the correct long form elsewhere (`src/components/shop/StockStateBadge.tsx:26` — `inset-inline-start-0 inset-inline-end-0`), confirming convention. As written, the banner has no horizontal anchor and will pin to the left edge of the viewport in both LTR and RTL — directly violating CLAUDE.md's RTL non-negotiable. The component is currently unmounted (Phase 9 scaffold), so the bug is latent, but the Phase 9 SUMMARY claims the symmetric `p-6 m-6` is the only thing the banner relies on — it isn't, this directional positioning is broken.

**Fix:**
```tsx
// Before
className="fixed bottom-0 inline-end-0 z-50 max-w-md p-6 m-6 ..."

// After — use the same form as StockStateBadge
className="fixed bottom-0 inset-inline-end-0 z-50 max-w-md p-6 m-6 ..."
// (or the short form `end-0` if Tailwind config exposes it)
```

### CR-03: AR translation for `Errors.section.adminOrdersFailed` is English

**File:** `messages/ar.json:403`
**Issue:** `"adminOrdersFailed": "Order list temporarily unavailable."` — this is the English string left untranslated in the Arabic messages file. The `/[locale]/admin/orders` page calls `getTranslations('Errors.section')` and renders `tErr('adminOrdersFailed')` directly in the UI (`src/app/[locale]/admin/orders/page.tsx:29`), so an Arabic admin hitting a Supabase blip sees an English error message inside an RTL layout. The other two keys in this group (`shopLoadFailed`, `orderLoadFailed`) are correctly translated.

**Fix:**
```json
// messages/ar.json — replace line 403
"adminOrdersFailed": "قائمة الطلبات غير متاحة مؤقتاً."
```

## Warnings

### WR-01: `BrandedErrorPage` only renders `errorDigest` in development — defeats its purpose

**File:** `src/components/error/BrandedErrorPage.tsx:78`
**Issue:** The condition `errorDigest && process.env.NODE_ENV === 'development'` means the digest (Next.js's hashed error identifier specifically designed to be safe to show users so they can give it to support) is hidden in production and shown in development. This is backwards. Developers running `next dev` already have the full stack trace in their console; they don't need the digest. Production users hitting `error.tsx` get a generic "Something broke" page with no reference number to give support — defeating the entire reason `digest` exists. The comment claims this mitigates "T-09-05-01 (information disclosure via internal IDs)", but `digest` is by design a non-reversible hash that does NOT disclose internal information. This was a misread of the pitfall.

**Fix:**
```tsx
// Before
{errorDigest && process.env.NODE_ENV === 'development' && (
  <p className="text-xs text-white/40">Error ID: {errorDigest}</p>
)}

// After — show in production where users actually need a reference
{errorDigest && (
  <p className="text-xs text-white/40">Error ID: {errorDigest}</p>
)}
```

### WR-02: PDP JSON-LD escapes `<` but not `>` or `&` — incomplete XSS hardening

**File:** `src/app/[locale]/shop/[category]/[slug]/page.tsx:111,117`
**Issue:** `JSON.stringify(productJsonLd).replace(/</g, '\\u003c')` only neutralizes `<`. The recommended hardening for `<script>` JSON injection is to also escape `>`, `&`, and the U+2028/U+2029 line separators that can break out of a JS string in older parsers. The product `name`/`description` are author-controlled today (static `/data/products.ts`) so the practical exposure is low, but the data-layer contract in CLAUDE.md states "When backend arrives, only `/lib/products.ts` changes" — meaning these fields will eventually become user-influenced via CMS/admin and the partial escape will silently underprotect.

**Fix:**
```tsx
function safeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
// then: __html: safeJsonLd(productJsonLd)
```

### WR-03: `global-error.tsx` reads `document.documentElement.lang` synchronously during render — can return `''` on first paint and yield wrong copy

**File:** `src/app/global-error.tsx:46-50`
**Issue:** `const detected = typeof document !== 'undefined' ? document.documentElement.lang : 'en'` runs during render. When `global-error.tsx` activates, the locale layout has been replaced — there is no guarantee the `<html lang>` attribute reflects the user's actual locale at the moment the component renders. If `document.documentElement.lang` is `''` or `'en'` because React mounted a fresh `<html>` skeleton before the segment replaced it, an Arabic user sees the English copy on the global crash page. There is no recovery path because the global-error owns its own `<html>` and ignores the previous `dir`/`lang`. A more robust source is the URL pathname (`window.location.pathname.startsWith('/ar')`).

**Fix:**
```tsx
const detected: SupportedLang =
  typeof window !== 'undefined' && window.location.pathname.startsWith('/ar')
    ? 'ar'
    : 'en';
```

### WR-04: Footer benefit bar, About page, Contact form are hardcoded EN/AR strings — bypass next-intl

**Files:**
- `src/components/footer/Footer.tsx:19,23,27,31,55-58,76-77` (benefit bar + nav links)
- `src/app/[locale]/about/page.tsx:30-86` (entire page is `isRtl ? 'AR' : 'EN'` ternaries)
- `src/app/[locale]/contact/ContactClient.tsx:30-95` (form labels, button copy, success state)

**Issue:** These three files use string ternaries on `isRtl`/`locale` rather than next-intl keys. The Footer file even has a `TODO(i18n)` comment acknowledging the gap (`Footer.tsx:11-14`). This makes the strings: (a) unreviewable by translators, (b) duplicated across files (the AR error copy in `global-error.tsx` is itself a duplicate of `messages/ar.json` `Errors.heading`/`body` because global-error cannot use next-intl — that one is intentional, but Footer/About/Contact are not), and (c) silently shipping AR-only Footer text that says "Free shipping from $149" — wrong currency for KSA, and never gets translated. The `Meta.about.title` and `Meta.contact.title` keys exist in the messages files but aren't used in the page bodies — only in `generateMetadata`.

**Fix:** File a follow-up to migrate these to `getTranslations` / `useTranslations`. As an immediate fix, at minimum: change the Footer benefit-bar currency from `$149` to a SAR figure (or read it from a translation key) — the existing copy is wrong for the launch market. The Phase 7 cart spec uses 300 SAR for free shipping; Footer says $149. Inconsistency is a launch bug regardless of i18n.

### WR-05: Confirmation page `lookupFailed` flag is redundant

**File:** `src/app/[locale]/checkout/confirmation/page.tsx:28-49`
**Issue:** The page sets both `order` and `lookupFailed`. After the try/catch, it checks `if (lookupFailed)` then `if (!order) notFound()`. Because `getOrderByReference` either returns an `Order` or `null` (and only throws on infra error), the two branches are exhaustive — but the boolean flag adds dead state. More importantly, if `getOrderByReference` ever starts throwing a specific "not found" error in the future, the catch will set `lookupFailed = true` and the user will see "we can't pull up your order" instead of a 404 — a regression vector.

**Fix:** Catch only the infra errors you actually want to soft-fail on, e.g.:
```ts
try {
  order = await getOrderByReference(ref);
} catch (err) {
  console.error('[checkout/confirmation] getOrderByReference failed', err);
  // render reassurance, don't 404
  const tErr = await getTranslations('Errors.section');
  return <FallbackUI msg={tErr('orderLoadFailed')} />;
}
if (!order) notFound();
```
This eliminates the dead `lookupFailed` flag and tightens behavior.

### WR-06: `seo.ts` hand-splits dotted keys instead of taking a flat key

**File:** `src/lib/seo.ts:32-50`
**Issue:** The helper accepts `titleKey: 'Meta.about.title'` and splits on `.` to derive `(namespace, subKey)`. This works, but: (a) it casts to `as never` four times to silence next-intl's strict types — this is a code smell that hides typos at compile time, (b) it makes two `getTranslations` calls even when title and description share a namespace (true for every caller in this phase), (c) `getTranslations({ locale, namespace: undefined })` plus `t('Meta.about.title')` would achieve the same thing with one call and full type safety. Nothing breaks in practice, but the helper undermines the type-safety-first reason for using next-intl's typed getTranslations.

**Fix:** Refactor to a single getTranslations call:
```ts
const t = await getTranslations({ locale });
const title = t(titleKey as never);
const description = t(descriptionKey as never);
```

## Info

### IN-01: `messages/ar.json` legal sections all carry `[AR-LEGAL-REVIEW]` prefix in body text

**File:** `messages/ar.json:205-369`
**Issue:** Every Arabic legal-policy `body` literally starts with the string `[AR-LEGAL-REVIEW]`. If the intent was a code marker, it leaked into rendered copy — Arabic users will see the bracket text at the top of every privacy/terms/cookies section. If this is intentional placeholder text, ship a plan to strip it before release. The English file has no parallel `[EN-LEGAL-REVIEW]` markers, suggesting these were author notes that were not removed.

**Fix:** Strip `[AR-LEGAL-REVIEW] ` from all 30 occurrences before deploying to production. Add a CI guard: `grep -E '\[AR-LEGAL-REVIEW\]|\[USER-CONFIRM' messages/ar.json && exit 1`.

### IN-02: `messages/en.json` and `ar.json` carry `[USER-CONFIRM ...]` placeholders inside live legal copy

**File:** `messages/en.json:205,221,237,265,279,335` and parallel AR lines
**Issue:** Privacy and Terms sections have `[USER-CONFIRM commercial registration]`, `[USER-CONFIRM postal address, Riyadh, KSA]`, `[USER-CONFIRM] 5 years (KSA tax retention)`, etc. These are placeholders for legal review and should not render to end users. Either the templateDisclaimer footer makes this acceptable (Plan 09-01 implies it does), or these need real values before launch.

**Fix:** Either (a) add a CI grep that fails on `[USER-CONFIRM` in messages, or (b) confirm with legal that the templateDisclaimer footer is sufficient for v1 and document the policy.

### IN-03: `not-found.tsx` and `error.tsx` both pass `ctaHref="/"` despite the heading suggesting "Browse shop"

**File:** `src/app/[locale]/not-found.tsx:15-26`
**Issue:** Not actually a bug — `ctaHref="/shop"` is correct, the secondary `secondaryHref="/"` is correct. False positive. (Keeping this entry to document the trace.)

### IN-04: `LegalArticle` `lastUpdated` date is hardcoded as a literal string in three places

**Files:** `src/app/[locale]/legal/{cookies,privacy,terms}/page.tsx` all set `lastUpdated="10 May 2026"`
**Issue:** Three duplicated literals. When one is updated the other two will silently drift. Also the date string is English in both EN and AR locales — Arabic users see "10 May 2026" not "١٠ مايو ٢٠٢٦" (or its Latin-numerals equivalent).

**Fix:** Centralize as a constant per page or in a config, and use `Intl.DateTimeFormat` to format per locale. Per CLAUDE.md the project uses `'ar-SA-u-nu-latn'` to keep Western numerals, so `new Intl.DateTimeFormat('ar-SA-u-nu-latn', { dateStyle: 'long' }).format(new Date(2026, 4, 10))` would render "10 مايو 2026".

### IN-05: `LegalLayout` is a no-op pass-through — could be deleted

**File:** `src/app/[locale]/legal/layout.tsx`
**Issue:** The whole component does `return <>{children}</>;`. Next.js doesn't require a layout file for a segment; the file adds an unnecessary boundary. The comment explains "LegalArticle owns the chrome" — fine, but then the layout file shouldn't exist at all.

**Fix:** Delete `src/app/[locale]/legal/layout.tsx`. No behavior change.

---

_Reviewed: 2026-05-10_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
