/**
 * Phase 10 Plan 05 — list wrapper for /account orders. Handles empty state
 * inline per UI-SPEC §"Empty state — no orders".
 *
 * The empty heading reuses Tier 1 Display (text-4xl md:text-6xl) so the
 * card carries the same editorial weight as the page H1 (UI-SPEC §Typography
 * 4-distinct-size contract).
 */
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale, Order } from '@/types/domain';
import { OrderRow } from './OrderRow';

interface Props {
  orders: Order[];
  locale: Locale;
}

export async function OrdersList({ orders, locale }: Props) {
  const t = await getTranslations('Account');

  if (orders.length === 0) {
    return (
      <div className="bg-[#111111] border border-white/10 rounded-lg p-12 text-center space-y-6">
        <p className="text-[12px] uppercase tracking-widest text-white/40 font-bold">
          {t('empty.eyebrow')}
        </p>
        <p className="text-4xl md:text-6xl font-bold uppercase tracking-tighter text-white leading-none">
          {t('empty.heading')}
        </p>
        <p className="text-sm text-white/60 max-w-xs mx-auto">
          {t('empty.body')}
        </p>
        <Link
          href="/shop"
          className="inline-flex w-full sm:w-auto px-10 h-14 bg-white text-black rounded-lg font-bold uppercase tracking-widest items-center justify-center gap-2 hover:bg-white/90 transition-colors min-h-[44px] text-sm"
        >
          {t('empty.cta')}
        </Link>
      </div>
    );
  }

  return (
    <ol className="space-y-3">
      {orders.map((o) => (
        <OrderRow key={o.id} order={o} locale={locale} />
      ))}
    </ol>
  );
}
