import type { ReactNode } from 'react'

interface PDPLayoutProps {
  gallery: ReactNode
  info: ReactNode
}

// Server Component — layout shell accepting gallery and info as render props.
// Desktop: two-column grid (55% gallery, 45% sticky info) per D-07.
// Mobile: single column, gallery above, info below.
export function PDPLayout({ gallery, info }: PDPLayoutProps) {
  return (
    <div className="flex flex-col gap-8 md:grid md:grid-cols-[11fr_9fr] md:gap-12 xl:gap-16">
      <div>{gallery}</div>
      {/*
        sticky top-32: sticks 128px from viewport top — matches the panel's INITIAL
        on-screen position (navbar h-[80px] + page py-12 of 48px = 128px). Pinning at
        the initial position means scroll-y=0 already satisfies the sticky threshold,
        so the panel never travels — the gallery scrolls past it from the first wheel
        click instead of dragging the panel up for 48px before sticking.
        self-start: required — without it the grid stretches the element to row
        height and sticky fails.
      */}
      <div className="sticky top-32 self-start">
        {info}
      </div>
    </div>
  )
}
