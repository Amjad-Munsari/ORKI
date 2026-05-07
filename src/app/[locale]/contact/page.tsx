'use client'

import { use, useState } from 'react'
import { ArrowRight, ArrowLeft, MessageCircle } from 'lucide-react'
import type { Locale } from '@/types/domain'

interface ContactPageProps {
  params: Promise<{ locale: string }>
}

export default function ContactPage({ params }: ContactPageProps) {
  const { locale } = use(params)
  const isRtl = locale === 'ar'
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      setSent(true)
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-black pt-24 pb-48">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-start">
          <div className="space-y-12">
            <h1 className="text-6xl md:text-[100px] font-bold uppercase tracking-tighter leading-none text-white">
              {isRtl ? 'تواصل / معنا' : 'GET IN / TOUCH'}
            </h1>
            <div className="space-y-6">
              <p className="text-lg text-white/60 leading-relaxed max-w-md">
                {isRtl 
                  ? 'لديك سؤال؟ فريقنا هنا لمساعدتك. تواصل معنا عبر النموذج أو مباشرة من خلال الواتساب.' 
                  : 'Have a question? Our team is here to help. Reach out via the form or directly through WhatsApp.'}
              </p>
              <div className="pt-6">
                <a
                  href="https://wa.me/966500000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-white border border-white/20 px-8 h-14 rounded-lg hover:bg-white hover:text-black transition-all"
                >
                  <MessageCircle className="size-5" />
                  {isRtl ? 'دردشة عبر الواتساب' : 'Chat on WhatsApp'}
                </a>
              </div>
            </div>
          </div>

          <div className="bg-[#111111] border border-white/10 p-12 rounded-lg">
            {sent ? (
              <div className="py-24 text-center space-y-6">
                <div className="size-16 rounded-full bg-white/5 flex items-center justify-center mx-auto text-white">
                  <ArrowRight className={isRtl ? "rotate-180" : ""} />
                </div>
                <h2 className="text-2xl font-bold uppercase tracking-tighter text-white">
                  {isRtl ? 'شكراً لتواصلك' : 'Message Sent'}
                </h2>
                <p className="text-sm text-white/40 uppercase tracking-widest">
                  {isRtl ? 'سنرد عليك قريباً جداً' : 'We\'ll get back to you shortly'}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-10">
                <Input
                  label={isRtl ? 'الاسم' : 'Name'}
                  required
                />
                <Input
                  label={isRtl ? 'البريد الإلكتروني' : 'Email'}
                  type="email"
                  required
                />
                <div className="space-y-2">
                  <label className="block text-[10px] uppercase tracking-[0.3em] text-white/40 mb-2 font-bold">
                    {isRtl ? 'الرسالة' : 'Message'}
                  </label>
                  <textarea
                    required
                    rows={4}
                    className="w-full bg-transparent border-b border-white/20 py-3 text-white placeholder:text-white/10 
                               focus:outline-none focus:border-white transition-colors duration-300 rounded-none resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-16 bg-white text-black rounded-lg font-bold uppercase tracking-widest hover:bg-white/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-4"
                >
                  {isSubmitting 
                    ? (isRtl ? 'جاري الإرسال...' : 'Sending...') 
                    : (isRtl ? 'إرسال الرسالة' : 'Send Message')}
                  {!isSubmitting && (isRtl ? <ArrowLeft className="size-5" /> : <ArrowRight className="size-5" />)}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Input({ 
  label, 
  className, 
  ...props 
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div className={className}>
      <label className="block text-[10px] uppercase tracking-[0.3em] text-white/40 mb-2 font-bold">
        {label}
      </label>
      <input
        {...props}
        className="w-full bg-transparent border-b border-white/20 py-3 text-white placeholder:text-white/10 
                   focus:outline-none focus:border-white transition-colors duration-300 rounded-none"
      />
    </div>
  )
}
