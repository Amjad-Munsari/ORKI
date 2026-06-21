import { Link } from '@/i18n/navigation'
import { Truck, RotateCcw, ShieldCheck, Users } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

export async function Footer() {
  const currentYear = new Date().getFullYear()
  const tBenefits = await getTranslations('Footer.benefits')
  const tNav = await getTranslations('Footer.nav')
  const tHelp = await getTranslations('Footer.help')
  const tLegal = await getTranslations('Footer.legal')
  const tFooter = await getTranslations('Footer')

  return (
    <footer className="w-full bg-black text-white">
      {/* Benefit Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 border-y border-white/10">
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center border-b md:border-b-0 md:border-e border-white/10 group hover:bg-white/[0.02] transition-colors">
          <Truck className="size-6 mb-4 text-white/60 group-hover:text-white transition-colors" />
          <span className="text-sm font-medium tracking-tight text-white/80">{tBenefits('shipping')}</span>
        </div>
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center border-b md:border-b-0 md:border-e border-white/10 group hover:bg-white/[0.02] transition-colors">
          <RotateCcw className="size-6 mb-4 text-white/60 group-hover:text-white transition-colors" />
          <span className="text-sm font-medium tracking-tight text-white/80">{tBenefits('returns')}</span>
        </div>
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center border-b md:border-b-0 md:border-e border-white/10 group hover:bg-white/[0.02] transition-colors">
          <ShieldCheck className="size-6 mb-4 text-white/60 group-hover:text-white transition-colors" />
          <span className="text-sm font-medium tracking-tight text-white/80">{tBenefits('payments')}</span>
        </div>
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center group hover:bg-white/[0.02] transition-colors">
          <Users className="size-6 mb-4 text-white/60 group-hover:text-white transition-colors" />
          <span className="text-sm font-medium tracking-tight text-white/80">{tBenefits('support')}</span>
        </div>
      </div>

      {/* Main Footer Section */}
      <div className="max-w-[var(--container-max)] mx-auto px-12 py-24">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-16 lg:gap-32">

          {/* Brand & Copyright */}
          <div className="flex-1 space-y-8">
            <h2 className="display-1 font-bold">
              ORKI
            </h2>
            <p className="text-sm text-white/40 font-medium">
              {tFooter('copyrightShort', { year: currentYear })}
            </p>
          </div>

          {/* Navigation Groups */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-16 lg:gap-24 pt-4">
            {/* Group 1: Navigation */}
            <div className="space-y-6">
              <span className="text-xs font-semibold text-white/40 block">{tNav('groupLabel')}</span>
              <ul className="space-y-4">
                <li><Link href="/" className="text-sm font-semibold inline-block leading-none py-2 link-underline">{tNav('home')}</Link></li>
                <li><Link href="/shop/tops" className="text-sm font-semibold inline-block leading-none py-2 link-underline">{tNav('tops')}</Link></li>
                <li><Link href="/shop/bottoms" className="text-sm font-semibold inline-block leading-none py-2 link-underline">{tNav('bottoms')}</Link></li>
                <li><Link href="/about" className="text-sm font-semibold inline-block leading-none py-2 link-underline">{tNav('story')}</Link></li>
              </ul>
            </div>

            {/* Group 2: Legal */}
            <div className="space-y-6">
              <span className="text-xs font-semibold text-white/40 block">{tLegal('groupLabel')}</span>
              <ul className="space-y-4">
                <li><Link href="/legal/privacy" className="text-sm font-semibold inline-block leading-none py-2 link-underline">{tLegal('privacy')}</Link></li>
                <li><Link href="/legal/terms" className="text-sm font-semibold inline-block leading-none py-2 link-underline">{tLegal('terms')}</Link></li>
                <li><Link href="/legal/cookies" className="text-sm font-semibold inline-block leading-none py-2 link-underline">{tLegal('cookies')}</Link></li>
              </ul>
            </div>

            {/* Group 3: Help */}
            <div className="space-y-6">
              <span className="text-xs font-semibold text-white/40 block">{tHelp('groupLabel')}</span>
              <ul className="space-y-4">
                <li><Link href="/contact" className="text-sm font-semibold inline-block leading-none py-2 link-underline">{tHelp('contact')}</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
