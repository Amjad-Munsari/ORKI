'use client'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useCartStore } from '@/store/cartStore'


// Server renders count=0 (skipHydration), client rehydrates actual value after StoreHydration mounts.
// Progressive enhancement: badge not visible on first server paint, appears after hydration.
export function CartBadge() {
  const count = useCartStore(state =>
    state.items.reduce((n, i) => n + i.quantity, 0)
  )
  const shouldReduceMotion = useReducedMotion()

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
          className="absolute -top-1 -inset-inline-end-1
                     min-w-[18px] h-[18px] rounded-full bg-black text-white
                     text-[10px] font-bold flex items-center justify-center px-1
                     pointer-events-none select-none z-10"
          aria-label={`${count} items in cart`}
        >
          {count}
        </motion.span>
      )}
    </AnimatePresence>
  )
}
