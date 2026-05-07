import { getRelatedProducts } from '@/lib/products'
import { ProductGrid } from '@/components/shop/ProductGrid'
import type { Locale } from '@/types/domain'

interface RelatedProductsProps {
  currentProductId: string
  category: 'tops' | 'bottoms'
  locale: Locale
}

export function RelatedProducts({ currentProductId, category, locale }: RelatedProductsProps) {
  const related = getRelatedProducts(currentProductId, category, 4)

  if (related.length === 0) return null

  return (
    <section className="mt-16">
      <h2 className="text-xl font-semibold tracking-[-0.02em] mb-8">
        {locale === 'ar' ? 'قد يعجبك أيضاً' : 'You Might Also Like'}
      </h2>
      <ProductGrid products={related} locale={locale} />
    </section>
  )
}
