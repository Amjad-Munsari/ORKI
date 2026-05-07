'use client'

import { CreditCard, Smartphone, Banknote, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Locale } from '@/types/domain'

export type PaymentMethod = 'card' | 'mada' | 'stcpay' | 'applepay' | 'cod'

interface PaymentGridProps {
  locale: Locale
  selected: PaymentMethod | null
  onSelect: (method: PaymentMethod) => void
}

export function PaymentGrid({ locale, selected, onSelect }: PaymentGridProps) {
  const isRtl = locale === 'ar'

  const methods: { id: PaymentMethod; label: string; icon: LucideIcon; sublabel?: string }[] = [
    { 
      id: 'card', 
      label: isRtl ? 'بطاقة ائتمان' : 'Credit Card', 
      icon: CreditCard,
      sublabel: 'Visa / Mastercard'
    },
    { 
      id: 'mada', 
      label: 'مدى', 
      icon: CreditCard,
      sublabel: 'mada' 
    },
    { 
      id: 'stcpay', 
      label: 'stc pay', 
      icon: Smartphone 
    },
    { 
      id: 'applepay', 
      label: 'Apple Pay', 
      icon: Smartphone 
    },
    { 
      id: 'cod', 
      label: isRtl ? 'الدفع عند الاستلام' : 'Cash on Delivery', 
      icon: Banknote 
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {methods.map((method) => {
        const Icon = method.icon
        const isSelected = selected === method.id

        return (
          <button
            key={method.id}
            type="button"
            onClick={() => onSelect(method.id)}
            className={cn(
              "flex flex-col items-center justify-center p-6 border transition-all duration-300 rounded-lg group",
              isSelected 
                ? "bg-white border-white text-black" 
                : "bg-transparent border-white/10 text-white/40 hover:border-white/30 hover:text-white/60"
            )}
          >
            <Icon className={cn("size-6 mb-3", isSelected ? "text-black" : "text-white/20 group-hover:text-white/40")} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-center">
              {method.label}
            </span>
            {method.sublabel && (
              <span className={cn(
                "text-[9px] mt-1 uppercase tracking-tighter opacity-50",
                isSelected ? "text-black/60" : "text-white/20"
              )}>
                {method.sublabel}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
