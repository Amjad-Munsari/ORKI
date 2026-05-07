import { Suspense } from 'react'
import { getAllProducts } from '@/lib/products'
import { ShopHeader } from '@/components/shop/ShopHeader'
import { ProductGrid } from '@/components/shop/ProductGrid'
import type { Locale } from '@/types/domain'

type Props = {
  params: Promise<{ locale: Locale }>
  searchParams: Promise<{ category?: string; sort?: string }>
}

export default async function ShopPage({ params, searchParams }: Props) {
  // Next.js 15: both params and searchParams are Promises — must await
  const { locale } = await params
  const { category = 'all', sort = 'newest' } = await searchParams

  // Server-side filtering — unknown category values are ignored (returns all)
  let products = getAllProducts()
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
    <div className="max-w-[1280px] mx-auto px-6 py-12">
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
