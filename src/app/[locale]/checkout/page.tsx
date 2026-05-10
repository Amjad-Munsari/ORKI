'use client';

import { use, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import {
  ShippingForm,
  type ShippingFormData,
} from '@/components/checkout/ShippingForm';
import { OrderSummary } from '@/components/checkout/OrderSummary';
import {
  PaymentGrid,
  type PaymentMethod,
} from '@/components/checkout/PaymentGrid';
import { CheckoutSteps } from '@/components/checkout/CheckoutSteps';
import { TrustSignals } from '@/components/checkout/TrustSignals';
import { useRouter } from '@/i18n/navigation';
import { submitCheckoutAction } from '@/app/actions/orders';
import type { Locale } from '@/types/domain';
import { Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CheckoutPageProps {
  params: Promise<{ locale: string }>;
}

export default function CheckoutPage({ params }: CheckoutPageProps) {
  const { locale } = use(params);
  const router = useRouter();
  const t = useTranslations('Checkout');

  const [step, setStep] = useState<1 | 2>(1);
  const [shippingData, setShippingData] = useState<ShippingFormData | null>(
    null
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleShippingSubmit = (data: ShippingFormData) => {
    setShippingData(data);
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePlaceOrder = () => {
    if (!paymentMethod || !shippingData) return;
    setError(null);
    // Server action only accepts the four real-rail methods. UI methods 'card'/'cod'
    // are not part of the server enum — when selected, fall through to the
    // validation error path with the same envelope.
    startTransition(async () => {
      const result = await submitCheckoutAction({
        shipping: shippingData,
        // `paymentMethod` is already typed as PaymentMethod which matches the
        // server-side PaymentMethodCode union (card | mada | stcpay | applepay | cod).
        payment: { method: paymentMethod },
      });
      if (!result.ok) {
        const raw = result.messageKey;
        const key = raw.startsWith('Checkout.')
          ? raw.replace(/^Checkout\./, '')
          : raw;
        try {
          setError(t(key as never));
        } catch {
          setError(t('errors.unknown'));
        }
        return;
      }
      router.push(
        `/checkout/confirmation?ref=${result.data.reference}`
      );
    });
  };

  return (
    <div className="min-h-screen bg-black pt-24 pb-32">
      <div className="max-w-[1280px] mx-auto px-6">
        <h1 className="text-3xl md:text-5xl font-bold uppercase tracking-tighter mb-8 text-white">
          {t('title')}
        </h1>
        <div className="mb-12">
          <CheckoutSteps current={step} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          <div className="lg:col-span-7 space-y-16">
            {/* Step 1: Shipping */}
            <section className={step === 2 ? 'opacity-40' : ''}>
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-sm font-bold uppercase tracking-widest text-white">
                  {t('step1')}
                </h2>
                {step === 2 && (
                  <button
                    onClick={() => setStep(1)}
                    className="text-[10px] uppercase tracking-widest text-white/40 hover:text-white underline underline-offset-4 min-h-[44px]"
                  >
                    {t('edit')}
                  </button>
                )}
              </div>

              {step === 1 ? (
                <div className="space-y-12">
                  <ShippingForm
                    formId="checkout-shipping-form"
                    defaultValues={shippingData ?? undefined}
                    onValid={handleShippingSubmit}
                  />
                  <button
                    form="checkout-shipping-form"
                    type="submit"
                    className="w-full h-14 bg-white text-black rounded-lg font-bold uppercase tracking-widest hover:bg-white/90 transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                  >
                    {t('continueToPayment')}
                  </button>
                </div>
              ) : (
                <div className="text-sm text-white/60">
                  <p>
                    {shippingData?.firstName} {shippingData?.lastName}
                  </p>
                  <p>
                    {shippingData?.address}, {shippingData?.district}
                  </p>
                  <p>{shippingData?.city}</p>
                </div>
              )}
            </section>

            {/* Step 2: Payment */}
            <section
              className={
                step === 1 ? 'opacity-40 pointer-events-none' : ''
              }
            >
              <h2 className="text-sm font-bold uppercase tracking-widest text-white mb-10">
                {t('step2')}
              </h2>

              <div className="space-y-10">
                <PaymentGrid
                  locale={locale as Locale}
                  selected={paymentMethod}
                  onSelect={setPaymentMethod}
                />

                {error && (
                  <div
                    role="alert"
                    className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3 text-red-400"
                  >
                    <AlertCircle className="size-5 shrink-0" aria-hidden />
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                <TrustSignals />

                <button
                  onClick={handlePlaceOrder}
                  disabled={!paymentMethod || isPending}
                  className={cn(
                    'w-full h-14 bg-white text-black rounded-lg font-bold uppercase tracking-widest',
                    'disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/90 transition-colors',
                    'flex items-center justify-center gap-3 min-h-[44px]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40'
                  )}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="size-5 animate-spin" aria-hidden />
                      {t('processing')}
                    </>
                  ) : (
                    t('placeOrder')
                  )}
                </button>
              </div>
            </section>
          </div>

          <div className="lg:col-span-5">
            <OrderSummary locale={locale as Locale} />
          </div>
        </div>
      </div>
    </div>
  );
}
