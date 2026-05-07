'use client'
import type { Size, Locale } from '@/types/domain'
import { SizeGuideModal } from './SizeGuideModal'

interface SizeSelectorProps {
  sizes: Size[]
  selectedSize: string | null
  onSizeChange: (label: string) => void
  locale: Locale
}

export function SizeSelector({ sizes, selectedSize, onSizeChange, locale }: SizeSelectorProps) {
  return (
    <div>
      {/* Label row: "Size" inline-start, "Size Guide" trigger inline-end */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-normal text-white/60">
          {locale === 'ar' ? 'المقاس' : 'Size'}
        </span>
        <SizeGuideModal locale={locale} />
      </div>

      {/* Button group — horizontal flex, wraps on overflow */}
      <div className="flex flex-wrap gap-2">
        {sizes.map(size => {
          const isSelected = selectedSize === size.label
          const isOOS = !size.inStock

          return (
            <button
              key={size.label}
              type="button"
              onClick={() => {
                if (!isOOS) onSizeChange(size.label)
              }}
              aria-disabled={isOOS ? 'true' : undefined}
              tabIndex={isOOS ? -1 : undefined}
              aria-pressed={isSelected ? 'true' : 'false'}
              className={[
                'relative overflow-hidden min-w-[44px] min-h-[44px] px-3 rounded-lg border',
                'text-sm font-normal transition-colors duration-150',
                isOOS
                  ? [
                      'opacity-40 cursor-not-allowed border-white/[0.12] text-white/60',
                      // Diagonal strikethrough via before: pseudo-element (RESEARCH.md Pattern 7)
                      'before:absolute before:inset-0',
                      'before:bg-[linear-gradient(to_bottom_right,transparent_calc(50%-0.5px),rgba(255,255,255,0.4)_calc(50%-0.5px),rgba(255,255,255,0.4)_calc(50%+0.5px),transparent_calc(50%+0.5px))]',
                    ].join(' ')
                  : isSelected
                    ? 'bg-white text-black border-white'
                    : 'bg-transparent text-white/60 border-white/[0.12] hover:border-white hover:text-white',
              ].filter(Boolean).join(' ')}
            >
              {size.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
