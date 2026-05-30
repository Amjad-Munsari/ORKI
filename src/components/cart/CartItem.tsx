'use client'

import { useTransition } from 'react'
import { Plus, Minus, Trash2 } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { PlaceholderImage } from '@/components/PlaceholderImage'
import { formatPriceSAR } from '@/lib/format-price'
import {
  updateQtyAction,
  removeItemAction,
} from '@/app/actions/cart'
import type {
  CartItem as CartItemType,
  Locale,
  ServerCartItem,
} from '@/types/domain'

interface CartItemProps {
  item: CartItemType
  locale: Locale
}

export function CartItem({ item, locale }: CartItemProps) {
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const removeItem = useCartStore((s) => s.removeItem)
  const setItems = useCartStore((s) => s.setItems)
  const [, startTransition] = useTransition()

  /** Refetch from the server when an action fails — reconciles optimistic UI. */
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

  const handleDelta = (delta: 1 | -1) => {
    // Optimistic local update first.
    updateQuantity(item.product.id, item.selectedSize, delta)
    // Pre-hydration items have no server id yet — skip server sync.
    if (!item.id) return
    const newQty = Math.max(0, item.quantity + delta)
    startTransition(async () => {
      const result = await updateQtyAction(item.id!, newQty)
      if (!result.ok) await refetch()
    })
  }

  const handleRemove = () => {
    removeItem(item.product.id, item.selectedSize)
    if (!item.id) return
    startTransition(async () => {
      const result = await removeItemAction(item.id!)
      if (!result.ok) await refetch()
    })
  }

  return (
    <div className="flex gap-4 py-4 border-b border-white/10 group">
      <div className="size-24 overflow-hidden flex-shrink-0">
        <PlaceholderImage
          aspectRatio="3/4"
          alt={item.product.name[locale]}
          src={item.product.images[0]}
          className="w-full h-full"
        />
      </div>

      <div className="flex-1 flex flex-col justify-between py-1">
        <div>
          <div className="flex justify-between items-start">
            <h3 className="text-sm font-bold uppercase tracking-tight text-white leading-tight">
              {item.product.name[locale]}
            </h3>
            <button
              onClick={handleRemove}
              className="text-white/40 hover:text-white transition-colors p-1 -me-1"
              aria-label={locale === 'ar' ? 'إزالة المنتج' : 'Remove item'}
            >
              <Trash2 className="size-4" />
            </button>
          </div>
          <p className="text-[12px] text-white/50 mt-1 uppercase">
            {locale === 'ar' ? 'المقاس' : 'Size'}: {item.selectedSize}
          </p>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center bg-white/5 rounded-full px-2 py-1">
            <button
              onClick={() => handleDelta(-1)}
              className="p-1 hover:text-white text-white/60 transition-colors"
              aria-label={locale === 'ar' ? 'تقليل الكمية' : 'Decrease quantity'}
            >
              <Minus className="size-3" />
            </button>
            <span className="w-8 text-center text-[12px] font-bold text-white">
              {item.quantity}
            </span>
            <button
              onClick={() => handleDelta(1)}
              className="p-1 hover:text-white text-white/60 transition-colors"
              aria-label={locale === 'ar' ? 'زيادة الكمية' : 'Increase quantity'}
            >
              <Plus className="size-3" />
            </button>
          </div>
          <p className="text-sm font-bold text-white">
            {formatPriceSAR(item.product.price * item.quantity, locale)}
          </p>
        </div>
      </div>
    </div>
  )
}
