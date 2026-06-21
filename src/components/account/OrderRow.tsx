/**
 * Phase 10 Plan 05 — single order card in the /account list.
 *
 * Markup contract: UI-SPEC §"<OrderRow> spec". Outline-only status pill
 * (UI-SPEC §Anti-patterns #10: status conveyed by label, not color).
 * Reference is always rendered LTR via explicit dir="ltr" since order
 * references are intentionally Latin (e.g. ORK-A1B2C3).
 */
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { formatSAR } from '@/lib/orders/pricing';
import type { Locale, Order } from '@/types/domain';

interface Props {
  order: Order;
  locale: Locale;
}

function formatDate(date: Date | string, locale: Locale): string {
  const d = date instanceof Date ? date : new Date(date);
  // Force Latin numerals in both locales (matches the SAR currency contract
  // in CLAUDE.md §Design System: ar-SA-u-nu-latn).
  const tag = locale === 'ar' ? 'ar-SA-u-nu-latn' : 'en-US';
  return new Intl.DateTimeFormat(tag, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
}

export async function OrderRow({ order, locale }: Props) {
  const t = await getTranslations('Account');
  const tOrder = await getTranslations('Order.status');

  return (
    <li>
      <Link
        href={`/account/orders/${order.reference}`}
        className="block bg-[#111111] border border-white/10 rounded-lg p-6
                   hover:border-white/30 transition-colors min-h-[44px]
                   focus-visible:border-white focus-visible:outline-none"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[12px] uppercase tracking-widest text-white/40 font-bold">
              {t('referenceLabel')}
            </p>
            <p
              className="font-mono font-bold text-white tracking-wider"
              dir="ltr"
            >
              {order.reference}
            </p>
            <p className="text-xs text-white/60">
              {formatDate(order.placedAt, locale)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span
              className="border border-white/30 text-white/80 text-[12px]
                         uppercase tracking-widest px-3 py-1 rounded-none"
            >
              {tOrder(order.status)}
            </span>
            <p className="text-sm text-white">
              {formatSAR(order.totalCents, locale)}
            </p>
          </div>
        </div>
      </Link>
    </li>
  );
}
