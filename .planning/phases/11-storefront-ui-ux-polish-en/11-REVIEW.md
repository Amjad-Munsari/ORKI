---
phase: 11-storefront-ui-ux-polish-en
reviewed: 2026-05-17T00:00:00Z
depth: deep
files_reviewed: 23
files_reviewed_list:
  - messages/ar.json
  - messages/en.json
  - src/app/[locale]/about/page.tsx
  - src/app/[locale]/contact/ContactClient.tsx
  - src/app/[locale]/page.tsx
  - src/app/[locale]/shop/[category]/[slug]/page.tsx
  - src/app/[locale]/shop/page.tsx
  - src/components/PlaceholderImage.tsx
  - src/components/nav/LanguageSwitcher.tsx
  - src/components/nav/MobileNavDrawer.tsx
  - src/components/nav/Navbar.tsx
  - src/components/nav/ShopDropdown.tsx
  - src/components/pdp/PDPGallery.tsx
  - src/components/pdp/PDPGallerySkeleton.tsx
  - src/components/pdp/PDPInfoPanel.tsx
  - src/components/pdp/PDPLayout.tsx
  - src/components/shop/ProductCard.tsx
  - src/components/shop/ProductGrid.tsx
  - src/components/shop/ShopGridSkeleton.tsx
  - src/components/shop/ShopHeader.tsx
  - src/components/shop/StockStateBadge.tsx
  - src/components/ui/select.tsx
  - src/lib/placeholder-variant.ts
findings:
  critical: 2
  warning: 5
  info: 2
  total: 9
status: issues_found
---

# Phase 11: Code Review Report

**Reviewed:** 2026-05-17
**Depth:** deep
**Files Reviewed:** 23
**Status:** issues_found

## Summary

Phase 11 introduced 15 plans across Waves 0–4: dark Navbar, varied placeholder imagery, category splat, PDP gallery rewrite, WhatsApp contact card, about rhythm, shop Suspense+skeleton, shadcn Select sort, 404 voice, empty-state i18n, and brand-ethos i18n migration. The architecture decisions are sound and the majority of the code is clean. Two blockers found: a live broken link (`wa.me/TBD`) and duplicate SVG filter IDs that produce invalid HTML. Five warnings cover RTL violations in the new `select.tsx`, a Suspense wrapper with no effect, hardcoded EN-only AT strings in skeletons, and a concentration of inline EN/AR ternaries in new Phase 11 code.

---

## Critical Issues

### CR-01: WhatsApp CTA produces a broken link — `wa.me/TBD` ships to production

**File:** `src/app/[locale]/contact/ContactClient.tsx:12-16`
**Issue:** `WA_NUMBER = 'TBD'` is a sentinel placeholder. Both `<a href="https://wa.me/TBD">` elements on the contact page resolve to a 404 on WhatsApp's redirect service. This is the *only* contact path presented to users (the form was intentionally removed in plan 11-10). The page renders no error; users who tap either CTA silently land on a broken URL.
**Fix:** Replace the sentinel with the real number before shipping. If the number is genuinely not yet known, disable the CTA and render a visible "coming soon" state rather than a broken link:
```tsx
// Correct constant (no +, spaces, or dashes):
const WA_NUMBER = '966555123456'
// Or, if still TBD, gate the link:
const waHref = WA_NUMBER !== 'TBD' ? `https://wa.me/${WA_NUMBER}` : null
// Then render <span> instead of <a> when waHref is null.
```

---

### CR-02: Duplicate SVG filter ID `orki-grain` causes invalid HTML on any product grid page

**File:** `src/components/PlaceholderImage.tsx:111`
**Issue:** `GrainTexture` renders `<filter id="orki-grain">` inside an inline SVG. When multiple `GrainTexture` variant cards appear on the same page (the shop grid renders up to 8 cards; the home page renders 4), the DOM contains multiple elements with identical `id="orki-grain"`. Duplicate IDs are invalid HTML per the spec; some browsers and crawlers will flag this. More concretely, if the browser's ID lookup resolves to a different filter element than the one in the same SVG subtree, the grain effect silently disappears on all but the first card.
**Fix:** Make the filter ID unique per instance using `React.useId()` (React 18+, available in Next.js 15):
```tsx
function GrainTexture() {
  const id = React.useId()
  const filterId = `orki-grain-${id}`
  return (
    <>
      <div className="absolute inset-0 bg-[var(--color-placeholder-bg)]" aria-hidden="true" />
      <svg className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none" aria-hidden="true">
        <filter id={filterId}>
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="2" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#${filterId})`} />
      </svg>
    </>
  )
}
```
`PlaceholderImage` is already a client-capable component (no `'use client'`, but consumed both server- and client-side). `useId` works in server components via React's streaming ID generation, so no `'use client'` directive is required.

---

## Warnings

### WR-01: `select.tsx` ships three physical-direction utility classes violating CLAUDE.md RTL contract

**File:** `src/components/ui/select.tsx:25, 44, 120, 130`
**Issue:** `select.tsx` is a new Phase 11 file. It contains:
- `SelectValue` line 25: `"flex flex-1 text-left"` — `text-left` is a directional class; in AR RTL the value text will be left-aligned instead of start-aligned.
- `SelectTrigger` line 44: `pr-2 pl-2.5` — physical padding on the trigger; the trigger interior will be mirrored incorrectly in RTL.
- `SelectItem` line 120: `pr-8 pl-1.5` — physical item padding. The check-indicator space is reserved on the physical right, not the inline-end, so it overlaps text in RTL.
- `SelectItem` indicator line 130: `absolute right-2` — indicator positioned to physical right; it will be under the text in RTL.

CLAUDE.md mandates: *"Never write: `ml-`, `mr-`, `pl-`, `pr-`, `left-`, `right-` as directional styles."*

**Fix:**
```tsx
// SelectValue: text-left → text-start
className={cn("flex flex-1 text-start", className)}

// SelectTrigger: pr-2 pl-2.5 → pe-2 ps-2.5
"... py-2 pe-2 ps-2.5 ..."

// SelectItem: pr-8 pl-1.5 → pe-8 ps-1.5
"relative flex w-full cursor-default items-center gap-1.5 rounded-md py-1 pe-8 ps-1.5 ..."

// SelectItem indicator: right-2 → end-2 (Tailwind v4 logical inset)
<span className="pointer-events-none absolute end-2 flex size-4 items-center justify-center" />
```

---

### WR-02: `<Suspense>` around `PDPGallery` (a synchronous client component) never triggers its fallback

**File:** `src/app/[locale]/shop/[category]/[slug]/page.tsx:138-145`
**Issue:** `PDPGallery` is marked `'use client'` and does no async data fetching — it receives all data as props. A `<Suspense>` boundary only shows its fallback when a child *suspends* (throws a Promise). A sync client component never suspends, so `<PDPGallerySkeleton />` is unreachable dead code. This is misleading: a future developer may depend on this skeleton showing during navigation without understanding why it never appears.
**Fix:** Remove the `<Suspense>` wrapper around `PDPGallery` — or, if skeleton-during-navigation is desired, use `<Suspense>` only if `PDPGallery` is converted to an async server component that fetches its own images.
```tsx
// Replace:
<Suspense fallback={<PDPGallerySkeleton />}>
  <PDPGallery ... />
</Suspense>

// With:
<PDPGallery ... />
```
The outer `ShopGridSkeleton` Suspense pattern in `shop/page.tsx` is correct because `ShopGridSection` is an `async` function that awaits `getAllProducts()`.

---

### WR-03: Skeleton `aria-label` strings are hardcoded English — broken for AR screen-reader users

**File:** `src/components/shop/ShopGridSkeleton.tsx:10`, `src/components/pdp/PDPGallerySkeleton.tsx:11`
**Issue:** Both new skeleton components are server components with `role="status"` and hardcoded English `aria-label` values (`"Loading products"`, `"Loading product gallery"`). In the `/ar/shop` route, a screen reader will announce the English string. Server components cannot use `useTranslations`; they can receive a translated string as a prop.
**Fix:** Add a `label` prop (defaulting to the EN string for back-compat), and pass a translated value from the parent server component:
```tsx
// ShopGridSkeleton:
export function ShopGridSkeleton({ label = 'Loading products' }: { label?: string }) {
  return <div role="status" aria-label={label} ...>

// In shop/page.tsx (server component can call getTranslations):
const tShop = await getTranslations('Shop')
<ShopGridSkeleton label={tShop('loadingLabel')} />
```
Add `Shop.loadingLabel` and `Shop.galleryLoadingLabel` keys to both locale files.

---

### WR-04: Phase 11 introduces new inline EN/AR ternaries in `PDPInfoPanel` for content that should live in next-intl

**File:** `src/components/pdp/PDPInfoPanel.tsx:47, 71-72, 88, 100-101`
**Issue:** Plan 11-11 added the passive low-stock signal and per-size stock signal using raw `locale === 'ar' ? '...' : '...'` inline strings. The project pattern (per CLAUDE.md and the work done in plans 11-13 and 11-14) is to put all user-visible strings in `messages/{en,ar}.json` and retrieve them via `next-intl`. Four strings are new violations:
- Line 47: `'كمية محدودة' : 'Limited stock'`
- Lines 71-72: `` `متبقي ${size.stock} قطع فقط` : `ONLY ${size.stock} LEFT` ``
- Line 88: `'نفد المخزون' : 'Out of Stock'` (the disabled button label)
- Lines 100-101: `'إرجاع مجاني...' : 'Free returns...'`

`PDPInfoPanel` is `'use client'`, so it should use `useTranslations`. The stock count strings require ICU `{count}` interpolation in the message catalog.
**Fix:** Add keys to `messages/*.json` under `Shop` (e.g. `limitedStock`, `onlyNLeft`, `outOfStock`, `returnPolicy`) and call `const t = useTranslations('Shop')` at the top of `PDPInfoPanel`.

---

### WR-05: `ContactClient` has `aria-live="polite"` on a static card — misleading semantics

**File:** `src/app/[locale]/contact/ContactClient.tsx:51`
**Issue:** The WhatsApp callout `<aside>` carries `role="region" aria-live="polite"`. `aria-live` tells screen readers to announce content changes dynamically. This card's content is static — it never changes after mount. Applying `aria-live` to static content is not a rendering error, but it causes screen readers to queue an announcement of the entire card's content immediately on page load, which is disruptive and confusing (the card will be read twice: once as the user reaches it by navigation, once as the live-region fires).
**Fix:** Remove `aria-live="polite"` from the static card. The `role="region"` with `aria-label` is sufficient for navigation purposes.
```tsx
<aside
  role="region"
  aria-label={isRtl ? 'قناة المراسلة الحالية' : 'Current messaging channel'}
  className="..."
>
```

---

## Info

### IN-01: Orphaned `Shop.emptyHeading` / `Shop.emptyBody` keys in both locale files

**File:** `messages/en.json:87-88`, `messages/ar.json:87-88`
**Issue:** The old flat keys `Shop.emptyHeading` and `Shop.emptyBody` are no longer referenced in any source file. Plan 11-14 migrated to the nested `Shop.empty.heading` / `Shop.empty.body` structure. The old keys are dead weight in both locale files.
**Fix:** Delete `"emptyHeading"` and `"emptyBody"` from both `messages/en.json` and `messages/ar.json` under the `Shop` namespace.

---

### IN-02: `PDPGallery` passes `undefined as unknown as string` to `PlaceholderImage.src` — unsafe cast

**File:** `src/components/pdp/PDPGallery.tsx:21`
**Issue:** When `images` is empty, the code pushes `undefined as unknown as string` as a sentinel to show one placeholder slot. This double cast bypasses TypeScript's type system. `PlaceholderImage.src` is typed `string | null | undefined` so `undefined` would be accepted directly without the cast. The cast adds noise and could mask a future type mismatch.
**Fix:**
```tsx
const visibleImages = (images.length > 0 ? images : [undefined]).slice(0, MAX_GALLERY_IMAGES)
// PlaceholderImage.src accepts string | null | undefined; undefined is valid.
```

---

_Reviewed: 2026-05-17_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: deep_
