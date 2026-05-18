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
      className="flex items-center justify-center min-h-[44px] min-w-[44px] text-white/60 hover:text-white transition-colors duration-[var(--duration-base)] ease-[var(--ease-out-soft)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
    >
      <span className="relative inline-block size-5">
        <ShoppingCart className="block size-5" aria-hidden="true" />
        <CartBadge />
      </span>
    </button>
  )
}
