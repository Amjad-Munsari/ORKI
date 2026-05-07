import { PlaceholderImage } from '@/components/PlaceholderImage'
import type { Locale } from '@/types/domain'

interface PDPGalleryProps {
  images: string[]
  productName: string
  locale: Locale
}

export function PDPGallery({ images, productName, locale }: PDPGalleryProps) {
  const imageSlots = [
    {
      n: 1,
      alt: locale === 'ar' ? `${productName} — صورة 1` : `${productName} — image 1`,
      priority: true,
      src: images[0]
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      {imageSlots.map(slot => (
        <PlaceholderImage
          key={slot.n}
          src={slot.src}
          aspectRatio="4/5"
          alt={slot.alt}
          priority={slot.priority}
        />
      ))}
    </div>
  )
}
