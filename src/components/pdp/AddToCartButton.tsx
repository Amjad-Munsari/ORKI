'use client'
import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Check } from 'lucide-react'
import { animationPresets } from '@/lib/animation-presets'
import { useCartStore } from '@/store/cartStore'
import type { Product, Locale } from '@/types/domain'

type ButtonState = 'idle' | 'success'

interface AddToCartButtonProps {
  product: Product
  selectedSize: string | null
  locale: Locale
}

export function AddToCartButton({ product, selectedSize, locale }: AddToCartButtonProps) {
  const [state, setState] = useState<ButtonState>('idle')
  const addItem = useCartStore(s => s.addItem)
  const setDrawerOpen = useCartStore(s => s.setDrawerOpen)
  const shouldReduceMotion = useReducedMotion()

  function handleClick() {
    if (!selectedSize || state === 'success') return
    addItem(product, selectedSize)
    setDrawerOpen(true)
    setState('success')
    // Reset after 1500ms per D-11
    setTimeout(() => setState('idle'), 1500)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!selectedSize}
      className="w-full h-[52px] rounded-lg bg-white text-black font-semibold text-base
                 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
                 transition-opacity duration-150"
    >
      <AnimatePresence mode="wait" initial={false}>
        {state === 'idle' ? (
          <motion.span
            key="idle"
            initial={{ opacity: shouldReduceMotion ? 1 : 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: shouldReduceMotion ? 1 : 0 }}
            transition={animationPresets.successState}
          >
            {locale === 'ar' ? 'أضف إلى السلة' : 'Add to Cart'}
          </motion.span>
        ) : (
          <motion.span
            key="success"
            initial={{ opacity: shouldReduceMotion ? 1 : 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: shouldReduceMotion ? 1 : 0 }}
            transition={animationPresets.successState}
            className="flex items-center justify-center gap-2"
          >
            <Check className="size-4" aria-hidden="true" />
            {locale === 'ar' ? 'تمت الإضافة' : 'Added'}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
}
