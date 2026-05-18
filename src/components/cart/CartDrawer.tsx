'use client'

import { useCartStore } from '@/store/cartStore'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import { CartItem } from './CartItem'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/types/domain'
import { ShoppingBag, ArrowRight, ArrowLeft } from 'lucide-react'

interface CartDrawerProps {
  locale: Locale
}

export function CartDrawer({ locale }: CartDrawerProps) {
  const { items, isDrawerOpen, setDrawerOpen } = useCartStore()
  
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const isRtl = locale === 'ar'

  return (
    <Sheet open={isDrawerOpen} onOpenChange={setDrawerOpen}>
      <SheetContent
        side="right"
        className={`w-full sm:max-w-md bg-black/95 backdrop-blur-xl border-white/10 flex flex-col p-0 !duration-[1200ms] !ease-[cubic-bezier(0.19,1,0.22,1)] data-starting-style:!opacity-100 data-ending-style:!opacity-100 ${
          isRtl
            ? 'data-starting-style:!-translate-x-full data-ending-style:!-translate-x-full'
            : 'data-starting-style:!translate-x-full data-ending-style:!translate-x-full'
        }`}
      >
        <SheetHeader className="px-6 pt-8 pb-4 border-b border-white/10">
          <SheetTitle className="text-xl font-bold uppercase tracking-tight text-white flex items-center gap-2">
            <ShoppingBag className="size-5" />
            {isRtl ? 'حقيبة التسوق' : 'Shopping Bag'}
            <span className="text-sm font-normal text-white/40 tabular-nums">
              ({items.length})
            </span>
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6">
          {items.length > 0 ? (
            <div className="divide-y divide-white/10">
              {items.map((item) => (
                <CartItem 
                  key={`${item.product.id}-${item.selectedSize}`} 
                  item={item} 
                  locale={locale} 
                />
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12">
              <div className="size-16 rounded-full bg-white/5 flex items-center justify-center">
                <ShoppingBag className="size-8 text-white/20" />
              </div>
              <div>
                <p className="text-white font-medium">
                  {isRtl ? 'حقيبتك فارغة' : 'Your bag is empty'}
                </p>
                <p className="text-white/40 text-sm mt-1">
                  {isRtl ? 'ابدأ بإضافة بعض المنتجات الرائعة' : 'Start adding some amazing products'}
                </p>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="text-sm font-bold uppercase tracking-widest text-white underline underline-offset-8 hover:text-white/80 transition-colors"
              >
                {isRtl ? 'استمر في التسوق' : 'Continue Shopping'}
              </button>
            </div>
          )}
        </div>

        {items.length > 0 && (
          <SheetFooter className="p-6 bg-white/[0.02] border-t border-white/10 flex flex-col gap-4">
            <div className="flex justify-between items-end mb-2">
              <span className="text-sm text-white/60 uppercase tracking-widest">
                {isRtl ? 'المجموع الفرعي' : 'Subtotal'}
              </span>
              <span className="text-2xl font-bold text-white tabular-nums">
                {subtotal} SAR
              </span>
            </div>
            
            <Link
              href="/checkout"
              onClick={() => setDrawerOpen(false)}
              className="w-full h-14 bg-white text-black rounded-lg font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/90 transition-colors group"
            >
              {isRtl ? 'إتمام الشراء' : 'Checkout'}
              {isRtl ? (
                <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
              ) : (
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              )}
            </Link>

            <p className="text-[10px] text-white/30 text-center uppercase tracking-tighter">
              {isRtl 
                ? 'الشحن والضرائب تحسب عند إتمام الطلب' 
                : 'Shipping & taxes calculated at checkout'}
            </p>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}
