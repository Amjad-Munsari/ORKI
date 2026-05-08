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
    <div className="flex flex-col gap-8 md:grid md:grid-cols-[55%_45%] md:gap-12 xl:gap-16">
      <div>{gallery}</div>
      {/*
        sticky top-16: sticks 64px from viewport top (Navbar height = h-16 from Phase 1).
        self-start: required — without it the grid stretches the element to row height and sticky fails.
      */}
      <div className="sticky top-20 self-start">
        {info}
      </div>
    </div>
  )
}
