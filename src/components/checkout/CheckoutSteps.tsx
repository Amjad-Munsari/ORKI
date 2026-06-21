'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface Props {
  current: 1 | 2;
  total?: 2;
}

export function CheckoutSteps({ current, total = 2 }: Props) {
  const t = useTranslations('Checkout');
  const labels = [t('step1'), t('step2')];
  return (
    <>
      <ol
        className="flex items-center gap-4"
        aria-label={t('title')}
      >
        {labels.map((label, i) => {
          const idx = (i + 1) as 1 | 2;
          const active = idx === current;
          return (
            <li
              key={label}
              className="flex items-center gap-3"
              aria-current={active ? 'step' : undefined}
            >
              <span
                className={cn(
                  'size-6 rounded-full flex items-center justify-center text-[10px] font-bold',
                  active
                    ? 'bg-white text-black'
                    : 'border border-white/20 text-white/40'
                )}
              >
                {idx}
              </span>
              <span
                className={cn(
                  'text-sm font-bold uppercase tracking-widest',
                  active ? 'text-white' : 'text-white/40'
                )}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
      <div role="status" aria-live="polite" className="sr-only">
        {t('stepProgress', { current, total })}
      </div>
    </>
  );
}
