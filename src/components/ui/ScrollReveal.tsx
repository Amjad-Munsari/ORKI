'use client'

import { motion } from 'motion/react'
import { useReducedMotionSafe } from '@/hooks/useReducedMotionSafe'

interface ScrollRevealProps {
  children: React.ReactNode
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
  className?: string
}

export function ScrollReveal({ 
  children, 
  delay = 0, 
  direction = 'up',
  className = '' 
}: ScrollRevealProps) {
  // Hydration-safe: SSR + first client render assume no reduced motion so the
  // markup matches; the real preference applies after mount (no React mismatch).
  const shouldReduceMotion = useReducedMotionSafe()

  // Fallback for reduced motion: instant render, no fade, no movement.
  // (Phase 11 anim pass: reduced-motion users skip the reveal entirely.)
  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>
  }

  // Canonical Lenis/Apple decelerating curve — matches --ease-out-soft in globals.css
  // and the easing inside SmoothScrollProvider so the page feels coherent.
  const EASE_OUT_SOFT = [0.16, 1, 0.3, 1] as [number, number, number, number]

  const variants = {
    hidden: {
      opacity: 0,
      y: direction === 'up' ? 48 : direction === 'down' ? -48 : 0,
      x: direction === 'left' ? 48 : direction === 'right' ? -48 : 0,
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      transition: {
        duration: 1.1,
        delay,
        ease: EASE_OUT_SOFT,
      },
    },
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  )
}
