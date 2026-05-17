'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
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
  const shouldReduceMotion = useReducedMotion()

  // Refs to each main image cell — used by both desktop thumb-click and mobile
  // IntersectionObserver. We allocate refs up to MAX_GALLERY_IMAGES once.
  const cellRefs = useRef<Array<HTMLDivElement | null>>([])
  const [activeIndex, setActiveIndex] = useState(0)

  // Desktop-only parallax on the FIRST image. Gated via matchMedia so mobile
  // (which renders the gallery as a horizontal scroller) renders identically
  // to before. Reduced-motion users also skip the transform.
  const heroRef = useRef<HTMLDivElement>(null)
  const [parallaxEnabled, setParallaxEnabled] = useState(false)
  useEffect(() => {
    if (shouldReduceMotion) return
    const mql = window.matchMedia('(min-width: 768px)')
    const sync = () => setParallaxEnabled(mql.matches)
    sync()
    mql.addEventListener('change', sync)
    return () => mql.removeEventListener('change', sync)
  }, [shouldReduceMotion])

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start end', 'end start'],
  })
  // Slow ~12% upward drift across the hero's scroll range. Lenis-smoothed
  // scroll makes this read as physical momentum, not a CSS tic.
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '-12%'])

  // Mobile dot tracking: observe each cell; the most-visible one wins.
  useEffect(() => {
    const cells = cellRefs.current.filter((c): c is HTMLDivElement => c !== null)
    if (cells.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the most-intersecting cell as the active one.
        type BestEntry = { index: number; ratio: number }
        let best: BestEntry | null = null
        entries.forEach((entry) => {
          const idx = cells.indexOf(entry.target as HTMLDivElement)
          if (idx === -1) return
          if (!best || entry.intersectionRatio > best.ratio) {
            best = { index: idx, ratio: entry.intersectionRatio } as BestEntry
          }
        })
        const resolved = best as BestEntry | null
        if (resolved && resolved.ratio > 0.5) setActiveIndex(resolved.index)
      },
      { threshold: [0.25, 0.5, 0.75] },
    )

    cells.forEach((c) => observer.observe(c))
    return () => observer.disconnect()
  }, [visibleImages.length])

  function scrollToIndex(index: number) {
    const target = cellRefs.current[index]
    if (!target) return
    target.scrollIntoView({
      behavior: shouldReduceMotion ? 'auto' : 'smooth',
      block: 'center',
      inline: 'center',
    })
    setActiveIndex(index)
  }

  return (
    <div className="md:grid md:grid-cols-[80px_1fr] md:gap-6">
      {/* Desktop thumb strip — inline-start. Hidden on mobile. */}
      <nav
        className="hidden md:flex md:flex-col md:gap-3"
        aria-label={locale === 'ar' ? 'صور المنتج المصغرة' : 'Product image thumbnails'}
      >
        {visibleImages.map((src, index) => (
          <button
            key={`thumb-${index}`}
            type="button"
            onClick={() => scrollToIndex(index)}
            aria-label={
              locale === 'ar'
                ? `عرض الصورة ${index + 1}`
                : `View image ${index + 1}`
            }
            aria-current={activeIndex === index ? 'true' : undefined}
            className={`relative w-full overflow-hidden transition-opacity focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
              activeIndex === index ? 'opacity-100' : 'opacity-50 hover:opacity-80'
            }`}
            style={{ aspectRatio: '3 / 4' }}
          >
            <PlaceholderImage
              aspectRatio="3/4"
              alt=""
              src={src}
              variant={variant}
            />
          </button>
        ))}
      </nav>

      {/* Main stack — desktop stacked vertical, mobile horizontal scroll-snap. */}
      <div
        className="
          flex flex-row gap-4 overflow-x-auto snap-x snap-mandatory
          md:flex-col md:overflow-visible md:snap-none
          [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
        "
        role="region"
        aria-label={locale === 'ar' ? 'صور المنتج' : 'Product images'}
      >
        {visibleImages.map((src, index) => {
          const alt =
            locale === 'ar'
              ? `${productName} — صورة ${index + 1}`
              : `${productName} — image ${index + 1}`
          const image = (
            <PlaceholderImage
              aspectRatio="4/5"
              alt={alt}
              src={src}
              priority={index === 0}
              variant={variant}
            />
          )
          return (
            <div
              key={`cell-${index}`}
              ref={(el) => {
                cellRefs.current[index] = el
                if (index === 0) heroRef.current = el
              }}
              className="flex-shrink-0 w-full snap-center md:flex-shrink"
            >
              {index === 0 && parallaxEnabled ? (
                <motion.div
                  style={{ y: heroY }}
                  className="will-change-transform"
                >
                  {image}
                </motion.div>
              ) : (
                image
              )}
            </div>
          )
        })}
      </div>

      {/* Mobile dot indicators — hidden on md and up. */}
      {visibleImages.length > 1 && (
        <div
          className="flex justify-center gap-2 mt-4 md:hidden"
          role="tablist"
          aria-label={locale === 'ar' ? 'مؤشر الصور' : 'Image indicators'}
        >
          {visibleImages.map((_, index) => (
            <button
              key={`dot-${index}`}
              type="button"
              role="tab"
              aria-selected={activeIndex === index}
              aria-label={
                locale === 'ar'
                  ? `الانتقال إلى الصورة ${index + 1}`
                  : `Go to image ${index + 1}`
              }
              onClick={() => scrollToIndex(index)}
              className={`size-2 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
                activeIndex === index ? 'bg-white' : 'bg-white/30'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
