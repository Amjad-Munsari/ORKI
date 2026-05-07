'use client'


import { useCartStore } from '@/store/cartStore'
import type { Locale } from '@/types/domain'

interface OrderSummaryProps {
  locale: Locale
}

export function OrderSummary({ locale }: OrderSummaryProps) {
  const { items } = useCartStore()
  const isRtl = locale === 'ar'
  
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const shipping = 0 // Mock free shipping
  const total = subtotal + shipping

  return (
    <div className="bg-[#111111] border border-white/10 p-8 space-y-8 sticky top-24">
      <h2 className="text-sm font-bold uppercase tracking-widest text-white/40 border-b border-white/10 pb-4">
        {isRtl ? 'ملخص الطلب' : 'Order Summary'}
      </h2>

      <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {items.map((item) => (
          <div key={`${item.product.id}-${item.selectedSize}`} className="flex gap-4">
            <div className="relative size-16 bg-white/5 overflow-hidden flex-shrink-0 flex items-center justify-center select-none">
              <span
                className="font-semibold tracking-widest text-[8px] uppercase"
                style={{color: 'rgba(255, 255, 255, 0.15)'}}
              >
                ORKI
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[12px] font-bold uppercase text-white truncate">
                {item.product.name[locale]}
              </h3>
              <p className="text-[10px] text-white/40 mt-1">
                {item.selectedSize} × {item.quantity}
              </p>
            </div>
            <p className="text-[12px] font-bold text-white whitespace-nowrap">
              {item.product.price * item.quantity} SAR
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-4 pt-8 border-t border-white/10">
        <div className="flex justify-between text-sm">
          <span className="text-white/40 uppercase tracking-widest text-[10px] font-bold">
            {isRtl ? 'المجموع الفرعي' : 'Subtotal'}
          </span>
          <span className="text-white tabular-nums">{subtotal} SAR</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-white/40 uppercase tracking-widest text-[10px] font-bold">
            {isRtl ? 'الشحن' : 'Shipping'}
          </span>
          <span className="text-white uppercase text-[10px] font-bold tracking-widest">
            {isRtl ? 'مجاني' : 'Free'}
          </span>
        </div>
        <div className="flex justify-between pt-4 border-t border-white/20">
          <span className="text-white uppercase tracking-widest text-xs font-bold">
            {isRtl ? 'الإجمالي' : 'Total'}
          </span>
          <span className="text-xl font-bold text-white tabular-nums">{total} SAR</span>
        </div>
      </div>

      <div className="p-4 bg-white/[0.03] border border-white/5 rounded-sm">
        <p className="text-[10px] text-white/30 uppercase tracking-tighter leading-relaxed">
          {isRtl 
            ? 'بإتمام هذا الطلب، فإنك توافق على شروط الخدمة وسياسة الخصوصية الخاصة بنا.' 
            : 'By completing this order, you agree to our Terms of Service and Privacy Policy.'}
        </p>
      </div>
    </div>
  )
}
