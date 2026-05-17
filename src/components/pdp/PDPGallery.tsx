import { PlaceholderImage } from '@/components/PlaceholderImage'
import { getPlaceholderVariantName } from '@/lib/placeholder-variant'
import type { Locale } from '@/types/domain'

interface PDPGalleryProps {
  productName: string
  images: string[]
  locale: Locale
  /** Optional product slug — used to pick a deterministic placeholder variant per product.
   *  If absent (back-compat), falls back to 'ghost'. */
  slug?: string
}

const MAX_GALLERY_IMAGES = 6

export function PDPGallery({ productName, images, locale, slug }: PDPGalleryProps) {
  const visibleImages = (images.length > 0 ? images : [undefined as unknown as string]).slice(
    0,
    MAX_GALLERY_IMAGES,
  )
  const variant = slug ? getPlaceholderVariantName(slug) : 'ghost'

  return (
    <div className="flex flex-col gap-4">
      {visibleImages.map((src, index) => (
        <PlaceholderImage
          key={`${productName}-${index}`}
          aspectRatio="4/5"
          alt={
            locale === 'ar'
              ? `${productName} — صورة ${index + 1}`
              : `${productName} — image ${index + 1}`
          }
          src={src}
          priority={index === 0}
          variant={variant}
        />
      ))}
    </div>
  )
}
