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
        sticky top-20: sticks 80px from viewport top (Navbar height = h-[80px]; layout pt-20 = 80px).
        self-start: required — without it the grid stretches the element to row height and sticky fails.
        Phase 11: comment reconciled to actual Navbar height (was stale "h-16 from Phase 1").
      */}
      <div className="sticky top-20 self-start">
        {info}
      </div>
    </div>
  )
}
