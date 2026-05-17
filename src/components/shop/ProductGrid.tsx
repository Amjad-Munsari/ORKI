import { getTranslations } from 'next-intl/server'
import { ProductCard } from '@/components/shop/ProductCard'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import type { Product, Locale } from '@/types/domain'

interface ProductGridProps {
  products: Product[]
  locale: Locale
}

export async function ProductGrid({ products, locale }: ProductGridProps) {
  if (products.length === 0) {
    const t = await getTranslations('Shop.empty')
    // next-intl resolves messages/ar.json for AR users; AR keys added as placeholder
    // values (same strings as pre-Phase-11 inline). Phase 999.11 owns AR voice review.
    return (
      <div className="py-24 text-center">
        <p className="text-white text-lg font-semibold mb-2">
          {t('heading')}
        </p>
        <p className="text-white/60 text-base">
          {t('body')}
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16">
      {products.map((product, i) => (
        <ScrollReveal key={product.id} delay={(i % 4) * 0.1}>
          <ProductCard
            product={product}
            locale={locale}
            priority={i < 4}
          />
        </ScrollReveal>
      ))}
    </div>
  )
}
