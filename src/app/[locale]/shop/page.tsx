import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import { getAllProducts } from '@/lib/products'
import { ShopHeader } from '@/components/shop/ShopHeader'
import { ProductGrid } from '@/components/shop/ProductGrid'
import { buildMetadata } from '@/lib/seo'
import type { Locale, Product } from '@/types/domain'

type Props = {
  params: Promise<{ locale: Locale }>
  searchParams: Promise<{ category?: string; sort?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return buildMetadata({
    path: '/shop',
    locale,
    titleKey: 'Meta.shop.title',
    descriptionKey: 'Meta.shop.description',
  })
}

export default async function ShopPage({ params, searchParams }: Props) {
  // Next.js 15: both params and searchParams are Promises — must await
  const { locale } = await params
  const { category = 'all', sort = 'newest' } = await searchParams

  // Server-side filtering — unknown category values are ignored (returns all).
  // PERF-05: wrap DB read in try/catch so a Supabase blip renders branded
  // fallback copy instead of bubbling to the per-locale error boundary.
  let products: Product[] | null = null
  try {
    products = await getAllProducts()
  } catch (err) {
    console.error('[shop] getAllProducts failed', err)
  }

  if (!products) {
    const tErr = await getTranslations('Errors.section')
    return (
      <div
        role="alert"
        className="min-h-[60vh] flex items-center justify-center px-6"
      >
        <p className="text-lg text-white/60 max-w-md text-center">
          {tErr('shopLoadFailed')}
        </p>
      </div>
    )
  }

  if (category === 'tops' || category === 'bottoms') {
    products = products.filter(p => p.category === category)
  }

  // Server-side sorting — unknown sort values fall through to default (newest = array order)
  if (sort === 'price-asc') {
    products = [...products].sort((a, b) => a.price - b.price)
  } else if (sort === 'price-desc') {
    products = [...products].sort((a, b) => b.price - a.price)
  }

  // Normalize category for ShopHeader prop type
  const activeCategory =
    category === 'tops' ? 'tops' :
    category === 'bottoms' ? 'bottoms' :
    'all'

  const activeSort =
    sort === 'price-asc' ? 'price-asc' :
    sort === 'price-desc' ? 'price-desc' :
    'newest'

  return (
    <div className="max-w-[var(--container-max)] mx-auto px-6 py-12">
      {/* ShopHeader uses useSearchParams — MUST be wrapped in Suspense (Next.js 15 requirement) */}
      <Suspense fallback={null}>
        <ShopHeader
          activeCategory={activeCategory}
          activeSort={activeSort}
          productCount={products.length}
          locale={locale}
        />
      </Suspense>
      <ProductGrid products={products} locale={locale} />
    </div>
  )
}
