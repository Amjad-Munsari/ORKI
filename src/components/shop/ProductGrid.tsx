import { ProductCard } from '@/components/shop/ProductCard'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
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
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
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
