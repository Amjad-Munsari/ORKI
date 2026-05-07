'use client'

import { ShoppingCart } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { CartBadge } from './CartBadge'

interface CartTriggerProps {
  ariaLabel: string
}

export function CartTrigger({ ariaLabel }: CartTriggerProps) {
  const setDrawerOpen = useCartStore(state => state.setDrawerOpen)

  return (
    <button
      onClick={() => setDrawerOpen(true)}
      aria-label={ariaLabel}
      className="flex items-center justify-center min-h-[44px] min-w-[44px] hover:opacity-60 transition-opacity relative"
    >
      <ShoppingCart className="size-5" aria-hidden="true" />
      <CartBadge />
    </button>
  )
}