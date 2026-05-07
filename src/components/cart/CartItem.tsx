'use client'


import { Plus, Minus, Trash2 } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import type { CartItem as CartItemType, Locale } from '@/types/domain'

interface CartItemProps {
  item: CartItemType
  locale: Locale
}

export function CartItem({ item, locale }: CartItemProps) {
  const { updateQuantity, removeItem } = useCartStore()

  return (
    <div className="flex gap-4 py-4 border-b border-white/10 group">
      <div className="relative size-24 bg-[#111111] overflow-hidden flex items-center justify-center select-none">
        <span
          className="font-semibold tracking-widest text-[10px] uppercase"
          style={{color: 'rgba(255, 255, 255, 0.15)'}}
        >
          ORKI
        </span>
      </div>

      <div className="flex-1 flex flex-col justify-between py-1">
        <div>
          <div className="flex justify-between items-start">
            <h3 className="text-sm font-bold uppercase tracking-tight text-white leading-tight">
              {item.product.name[locale]}
            </h3>
            <button
              onClick={() => removeItem(item.product.id, item.selectedSize)}
              className="text-white/40 hover:text-white transition-colors p-1 -mr-1"
              aria-label="Remove item"
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
              onClick={() => updateQuantity(item.product.id, item.selectedSize, -1)}
              className="p-1 hover:text-white text-white/60 transition-colors"
              aria-label="Decrease quantity"
            >
              <Minus className="size-3" />
            </button>
            <span className="w-8 text-center text-[12px] font-bold text-white">
              {item.quantity}
            </span>
            <button
              onClick={() => updateQuantity(item.product.id, item.selectedSize, 1)}
              className="p-1 hover:text-white text-white/60 transition-colors"
              aria-label="Increase quantity"
            >
              <Plus className="size-3" />
            </button>
          </div>
          <p className="text-sm font-bold text-white">
            {item.product.price * item.quantity} SAR
          </p>
        </div>
      </div>
    </div>
  )
}
