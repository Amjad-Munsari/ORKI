import { PlaceholderImage } from '@/components/PlaceholderImage'
import type { Locale } from '@/types/domain'

interface PDPGalleryProps {
  productName: string
  locale: Locale
}

export function PDPGallery({ productName, locale }: PDPGalleryProps) {
  const imageSlots = [
    {
      n: 1,
      alt: locale === 'ar' ? `${productName} — صورة 1` : `${productName} — image 1`,
      priority: true,
    },
    {
      n: 2,
      alt: locale === 'ar' ? `${productName} — صورة 2` : `${productName} — image 2`,
      priority: false,
    },
    {
      n: 3,
      alt: locale === 'ar' ? `${productName} — صورة 3` : `${productName} — image 3`,
      priority: false,
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      {imageSlots.map(slot => (
        <PlaceholderImage
          key={slot.n}
          aspectRatio="4/5"
          alt={slot.alt}
          priority={slot.priority}
        />
      ))}
    </div>
  )
}
