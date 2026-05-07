'use client'

import { use, useState } from 'react'
import { ShippingForm } from '@/components/checkout/ShippingForm'
import { OrderSummary } from '@/components/checkout/OrderSummary'
import { PaymentGrid, type PaymentMethod } from '@/components/checkout/PaymentGrid'
import { useRouter } from '@/i18n/navigation'
import type { Locale } from '@/types/domain'
import { Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CheckoutPageProps {
  params: Promise<{ locale: string }>
}

export default function CheckoutPage({ params }: CheckoutPageProps) {
  const { locale } = use(params)
  const router = useRouter()
  const isRtl = locale === 'ar'

  const [step, setStep] = useState<1 | 2>(1)
  const [shippingData, setShippingData] = useState<any>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleShippingSubmit = (data: any) => {
    setShippingData(data)
    setStep(2)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePlaceOrder = async () => {
    if (!paymentMethod || !shippingData) return

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/checkout/mock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipping: shippingData,
          payment: paymentMethod,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Checkout failed')
      }

      router.push(`/checkout/confirmation?orderId=${data.orderId}`)
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-black pt-24 pb-32">
      <div className="max-w-[1280px] mx-auto px-6">
        <h1 className="text-3xl md:text-5xl font-bold uppercase tracking-tighter mb-12 text-white">
          {isRtl ? 'إتمام الشراء' : 'Checkout'}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          <div className="lg:col-span-7 space-y-16">
            {/* Step 1: Shipping */}
            <section className={step === 2 ? 'opacity-40' : ''}>
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-sm font-bold uppercase tracking-widest text-white flex items-center gap-4">
                  <span className="size-6 rounded-full bg-white text-black flex items-center justify-center text-[10px]">1</span>
                  {isRtl ? 'معلومات الشحن' : 'Shipping Information'}
                </h2>
                {step === 2 && (
                  <button 
                    onClick={() => setStep(1)}
                    className="text-[10px] uppercase tracking-widest text-white/40 hover:text-white underline underline-offset-4"
                  >
                    {isRtl ? 'تعديل' : 'Edit'}
                  </button>
                )}
              </div>
              
              {step === 1 ? (
                <div className="space-y-12">
                  <ShippingForm locale={locale as Locale} onSubmit={handleShippingSubmit} />
                  <button
                    onClick={() => (document.querySelector('form') as HTMLFormElement)?.requestSubmit()}
                    className="w-full h-14 bg-white text-black rounded-lg font-bold uppercase tracking-widest hover:bg-white/90 transition-colors"
                  >
                    {isRtl ? 'الاستمرار للدفع' : 'Continue to Payment'}
                  </button>
                </div>
              ) : (
                <div className="text-sm text-white/60">
                  <p>{shippingData?.firstName} {shippingData?.lastName}</p>
                  <p>{shippingData?.address}, {shippingData?.district}</p>
                  <p>{shippingData?.city}, Saudi Arabia</p>
                </div>
              )}
            </section>

            {/* Step 2: Payment */}
            <section className={step === 1 ? 'opacity-40 pointer-events-none' : ''}>
              <h2 className="text-sm font-bold uppercase tracking-widest text-white mb-10 flex items-center gap-4">
                <span className={cn(
                  "size-6 rounded-full flex items-center justify-center text-[10px]",
                  step === 2 ? "bg-white text-black" : "border border-white/20 text-white/40"
                )}>2</span>
                {isRtl ? 'طريقة الدفع' : 'Payment Method'}
              </h2>
              
              <div className="space-y-10">
                <PaymentGrid 
                  locale={locale as Locale} 
                  selected={paymentMethod} 
                  onSelect={setPaymentMethod} 
                />

                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3 text-red-400">
                    <AlertCircle className="size-5 shrink-0" />
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                <button
                  onClick={handlePlaceOrder}
                  disabled={!paymentMethod || isSubmitting}
                  className="w-full h-14 bg-white text-black rounded-lg font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/90 transition-colors flex items-center justify-center gap-3"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-5 animate-spin" />
                      {isRtl ? 'جاري المعالجة...' : 'Processing...'}
                    </>
                  ) : (
                    isRtl ? 'تأكيد الطلب' : 'Complete Purchase'
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
  )
}
