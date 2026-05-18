import { ArrowRight, ArrowLeft } from 'lucide-react'
import type { Locale } from '@/types/domain'

interface ArrowCtaProps {
  locale: Locale
  /** 'forward' = points in reading direction; 'back' = opposite. Default 'forward'. */
  direction?: 'forward' | 'back'
  /** Tailwind size class for the icon box, e.g. 'size-4' or 'size-5'. Default 'size-4'. */
  size?: string
  className?: string
}

/**
 * Hover-replace arrow for CTA buttons/links. Requires `group` on the parent.
 * On hover: the visible arrow slides out in its pointing direction; a second arrow
 * slides in from the opposite side. Direction auto-mirrors in RTL.
 */
export function ArrowCta({
  locale,
  direction = 'forward',
  size = 'size-4',
  className = '',
}: ArrowCtaProps) {
  const isRtl = locale === 'ar'
  const pointsRight = direction === 'forward' ? !isRtl : isRtl
  const Icon = pointsRight ? ArrowRight : ArrowLeft

  const exit = pointsRight
    ? 'group-hover:translate-x-full'
    : 'group-hover:-translate-x-full'
  const incomingFrom = pointsRight ? '-translate-x-full' : 'translate-x-full'

  const transition =
    'transition-transform duration-[800ms] ease-[cubic-bezier(0.19,1,0.22,1)] motion-reduce:transform-none'

  return (
    <span
      aria-hidden
      className={`relative inline-block overflow-hidden align-middle ${size} ${className}`}
    >
      <Icon className={`block ${size} ${transition} ${exit}`} />
      <Icon
        className={`absolute inset-0 ${size} ${incomingFrom} group-hover:translate-x-0 group-hover:delay-200 ${transition} motion-reduce:opacity-0`}
      />
    </span>
  )
}
