import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import { getOrderByReference } from '@/lib/orders/server';
import { formatSAR } from '@/lib/orders/pricing';
import type { Locale, Order } from '@/types/domain';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ ref?: string; orderId?: string }>;
}

export default async function ConfirmationPage({
  params,
  searchParams,
}: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const ref = sp.ref ?? sp.orderId;
  if (!ref) notFound();

  // PERF-05: separate "DB unavailable" (try/catch fallback) from "order
  // doesn't exist" (still notFound()). A Supabase blip should NOT 404 a user
  // whose payment we already accepted — render reassurance copy instead.
  let order: Order | null = null;
  let lookupFailed = false;
  try {
    order = await getOrderByReference(ref);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[checkout/confirmation] getOrderByReference failed', err);
    lookupFailed = true;
  }

  if (lookupFailed) {
    const tErr = await getTranslations('Errors.section');
    return (
      <div
        role="alert"
        className="min-h-[60vh] flex items-center justify-center px-6"
      >
        <p className="text-lg text-white/60 max-w-md text-center">
          {tErr('orderLoadFailed')}
        </p>
      </div>
    );
  }

  if (!order) notFound();

  const t = await getTranslations('Order');
  const isRtl = locale === 'ar';
  const loc = locale as Locale;

  return (
    <div className="min-h-screen bg-black flex items-center justify-center py-24 px-6">
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

        <div className="bg-[#111111] border border-white/10 p-8 rounded-lg space-y-4">
          <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">
            {t('reference')}
          </p>
          <p className="text-2xl font-mono font-bold text-white tracking-widest">
            {order.reference}
          </p>
          <p className="text-white text-sm">
            {formatSAR(order.totalCents, loc)}
          </p>
          <p className="text-[12px] text-white/60 leading-relaxed max-w-sm mx-auto">
            {t('emailSent')}
          </p>
        </div>

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

        <p className="text-[10px] text-white/20 uppercase tracking-tighter">
          {t('support')}
        </p>
      </div>
    </div>
  );
}
