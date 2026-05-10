import { notFound } from 'next/navigation'
import { getProductBySlug } from '@/lib/products'
import { PDPLayout } from '@/components/pdp/PDPLayout'
import { PDPGallery } from '@/components/pdp/PDPGallery'
import { PDPInfoPanel } from '@/components/pdp/PDPInfoPanel'
import { RelatedProducts } from '@/components/pdp/RelatedProducts'
import type { Metadata } from 'next'
import type { Locale } from '@/types/domain'

type Props = {
  params: Promise<{ locale: Locale; category: string; slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params
  const product = await getProductBySlug(slug)

  if (!product) return {}

  // Bare title — root layout's title.template ('%s | ORKI') applies the suffix
  // exactly once. OG/Twitter are NOT subject to title.template, so compose explicitly.
  const title = product.name[locale]
  const fullTitle = `${title} | ORKI`
  const description = product.description[locale]
  const image = product.images[0] || '/images/og-default.png'
  const path = `/shop/${product.category}/${product.slug}`

  return {
    title,
    description,
    alternates: {
      canonical: `https://orki.sa/${locale}${path}`,
      languages: {
        en:          `https://orki.sa/en${path}`,
        ar:          `https://orki.sa/ar${path}`,
        'x-default': `https://orki.sa/en${path}`,
      },
    },
    openGraph: {
      title: fullTitle,
      description,
      images: [image],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [image],
    },
  }
}

export default async function ProductPage({ params }: Props) {
  const { locale, slug } = await params

  const product = await getProductBySlug(slug)
  if (!product) notFound()

  // JSON-LD Product schema — PDP-10
  // Native <script> tag (not next/script which is for executable JS)
  // .replace(/</g, '\\u003c') mitigates XSS via product name/description injection
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name[locale],
    description: product.description[locale],
    image: product.images,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'SAR',
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: locale === 'ar' ? 'المتجر' : 'Shop',
        item: `https://orki.sa/${locale}/shop`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: product.category === 'tops' 
          ? (locale === 'ar' ? 'بلايز' : 'Tops') 
          : (locale === 'ar' ? 'بناطيل' : 'Bottoms'),
        item: `https://orki.sa/${locale}/shop/${product.category}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.name[locale],
        item: `https://orki.sa/${locale}/shop/${product.category}/${product.slug}`,
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, '\\u003c'),
        }}
      />

      <div className="max-w-[1280px] mx-auto px-6 py-12">
        <PDPLayout
          gallery={
            <PDPGallery
              productName={product.name[locale]}
              images={product.images}
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
