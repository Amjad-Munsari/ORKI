/**
 * Phase 10 Plan 05 — lifted from src/app/[locale]/checkout/confirmation/page.tsx
 * (lines 52-109 of the pre-lift confirmation page).
 *
 * Presentational RSC consumed by:
 *   - src/app/[locale]/checkout/confirmation/page.tsx  (guest + signed-in)
 *   - src/app/[locale]/account/orders/[reference]/page.tsx  (signed-in only)
 *
 * Both routes share the `[#111111]` editorial card. The eyebrow ("Order
 * Reference") was bumped to 12px per UI-SPEC §Anti-patterns #15
 * (4-distinct-size typography contract).
 *
 * `confirmationChrome` toggles the success eyebrow + outer "thanks" stacking;
 * the `/account/orders/[ref]` route renders the card alone, without the
 * confirmation-page success badge or the back-home CTA cluster.
 */
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import { formatSAR } from '@/lib/orders/pricing';
import type { Locale, Order } from '@/types/domain';

interface Props {
  order: Order;
  locale: Locale;
  /**
   * When true: render the full confirmation chrome (success icon, "thanks"
   * eyebrow, back-home + continue-shopping CTAs, support footer). Default
   * false — the account route consumes just the bare order card.
   */
  confirmationChrome?: boolean;
}

export async function OrderDetailView({
  order,
  locale,
  confirmationChrome = false,
}: Props) {
  const t = await getTranslations('Order');
  const isRtl = locale === 'ar';

  const card = (
    <div className="bg-[#111111] border border-white/10 p-8 rounded-lg space-y-4">
      <p className="text-[12px] uppercase tracking-widest text-white/40 font-bold">
        {t('reference')}
      </p>
      <p
        className="text-2xl font-mono font-bold text-white tracking-widest"
        dir="ltr"
      >
        {order.reference}
      </p>
      <p className="text-white text-sm">
        {formatSAR(order.totalCents, locale)}
      </p>
      <p className="text-[12px] text-white/60 leading-relaxed max-w-sm mx-auto">
        {t('emailSent')}
      </p>
    </div>
  );

  if (!confirmationChrome) {
    return card;
  }

  return (
    <div className="max-w-xl w-full text-center space-y-12">
      <div className="flex flex-col items-center space-y-6">
        <div className="size-20 rounded-full bg-white/5 flex items-center justify-center">
          <CheckCircle2 className="size-10 text-white" aria-hidden />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl md:text-6xl font-bold uppercase tracking-tighter text-white">
            {t('confirmedTitle')}
          </h1>
          <p className="text-white/40 uppercase tracking-widest text-xs font-bold">
            {t('thanks')}
          </p>
        </div>
      </div>

      {card}

      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
        <Link
          href="/"
          className="w-full sm:w-auto px-10 h-14 bg-white text-black rounded-lg font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/90 transition-colors min-h-[44px]"
        >
          {t('backHome')}
        </Link>
        <Link
          href="/shop"
          className="w-full sm:w-auto text-sm font-bold uppercase tracking-widest text-white underline underline-offset-8 hover:text-white/80 transition-colors flex items-center gap-2 min-h-[44px]"
        >
          {t('continueShopping')}
          {isRtl ? (
            <ArrowLeft className="size-4" aria-hidden />
          ) : (
            <ArrowRight className="size-4" aria-hidden />
          )}
        </Link>
      </div>

      <p className="text-[12px] text-white/20 uppercase tracking-tighter">
        {t('support')}
      </p>
    </div>
  );
}
