'use client';

import { useTranslations } from 'next-intl';
import { Lock, RotateCcw, ShieldCheck } from 'lucide-react';

export function TrustSignals() {
  const t = useTranslations('Checkout.trust');
  const items = [
    { icon: Lock, label: t('secureCheckout') },
    { icon: RotateCcw, label: t('returnsPolicy') },
    { icon: ShieldCheck, label: t('sslEncryption') },
  ];
  return (
    <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 py-4 border-y border-white/10">
      {items.map(({ icon: Icon, label }) => (
        <li
          key={label}
          className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/50"
        >
          <Icon className="size-3.5" aria-hidden />
          <span>{label}</span>
        </li>
      ))}
    </ul>
  );
}
