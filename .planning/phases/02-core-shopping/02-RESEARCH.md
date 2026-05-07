# Phase 2: Core Shopping — Research

**Researched:** 2026-05-07
**Domain:** Next.js 15 App Router — shop pages, PDP, Zustand CartStore, RTL-aware components, JSON-LD, Motion animations
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Navbar "Tops" and "Bottoms" direct links replaced with a single "Categories" item that reveals a hover dropdown (Tops / Bottoms). Navbar must be updated in Phase 2.
- **D-02:** Hover dropdown routes to `/shop/tops` and `/shop/bottoms`.
- **D-03:** Filter and sort state lives in URL query params (`?category=tops|bottoms`, `?sort=newest|price-asc|price-desc`). Bookmarkable, shareable, back-button-safe.
- **D-04:** `/shop` index page shows all products with category tabs (All | Tops | Bottoms). `/shop/tops` and `/shop/bottoms` are the same page pre-filtered via query param.
- **D-05:** Sort control sits top-right of the product grid, inline with product count. Compact, editorial.
- **D-06:** Stacked vertical gallery — 3 placeholder images (4:5 aspect ratio) on the left column. No carousel.
- **D-07:** Desktop: scrolling image column on left, sticky product info panel on right (`sticky top-[64px]`). Mobile: images stacked above, info below.
- **D-08:** 3 PlaceholderImage slots per PDP. Phase 2 swaps `src` prop only — no layout changes needed.
- **D-09:** On hover: image zooms (CSS scale on inner image) AND product name underlines. Both fire together.
- **D-10:** CartStore (Zustand + persist middleware) initializes in Phase 2. Drawer is Phase 3.
- **D-11:** "Add to Cart" shows brief success state (~1.5s "Added" + checkmark), then resets. Self-contained button state. No toast.
- **D-12:** Cart item count badge wired on nav cart icon in Phase 2. Reads from CartStore, updates live.

### Claude's Discretion

- Exact transition duration and easing for image zoom hover (stay within `animationPresets` or extend the presets file).
- Product data: populate `products.ts` with realistic placeholder products (ORKI-style, bilingual EN/AR, SAR prices, all stock states).
- Size guide modal measurements chart content (Saudi market apparel sizing).
- Return policy snippet copy (bilingual).
- Related products selection algorithm (same category, exclude current product).

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SHOP-01 | Shop index page displays all products in a grid with product cards | Next.js async Server Component page with `searchParams` prop (Promise in v15); `getAllProducts()` from `lib/products.ts` |
| SHOP-02 | Separate category pages for Tops and Bottoms | Dynamic route `[locale]/shop/[category]/page.tsx` + query param aliasing from `/shop?category=tops` |
| SHOP-03 | ProductCard: placeholder image, product name, price in SAR | PlaceholderImage (existing), `Intl.NumberFormat` with `'ar-SA-u-nu-latn'` locale option |
| SHOP-04 | Filter by category, sort by Newest / Price Low–High / High–Low | URL `searchParams` passed to Server Component; client tab/sort buttons use `useRouter` + `URLSearchParams`; no page reload |
| PDP-01 | PDP displays image gallery (4:5 placeholder images) | PDPGallery component with 3 stacked PlaceholderImage slots, first gets `priority={true}` |
| PDP-02 | Name and description in active locale | `product.name[locale]` / `product.description[locale]` via `params.locale` |
| PDP-03 | Price in SAR with locale-correct formatting | `new Intl.NumberFormat('ar-SA-u-nu-latn', { style:'currency', currency:'SAR' })` — Western numerals in both locales |
| PDP-04 | Size selector button group with per-size OOS state | SizeSelector component; OOS buttons get `aria-disabled="true"`, `tabIndex={-1}`, CSS `::after` diagonal line |
| PDP-05 | Add to Cart disabled until size selected; success state on activation | AddToCartButton internal state `'idle' | 'success'`; Motion `AnimatePresence mode="wait"` key swap, 1500ms timer |
| PDP-06 | Size guide modal with measurements chart | `npx shadcn add dialog` — base-ui Dialog; measurement table in UI-SPEC included |
| PDP-07 | Return policy snippet below Add to Cart | Static bilingual copy below button; copy defined in UI-SPEC |
| PDP-08 | Related products row at bottom of PDP | `getProductsByCategory(category).filter(p => p.id !== currentId).slice(0, 4)` using existing `lib/products.ts` function |
| PDP-09 | All three stock states fully designed | StockStateBadge component; derives `inStock` from `product.sizes.some(s => s.inStock)` |
| PDP-10 | JSON-LD Product schema on every PDP | `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />` in page Server Component |
| ANIM-03 | Refined hover states on product cards | CSS `scale(1.04)` on inner Image via Tailwind group-hover; `text-underline` on name; presets file extended with `cardHover` |
</phase_requirements>

---

## Summary

Phase 2 builds the full browse-to-add-to-cart flow on top of the Phase 1 RTL/i18n foundation. It introduces five new route segments, twelve new components (across `components/shop/` and `components/pdp/`), one update to `Navbar.tsx`, the CartStore initialization, and product data population.

The dominant technical pattern is **Server Component pages that receive `searchParams` as an async Promise prop** (Next.js 15 change from v14). Filter and sort state lives exclusively in the URL — no client state for filtering. CartStore is the only client-side state introduced, initialized with Zustand persist middleware and localStorage. Hydration mismatch prevention requires either `skipHydration + useEffect rehydrate()` or a stable `_hasHydrated` guard.

The base-ui `NavigationMenu` primitive (already installed as `src/components/ui/navigation-menu.tsx`) handles the Categories hover dropdown out of the box — hover open/close is built in, no manual `onMouseEnter` management needed. The SizeGuideModal requires `npx shadcn add dialog` (one CLI command; base-ui Dialog follows the same render-prop pattern as the Phase 1 Sheet). JSON-LD injection uses a native `<script>` tag with `dangerouslySetInnerHTML`, not `next/script` — this is the Next.js official recommendation.

**Primary recommendation:** Build all shop and PDP components as Server Components wherever possible (ProductCard, ProductGrid, PDPGallery, PDPLayout, RelatedProducts, ShopHeader filter tabs), and introduce `'use client'` only at the interaction boundary (SizeSelector, AddToCartButton, CartBadge, CategoryDropdown, SizeGuideModal trigger). This minimizes client JS and avoids Zustand being read outside Client Components.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| URL-based filter/sort | Frontend Server (SSR) | Browser/Client (tab/sort buttons) | `searchParams` prop is read in Server Component; tab/sort buttons update URL using `useRouter` from client |
| Product data fetching | Frontend Server (SSR) | — | `getAllProducts()` / `getProductsByCategory()` called in Server Component pages; no API call needed |
| CartStore (add to cart, count badge) | Browser/Client | — | Zustand store is browser-only; localStorage persistence; CartBadge and AddToCartButton are Client Components |
| CategoryDropdown hover menu | Browser/Client | — | Must be a Client Component for hover/open state; uses base-ui NavigationMenu |
| SizeSelector + SizeGuideModal | Browser/Client | — | Size selection is interactive state; modal requires Client Component |
| JSON-LD schema injection | Frontend Server (SSR) | — | Script tag rendered inside Server Component page; no client hydration needed |
| Product card hover animation | Browser/Client (CSS) | — | Pure CSS `group-hover` + Tailwind; no JS required |
| AddToCartButton success state | Browser/Client | — | Internal state machine `'idle' | 'success'` with 1.5s timer; Motion AnimatePresence |
| Translation (i18n) | Frontend Server (SSR) | Browser/Client (hooks) | Server Components use `getTranslations()`; Client Components use `useTranslations()` |

---

## Standard Stack

### Core

| Library | Version (installed) | Purpose | Why Standard |
|---------|---------------------|---------|--------------|
| Next.js | 15.3.9 | App Router pages, `searchParams`, `generateStaticParams` | Framework — already installed |
| next-intl | 4.11.0 | `useTranslations`, `getTranslations`, locale-aware `Link`/`useRouter` | i18n — already installed; `@/i18n/navigation` exports used project-wide |
| Zustand | 5.0.13 | CartStore with persist middleware + localStorage | State management — already installed |
| Motion | 12.38.0 | AnimatePresence key swap (AddToCartButton), CartBadge scale pop, CategoryDropdown fade | Animation — already installed |
| @base-ui/react | 1.4.1 | NavigationMenu (CategoryDropdown), Dialog (SizeGuideModal) | UI primitives — already installed |
| Tailwind CSS v4 | 4.x | Utility classes; logical properties (`ms-`, `me-`, `ps-`, `pe-`) only | Styling — already installed |
| lucide-react | 1.14.0 | `Check`, `ChevronDown`, `ShoppingCart`, `X` icons | Icon library — already installed |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn dialog | (CLI add) | SizeGuideModal primitive | One CLI command: `npx shadcn add dialog`; base-ui Dialog under the hood |

### Not Required

| Instead of | Could Use | Why Not |
|------------|-----------|---------|
| Custom hover dropdown | headlessui, radix | base-ui NavigationMenu already installed and handles hover/keyboard correctly |
| toast library (react-hot-toast, sonner) | (any) | D-11 explicitly bans toast libraries; button success state is self-contained |
| schema-dts | community library | Unnecessary for one Product type; inline object is simpler |
| serialize-javascript | community library | The `replace(/</g, '\\u003c')` inline sanitization is sufficient for this schema shape |

**Installation (only missing item):**
```bash
npx shadcn add dialog
```

**Version verification (2026-05-07):**
```
zustand: 5.0.13  (registry latest)
motion:  12.38.0 (registry latest)
next:    16.2.5  (registry latest — project has ^15.3.9, compatible)
@base-ui/react: 1.4.1 (registry latest)
next-intl: 4.11.0 (registry latest)
```

---

## Architecture Patterns

### System Architecture Diagram

```
URL: /[locale]/shop?category=tops&sort=newest
         │
         ▼
[shop/page.tsx — Server Component]
  │  await searchParams → { category, sort }
  │  getAllProducts() → filtered + sorted array
  │
  ├── <ShopHeader> (category tabs + sort control)
  │     └── Category tab buttons: useRouter().push({ query: {category, sort} })
  │         Sort select: useRouter().push({ query: {category, sort} })
  │
  └── <ProductGrid products={filtered}>
        └── <ProductCard product> × N
              └── <Link href="/shop/[category]/[slug]">
                    ├── <PlaceholderImage aspectRatio="3/4" />
                    ├── product.name[locale]
                    └── Intl.NumberFormat price (SAR)

URL: /[locale]/shop/tops/orki-heavy-tee
         │
         ▼
[shop/[category]/[slug]/page.tsx — Server Component]
  │  await params → { locale, category, slug }
  │  getProductBySlug(slug) → product
  │  ← inject JSON-LD <script>
  │
  ├── <PDPLayout gallery={...} info={...}>
  │     ├── left: <PDPGallery> — 3 × PlaceholderImage(4/5) stacked
  │     └── right: sticky info panel
  │           ├── product.name[locale]  (h1)
  │           ├── Intl.NumberFormat price
  │           ├── <SizeSelector> ← Client Component
  │           │     └── triggers SizeGuideModal
  │           ├── <AddToCartButton> ← Client Component
  │           │     └── CartStore.addItem(...)
  │           ├── return policy snippet
  │           └── <StockStateBadge>
  │
  └── <RelatedProducts> — same category, exclude current, max 4
        └── <ProductGrid products={related}>

Navbar (all pages):
  ├── [Categories hover dropdown] ← CategoryDropdown Client Component
  │     └── base-ui NavigationMenu — hover open/close built in
  └── [Cart icon] ← CartBadge Client Component
        └── useCartStore(state => state.items).length

CartStore (Zustand + persist):
  src/store/cartStore.ts
  └── create + persist({ name: 'orki-cart', storage: createJSONStorage(() => localStorage) })
      skipHydration: true
  └── <StoreHydration> Client Component in layout.tsx
        └── useEffect(() => { useCartStore.persist.rehydrate() }, [])
```

### Recommended Project Structure

```
src/
├── app/[locale]/
│   ├── shop/
│   │   ├── page.tsx                    # Shop index — Server Component
│   │   └── [category]/
│   │       ├── page.tsx                # /shop/tops, /shop/bottoms — Server Component
│   │       └── [slug]/
│   │           └── page.tsx            # PDP — Server Component + JSON-LD
├── components/
│   ├── nav/
│   │   ├── Navbar.tsx                  # UPDATED: add CategoryDropdown + CartBadge
│   │   ├── CategoryDropdown.tsx        # NEW: Client Component
│   │   └── CartBadge.tsx               # NEW: Client Component
│   ├── shop/
│   │   ├── ProductCard.tsx             # Server Component
│   │   ├── ProductGrid.tsx             # Server Component
│   │   ├── ShopHeader.tsx              # NEW: Client Component (tab/sort interaction)
│   │   └── StockStateBadge.tsx         # NEW: Server Component (no interaction)
│   └── pdp/
│       ├── PDPGallery.tsx              # Server Component
│       ├── PDPLayout.tsx               # Server Component
│       ├── SizeSelector.tsx            # Client Component
│       ├── SizeGuideModal.tsx          # Client Component
│       ├── AddToCartButton.tsx         # Client Component
│       └── RelatedProducts.tsx         # Server Component
├── store/
│   ├── cartStore.ts                    # Zustand store definition
│   └── StoreHydration.tsx              # Client Component — rehydrate on mount
├── data/
│   └── products.ts                     # POPULATED in Phase 2
└── lib/
    ├── products.ts                     # EXTEND: add getRelatedProducts()
    └── animation-presets.ts            # EXTEND: cardHover, badgePop, dropdownOpen, successState
```

### Pattern 1: Next.js 15 Shop Page with Async searchParams

**What:** Server Component page reads filter/sort from URL query params via the `searchParams` Promise prop.
**When to use:** Any page that needs URL-driven filtering without client state.

```typescript
// Source: https://nextjs.org/docs/app/api-reference/file-conventions/page
// src/app/[locale]/shop/page.tsx
export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string }>
}) {
  const { category = 'all', sort = 'newest' } = await searchParams

  let products = getAllProducts()

  if (category === 'tops' || category === 'bottoms') {
    products = products.filter(p => p.category === category)
  }

  if (sort === 'price-asc') {
    products = [...products].sort((a, b) => a.price - b.price)
  } else if (sort === 'price-desc') {
    products = [...products].sort((a, b) => b.price - a.price)
  }
  // default 'newest': products array order is newest-first in data file

  return (
    <>
      <ShopHeader activeCategory={category} activeSort={sort} productCount={products.length} />
      <ProductGrid products={products} />
    </>
  )
}
```

**Critical note:** `searchParams` is a **Promise** in Next.js 15 — must `await` it. Using `searchParams` opts the page into dynamic rendering (request-time, not build-time). This is correct for a shop page — we want up-to-date filter state per request.

### Pattern 2: Client Component Filter/Sort URL Update

**What:** Tab/sort buttons in ShopHeader update the URL using `useRouter` from `@/i18n/navigation`.
**When to use:** Any Client Component that needs to update URL query params without a full navigation.

```typescript
// Source: https://next-intl.dev/docs/routing/navigation
// src/components/shop/ShopHeader.tsx
'use client'
import { useRouter, usePathname } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'

export function ShopHeader({ activeCategory, activeSort, productCount }: ShopHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function setCategory(category: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (category === 'all') {
      params.delete('category')
    } else {
      params.set('category', category)
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  function setSort(sort: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (sort === 'newest') {
      params.delete('sort')
    } else {
      params.set('sort', sort)
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }
  // ...
}
```

**Note:** `useSearchParams` from `next/navigation` (not from `@/i18n/navigation`) is appropriate for reading the current URL in a Client Component. The `useRouter` from `@/i18n/navigation` is used for navigation to preserve locale prefix.

### Pattern 3: Zustand CartStore with Persist + Hydration Guard

**What:** Persist cart to localStorage, prevent SSR hydration mismatch using `skipHydration` + manual rehydrate on mount.
**When to use:** Any Zustand store that persists to localStorage in a Next.js App Router app.

```typescript
// Source: https://zustand.docs.pmnd.rs/reference/middlewares/persist (official docs)
// src/store/cartStore.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { CartItem, Product } from '@/types/domain'

interface CartState {
  items: CartItem[]
  addItem: (product: Product, selectedSize: string) => void
  removeItem: (productId: string, selectedSize: string) => void
  clearCart: () => void
  getTotalCount: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, selectedSize) =>
        set(state => {
          const existing = state.items.find(
            i => i.product.id === product.id && i.selectedSize === selectedSize
          )
          if (existing) {
            return {
              items: state.items.map(i =>
                i.product.id === product.id && i.selectedSize === selectedSize
                  ? { ...i, quantity: i.quantity + 1 }
                  : i
              ),
            }
          }
          return { items: [...state.items, { product, selectedSize, quantity: 1 }] }
        }),
      removeItem: (productId, selectedSize) =>
        set(state => ({
          items: state.items.filter(
            i => !(i.product.id === productId && i.selectedSize === selectedSize)
          ),
        })),
      clearCart: () => set({ items: [] }),
      getTotalCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: 'orki-cart',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true, // CRITICAL: prevents SSR hydration mismatch
    }
  )
)
```

```typescript
// Source: Zustand official docs — skipHydration pattern
// src/store/StoreHydration.tsx
'use client'
import { useEffect } from 'react'
import { useCartStore } from './cartStore'

export function StoreHydration() {
  useEffect(() => {
    // Rehydrate persisted cart state after client mount
    // useEffect runs only on client — prevents server/client mismatch
    useCartStore.persist.rehydrate()
  }, [])

  return null
}
```

```typescript
// Add to src/app/[locale]/layout.tsx:
import { StoreHydration } from '@/store/StoreHydration'
// Inside layout:
<StoreHydration />
```

### Pattern 4: CartBadge — Reading Zustand in Client Component

**What:** Read cart item count safely in a Client Component without hydration mismatch.
**When to use:** Any Client Component that reads persisted Zustand state.

```typescript
// src/components/nav/CartBadge.tsx
'use client'
import { useCartStore } from '@/store/cartStore'
import { AnimatePresence, motion } from 'motion/react'
import { animationPresets } from '@/lib/animation-presets'

export function CartBadge() {
  // Safe: StoreHydration has already called rehydrate() by the time
  // this component renders client-side; server render shows count=0
  // which is the correct initial state (no mismatch)
  const count = useCartStore(state => state.items.reduce((n, i) => n + i.quantity, 0))

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.span
          key="badge"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          transition={animationPresets.badgePop}
          className="absolute top-0 inset-inline-end-0 -translate-y-1/2 translate-x-1/2
                     min-w-[20px] h-5 rounded-full bg-white text-black
                     text-[12px] font-semibold flex items-center justify-center px-1"
        >
          {count >= 10 ? '9+' : count}
        </motion.span>
      )}
    </AnimatePresence>
  )
}
```

**Why this is safe:** With `skipHydration: true`, the store always starts with `items: []` on both server and client during SSR. The `StoreHydration` component triggers rehydration after mount, so the count updates from 0 to actual after hydration — this is a progressive enhancement, not a mismatch.

### Pattern 5: JSON-LD Product Schema

**What:** Inject structured data for Google Rich Results on every PDP.
**When to use:** Any Server Component product page.

```typescript
// Source: https://nextjs.org/docs/app/guides/json-ld (official Next.js docs)
// Inside the PDP Server Component page return:
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: product.name.en,  // Schema.org uses canonical language; EN is canonical
  description: product.description.en,
  offers: {
    '@type': 'Offer',
    price: product.price,
    priceCurrency: 'SAR',
    availability: product.inStock
      ? 'https://schema.org/InStock'
      : 'https://schema.org/OutOfStock',
  },
}

// In JSX:
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
  }}
/>
```

**Note:** Use native `<script>` tag, not `next/script`. Next.js docs explicitly state: "Since JSON-LD is structured data, not executable code, a native `<script>` tag is the right choice here."

### Pattern 6: AddToCartButton Success State

**What:** Label/icon swap with exit + enter animation using AnimatePresence key swap.
**When to use:** Any button that needs a temporary feedback state.

```typescript
// Source: https://motion.dev/docs/react-animate-presence
// src/components/pdp/AddToCartButton.tsx
'use client'
import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check } from 'lucide-react'
import { animationPresets } from '@/lib/animation-presets'
import { useCartStore } from '@/store/cartStore'

type ButtonState = 'idle' | 'success'

export function AddToCartButton({ product, selectedSize, locale }: AddToCartButtonProps) {
  const [state, setState] = useState<ButtonState>('idle')
  const addItem = useCartStore(s => s.addItem)

  function handleClick() {
    if (!selectedSize || state === 'success') return
    addItem(product, selectedSize)
    setState('success')
    setTimeout(() => setState('idle'), 1500)
  }

  return (
    <button
      onClick={handleClick}
      disabled={!selectedSize}
      className="w-full h-[52px] rounded-lg bg-white text-black font-semibold text-base
                 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
    >
      <AnimatePresence mode="wait">
        {state === 'idle' ? (
          <motion.span
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={animationPresets.successState}
          >
            {locale === 'ar' ? 'أضف إلى السلة' : 'Add to Cart'}
          </motion.span>
        ) : (
          <motion.span
            key="success"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={animationPresets.successState}
            className="flex items-center justify-center gap-2"
          >
            <Check className="size-4" />
            {locale === 'ar' ? 'تمت الإضافة' : 'Added'}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
}
```

### Pattern 7: OOS Diagonal Strikethrough via CSS Pseudo-element

**What:** A diagonal line across an OOS size button using `::after` with transform.
**When to use:** SizeSelector — individual size button in out-of-stock state.

```css
/* Applied via Tailwind's arbitrary variants or a global CSS class */
/* The parent button needs position: relative, overflow: hidden */
.size-btn-oos::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom right,
    transparent calc(50% - 0.5px),
    rgba(255, 255, 255, 0.40) calc(50% - 0.5px),
    rgba(255, 255, 255, 0.40) calc(50% + 0.5px),
    transparent calc(50% + 0.5px)
  );
  pointer-events: none;
}
```

**Alternative (simpler, pure Tailwind + inline styles):**
```typescript
// On the OOS button element:
<button
  aria-disabled="true"
  tabIndex={-1}
  className="relative overflow-hidden opacity-40 cursor-not-allowed
             before:absolute before:inset-0
             before:bg-[linear-gradient(to_bottom_right,transparent_calc(50%-0.5px),rgba(255,255,255,0.4)_calc(50%-0.5px),rgba(255,255,255,0.4)_calc(50%+0.5px),transparent_calc(50%+0.5px))]"
>
  {size.label}
</button>
```

### Pattern 8: Sticky PDP Info Panel

**What:** Right column sticks to viewport top as the left image column scrolls.
**When to use:** Two-column desktop PDP layout.

```typescript
// PDPLayout.tsx
<div className="md:grid md:grid-cols-[55%_45%] md:gap-12 xl:gap-16">
  {/* Left column — scrolls naturally */}
  <div>{gallery}</div>
  {/* Right column — sticky to navbar bottom */}
  <div className="sticky top-16 self-start">
    {info}
  </div>
</div>
```

**`top-16`** = 64px = Navbar height (established Phase 1 as `h-16`). The `self-start` is required — without it, the sticky element stretches to full grid row height and does not stick correctly.

### Pattern 9: CategoryDropdown with base-ui NavigationMenu

**What:** Use the installed `NavigationMenu` component from `src/components/ui/navigation-menu.tsx` for the Categories hover dropdown. The base-ui NavigationMenu handles hover-intent open/close, keyboard (Escape, Tab), and focus management natively.
**When to use:** Navbar desktop category hover dropdown.

```typescript
// Source: https://base-ui.com/react/components/navigation-menu
// The existing navigation-menu.tsx wraps @base-ui/react/navigation-menu
// Key props: NavigationMenu.Root has built-in hover trigger with delay/closeDelay
// NavigationMenuTrigger already renders ChevronDown with rotation on open
// Override default styles to match ORKI dark theme:

<NavigationMenu className="relative">
  <NavigationMenuList>
    <NavigationMenuItem>
      <NavigationMenuTrigger className="text-white/60 hover:text-white bg-transparent text-base font-normal px-0">
        {t('categories')}
      </NavigationMenuTrigger>
      <NavigationMenuContent>
        {/* Links inside — styled with ORKI dark panel */}
        <ul className="min-w-[160px] bg-[#111111] border border-white/[0.12] rounded-lg py-2">
          <li>
            <NavigationMenuLink asChild>
              <Link href="/shop/tops" className="block px-4 py-3 text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors duration-150">
                {t('tops')}
              </Link>
            </NavigationMenuLink>
          </li>
          {/* bottoms similarly */}
        </ul>
      </NavigationMenuContent>
    </NavigationMenuItem>
  </NavigationMenuList>
</NavigationMenu>
```

**Important:** The existing `navigation-menu.tsx` wraps `@base-ui/react/navigation-menu` directly (confirmed by codebase scan). The `NavigationMenuPositioner` already renders inside a Portal — the dropdown panel positions correctly in the stacking context. Override Tailwind classes at usage site; no edits needed to the primitive file.

### Anti-Patterns to Avoid

- **Direct `data/products.ts` import in components:** All product access must flow through `lib/products.ts` — banned by project convention. ESLint does not enforce this but it is the architectural contract (enforced by code review / plan checker).
- **Physical CSS properties (`ml-`, `mr-`, `pl-`, `pr-`):** Banned by ESLint rule established in Phase 1. Always use `ms-`, `me-`, `ps-`, `pe-`.
- **`<img>` tags:** Banned by ESLint rule (`no-img-element`). Always `next/image`.
- **`next/navigation` Link/useRouter directly:** Always import from `@/i18n/navigation` to preserve locale prefix in navigation.
- **`next/script` for JSON-LD:** Use native `<script>` tag — `next/script` is for executable JS.
- **Reading Zustand cart store in a Server Component:** Zustand is client-only. Only Client Components can `useCartStore`.
- **`useSearchParams` for filter tabs in Server Component:** `searchParams` prop is the server-side equivalent. `useSearchParams` is for Client Components only.
- **Synchronous `params`/`searchParams` in Next.js 15:** Both are Promises in v15. Must `await` them or use `React.use()` in Client Components.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Hover dropdown with keyboard support | Custom hover state + ref tracking + Escape listener | `NavigationMenu` (base-ui, already installed) | Edge cases: focus trap, Escape, Tab, screen reader ARIA, pointer leave timing |
| Modal with focus trap | Custom modal with manual focus management | `Dialog` (base-ui via `npx shadcn add dialog`) | base-ui Dialog handles focus trap, Escape, aria-modal, scroll lock |
| localStorage persistence | Custom serialize/deserialize + version checks | Zustand `persist` middleware | Handles JSON serialization, storage errors, version migration, partial state updates |
| Hover intent delay | Debounce mouseenter/mouseleave manually | base-ui NavigationMenu `delay`/`closeDelay` props | Built in; prevents flicker on quick mouse passes |
| Cart total item count | Manual array sum | `getTotalCount()` derived from store state | Centralizes logic; one source of truth |
| Exit animations for removed components | CSS display:none toggling | `AnimatePresence` (Motion) | CSS cannot animate the "unmount" of a React component |

**Key insight:** Every interactive element in this phase has a battle-tested primitive already installed. The executor's job is styling and wiring, not building interaction logic from scratch.

---

## Common Pitfalls

### Pitfall 1: Synchronous `searchParams` in Next.js 15

**What goes wrong:** Reading `searchParams.category` directly (v14 style) instead of `(await searchParams).category` causes a build warning and will break in future Next.js versions. The TypeScript type `Promise<{...}>` makes this visible.
**Why it happens:** Breaking change in Next.js 15 — both `params` and `searchParams` became async Promises.
**How to avoid:** Always `await searchParams` at the top of the async Server Component, destructure from the result.
**Warning signs:** TypeScript error "Property 'category' does not exist on type 'Promise<...>'" or runtime undefined values.

### Pitfall 2: Zustand Hydration Mismatch

**What goes wrong:** Cart count badge shows different value on server vs client, React throws hydration error.
**Why it happens:** Zustand persist rehydrates from localStorage only on client, but server renders with initial state `[]`. Without `skipHydration`, Zustand tries to rehydrate during Server Component execution (which has no localStorage).
**How to avoid:** Set `skipHydration: true` in persist config. Add `<StoreHydration />` Client Component to layout that calls `useCartStore.persist.rehydrate()` inside `useEffect`. CartBadge renders 0 on initial server pass — this is correct behavior.
**Warning signs:** Hydration error in console mentioning "cart" or count mismatch.

### Pitfall 3: Logical Properties Violation in New Components

**What goes wrong:** Writing `left-0`, `right-0`, `ml-4`, `pl-2` etc. in Phase 2 components causes ESLint errors and RTL layout breakage.
**Why it happens:** Physical property habit — developers default to physical directions.
**How to avoid:** Before writing any spacing or position class, mentally translate: `left` → `inset-inline-start` or `start`, `right` → `inset-inline-end` or `end`, `ml` → `ms`, `mr` → `me`, `pl` → `ps`, `pr` → `pe`. The ESLint rule will catch violations at lint time.
**Warning signs:** ESLint errors during `next build`; RTL layout looking mirrored incorrectly.

### Pitfall 4: ProductCard Hover — Group Class Required

**What goes wrong:** `group-hover:scale-[1.04]` on the inner Image has no effect because the outer wrapper does not have the `group` class.
**Why it happens:** Tailwind's group modifier requires the ancestor to be marked with `group`.
**How to avoid:** Add `group` to the outer card `<Link>` element. The `group-hover:` variant on the Image and name will then respond to hover anywhere on the card.
**Warning signs:** Image does not scale on hover; no errors in console.

### Pitfall 5: `sticky` Without `self-start` in Grid

**What goes wrong:** The sticky info panel does not stick — it stretches to the full grid row height and appears pinned to its own extended height rather than sticking to viewport.
**Why it happens:** In CSS Grid, a grid item's height is set to fill the row by default (`align-self: stretch`). `sticky` only works if the element can actually scroll within its scroll container — but if it fills the full grid row, there is nothing to scroll.
**How to avoid:** Add `self-start` to the sticky column container. This sets `align-self: start`, allowing the element to have its intrinsic height and sticky to function correctly.
**Warning signs:** Desktop PDP info panel scrolls away with the page instead of sticking.

### Pitfall 6: `next/navigation` Link Instead of `@/i18n/navigation` Link

**What goes wrong:** Navigating to `/shop/tops` sends the user to a non-locale URL, stripping the `/en/` or `/ar/` prefix.
**Why it happens:** `import { Link } from 'next/link'` does not add locale prefix; `import { Link } from '@/i18n/navigation'` does.
**How to avoid:** All `Link` and `useRouter` imports in Phase 2 must come from `@/i18n/navigation`, not `next/navigation` or `next/link`.
**Warning signs:** 404 on navigation; URL shows `/shop/tops` without locale prefix.

### Pitfall 7: `/shop/tops` Route vs `/shop?category=tops`

**What goes wrong (decision complexity):** The architecture uses both `/shop/tops` (URL path, from Navbar links) AND `/shop?category=tops` (query param, from filter tabs on the shop page). These must serve the same content.
**How to handle:** The `/shop/[category]/page.tsx` route simply reads `params.category` and delegates to the same filtering logic as the shop index — it is effectively an alias. The `/shop` index page tabs update query params. Both approaches render the same filtered ProductGrid.
**Why it works:** D-02 says dropdown routes to `/shop/tops`; D-03 says filter state is in query params. These coexist: `/shop/tops` has an implicit `category=tops` from the path segment, not the query string.

### Pitfall 8: `useSearchParams` Requires Suspense Boundary

**What goes wrong:** Using `useSearchParams` in a Client Component without a Suspense boundary causes Next.js to throw a build error: "useSearchParams() should be wrapped in a suspense boundary".
**Why it happens:** Next.js 15 requires `useSearchParams` Client Components to be wrapped in `<Suspense>` to enable static generation of the parent route.
**How to avoid:** Wrap the `ShopHeader` Client Component (which uses `useSearchParams`) in a `<Suspense fallback={...}>` inside the Server Component page.
**Warning signs:** Build error mentioning Suspense and useSearchParams.

---

## Code Examples

### Product Data Population (src/data/products.ts)

```typescript
// Source: src/types/domain.ts (Product type contract)
// ORKI-style streetwear products — bilingual EN/AR, SAR pricing, all stock states covered
import { Product } from '@/types/domain'

export const products: Product[] = [
  {
    id: 'orki-heavy-tee-black',
    slug: 'orki-heavy-tee-black',
    name: { en: 'ORKI Heavy Tee — Black', ar: 'تيشيرت أوركي الثقيل — أسود' },
    description: {
      en: 'Heavyweight 320gsm cotton. Dropped shoulders. ORKI wordmark embroidered at chest.',
      ar: 'قطن ثقيل 320 جرام. أكتاف منخفضة. شعار أوركي مطرّز على الصدر.',
    },
    category: 'tops',
    price: 249,
    currency: 'SAR',
    sizes: [
      { label: 'XS', inStock: true },
      { label: 'S', inStock: true },
      { label: 'M', inStock: false },   // partial OOS
      { label: 'L', inStock: true },
      { label: 'XL', inStock: true },
    ],
    images: [],
    inStock: true,
  },
  {
    id: 'orki-washed-tee-ecru',
    slug: 'orki-washed-tee-ecru',
    name: { en: 'ORKI Washed Tee — Ecru', ar: 'تيشيرت أوركي المغسول — إيكرو' },
    description: {
      en: 'Acid-washed 280gsm jersey. Relaxed fit. Chest pocket with woven label.',
      ar: 'جيرسي مغسول بالحامض 280 جرام. قصة مريحة. جيب صدر بعلامة منسوجة.',
    },
    category: 'tops',
    price: 219,
    currency: 'SAR',
    sizes: [
      { label: 'XS', inStock: false },
      { label: 'S', inStock: false },
      { label: 'M', inStock: false },
      { label: 'L', inStock: false },
      { label: 'XL', inStock: false },
    ],
    images: [],
    inStock: false,    // fully OOS — covers fully-OOS stock state
  },
  {
    id: 'orki-utility-cargo-black',
    slug: 'orki-utility-cargo-black',
    name: { en: 'ORKI Utility Cargo — Black', ar: 'بنطلون أوركي الكارغو — أسود' },
    description: {
      en: 'Relaxed cargo silhouette. Six pockets. Adjustable ankle cuffs. Twill fabric.',
      ar: 'سيلويت كارغو مريح. ستة جيوب. أكمام قابلة للتعديل عند الكاحل. قماش تويل.',
    },
    category: 'bottoms',
    price: 349,
    currency: 'SAR',
    sizes: [
      { label: 'XS', inStock: true },
      { label: 'S', inStock: true },
      { label: 'M', inStock: true },
      { label: 'L', inStock: true },
      { label: 'XL', inStock: false },  // partial OOS
    ],
    images: [],
    inStock: true,
  },
  {
    id: 'orki-wide-leg-trousers-black',
    slug: 'orki-wide-leg-trousers-black',
    name: { en: 'ORKI Wide Leg Trousers — Black', ar: 'بنطلون أوركي واسع الساق — أسود' },
    description: {
      en: 'High-rise wide leg cut. Pressed front crease. Concealed zip fly. Premium wool blend.',
      ar: 'قصة ساق واسعة بخصر مرتفع. كسرة أمامية مكوية. سحاب مخفي. خليط صوف فاخر.',
    },
    category: 'bottoms',
    price: 399,
    currency: 'SAR',
    sizes: [
      { label: 'XS', inStock: true },
      { label: 'S', inStock: true },
      { label: 'M', inStock: true },
      { label: 'L', inStock: true },
      { label: 'XL', inStock: true },
    ],
    images: [],
    inStock: true,
  },
  {
    id: 'orki-oversized-tee-white',
    slug: 'orki-oversized-tee-white',
    name: { en: 'ORKI Oversized Tee — White', ar: 'تيشيرت أوركي أوفرسايز — أبيض' },
    description: {
      en: 'Ultra-oversized silhouette. 300gsm cotton. Screen-printed graphic at back.',
      ar: 'سيلويت فضفاض للغاية. قطن 300 جرام. طباعة مطبوعة بالشاشة على الظهر.',
    },
    category: 'tops',
    price: 269,
    currency: 'SAR',
    sizes: [
      { label: 'XS', inStock: true },
      { label: 'S', inStock: true },
      { label: 'M', inStock: true },
      { label: 'L', inStock: true },
      { label: 'XL', inStock: true },
    ],
    images: [],
    inStock: true,
  },
  {
    id: 'orki-track-pants-black',
    slug: 'orki-track-pants-black',
    name: { en: 'ORKI Track Pants — Black', ar: 'بنطلون تراك أوركي — أسود' },
    description: {
      en: 'Technical fabric. Elastic waistband with drawcord. Tapered leg. Side zip pockets.',
      ar: 'قماش تقني. خصر مطاطي مع حبل ربط. ساق مخروطية. جيوب جانبية بسحاب.',
    },
    category: 'bottoms',
    price: 299,
    currency: 'SAR',
    sizes: [
      { label: 'XS', inStock: false },
      { label: 'S', inStock: true },
      { label: 'M', inStock: true },
      { label: 'L', inStock: false },
      { label: 'XL', inStock: true },
    ],
    images: [],
    inStock: true,
  },
]
```

**Stock state coverage:** `orki-heavy-tee-black` = partial OOS (M sold out); `orki-washed-tee-ecru` = fully OOS; all others = fully in-stock (with `orki-utility-cargo-black` and `orki-track-pants-black` also having partial OOS sizes). This gives the planner full coverage of SHOP-04 stock state requirements.

### SAR Price Formatting

```typescript
// Source: [ASSUMED] — Intl.NumberFormat is standard Web API
// Use 'ar-SA-u-nu-latn' for Western numerals in both EN and AR locales
// per CLAUDE.md: "formatted via Intl.NumberFormat with 'ar-SA-u-nu-latn' for Western numerals"
function formatPrice(price: number): string {
  return new Intl.NumberFormat('ar-SA-u-nu-latn', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
  // Outputs: "٢٤٩ ر.س." but with 'nu-latn': "249 ر.س."
}
```

### lib/products.ts Extension (getRelatedProducts)

```typescript
// Add to src/lib/products.ts for PDP-08
export function getRelatedProducts(
  currentId: string,
  category: 'tops' | 'bottoms',
  limit = 4
): Product[] {
  return products
    .filter(p => p.category === category && p.id !== currentId)
    .slice(0, limit)
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `searchParams` as sync object (Next.js 14) | `searchParams` as `Promise<{...}>` — must `await` | Next.js 15.0 RC | All shop/PDP pages must be async and await params |
| `params` as sync object (Next.js 14) | `params` as `Promise<{...}>` — must `await` | Next.js 15.0 RC | PDP `[slug]` page must `async` + `await params` |
| Framer Motion import | `motion/react` (rebranded as Motion) | v11+ | `import { motion, AnimatePresence } from 'motion/react'` — confirmed in project (`motion` package installed) |
| `create()` without TypeScript generic | `create<State>()()` (curried — note double call) | Zustand v4+ | TypeScript users must use the curried form for type inference |
| Zustand `persist` auto-hydrates | `skipHydration: true` + manual rehydrate for SSR | v3+ (SSR awareness) | Required pattern for any Next.js App Router project |

**Deprecated/outdated for this project:**
- `import { AnimatePresence } from 'framer-motion'` — the package is now `motion`, installed as such. Use `'motion/react'`.
- Direct `import { Link } from 'next/link'` — project convention requires `@/i18n/navigation`.
- `useSearchParams` without Suspense boundary in Next.js 15 — build will fail.

---

## Route Structure

```
src/app/[locale]/
├── shop/
│   ├── page.tsx               ← /en/shop  (all products, query params for filter/sort)
│   └── [category]/
│       ├── page.tsx           ← /en/shop/tops, /en/shop/bottoms
│       └── [slug]/
│           └── page.tsx       ← /en/shop/tops/orki-heavy-tee-black
```

**D-04 implementation note:** The `/shop/[category]/page.tsx` route handles `/shop/tops` and `/shop/bottoms`. It is NOT a separate page — it reads `params.category`, pre-filters via `getProductsByCategory(category)`, and renders the same `ShopHeader` + `ProductGrid`. The `ShopHeader` in this context starts with `activeCategory` pre-set from the path segment, not from a query param.

**D-03 implementation note:** On the `/shop` index, the category tabs add `?category=tops` to the URL. Both `/shop?category=tops` and `/shop/tops` show the same filtered grid. This is by design — users arriving via Navbar dropdown get a clean URL path; users using filter tabs get a query param URL. Both work correctly.

---

## Environment Availability

Step 2.6: No external dependencies beyond the project's own installed packages. All required tools (Next.js, Zustand, Motion, base-ui) are already in `package.json`. One CLI command adds the missing shadcn component.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build/run | Yes | v22.18.0 | — |
| npm | Package install | Yes | 11.7.0 | — |
| zustand (installed) | CartStore | Yes | ^5.0.13 in pkg | — |
| motion (installed) | Animations | Yes | ^12.38.0 in pkg | — |
| @base-ui/react (installed) | NavigationMenu, Dialog | Yes | ^1.4.1 in pkg | — |
| shadcn dialog (not yet added) | SizeGuideModal | Partial | — | Run: `npx shadcn add dialog` |
| next-intl (installed) | Translations, routing | Yes | ^4.11.0 in pkg | — |

**Missing dependencies with no fallback:** none — all blocking dependencies are available.
**shadcn dialog:** Single CLI install, no blocker. Planner should include `npx shadcn add dialog` as Wave 0 task.

---

## Validation Architecture

No test framework is installed (no jest, vitest, playwright, cypress in `package.json`). `nyquist_validation` is `true` in config.json, so validation architecture must be documented.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None installed — Wave 0 must add `vitest` + `@testing-library/react` |
| Config file | None — Wave 0 creates `vitest.config.ts` |
| Quick run command | `npx vitest run --reporter=dot` (after install) |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SHOP-01 | getAllProducts() returns product array | unit | `vitest run tests/products.test.ts` | ❌ Wave 0 |
| SHOP-02 | getProductsByCategory filters correctly | unit | `vitest run tests/products.test.ts` | ❌ Wave 0 |
| SHOP-03 | ProductCard renders name + price | unit | `vitest run tests/ProductCard.test.tsx` | ❌ Wave 0 |
| SHOP-04 | Filter + sort produces correct subset | unit | `vitest run tests/products.test.ts` | ❌ Wave 0 |
| PDP-03 | SAR price formatter outputs correct string | unit | `vitest run tests/formatPrice.test.ts` | ❌ Wave 0 |
| PDP-04 | OOS sizes get aria-disabled="true" | unit | `vitest run tests/SizeSelector.test.tsx` | ❌ Wave 0 |
| PDP-05 | AddToCartButton calls store.addItem on click | unit | `vitest run tests/AddToCartButton.test.tsx` | ❌ Wave 0 |
| PDP-08 | getRelatedProducts excludes current product | unit | `vitest run tests/products.test.ts` | ❌ Wave 0 |
| CART-03 (partial) | CartStore addItem updates items array | unit | `vitest run tests/cartStore.test.ts` | ❌ Wave 0 |
| PDP-01, PDP-02, PDP-06, PDP-07, PDP-09, PDP-10, ANIM-03 | Visual/layout correctness, JSON-LD present, animation behaviors | manual | Browser inspection, DOM check | manual-only |

### Sampling Rate

- **Per task commit:** `npx vitest run tests/[relevant-file].test.ts -x` (fast unit test for changed file)
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `tests/products.test.ts` — covers SHOP-01, SHOP-02, SHOP-04, PDP-08
- [ ] `tests/formatPrice.test.ts` — covers PDP-03
- [ ] `tests/SizeSelector.test.tsx` — covers PDP-04
- [ ] `tests/AddToCartButton.test.tsx` — covers PDP-05
- [ ] `tests/cartStore.test.ts` — covers CART-03 (partial, addItem logic)
- [ ] `tests/ProductCard.test.tsx` — covers SHOP-03
- [ ] `vitest.config.ts` — shared config
- [ ] `tests/setup.ts` — @testing-library/react setup
- [ ] Framework install: `npm install -D vitest @testing-library/react @testing-library/user-event @vitejs/plugin-react jsdom`

---

## Security Domain

Phase 2 introduces no authentication, no user input beyond size selection and form interactions, and no server-side API routes. The one security-relevant item is JSON-LD injection.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | N/A — no auth in Phase 2 |
| V3 Session Management | No | N/A |
| V4 Access Control | No | N/A |
| V5 Input Validation | Minimal | JSON-LD payload sanitization: `.replace(/</g, '\\u003c')` prevents XSS via product name/description |
| V6 Cryptography | No | N/A |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via JSON-LD injection (malicious `<script>` in product name/description) | Tampering | `.replace(/</g, '\\u003c')` in `JSON.stringify` output — documented Next.js official pattern |
| Client-side cart tampering (localStorage) | Tampering | Acceptable for frontend-only phase; backend will validate on purchase. Document as known limitation. |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `Intl.NumberFormat('ar-SA-u-nu-latn', { style:'currency', currency:'SAR' })` produces Western numerals in both EN and AR | Code Examples — SAR formatting | Price numerals might render as Arabic-Indic digits; test in actual browser to confirm |
| A2 | Product `images: []` (empty array) is fine for Phase 2 because PlaceholderImage uses a data URI src — the images array is ignored during Phase 2 | Product data population | If PlaceholderImage or PDPGallery reads `product.images[0]`, it would receive `undefined`; gallery components should use data URI directly as established in Phase 1 |
| A3 | `@base-ui/react` v1.4.1 NavigationMenu hover-intent behavior (open on mouse enter trigger, close on mouse leave panel) works correctly without additional configuration | Architecture Patterns — Pattern 9 | If base-ui's hover behavior has bugs at this version, a manual state fallback with `onMouseEnter`/`onMouseLeave` may be needed |
| A4 | `npx shadcn add dialog` adds a base-ui Dialog component consistent with the Phase 1 Sheet pattern (render prop, not Radix asChild) | Standard Stack | If shadcn has changed the dialog template, the SizeGuideModal implementation pattern may differ; verify after install |

**If this table is empty:** Not the case — 4 assumptions logged.

---

## Open Questions

1. **`/shop` vs `/shop/[category]` as filter mechanism**
   - What we know: D-03 says query params; D-04 says both `/shop` (with tabs) and `/shop/tops` (path) exist. The routing.ts from next-intl needs to know about `/shop/[category]`.
   - What's unclear: Does the next-intl `routing.ts` need explicit pathnames config for `/shop/[category]` or does dynamic routing work transparently?
   - Recommendation: Dynamic routes (`[category]`) in Next.js work without explicit next-intl pathname configuration. The `Link` from `@/i18n/navigation` adds the locale prefix; the `[category]` segment is just a regular dynamic segment. No change needed to `routing.ts`.

2. **`inStock` derived vs stored on Product**
   - What we know: `Product.inStock: boolean` exists in domain.ts. The `StockStateBadge` needs to distinguish "in-stock", "partial", and "out-of-stock".
   - What's unclear: The existing `inStock` field is a simple boolean — it cannot express "partial" state. Partial OOS must be derived: `product.sizes.some(s => s.inStock) && product.sizes.some(s => !s.inStock)`.
   - Recommendation: Compute stock state in a helper function `getStockState(product): 'in-stock' | 'partial' | 'out-of-stock'`. Add this to `lib/products.ts`. Do not change the `Product` type (it is the backend contract — shape must not change).

---

## Sources

### Primary (HIGH confidence)
- Next.js official docs (v16.2.5, 2026-05-06) — `searchParams` Promise type, dynamic routes, JSON-LD pattern: https://nextjs.org/docs/app/api-reference/file-conventions/page
- Next.js official docs — JSON-LD guide: https://nextjs.org/docs/app/guides/json-ld
- Next.js official docs — Linking and Navigating (window.history.pushState for sort): https://nextjs.org/docs/app/getting-started/linking-and-navigating
- Next.js official docs — Dynamic Routes: https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes
- Motion official docs — AnimatePresence, mode="wait", key swap: https://motion.dev/docs/react-animate-presence
- base-ui official docs — NavigationMenu hover behavior: https://base-ui.com/react/components/navigation-menu
- next-intl official docs — useRouter with query params: https://next-intl.dev/docs/routing/navigation
- Zustand official docs — persist skipHydration + rehydrate(): https://zustand.docs.pmnd.rs/reference/middlewares/persist
- Codebase scan — confirmed versions, installed components, established patterns: `package.json`, `src/components/ui/navigation-menu.tsx`, `src/components/ui/button.tsx`, `src/lib/animation-presets.ts`, `src/hooks/useDirection.ts`

### Secondary (MEDIUM confidence)
- Zustand hydration mismatch patterns (multiple community sources, cross-verified): https://github.com/pmndrs/zustand/discussions/1382, https://github.com/pmndrs/zustand/issues/938

### Tertiary (LOW confidence)
- SAR `Intl.NumberFormat` with `'ar-SA-u-nu-latn'` locale identifier (A1 in assumptions log — should be browser-verified): based on Web API spec and CLAUDE.md project directive

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages installed, versions verified against npm registry
- Architecture patterns: HIGH — Next.js 15 docs consulted for searchParams, JSON-LD, dynamic routes; Zustand docs for skipHydration
- Phase 1 contracts: HIGH — codebase read directly (PlaceholderImage, animationPresets, useDirection, Navbar, navigation.ts)
- Animation patterns: HIGH — Motion docs consulted for AnimatePresence key swap
- Pitfalls: HIGH — confirmed against official Next.js 15 migration notes (async params/searchParams)
- Product data: MEDIUM — content is at Claude's discretion; structure matches domain.ts contract

**Research date:** 2026-05-07
**Valid until:** 2026-06-07 (stable stack — Next.js, Zustand, Motion are not fast-moving within minor versions)
