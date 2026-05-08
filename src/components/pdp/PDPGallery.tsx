import { PlaceholderImage } from '@/components/PlaceholderImage'
import type { Locale } from '@/types/domain'

interface PDPGalleryProps {
  productName: string
  images: string[]
  locale: Locale
}

export function PDPGallery({ productName, images, locale }: PDPGalleryProps) {
  const imageSlots = [
    {
      n: 1,
      src: images[0],
      alt: locale === 'ar' ? `${productName} — صورة 1` : `${productName} — image 1`,
      priority: true,
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      {imageSlots.map(slot => (
        <PlaceholderImage
          key={slot.n}
          aspectRatio="4/5"
          alt={slot.alt}
          src={slot.src}
          priority={slot.priority}
        />
      ))}
    </div>
  )
}
