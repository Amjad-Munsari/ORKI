'use client'

import { use, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { useCartStore } from '@/store/cartStore'
import { CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react'


interface ConfirmationPageProps {
  params: Promise<{ locale: string }>
}

export default function ConfirmationPage({ params }: ConfirmationPageProps) {
  const { locale } = use(params)
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  const clearCart = useCartStore(state => state.clearCart)
  const isRtl = locale === 'ar'

  useEffect(() => {
    // Clear cart on successful order confirmation
    if (orderId) {
      clearCart()
    }
  }, [orderId, clearCart])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center py-24 px-6">
      <div className="max-w-xl w-full text-center space-y-12">
        <div className="flex flex-col items-center space-y-6">
          <div className="size-20 rounded-full bg-white/5 flex items-center justify-center">
            <CheckCircle2 className="size-10 text-white" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl md:text-6xl font-bold uppercase tracking-tighter text-white">
              {isRtl ? 'تم تأكيد طلبك' : 'Order Confirmed'}
            </h1>
            <p className="text-white/40 uppercase tracking-widest text-xs font-bold">
              {isRtl ? 'شكراً لتسوقك معنا' : 'Thank you for your order'}
            </p>
          </div>
        </div>

        <div className="bg-[#111111] border border-white/10 p-8 rounded-lg space-y-4">
          <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">
            {isRtl ? 'رقم الطلب' : 'Order Reference'}
          </p>
          <p className="text-2xl font-mono font-bold text-white tracking-widest">
            {orderId || 'ORK-XXXXXX'}
          </p>
          <p className="text-[12px] text-white/60 leading-relaxed max-w-sm mx-auto">
            {isRtl 
              ? 'لقد أرسلنا بريداً إلكترونياً لتأكيد الطلب مع كافة التفاصيل ومعلومات التتبع.' 
              : 'We\'ve sent a confirmation email with all the details and tracking information.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
          <Link
            href="/"
            className="w-full sm:w-auto px-10 h-14 bg-white text-black rounded-lg font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/90 transition-colors group"
          >
            {isRtl ? 'العودة للرئيسية' : 'Back to Home'}
          </Link>
          <Link
            href="/shop"
            className="w-full sm:w-auto text-sm font-bold uppercase tracking-widest text-white underline underline-offset-8 hover:text-white/80 transition-colors flex items-center gap-2"
          >
            {isRtl ? 'استمر في التسوق' : 'Continue Shopping'}
            {isRtl ? (
              <ArrowLeft className="size-4" />
            ) : (
              <ArrowRight className="size-4" />
            )}
          </Link>
        </div>

        <p className="text-[10px] text-white/20 uppercase tracking-tighter">
          {isRtl 
            ? 'إذا كان لديك أي أسئلة، يرجى التواصل مع فريق الدعم لدينا.' 
            : 'If you have any questions, please contact our support team.'}
        </p>
      </div>
    </div>
  )
}
