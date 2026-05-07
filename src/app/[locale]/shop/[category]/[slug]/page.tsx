import { notFound } from 'next/navigation'
import { getProductBySlug } from '@/lib/products'
import { PDPLayout } from '@/components/pdp/PDPLayout'
import { PDPGallery } from '@/components/pdp/PDPGallery'
import { PDPInfoPanel } from '@/components/pdp/PDPInfoPanel'
import { RelatedProducts } from '@/components/pdp/RelatedProducts'
import type { Locale } from '@/types/domain'

type Props = {
  params: Promise<{ locale: Locale; category: string; slug: string }>
}

export default async function ProductPage({ params }: Props) {
  const { locale, slug } = await params

  const product = getProductBySlug(slug)
  if (!product) notFound()

  // JSON-LD Product schema — PDP-10
  // Native <script> tag (not next/script which is for executable JS)
  // .replace(/</g, '\\u003c') mitigates XSS via product name/description injection
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />

      <div className="max-w-[1280px] mx-auto px-6 py-12">
        <PDPLayout
          gallery={
            <PDPGallery
              images={product.images}
              productName={product.name[locale]}
              locale={locale}
            />
          }
          info={
            <PDPInfoPanel
              product={product}
              locale={locale}
            />
          }
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
