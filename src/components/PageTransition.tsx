'use client'

import { motion, AnimatePresence } from 'motion/react'
import { usePathname } from 'next/navigation'
import { useReducedMotionSafe } from '@/hooks/useReducedMotionSafe'

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  // Hydration-safe: server + first client render use the non-reduced markup so
  // the SSR inline style matches; the preference applies after mount.
  const prefersReducedMotion = useReducedMotionSafe()

  const initial = prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 10 }
  const animate = prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }
  const exit = prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 }
  const transition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={initial}
        animate={animate}
        exit={exit}
        transition={transition}
        className="w-full h-full flex flex-col flex-1"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
