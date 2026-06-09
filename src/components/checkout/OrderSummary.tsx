'use client';

import { useCartStore } from '@/store/cartStore';
import { useLocale, useTranslations } from 'next-intl';
import type { Locale } from '@/types/domain';
import { computeOrderTotals, formatSAR } from '@/lib/orders/pricing';

interface OrderSummaryProps {
  locale?: Locale;
}

export function OrderSummary({ locale: localeProp }: OrderSummaryProps) {
  const localeFromIntl = useLocale() as Locale;
  const locale = localeProp ?? localeFromIntl;
  const t = useTranslations('Checkout');
  const { items } = useCartStore();

  const totals = computeOrderTotals(
    items.map((i) => ({
      unitPriceCents: i.product.price * 100,
      quantity: i.quantity,
    }))
  );

  return (
    <div className="bg-[#111111] border border-white/10 p-8 space-y-8 sticky top-24">
      <h2 className="text-sm font-bold uppercase tracking-widest text-white/40 border-b border-white/10 pb-4">
        {t('summary')}
      </h2>

      {/* data-lenis-prevent: inner scroll list on a Lenis-active page — without
          it the smooth-scroll provider hijacks the wheel and scrolls the page
          instead of this capped order list. */}
      <div className="space-y-6 max-h-[400px] overflow-y-auto pe-2 custom-scrollbar" data-lenis-prevent>
        {items.map((item) => (
          <div
            key={`${item.product.id}-${item.selectedSize}`}
            className="flex gap-4"
          >
            <div className="relative size-16 bg-white/5 overflow-hidden flex-shrink-0 flex items-center justify-center select-none">
              <span
                className="font-semibold tracking-widest text-[8px] uppercase"
                style={{ color: 'rgba(255, 255, 255, 0.15)' }}
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
              {formatSAR(item.product.price * 100 * item.quantity, locale)}
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-4 pt-8 border-t border-white/10">
        <Row
          label={t('subtotal')}
          value={formatSAR(totals.subtotalCents, locale)}
        />
        <Row
          label={t('shipping')}
          value={
            totals.shippingCents === 0
              ? t('freeShipping')
              : formatSAR(totals.shippingCents, locale)
          }
        />
        <Row
          label={t('vat')}
          value={formatSAR(totals.vatCents, locale)}
        />
        <div className="flex justify-between pt-4 border-t border-white/20">
          <span className="text-white uppercase tracking-widest text-xs font-bold">
            {t('total')}
          </span>
          <span className="text-xl font-bold text-white tabular-nums">
            {formatSAR(totals.totalCents, locale)}
          </span>
        </div>
      </div>

      <div className="p-4 bg-white/[0.03] border border-white/5 rounded-sm">
        <p className="text-[10px] text-white/30 uppercase tracking-tighter leading-relaxed">
          {t('termsAcknowledgement')}
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-white/40 uppercase tracking-widest text-[10px] font-bold">
        {label}
      </span>
      <span className="text-white tabular-nums">{value}</span>
    </div>
  );
}
