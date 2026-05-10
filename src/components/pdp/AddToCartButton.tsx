'use client'
import { useState, useTransition } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Check } from 'lucide-react'
import { animationPresets } from '@/lib/animation-presets'
import { useCartStore } from '@/store/cartStore'
import { addToCartAction } from '@/app/actions/cart'
import type { Product, Locale, ServerCartItem } from '@/types/domain'

type ButtonState = 'idle' | 'success'

interface AddToCartButtonProps {
  product: Product
  selectedSize: string | null
  locale: Locale
}

export function AddToCartButton({ product, selectedSize, locale }: AddToCartButtonProps) {
  const [state, setState] = useState<ButtonState>('idle')
  const addItem = useCartStore(s => s.addItem)
  const setItems = useCartStore(s => s.setItems)
  const setDrawerOpen = useCartStore(s => s.setDrawerOpen)
  const shouldReduceMotion = useReducedMotion()
  const [, startTransition] = useTransition()

  /** Refetch from the server when the action fails — reconciles optimistic UI. */
  const refetch = async () => {
    try {
      const res = await fetch('/api/cart', { cache: 'no-store' })
      const json = (await res.json()) as {
        ok?: boolean
        cart?: { items?: ServerCartItem[] } | null
      }
      if (json?.ok && json.cart) {
        setItems(
          (json.cart.items ?? []).map((si) => ({
            id: si.id,
            sizeId: si.sizeId,
            product: si.product,
            selectedSize: si.sizeLabel,
            quantity: si.quantity,
          }))
        )
      }
    } catch {
      /* leave optimistic state in place */
    }
  }

  function handleClick() {
    if (!selectedSize || state === 'success') return
    const sizeId = product.sizes.find(s => s.label === selectedSize)?.id
    addItem(product, selectedSize)
    setDrawerOpen(true)
    setState('success')
    // Reset after 1500ms per D-11
    setTimeout(() => setState('idle'), 1500)
    if (!sizeId) return
    startTransition(async () => {
      const result = await addToCartAction(product.id, sizeId, 1)
      if (!result.ok) await refetch()
      else {
        setItems(
          result.data.items.map((si) => ({
            id: si.id,
            sizeId: si.sizeId,
            product: si.product,
            selectedSize: si.sizeLabel,
            quantity: si.quantity,
          }))
        )
      }
    })
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
