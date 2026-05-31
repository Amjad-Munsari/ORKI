'use client'
import { AnimatePresence, motion } from 'motion/react'
import { useTranslations } from 'next-intl'
import { useCartStore } from '@/store/cartStore'
import { useReducedMotionSafe } from '@/hooks/useReducedMotionSafe'


// Server renders count=0 (skipHydration), client rehydrates actual value after StoreHydration mounts.
// Progressive enhancement: badge not visible on first server paint, appears after hydration.
export function CartBadge() {
  const count = useCartStore(state =>
    state.items.reduce((n, i) => n + i.quantity, 0)
  )
  const t = useTranslations('Nav')
  const shouldReduceMotion = useReducedMotionSafe()

  return (
    <AnimatePresence mode="popLayout">
      {count > 0 && (
        <motion.span
          key={count}
          initial={{ scale: shouldReduceMotion ? 1 : 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: shouldReduceMotion ? 1 : 0.5, opacity: 0 }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 25,
            mass: 0.5
          }}
          className="absolute -bottom-1 -end-2
                     text-[10px] font-bold leading-none text-white
                     pointer-events-none select-none z-10 tabular-nums"
          aria-label={t('cartItemCount', { count })}
        >
          {count}
        </motion.span>
      )}
    </AnimatePresence>
  )
}
