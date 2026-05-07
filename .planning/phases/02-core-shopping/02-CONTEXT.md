# Phase 2: Core Shopping - Context

**Gathered:** 2026-05-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Full browse-to-cart flow: shop index, category pages, and product detail pages — with bilingual content, size selection, all three stock states, hover polish, CartStore initialization, and a basic cart count badge. No cart drawer (Phase 3). No checkout (Phase 3). No brand editorial pages (Phase 4).

</domain>

<decisions>
## Implementation Decisions

### Navigation Update
- **D-01:** Navbar "Tops" and "Bottoms" direct links are replaced with a single "Categories" item that reveals a hover dropdown (Tops / Bottoms). The Navbar component from Phase 1 must be updated in Phase 2.
- **D-02:** Hover dropdown routes to `/shop/tops` and `/shop/bottoms` (URLs unchanged from Phase 1 implementation).

### Shop & Filter/Sort
- **D-03:** Filter and sort state lives in URL query params (`?category=tops|bottoms`, `?sort=newest|price-asc|price-desc`). Bookmarkable, shareable, back-button-safe.
- **D-04:** `/shop` index page exists and shows all products with category tabs (All | Tops | Bottoms). `/shop/tops` and `/shop/bottoms` are the same page pre-filtered via query param.
- **D-05:** Sort control sits top-right of the product grid, inline with the product count (e.g., "12 Products  [Sort: Newest ▾]"). Compact, editorial — no separate sort bar.

### PDP Gallery Layout
- **D-06:** Stacked vertical gallery — 3 placeholder images (4:5 aspect ratio) scroll on the left column. No carousel or thumbnail strip.
- **D-07:** Desktop layout: scrolling image column on the left, sticky product info panel on the right (name, price, size selector, CTA). Mobile: images stacked above, info below.
- **D-08:** 3 PlaceholderImage slots per PDP (front, back, detail). Phase 2 swaps `src` prop only — no layout changes required when real images arrive (PlaceholderImage is already wired with `fill` for this).

### Product Card Hover (ANIM-03)
- **D-09:** On hover: image zooms (subtle CSS scale on the inner image) AND product name underlines. Both effects fire together. No overlay, no slide-up CTA, no quick-add button.

### Cart Initialization & Feedback
- **D-10:** CartStore (Zustand + persist middleware) initializes in Phase 2. The store is the data layer — the drawer is Phase 3.
- **D-11:** "Add to Cart" button shows a brief success state (~1.5s checkmark or "Added" label, then resets). No toast library needed — self-contained button state.
- **D-12:** Cart item count badge is wired on the nav cart icon in Phase 2 (small pull-forward of NAV-03 from Phase 3). The badge reads from CartStore and updates live when items are added.

### Claude's Discretion
- Exact transition duration and easing for image zoom hover (stay within `animationPresets` values or extend the presets file)
- Product data: Claude populates `products.ts` with realistic placeholder products (ORKI-style names, bilingual EN/AR descriptions, SAR prices). Sufficient variety to test all stock states (in-stock, partial, fully out-of-stock).
- Size guide modal measurements chart content (realistic apparel sizing for Saudi market)
- Return policy snippet copy (bilingual)
- Related products selection algorithm (same category, exclude current product)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Foundation
- `.planning/ROADMAP.md` — Phase 2 goal, requirements list (SHOP-01..04, PDP-01..10, ANIM-03), success criteria
- `.planning/REQUIREMENTS.md` — Full requirement definitions with REQ-IDs
- `.planning/PROJECT.md` — Brand constraints, design latitude, placeholder system contract

### Architecture Contracts
- `src/types/domain.ts` — `Product`, `CartItem`, `Size` types. These are the frontend↔backend contract. Do not change the shape.
- `src/lib/products.ts` — The ONLY file components may import product data from. When Medusa arrives, only this file changes.
- `src/data/products.ts` — Static placeholder data. Populate in Phase 2.

### Phase 1 Deliverables (reuse, do not rewrite)
- `src/components/PlaceholderImage.tsx` — Dark-field editorial placeholder. Phase 2 swaps `src` prop only.
- `src/lib/animation-presets.ts` — All animation values come from here. No ad-hoc durations.
- `src/hooks/useDirection.ts` — RTL/LTR direction hook for direction-aware components.
- `src/i18n/navigation.ts` — Use this `Link` and `useRouter` — never next/navigation directly.
- `src/components/nav/Navbar.tsx` — Must be updated in Phase 2 to replace direct Tops/Bottoms links with a "Categories" hover dropdown.

### Design Reference
- `marionshop.framer.website` — Visual reference: minimalist, dark, editorial. Stacked PDP gallery and clean sort UI align with this aesthetic.

No external ADRs or specs beyond what's listed.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `PlaceholderImage` (aspectRatio, alt, priority, className): Drop into ProductCard (3:4) and PDP gallery slots (4:5). Phase 2 wires real `src` when available — no layout change.
- `animationPresets.fadeIn / fadeOut`: Use for hover transition timing on product cards. May need a new `cardHover` preset added to `animation-presets.ts`.
- `useDirection()`: Returns `'ltr'|'rtl'`. Use in any direction-aware component (e.g., cart badge position on nav icon).
- `useTranslations()` / next-intl `Link`: Already established pattern — follow for all new pages.

### Established Patterns
- CSS logical properties only (`ms-`, `me-`, `ps-`, `pe-`, `inset-inline-start`, etc.). Physical classes (`ml-`, `mr-`, `pl-`, `pr-`) are banned by ESLint.
- All product data flows through `lib/products.ts` — never import from `data/products.ts` directly in components.
- Translation keys live in `messages/en.json` and `messages/ar.json`. Add Phase 2 keys to both files.
- `next/image` only (ESLint rule). No `<img>` tags.

### Integration Points
- Navbar (`src/components/nav/Navbar.tsx`): Update "Categories" dropdown here. `Link` from `@/i18n/navigation` is already imported.
- Layout shell (`src/app/[locale]/layout.tsx`): No changes expected. Navbar and Footer are already wired.
- `src/app/[locale]/page.tsx`: Placeholder home page from Phase 1 — not touched in Phase 2.
- New routes needed: `src/app/[locale]/shop/page.tsx`, `src/app/[locale]/shop/[category]/page.tsx` (or query param on shop page), `src/app/[locale]/shop/[category]/[slug]/page.tsx`.

</code_context>

<specifics>
## Specific Ideas

- marionshop.framer.website referenced for PDP layout and sort UI style — editorial, spacious, dark
- "Categories" hover dropdown in Navbar explicitly requested (not direct links)
- Stacked vertical PDP gallery explicitly chosen (editorial feel, no carousel complexity)
- Product card hover: image zoom + name underline together (not one or the other)
- Cart badge pull-forward: user wants live count badge visible in Phase 2, not waiting for Phase 3

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 2-Core Shopping*
*Context gathered: 2026-05-07*
