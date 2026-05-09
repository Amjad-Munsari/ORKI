'use client';

import { CreditCard, Smartphone, Banknote, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

export type PaymentMethod = 'card' | 'mada' | 'stcpay' | 'applepay' | 'cod';

interface PaymentGridProps {
  /** kept optional for backwards compatibility — locale resolution now flows through next-intl. */
  locale?: string;
  selected: PaymentMethod | null;
  onSelect: (method: PaymentMethod) => void;
}

export function PaymentGrid({ selected, onSelect }: PaymentGridProps) {
  const t = useTranslations('Checkout.payment');

  const methods: {
    id: PaymentMethod;
    label: string;
    icon: LucideIcon;
    sublabel?: string;
  }[] = [
    {
      id: 'card',
      label: t('card'),
      icon: CreditCard,
      sublabel: 'Visa / Mastercard',
    },
    {
      id: 'mada',
      label: t('mada'),
      icon: CreditCard,
      sublabel: 'mada',
    },
    {
      id: 'stcpay',
      label: t('stcpay'),
      icon: Smartphone,
    },
    {
      id: 'applepay',
      label: t('applepay'),
      icon: Smartphone,
    },
    {
      id: 'cod',
      label: t('cod'),
      icon: Banknote,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {methods.map((method) => {
        const Icon = method.icon;
        const isSelected = selected === method.id;

        return (
          <button
            key={method.id}
            type="button"
            onClick={() => onSelect(method.id)}
            aria-pressed={isSelected}
            className={cn(
              'flex flex-col items-center justify-center p-6 border transition-all duration-300 rounded-lg group min-h-[88px]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black',
              isSelected
                ? 'bg-white border-white text-black'
                : 'bg-transparent border-white/10 text-white/40 hover:border-white/30 hover:text-white/60'
            )}
          >
            <Icon
              className={cn(
                'size-6 mb-3',
                isSelected
                  ? 'text-black'
                  : 'text-white/20 group-hover:text-white/40'
              )}
            />
            <span className="text-[10px] font-bold uppercase tracking-widest text-center">
              {method.label}
            </span>
            {method.sublabel && (
              <span
                className={cn(
                  'text-[9px] mt-1 uppercase tracking-tighter opacity-50',
                  isSelected ? 'text-black/60' : 'text-white/20'
                )}
              >
                {method.sublabel}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
