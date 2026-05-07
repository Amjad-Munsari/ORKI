# Phase 2: Core Shopping — Pattern Map

**Mapped:** 2026-05-07
**Files analyzed:** 23 (new + modified)
**Analogs found:** 23 / 23

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/app/[locale]/shop/page.tsx` | page (Server Component) | request-response | `src/app/[locale]/layout.tsx` | role-match |
| `src/app/[locale]/shop/[category]/page.tsx` | page (Server Component) | request-response | `src/app/[locale]/layout.tsx` | role-match |
| `src/app/[locale]/shop/[category]/[slug]/page.tsx` | page (Server Component) | request-response | `src/app/[locale]/layout.tsx` | role-match |
| `src/components/shop/ProductCard.tsx` | component (Server) | transform | `src/components/PlaceholderImage.tsx` + `src/app/[locale]/page.tsx` | role-match |
| `src/components/shop/ProductGrid.tsx` | component (Server) | transform | `src/app/[locale]/page.tsx` | role-match |
| `src/components/shop/ShopHeader.tsx` | component (Client) | request-response | `src/components/nav/LanguageSwitcher.tsx` | role-match |
| `src/components/shop/StockStateBadge.tsx` | component (Server) | transform | `src/components/footer/Footer.tsx` | role-match |
| `src/components/pdp/PDPGallery.tsx` | component (Server) | transform | `src/components/PlaceholderImage.tsx` | exact |
| `src/components/pdp/PDPLayout.tsx` | component (Server) | transform | `src/app/[locale]/page.tsx` | role-match |
| `src/components/pdp/SizeSelector.tsx` | component (Client) | event-driven | `src/components/nav/LanguageSwitcher.tsx` | role-match |
| `src/components/pdp/SizeGuideModal.tsx` | component (Client) | event-driven | `src/components/ui/sheet.tsx` + `src/components/nav/MobileNavDrawer.tsx` | exact |
| `src/components/pdp/AddToCartButton.tsx` | component (Client) | event-driven | `src/components/nav/MobileNavDrawer.tsx` | exact |
| `src/components/pdp/RelatedProducts.tsx` | component (Server) | CRUD | `src/app/[locale]/page.tsx` | role-match |
| `src/components/nav/CategoryDropdown.tsx` | component (Client) | event-driven | `src/components/nav/MobileNavDrawer.tsx` + `src/components/ui/navigation-menu.tsx` | exact |
| `src/components/nav/CartBadge.tsx` | component (Client) | event-driven | `src/components/nav/MobileNavDrawer.tsx` | role-match |
| `src/store/cartStore.ts` | store | CRUD | `src/lib/products.ts` (data-layer pattern) | partial |
| `src/store/StoreHydration.tsx` | component (Client) | event-driven | `src/components/nav/LanguageSwitcher.tsx` | partial |
| `src/data/products.ts` | data | CRUD | existing stub at same path | exact |
| `src/lib/products.ts` | utility | CRUD | existing at same path | exact |
| `src/lib/animation-presets.ts` | utility | transform | existing at same path | exact |
| `src/components/nav/Navbar.tsx` | component (Server) | request-response | existing at same path | exact |
| `messages/en.json` + `messages/ar.json` | config | transform | existing at same paths | exact |

---

## Pattern Assignments

### `src/app/[locale]/shop/page.tsx` (page, request-response)

**Analog:** `src/app/[locale]/layout.tsx`

**Async params / searchParams pattern** (`src/app/[locale]/layout.tsx` lines 24–26):
```typescript
// Both params and searchParams are Promises in Next.js 15 — ALWAYS await
export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
```

**Full page pattern for shop — reading both params and searchParams:**
```typescript
// src/app/[locale]/shop/page.tsx
import { getTranslations } from 'next-intl/server'
import { getAllProducts } from '@/lib/products'
import { ShopHeader } from '@/components/shop/ShopHeader'
import { ProductGrid } from '@/components/shop/ProductGrid'
import { Locale } from '@/types/domain'
import { Suspense } from 'react'

type Props = {
  params: Promise<{ locale: Locale }>
  searchParams: Promise<{ category?: string; sort?: string }>
}

export default async function ShopPage({ params, searchParams }: Props) {
  const { locale } = await params
  const { category = 'all', sort = 'newest' } = await searchParams
  const t = await getTranslations({ locale, namespace: 'Shop' })

  let products = getAllProducts()
  if (category === 'tops' || category === 'bottoms') {
    products = products.filter(p => p.category === category)
  }
  if (sort === 'price-asc') products = [...products].sort((a, b) => a.price - b.price)
  else if (sort === 'price-desc') products = [...products].sort((a, b) => b.price - a.price)

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-12">
      <Suspense fallback={null}>
        <ShopHeader
          activeCategory={category as 'all' | 'tops' | 'bottoms'}
          activeSort={sort as 'newest' | 'price-asc' | 'price-desc'}
          productCount={products.length}
          locale={locale}
        />
      </Suspense>
      <ProductGrid products={products} locale={locale} />
    </div>
  )
}
```

**Key rules:**
- `searchParams` is a `Promise` — must `await` at the top
- Server Components use `getTranslations` (not `useTranslations`) — from `next-intl/server`
- `ShopHeader` uses `useSearchParams()` so it must be wrapped in `<Suspense>`
- `Link` and `useRouter` always from `@/i18n/navigation` — never `next/navigation`

---

### `src/app/[locale]/shop/[category]/page.tsx` (page, request-response)

**Analog:** `src/app/[locale]/layout.tsx` lines 24–26 (async params pattern)

**Pattern — category page as pre-filtered alias:**
```typescript
// src/app/[locale]/shop/[category]/page.tsx
type Props = {
  params: Promise<{ locale: Locale; category: 'tops' | 'bottoms' }>
  searchParams: Promise<{ sort?: string }>
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { locale, category } = await params
  const { sort = 'newest' } = await searchParams

  let products = getProductsByCategory(category)
  if (sort === 'price-asc') products = [...products].sort((a, b) => a.price - b.price)
  else if (sort === 'price-desc') products = [...products].sort((a, b) => b.price - a.price)

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-12">
      <Suspense fallback={null}>
        <ShopHeader
          activeCategory={category}
          activeSort={sort as 'newest' | 'price-asc' | 'price-desc'}
          productCount={products.length}
          locale={locale}
        />
      </Suspense>
      <ProductGrid products={products} locale={locale} />
    </div>
  )
}
```

---

### `src/app/[locale]/shop/[category]/[slug]/page.tsx` (page, request-response + JSON-LD)

**Analog:** `src/app/[locale]/layout.tsx` lines 24–26 (async params)

**Full pattern — async params + JSON-LD + `notFound()`:**
```typescript
// src/app/[locale]/shop/[category]/[slug]/page.tsx
import { notFound } from 'next/navigation'
import { getProductBySlug, getStockState } from '@/lib/products'
import { PDPLayout } from '@/components/pdp/PDPLayout'
import { PDPGallery } from '@/components/pdp/PDPGallery'
import { SizeSelector } from '@/components/pdp/SizeSelector'
import { AddToCartButton } from '@/components/pdp/AddToCartButton'
import { StockStateBadge } from '@/components/shop/StockStateBadge'
import { RelatedProducts } from '@/components/pdp/RelatedProducts'
import type { Locale } from '@/types/domain'

type Props = {
  params: Promise<{ locale: Locale; category: string; slug: string }>
}

export default async function ProductPage({ params }: Props) {
  const { locale, slug } = await params
  const product = getProductBySlug(slug)
  if (!product) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name.en,
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

  return (
    <>
      {/* JSON-LD: use native <script> tag, NOT next/script */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <div className="max-w-[1280px] mx-auto px-6 py-12">
        <PDPLayout
          gallery={<PDPGallery productName={product.name[locale]} locale={locale} />}
          info={/* SizeSelector, AddToCartButton, StockStateBadge, return policy */}
        />
        <RelatedProducts
          currentProductId={product.id}
          category={product.category}
          locale={locale}
        />
      </div>
    </>
  )
}
```

**Critical:** `notFound()` from `next/navigation` is acceptable — it's a navigation utility, not a Link/router. Only `Link` and `useRouter` must come from `@/i18n/navigation`.

---

### `src/components/shop/ProductCard.tsx` (component, Server, transform)

**Analog:** `src/components/PlaceholderImage.tsx` (image slot pattern) + `src/app/[locale]/page.tsx` (grid item pattern)

**PlaceholderImage usage pattern** (`src/components/PlaceholderImage.tsx` lines 27–32):
```typescript
// PlaceholderImage accepts aspectRatio, alt, priority, className
// Phase 2: add src prop for real images; no layout change needed
export function PlaceholderImage({
  aspectRatio,  // '3/4' for ProductCard, '4/5' for PDP
  alt,
  priority = false,
  className = '',
}: PlaceholderImageProps)
```

**Grid item + link pattern** (`src/app/[locale]/page.tsx` lines 8–10):
```typescript
import {useTranslations} from 'next-intl';
import {PlaceholderImage} from '@/components/PlaceholderImage';
// Server Component — no 'use client' directive
```

**Full ProductCard pattern:**
```typescript
// src/components/shop/ProductCard.tsx — Server Component (no 'use client')
import { Link } from '@/i18n/navigation'
import { PlaceholderImage } from '@/components/PlaceholderImage'
import { StockStateBadge } from '@/components/shop/StockStateBadge'
import type { Product, Locale } from '@/types/domain'

interface ProductCardProps {
  product: Product
  locale: Locale
  priority?: boolean
}

export function ProductCard({ product, locale, priority = false }: ProductCardProps) {
  const stockState = getStockState(product)
  const formattedPrice = new Intl.NumberFormat('ar-SA-u-nu-latn', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(product.price)

  return (
    // 'group' class on Link enables group-hover on inner elements (Tailwind pitfall!)
    <Link href={`/shop/${product.category}/${product.slug}`} className="group block">
      {/* Image wrapper — overflow-hidden clips the scale transform */}
      <div className="relative overflow-hidden bg-[#111111]">
        <PlaceholderImage
          aspectRatio="3/4"
          alt={product.name[locale]}
          priority={priority}
          // group-hover:scale-[1.04] — image zoom on card hover (D-09, ANIM-03)
          // transition uses animationPresets.cardHover values (300ms ease-out)
          className="transition-transform duration-300 ease-out group-hover:scale-[1.04]"
        />
        {stockState === 'out-of-stock' && (
          <StockStateBadge state="out-of-stock" locale={locale} context="card" />
        )}
      </div>
      {/* Product info below image */}
      <div className="pt-3 pb-4 px-0">
        {/* group-hover:underline fires simultaneously with image zoom (D-09) */}
        <p className="text-base font-normal text-white line-clamp-2 group-hover:underline decoration-white underline-offset-[3px]">
          {product.name[locale]}
        </p>
        <p className="text-sm font-normal text-white/60 mt-1">{formattedPrice}</p>
      </div>
    </Link>
  )
}
```

**Critical pitfalls:**
- `group` class MUST be on the outer `<Link>` or `group-hover:` variants have no effect
- CSS logical properties: `ps-`, `pe-` not `pl-`, `pr-`
- `Link` from `@/i18n/navigation` — not `next/link`

---

### `src/components/shop/ProductGrid.tsx` (component, Server, transform)

**Analog:** `src/app/[locale]/page.tsx` lines 22–33 (grid pattern)

**Grid pattern** (`src/app/[locale]/page.tsx` lines 22–33):
```typescript
<section className="max-w-[1280px] mx-auto px-6 py-12">
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    {Array.from({length: 4}).map((_, i) => (
      <PlaceholderImage key={i} aspectRatio="3/4" alt={t('imageAlt')} />
    ))}
  </div>
</section>
```

**Full ProductGrid pattern:**
```typescript
// src/components/shop/ProductGrid.tsx — Server Component (no 'use client')
import { ProductCard } from '@/components/shop/ProductCard'
import type { Product, Locale } from '@/types/domain'

interface ProductGridProps {
  products: Product[]
  locale: Locale
}

export function ProductGrid({ products, locale }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="text-white text-lg font-semibold mb-2">
          {locale === 'ar' ? 'لا يوجد شيء هنا بعد.' : 'Nothing here yet.'}
        </p>
        <p className="text-white/60 text-base">
          {locale === 'ar'
            ? 'تصفح جميع المنتجات أو جرّب فئة أخرى.'
            : 'Browse all products or try a different category.'}
        </p>
      </div>
    )
  }
  return (
    // grid-cols-2 mobile, grid-cols-3 md, grid-cols-4 xl (per UI-SPEC)
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {products.map((product, i) => (
        <ProductCard
          key={product.id}
          product={product}
          locale={locale}
          priority={i < 4} // first 4 cards above fold
        />
      ))}
    </div>
  )
}
```

---

### `src/components/shop/ShopHeader.tsx` (component, Client, request-response)

**Analog:** `src/components/nav/LanguageSwitcher.tsx` (useRouter + usePathname from `@/i18n/navigation`)

**URL-update pattern** (`src/components/nav/LanguageSwitcher.tsx` lines 4–16):
```typescript
'use client';
import {useLocale, useTranslations} from 'next-intl';
import {useRouter, usePathname} from '@/i18n/navigation';

export function LanguageSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  // ...
  function handleSwitch() {
    router.replace(pathname, {locale: nextLocale})
  }
}
```

**ShopHeader full pattern:**
```typescript
// src/components/shop/ShopHeader.tsx — Client Component
'use client'
import { useRouter, usePathname } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'  // OK for reading current URL in Client Component
import { useTranslations } from 'next-intl'
import type { Locale } from '@/types/domain'

interface ShopHeaderProps {
  activeCategory: 'all' | 'tops' | 'bottoms'
  activeSort: 'newest' | 'price-asc' | 'price-desc'
  productCount: number
  locale: Locale
}

export function ShopHeader({ activeCategory, activeSort, productCount, locale }: ShopHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()  // useSearchParams requires <Suspense> wrapping in parent
  const t = useTranslations('Shop')

  function setCategory(category: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (category === 'all') params.delete('category')
    else params.set('category', category)
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  function setSort(sort: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (sort === 'newest') params.delete('sort')
    else params.set('sort', sort)
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }
  // render tabs + sort select...
}
```

**Critical:** `useSearchParams` requires `<Suspense>` wrapper in the parent Server Component page. `useRouter` from `@/i18n/navigation` (NOT `next/navigation`) to preserve locale prefix.

---

### `src/components/shop/StockStateBadge.tsx` (component, Server, transform)

**Analog:** `src/components/footer/Footer.tsx` (simple Server Component with conditional rendering and translation)

**Server Component with translations pattern** (`src/components/footer/Footer.tsx` lines 1–7):
```typescript
import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
import {Separator} from '@/components/ui/separator';

export function Footer() {
  const t = useTranslations('Footer');
  // conditional rendering below
```

**StockStateBadge pattern:**
```typescript
// src/components/shop/StockStateBadge.tsx — Server Component (no 'use client')
import type { Locale } from '@/types/domain'

type StockState = 'in-stock' | 'partial' | 'out-of-stock'

interface StockStateBadgeProps {
  state: StockState
  locale: Locale
  context: 'card' | 'pdp'
}

export function StockStateBadge({ state, locale, context }: StockStateBadgeProps) {
  if (state === 'in-stock') return null

  if (context === 'card' && state === 'out-of-stock') {
    return (
      // Absolute positioned over image bottom — logical property inset-inline-start-0
      <div
        role="status"
        className="absolute bottom-0 inset-inline-start-0 inset-inline-end-0 px-3 py-2
                   bg-black/80 text-white text-xs font-normal"
      >
        {locale === 'ar' ? 'نفد المخزون' : 'Out of Stock'}
      </div>
    )
  }

  if (context === 'pdp') {
    if (state === 'partial') {
      return (
        <p role="status" className="text-sm text-white/60 mt-2">
          {locale === 'ar' ? 'بعض المقاسات نفدت' : 'Some sizes sold out'}
        </p>
      )
    }
    if (state === 'out-of-stock') {
      return (
        <p role="status" className="text-sm text-destructive mt-2 flex items-center gap-1">
          {locale === 'ar' ? 'نفد المخزون' : 'Out of Stock'}
        </p>
      )
    }
  }

  return null
}
```

---

### `src/components/pdp/PDPGallery.tsx` (component, Server, transform)

**Analog:** `src/components/PlaceholderImage.tsx` (direct — this component stacks 3 PlaceholderImage slots)

**PlaceholderImage stacking** (`src/app/[locale]/page.tsx` lines 10–17 shows single-image slot):
```typescript
<section className="w-full max-h-[80vh] overflow-hidden">
  <PlaceholderImage
    aspectRatio="4/5"
    alt={t('imageAlt')}
    priority  // first image gets priority
    className="w-full"
  />
</section>
```

**PDPGallery pattern:**
```typescript
// src/components/pdp/PDPGallery.tsx — Server Component (no 'use client')
import { PlaceholderImage } from '@/components/PlaceholderImage'
import type { Locale } from '@/types/domain'

interface PDPGalleryProps {
  productName: string
  locale: Locale
}

export function PDPGallery({ productName, locale }: PDPGalleryProps) {
  const imageSlots = [
    { n: 1, alt: locale === 'ar' ? `${productName} — صورة 1` : `${productName} — image 1`, priority: true },
    { n: 2, alt: locale === 'ar' ? `${productName} — صورة 2` : `${productName} — image 2`, priority: false },
    { n: 3, alt: locale === 'ar' ? `${productName} — صورة 3` : `${productName} — image 3`, priority: false },
  ]

  return (
    <div className="flex flex-col gap-4">
      {imageSlots.map(slot => (
        <PlaceholderImage
          key={slot.n}
          aspectRatio="4/5"
          alt={slot.alt}
          priority={slot.priority}
        />
      ))}
    </div>
  )
}
```

---

### `src/components/pdp/PDPLayout.tsx` (component, Server, transform)

**Analog:** `src/app/[locale]/page.tsx` (layout composition with sections)

**Two-column sticky layout pattern:**
```typescript
// src/components/pdp/PDPLayout.tsx — Server Component (no 'use client')
interface PDPLayoutProps {
  gallery: React.ReactNode
  info: React.ReactNode
}

export function PDPLayout({ gallery, info }: PDPLayoutProps) {
  return (
    // Mobile: single column (flex-col). Desktop (md+): two-column grid
    <div className="flex flex-col gap-8 md:grid md:grid-cols-[55%_45%] md:gap-12 xl:gap-16">
      {/* Left column: gallery — scrolls with page */}
      <div>{gallery}</div>
      {/* Right column: sticky info panel — self-start REQUIRED for sticky to work in grid */}
      <div className="sticky top-16 self-start">
        {info}
      </div>
    </div>
  )
}
```

**Critical:** `self-start` is mandatory. Without it, the element stretches to fill the grid row and sticky has nothing to scroll against (see RESEARCH.md Pitfall 5).

---

### `src/components/pdp/SizeSelector.tsx` (component, Client, event-driven)

**Analog:** `src/components/nav/LanguageSwitcher.tsx` (Client Component with button click + state + locale-aware text)

**Client Component button pattern** (`src/components/nav/LanguageSwitcher.tsx` lines 1–16):
```typescript
'use client';
import {useLocale, useTranslations} from 'next-intl';
import {useRouter, usePathname} from '@/i18n/navigation';

export function LanguageSwitcher() {
  // ...
  function handleSwitch() { router.replace(pathname, {locale: nextLocale}) }
  return (
    <button
      onClick={handleSwitch}
      className="flex items-center justify-center min-h-[44px] min-w-[44px] ..."
    >
```

**SizeSelector pattern:**
```typescript
// src/components/pdp/SizeSelector.tsx — Client Component
'use client'
import { useTranslations } from 'next-intl'
import type { Size, Locale } from '@/types/domain'

interface SizeSelectorProps {
  sizes: Size[]
  selectedSize: string | null
  onSizeChange: (label: string) => void
  locale: Locale
}

export function SizeSelector({ sizes, selectedSize, onSizeChange, locale }: SizeSelectorProps) {
  const t = useTranslations('Shop')

  return (
    <div>
      {/* Label row — "Size" text + Size Guide link */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-normal text-white/60">
          {locale === 'ar' ? 'المقاس' : 'Size'}
        </span>
        {/* SizeGuideModal trigger — imported here */}
      </div>
      {/* Button group */}
      <div className="flex flex-wrap gap-2">
        {sizes.map(size => {
          const isSelected = selectedSize === size.label
          const isOOS = !size.inStock
          return (
            <button
              key={size.label}
              onClick={() => !isOOS && onSizeChange(size.label)}
              aria-disabled={isOOS ? 'true' : undefined}
              tabIndex={isOOS ? -1 : undefined}
              className={[
                // Base: 44×44 min touch target, rounded, border
                'relative overflow-hidden min-w-[44px] min-h-[44px] px-3 rounded-lg border',
                'text-sm font-normal transition-colors duration-150',
                isOOS
                  ? 'opacity-40 cursor-not-allowed border-white/[0.12] text-white/60'  // OOS state
                  : isSelected
                    ? 'bg-white text-black border-white'  // selected state
                    : 'bg-transparent text-white/60 border-white/[0.12] hover:border-white hover:text-white',  // rest/hover
                // OOS diagonal strikethrough via Tailwind arbitrary before: pseudo-element
                isOOS && "before:absolute before:inset-0 before:bg-[linear-gradient(to_bottom_right,transparent_calc(50%-0.5px),rgba(255,255,255,0.4)_calc(50%-0.5px),rgba(255,255,255,0.4)_calc(50%+0.5px),transparent_calc(50%+0.5px))]",
              ].filter(Boolean).join(' ')}
            >
              {size.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

---

### `src/components/pdp/SizeGuideModal.tsx` (component, Client, event-driven)

**Analog:** `src/components/ui/sheet.tsx` (base-ui Dialog pattern) + `src/components/nav/MobileNavDrawer.tsx` (trigger + Sheet open/close state)

**Sheet/Dialog primitive pattern** (`src/components/ui/sheet.tsx` lines 1–19):
```typescript
"use client"
import { Dialog as SheetPrimitive } from "@base-ui/react/dialog"
// ...
function Sheet({ ...props }: SheetPrimitive.Root.Props) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}
function SheetTrigger({ ...props }: SheetPrimitive.Trigger.Props) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}
```

**Open/close state pattern** (`src/components/nav/MobileNavDrawer.tsx` lines 1–3, 47):
```typescript
'use client';
import {useState} from 'react';
// ...
const [isOpen, setIsOpen] = useState(false);
// ...
<Sheet open={isOpen} onOpenChange={setIsOpen}>
```

**SizeGuideModal pattern — uses Dialog (same base-ui/dialog primitive as Sheet):**
```typescript
// src/components/pdp/SizeGuideModal.tsx — Client Component
'use client'
import { Dialog } from '@/components/ui/dialog'  // after: npx shadcn add dialog
import { X } from 'lucide-react'
import type { Locale } from '@/types/domain'

interface SizeGuideModalProps {
  locale: Locale
}

export function SizeGuideModal({ locale }: SizeGuideModalProps) {
  return (
    <Dialog.Root>
      <Dialog.Trigger
        render={
          <button className="text-sm font-normal text-white/60 hover:text-white transition-colors duration-150 min-h-[44px]" />
        }
      >
        {locale === 'ar' ? 'دليل المقاسات' : 'Size Guide'}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60" />
        <Dialog.Popup className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-[480px] bg-[#111111] border border-white/[0.12] rounded-xl p-6">
            {/* Title + close row */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold tracking-[-0.02em]">
                {locale === 'ar' ? 'دليل المقاسات' : 'Size Guide'}
              </h2>
              <Dialog.Close
                render={
                  <button
                    aria-label={locale === 'ar' ? 'إغلاق' : 'Close'}
                    className="flex items-center justify-center min-h-[44px] min-w-[44px] text-white/60 hover:text-white"
                  />
                }
              >
                <X className="size-5" aria-hidden="true" />
              </Dialog.Close>
            </div>
            {/* Measurements table — see UI-SPEC for full data */}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
```

**Note:** After `npx shadcn add dialog`, the import path may be `@/components/ui/dialog`. The primitive pattern (`Root`, `Trigger`, `Portal`, `Backdrop`, `Popup`, `Close`) mirrors `sheet.tsx` exactly since both use `@base-ui/react/dialog`.

---

### `src/components/pdp/AddToCartButton.tsx` (component, Client, event-driven)

**Analog:** `src/components/nav/MobileNavDrawer.tsx` (AnimatePresence key swap for icon morph)

**AnimatePresence key swap pattern** (`src/components/nav/MobileNavDrawer.tsx` lines 57–79):
```typescript
import {motion, AnimatePresence, useReducedMotion} from 'motion/react';
// ...
<AnimatePresence mode="wait" initial={false}>
  {isOpen ? (
    <motion.span
      key="close"
      initial={{opacity: 0, scale: 0.95}}
      animate={{opacity: 1, scale: 1}}
      exit={{opacity: 0, scale: 0.95}}
      transition={{duration: 0.2, ease: [0.23, 1, 0.32, 1]}}
    >
      <X weight="bold" size={24} aria-hidden="true" />
    </motion.span>
  ) : (
    <motion.span
      key="open"
      // ...same motion props...
    >
      <List weight="bold" size={24} aria-hidden="true" />
    </motion.span>
  )}
</AnimatePresence>
```

**AddToCartButton pattern:**
```typescript
// src/components/pdp/AddToCartButton.tsx — Client Component
'use client'
import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Check } from 'lucide-react'
import { animationPresets } from '@/lib/animation-presets'
import { useCartStore } from '@/store/cartStore'
import type { Product, Locale } from '@/types/domain'

type ButtonState = 'idle' | 'success'

interface AddToCartButtonProps {
  product: Product
  selectedSize: string | null
  locale: Locale
}

export function AddToCartButton({ product, selectedSize, locale }: AddToCartButtonProps) {
  const [state, setState] = useState<ButtonState>('idle')
  const addItem = useCartStore(s => s.addItem)
  const shouldReduceMotion = useReducedMotion()

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
                 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
                 transition-opacity duration-150"
    >
      <AnimatePresence mode="wait" initial={false}>
        {state === 'idle' ? (
          <motion.span
            key="idle"
            initial={{ opacity: shouldReduceMotion ? 1 : 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: shouldReduceMotion ? 1 : 0 }}
            transition={animationPresets.successState}  // 150ms — added in Phase 2
          >
            {locale === 'ar' ? 'أضف إلى السلة' : 'Add to Cart'}
          </motion.span>
        ) : (
          <motion.span
            key="success"
            initial={{ opacity: shouldReduceMotion ? 1 : 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: shouldReduceMotion ? 1 : 0 }}
            transition={animationPresets.successState}
            className="flex items-center justify-center gap-2"
          >
            <Check className="size-4" aria-hidden="true" />
            {locale === 'ar' ? 'تمت الإضافة' : 'Added'}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
}
```

**Pattern rules:**
- `motion/react` — NOT `framer-motion` (package was rebranded, project uses `motion`)
- `useReducedMotion()` from `motion/react` — apply to `initial`/`exit` opacity to honor a11y preference
- `useCartStore` — only callable in Client Components

---

### `src/components/pdp/RelatedProducts.tsx` (component, Server, CRUD)

**Analog:** `src/app/[locale]/page.tsx` (Server Component calling a lib function and rendering a grid)

**Server Component data fetch + grid pattern** (`src/app/[locale]/page.tsx` lines 1–10):
```typescript
import {useTranslations} from 'next-intl';
import {PlaceholderImage} from '@/components/PlaceholderImage';
// No async needed when calling sync lib functions
export default function HomePage() {
  const t = useTranslations('Placeholder');
  // ...renders grid of items
```

**RelatedProducts pattern:**
```typescript
// src/components/pdp/RelatedProducts.tsx — Server Component (no 'use client')
import { getRelatedProducts } from '@/lib/products'  // function to be added in Phase 2
import { ProductGrid } from '@/components/shop/ProductGrid'
import type { Locale } from '@/types/domain'

interface RelatedProductsProps {
  currentProductId: string
  category: 'tops' | 'bottoms'
  locale: Locale
}

export function RelatedProducts({ currentProductId, category, locale }: RelatedProductsProps) {
  const related = getRelatedProducts(currentProductId, category, 4)
  if (related.length === 0) return null  // hidden entirely — per UI-SPEC Copywriting Contract

  return (
    <section className="mt-16">
      <h2 className="text-xl font-semibold tracking-[-0.02em] mb-8">
        {locale === 'ar' ? 'قد يعجبك أيضاً' : 'You Might Also Like'}
      </h2>
      <ProductGrid products={related} locale={locale} />
    </section>
  )
}
```

---

### `src/components/nav/CategoryDropdown.tsx` (component, Client, event-driven)

**Analog:** `src/components/ui/navigation-menu.tsx` (NavigationMenu primitive) + `src/components/nav/MobileNavDrawer.tsx` (Client Component with locale-aware nav links)

**NavigationMenu primitive exports** (`src/components/ui/navigation-menu.tsx` lines 158–168):
```typescript
export {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
  NavigationMenuPositioner,
}
```

**NavigationMenuTrigger has built-in ChevronDown rotation** (`src/components/ui/navigation-menu.tsx` lines 62–77):
```typescript
function NavigationMenuTrigger({ className, children, ...props }: NavigationMenuPrimitive.Trigger.Props) {
  return (
    <NavigationMenuPrimitive.Trigger
      className={cn(navigationMenuTriggerStyle(), "group", className)}
      {...props}
    >
      {children}{" "}
      <ChevronDownIcon
        className="relative top-px ms-1 size-3 transition duration-300
                   group-data-popup-open/navigation-menu-trigger:rotate-180
                   group-data-open/navigation-menu-trigger:rotate-180"
        aria-hidden="true"
      />
    </NavigationMenuPrimitive.Trigger>
  )
}
```

**CategoryDropdown pattern:**
```typescript
// src/components/nav/CategoryDropdown.tsx — Client Component
'use client'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'  // locale-aware Link
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'
import type { Locale } from '@/types/domain'

interface CategoryDropdownProps {
  locale: Locale
}

export function CategoryDropdown({ locale }: CategoryDropdownProps) {
  const t = useTranslations('Nav')

  return (
    // viewport={false} renders dropdown inline (not in a separate viewport element)
    // This is the correct mode for a navbar dropdown — no separate Positioner portal needed
    <NavigationMenu viewport={false}>
      <NavigationMenuList>
        <NavigationMenuItem>
          {/* Override default trigger styles with ORKI dark theme */}
          <NavigationMenuTrigger
            className="bg-transparent text-white/60 hover:text-white hover:bg-transparent
                       data-popup-open:text-white data-popup-open:bg-transparent
                       text-base font-normal px-0 h-auto"
          >
            {t('categories')}
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="min-w-[160px] bg-[#111111] border border-white/[0.12] rounded-lg py-2">
              <li>
                <NavigationMenuLink asChild>
                  <Link
                    href="/shop/tops"
                    className="block px-4 py-3 text-base font-normal text-white/60
                               hover:text-white hover:bg-white/[0.06] transition-colors duration-150"
                  >
                    {t('tops')}
                  </Link>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink asChild>
                  <Link
                    href="/shop/bottoms"
                    className="block px-4 py-3 text-base font-normal text-white/60
                               hover:text-white hover:bg-white/[0.06] transition-colors duration-150"
                  >
                    {t('bottoms')}
                  </Link>
                </NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}
```

**Note:** The NavigationMenu positioner uses a Portal (`NavigationMenuPositioner` wraps in `NavigationMenuPrimitive.Portal`). Override default `bg-popover` styles at usage site — the primitive applies `group-data-[viewport=false]` classnames that set `bg-popover` and `rounded-lg`. Override these in `NavigationMenuContent` className.

---

### `src/components/nav/CartBadge.tsx` (component, Client, event-driven)

**Analog:** `src/components/nav/MobileNavDrawer.tsx` (AnimatePresence + motion.span conditional render) + `src/components/nav/LanguageSwitcher.tsx` (minimal Client Component reading locale state)

**AnimatePresence conditional pattern** (`src/components/nav/MobileNavDrawer.tsx` lines 57–63):
```typescript
<AnimatePresence mode="wait" initial={false}>
  {isOpen ? (
    <motion.span key="close" initial={{opacity: 0, scale: 0.95}} ...>
```

**CartBadge pattern:**
```typescript
// src/components/nav/CartBadge.tsx — Client Component
'use client'
import { useCartStore } from '@/store/cartStore'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { animationPresets } from '@/lib/animation-presets'

export function CartBadge() {
  // Safe with skipHydration: server renders 0, client rehydrates to actual count
  const count = useCartStore(state =>
    state.items.reduce((n, i) => n + i.quantity, 0)
  )
  const shouldReduceMotion = useReducedMotion()

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.span
          key="badge"
          initial={{ scale: shouldReduceMotion ? 1 : 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: shouldReduceMotion ? 1 : 0 }}
          transition={animationPresets.badgePop}  // 150ms spring — added in Phase 2
          // Logical properties: inset-inline-end not right
          className="absolute top-0 inset-inline-end-0 -translate-y-1/2 translate-x-1/2
                     min-w-[20px] h-5 rounded-full bg-white text-black
                     text-[12px] font-semibold flex items-center justify-center px-1
                     pointer-events-none"
        >
          {count >= 10 ? '9+' : count}
        </motion.span>
      )}
    </AnimatePresence>
  )
}
```

---

### `src/store/cartStore.ts` (store, CRUD)

**Analog:** `src/lib/products.ts` (data-layer module pattern — named exports, typed with domain types)

**Module export pattern** (`src/lib/products.ts` lines 1–9):
```typescript
import {Product} from '@/types/domain';
import {products} from '@/data/products';
// All product data access flows through this file only.
export function getAllProducts(): Product[] {
  return products;
}
```

**CartStore pattern — Zustand with persist + skipHydration:**
```typescript
// src/store/cartStore.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { CartItem, Product } from '@/types/domain'

interface CartState {
  items: CartItem[]
  addItem: (product: Product, selectedSize: string) => void
  removeItem: (productId: string, selectedSize: string) => void
  clearCart: () => void
  getTotalCount: () => number
}

// Curried form: create<State>()() — required for TypeScript inference in Zustand v5
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
      skipHydration: true,  // CRITICAL: prevents SSR hydration mismatch
    }
  )
)
```

---

### `src/store/StoreHydration.tsx` (component, Client, event-driven)

**Analog:** `src/components/nav/LanguageSwitcher.tsx` (minimal Client Component, single responsibility)

**Minimal Client Component pattern** (`src/components/nav/LanguageSwitcher.tsx` lines 1–5):
```typescript
'use client';
import {useLocale, useTranslations} from 'next-intl';
import {useRouter, usePathname} from '@/i18n/navigation';
export function LanguageSwitcher() {
  // one hook, one responsibility, returns JSX
```

**StoreHydration pattern:**
```typescript
// src/store/StoreHydration.tsx — Client Component
'use client'
import { useEffect } from 'react'
import { useCartStore } from './cartStore'

// Renders nothing — exists solely to trigger cart rehydration after client mount.
// Must be placed inside NextIntlClientProvider in layout.tsx.
export function StoreHydration() {
  useEffect(() => {
    // useEffect runs only on client — safe localStorage access
    useCartStore.persist.rehydrate()
  }, [])
  return null
}
```

---

### `src/data/products.ts` (data, CRUD)

**Analog:** Same file — currently a stub. Populate per RESEARCH.md `## Code Examples` section.

**Current stub** (`src/data/products.ts` lines 1–6):
```typescript
import {Product} from '@/types/domain';
// Static product data — populated in Phase 2.
// Do NOT import this file directly from components.
// Always use /lib/products.ts as the data access layer.
export const products: Product[] = [];
```

**Pattern to follow:** Same import structure. Add 6 products covering all stock states as documented in RESEARCH.md Code Examples. Array order = newest-first (default sort).

---

### `src/lib/products.ts` (utility, CRUD)

**Analog:** Same file — extend with two new functions.

**Existing function signature pattern** (`src/lib/products.ts` lines 1–19):
```typescript
import {Product} from '@/types/domain';
import {products} from '@/data/products';
// All product data access flows through this file only.
export function getAllProducts(): Product[] { return products }
export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug)
}
export function getProductsByCategory(category: 'tops' | 'bottoms'): Product[] {
  return products.filter((p) => p.category === category)
}
```

**New functions to add:**
```typescript
// Add below existing exports — same style
export type StockState = 'in-stock' | 'partial' | 'out-of-stock'

export function getStockState(product: Product): StockState {
  const hasAnyInStock = product.sizes.some(s => s.inStock)
  const hasAnyOOS = product.sizes.some(s => !s.inStock)
  if (!hasAnyInStock) return 'out-of-stock'
  if (hasAnyOOS) return 'partial'
  return 'in-stock'
}

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

### `src/lib/animation-presets.ts` (utility, transform)

**Analog:** Same file — extend with new preset keys.

**Existing preset pattern** (`src/lib/animation-presets.ts` lines 1–29):
```typescript
export const animationPresets = {
  navEnter: { duration: 0.2, ease: [0.23, 1, 0.32, 1] as const },
  navExit:  { duration: 0.16, ease: [0.32, 0.72, 0, 1] as const },
  fadeIn:   { duration: 0.2, ease: [0.23, 1, 0.32, 1] as const },
  fadeOut:  { duration: 0.15, ease: [0.32, 0.72, 0, 1] as const },
} as const;
export type AnimationPresetKey = keyof typeof animationPresets;
```

**New presets to add (from UI-SPEC Animation Contract):**
```typescript
// ADD these keys inside the animationPresets object, before the closing `} as const`
cardHover: {
  duration: 0.3,
  ease: [0, 0, 0.2, 1] as const,  // CSS ease-out equivalent — smooth zoom
},
badgePop: {
  duration: 0.15,
  ease: [0.34, 1.56, 0.64, 1] as const,  // slight overshoot for tactile badge pop
},
dropdownOpen: {
  duration: 0.15,
  ease: [0.23, 1, 0.32, 1] as const,  // reuse navEnter easing
},
successState: {
  duration: 0.15,
  ease: [0.23, 1, 0.32, 1] as const,  // label swap fade
},
```

---

### `src/components/nav/Navbar.tsx` (component, modified)

**Analog:** Same file — update to replace direct Tops/Bottoms links with CategoryDropdown + add CartBadge.

**Current Navbar structure** (`src/components/nav/Navbar.tsx` lines 1–59):
```typescript
import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
import {LanguageSwitcher} from './LanguageSwitcher';
import {MobileNavDrawer} from './MobileNavDrawer';

export function Navbar() {
  const t = useTranslations('Nav');
  // ... desktop nav with direct Tops/Bottoms Links
```

**Modifications needed:**
1. Remove `<Link href="/shop/tops">` and `<Link href="/shop/bottoms">` from desktop nav
2. Add `<CategoryDropdown locale={...} />` in their place (Client Component — Navbar stays Server Component, categories dropdown is its own Client boundary)
3. Add `<CartBadge />` to the inline-end cluster next to LanguageSwitcher — wrap the cart icon in `relative` positioned container
4. Add `categories` translation key to `Nav` namespace (see messages section below)

**Cart icon + badge placement:**
```typescript
// In the inline-end cluster <div className="flex items-center gap-4">
<div className="relative">
  {/* Cart icon button */}
  <Link href="/cart" aria-label={t('cart')} className="relative flex items-center justify-center min-h-[44px] min-w-[44px] text-white/60 hover:text-white transition-opacity duration-150">
    <ShoppingCart className="size-5" aria-hidden="true" />
    <CartBadge />
  </Link>
</div>
```

**Note:** Navbar is a Server Component. `CategoryDropdown` and `CartBadge` are Client Components — they form their own client boundaries when imported into a Server Component. This is the correct RSC composition pattern.

---

### `src/app/[locale]/layout.tsx` (layout, modified)

**Analog:** Same file — add `<StoreHydration />` inside `<NextIntlClientProvider>`.

**Current layout body** (`src/app/[locale]/layout.tsx` lines 42–52):
```typescript
<body className="bg-black text-white antialiased min-h-screen flex flex-col">
  <NextIntlClientProvider>
    <Navbar />
    <main className="flex-1">
      {children}
    </main>
    <Footer />
  </NextIntlClientProvider>
</body>
```

**After modification — add StoreHydration as early as possible inside provider:**
```typescript
import { StoreHydration } from '@/store/StoreHydration'
// ...
<NextIntlClientProvider>
  <StoreHydration />  {/* Must be inside provider; renders null; triggers rehydrate() on mount */}
  <Navbar />
  <main className="flex-1">{children}</main>
  <Footer />
</NextIntlClientProvider>
```

---

### `messages/en.json` + `messages/ar.json` (config, transform)

**Analog:** Same files — add Phase 2 namespaces.

**Existing structure** (`messages/en.json` lines 1–24):
```json
{
  "Nav": { "shop": "Shop", "tops": "Tops", ... },
  "Footer": { ... },
  "Placeholder": { ... },
  "Meta": { ... }
}
```

**New keys to add (en.json):**
```json
{
  "Nav": {
    "...existing keys...",
    "categories": "Categories",
    "cart": "Cart"
  },
  "Shop": {
    "tabAll": "All",
    "tabTops": "Tops",
    "tabBottoms": "Bottoms",
    "productCount": "{count} Products",
    "sortLabel": "Sort:",
    "sortNewest": "Newest",
    "sortPriceAsc": "Price: Low to High",
    "sortPriceDesc": "Price: High to Low",
    "emptyHeading": "Nothing here yet.",
    "emptyBody": "Browse all products or try a different category.",
    "sizeLabel": "Size",
    "sizeGuide": "Size Guide",
    "addToCart": "Add to Cart",
    "added": "Added",
    "outOfStock": "Out of Stock",
    "returnPolicy": "Free returns within 14 days. No questions asked.",
    "relatedHeading": "You Might Also Like",
    "someSizesSoldOut": "Some sizes sold out",
    "sizeGuideTitle": "Size Guide",
    "sizeGuideClose": "Close"
  }
}
```

**New keys to add (ar.json) — same structure with AR translations:**
```json
{
  "Nav": {
    "...existing keys...",
    "categories": "الفئات",
    "cart": "السلة"
  },
  "Shop": {
    "tabAll": "الكل",
    "tabTops": "التيشيرتات",
    "tabBottoms": "البناطيل",
    "productCount": "{count} منتجات",
    "sortLabel": "ترتيب:",
    "sortNewest": "الأحدث",
    "sortPriceAsc": "السعر: من الأقل للأعلى",
    "sortPriceDesc": "السعر: من الأعلى للأقل",
    "emptyHeading": "لا يوجد شيء هنا بعد.",
    "emptyBody": "تصفح جميع المنتجات أو جرّب فئة أخرى.",
    "sizeLabel": "المقاس",
    "sizeGuide": "دليل المقاسات",
    "addToCart": "أضف إلى السلة",
    "added": "تمت الإضافة",
    "outOfStock": "نفد المخزون",
    "returnPolicy": "إرجاع مجاني خلال 14 يوماً بدون أي أسئلة.",
    "relatedHeading": "قد يعجبك أيضاً",
    "someSizesSoldOut": "بعض المقاسات نفدت",
    "sizeGuideTitle": "دليل المقاسات",
    "sizeGuideClose": "إغلاق"
  }
}
```

---

## Shared Patterns

### RTL / CSS Logical Properties
**Source:** `src/components/nav/Navbar.tsx`, `src/components/nav/MobileNavDrawer.tsx`, `src/components/footer/Footer.tsx`
**Apply to:** ALL new components — every spacing and position class
```typescript
// BANNED — physical:
ml-4  mr-4  pl-4  pr-4  left-0  right-0
// REQUIRED — logical:
ms-4  me-4  ps-4  pe-4  inset-inline-start-0  inset-inline-end-0
// For CartBadge position: inset-inline-end not right
className="absolute top-0 inset-inline-end-0"
```

### Translation Pattern — Server vs Client Components
**Source:** `src/app/[locale]/page.tsx` (Server), `src/components/nav/LanguageSwitcher.tsx` (Client)
**Apply to:** All new components with user-facing text
```typescript
// Server Component — use getTranslations (async)
import { getTranslations } from 'next-intl/server'
const t = await getTranslations({ locale, namespace: 'Shop' })

// Client Component — use useTranslations (sync hook)
import { useTranslations } from 'next-intl'
const t = useTranslations('Shop')
```

### Navigation — Always `@/i18n/navigation`
**Source:** `src/i18n/navigation.ts`, every component that navigates
**Apply to:** All components using `Link`, `useRouter`, `usePathname`
```typescript
// CORRECT — locale-aware:
import { Link, useRouter, usePathname } from '@/i18n/navigation'

// BANNED:
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// EXCEPTION — useSearchParams reads current URL, not navigation:
import { useSearchParams } from 'next/navigation'  // OK for reading only
```

### Motion Import
**Source:** `src/components/nav/MobileNavDrawer.tsx` line 4
**Apply to:** All components using animations
```typescript
// CORRECT:
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'

// BANNED (old package name):
import { motion } from 'framer-motion'
```

### Reduced Motion
**Source:** `src/components/nav/MobileNavDrawer.tsx` lines 4, 21, 38–39
**Apply to:** AddToCartButton, CartBadge, CategoryDropdown
```typescript
const shouldReduceMotion = useReducedMotion()
// Apply to initial/exit values:
initial={{ opacity: shouldReduceMotion ? 1 : 0 }}
// Or skip scale:
initial={{ scale: shouldReduceMotion ? 1 : 0 }}
```

### Async Params (Next.js 15)
**Source:** `src/app/[locale]/layout.tsx` line 26
**Apply to:** All new page Server Components
```typescript
// Both params and searchParams are Promises in Next.js 15
const { locale } = await params          // always await
const { category = 'all' } = await searchParams  // always await
```

### Touch Target Minimum
**Source:** `src/components/nav/LanguageSwitcher.tsx` line 23, `src/components/nav/MobileNavDrawer.tsx` line 52
**Apply to:** All interactive elements (size buttons, cart icon, close buttons)
```typescript
className="... min-h-[44px] min-w-[44px] ..."
// Size selector buttons also need min 44×44
```

### Animation Presets — No Ad-Hoc Values
**Source:** `src/lib/animation-presets.ts`
**Apply to:** Every `transition={}` prop in Motion components
```typescript
import { animationPresets } from '@/lib/animation-presets'
// Use:  transition={animationPresets.successState}
// Never:  transition={{ duration: 0.15 }}  // inline values banned
```

---

## No Analog Found

All files have analogs. No files require RESEARCH.md patterns as the only reference.

---

## Metadata

**Analog search scope:** `src/` — all .ts and .tsx files (22 files scanned)
**Pattern extraction date:** 2026-05-07
**Files with exact analog:** 8 (files being modified in-place)
**Files with role-match analog:** 15
**Files with no analog:** 0
