import type { Metadata } from 'next'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getProductsByCategory } from '@/lib/products'
import { ShopHeader } from '@/components/shop/ShopHeader'
import { ProductGrid } from '@/components/shop/ProductGrid'
import { buildMetadata } from '@/lib/seo'
import type { Locale } from '@/types/domain'

type Props = {
  params: Promise<{ locale: Locale; category: string }>
  searchParams: Promise<{ sort?: string }>
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; category: string }>
}): Promise<Metadata> {
  const { locale, category } = await params
  return buildMetadata({
    titleKey: `Shop.categories.${category}.title`,
    descriptionKey: `Shop.categories.${category}.description`,
    locale,
    path: `/shop/${category}`,
  })
}

export default async function CategoryPage({ params, searchParams }: Props) {
  // Next.js 15: both params and searchParams are Promises — must await
  const { locale, category } = await params
  const { sort = 'newest' } = await searchParams

  // Validate category — only 'tops' and 'bottoms' are valid segments
  if (category !== 'tops' && category !== 'bottoms') {
    notFound()
  }

  let products = await getProductsByCategory(category)

  if (sort === 'price-asc') {
    products = [...products].sort((a, b) => a.price - b.price)
  } else if (sort === 'price-desc') {
    products = [...products].sort((a, b) => b.price - a.price)
  }

  const activeSort =
    sort === 'price-asc' ? 'price-asc' :
    sort === 'price-desc' ? 'price-desc' :
    'newest'

  return (
    <div className="max-w-[var(--container-max)] mx-auto px-12 py-12">
      {/* ShopHeader uses useSearchParams — MUST be wrapped in Suspense (Next.js 15 requirement) */}
      <Suspense fallback={null}>
        <ShopHeader
          activeCategory={category}
          activeSort={activeSort}
          productCount={products.length}
          locale={locale}
        />
      </Suspense>
      <ProductGrid products={products} locale={locale} />
    </div>
  )
}
