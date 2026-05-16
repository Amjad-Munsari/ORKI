import { PlaceholderImage } from '@/components/PlaceholderImage'
import type { Locale } from '@/types/domain'

interface PDPGalleryProps {
  productName: string
  images: string[]
  locale: Locale
}

const MAX_GALLERY_IMAGES = 6

export function PDPGallery({ productName, images, locale }: PDPGalleryProps) {
  const visibleImages = (images.length > 0 ? images : [undefined as unknown as string]).slice(
    0,
    MAX_GALLERY_IMAGES,
  )

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
        />
      ))}
    </div>
  )
}
