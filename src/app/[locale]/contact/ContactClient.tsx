'use client'

import { MessageCircle, ArrowRight } from 'lucide-react'

interface Props {
  locale: 'en' | 'ar'
}

// Phase 11 D-16: WhatsApp number held as a single constant. UAT (Plan 11-16)
// prompts the user to replace 'TBD' with the real international number
// (no leading +, no spaces, no dashes). e.g. '966555123456'.
const WA_NUMBER = 'TBD'

export function ContactClient({ locale }: Props) {
  const isRtl = locale === 'ar'
  const waHref = `https://wa.me/${WA_NUMBER}`

  return (
    <div className="min-h-screen bg-black pt-24 pb-48">
      <div className="max-w-[var(--container-max)] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-start">

          {/* Left column — hero + intro (unchanged structurally per D-15) */}
          <div className="space-y-12">
            <h1 className="display-3 font-bold uppercase text-white">
              {isRtl ? 'تواصل / معنا' : 'GET IN / TOUCH'}
            </h1>
            <div className="space-y-6">
              <p className="text-lg text-white/60 leading-relaxed max-w-md">
                {isRtl
                  ? 'لديك سؤال؟ فريقنا هنا لمساعدتك. تواصل معنا عبر الواتساب.'
                  : 'Have a question? The fastest way to reach us is on WhatsApp.'}
              </p>
              <div className="pt-6">
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-white border border-white/20 px-8 h-14 rounded-lg hover:bg-white hover:text-black transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                  <MessageCircle className="size-5" />
                  {isRtl ? 'دردشة عبر الواتساب' : 'Chat on WhatsApp'}
                </a>
              </div>
            </div>
          </div>

          {/* Right column — callout card replaces the mock form (D-14). */}
          <aside
            role="region"
            aria-live="polite"
            aria-label={isRtl ? 'قناة المراسلة الحالية' : 'Current messaging channel'}
            className="bg-[var(--color-secondary-surface)] border border-white/10 p-12 rounded-lg"
          >
            <div className="space-y-6">
              <span className="text-[10px] uppercase tracking-[0.5em] text-white/40 font-bold">
                {isRtl ? 'قناة المراسلة' : 'Messaging channel'}
              </span>
              <h2 className="text-2xl font-bold text-white leading-tight">
                {isRtl
                  ? 'نحن لا نزال نُجهز قناة البريد.'
                  : "We're still wiring up email."}
              </h2>
              <p className="text-base text-white/70 leading-relaxed">
                {isRtl
                  ? 'راسلنا عبر الواتساب — نقرأ كل رسالة.'
                  : 'Message us on WhatsApp — we read every one.'}
              </p>
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 w-full h-16 bg-white text-black rounded-lg font-bold uppercase tracking-widest hover:bg-white/90 transition-colors justify-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                {isRtl ? 'افتح الواتساب' : 'Open WhatsApp'}
                <ArrowRight className="size-5 rtl-flip" />
              </a>
              <p className="text-xs text-white/30 leading-relaxed">
                {isRtl
                  ? 'سيُعاد فتح نموذج البريد الإلكتروني عندما نُفعّل خدمة الإرسال (لاحقاً).'
                  : 'The email form returns once our delivery channel is live. For now, WhatsApp is the fastest path.'}
              </p>
            </div>
          </aside>

        </div>
      </div>
    </div>
  )
}
