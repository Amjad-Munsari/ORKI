import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Truck, RotateCcw, ShieldCheck, Users } from 'lucide-react'

export function Footer() {
  const t = useTranslations('Footer')
  const currentYear = new Date().getFullYear()

  return (
    <footer className="w-full bg-black text-white">
      {/* Benefit Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 border-y border-white/10">
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center border-b md:border-b-0 md:border-r border-white/10 group hover:bg-white/[0.02] transition-colors">
          <Truck className="size-6 mb-4 text-white/60 group-hover:text-white transition-colors" />
          <span className="text-sm font-medium tracking-tight text-white/80">Free shipping from $149</span>
        </div>
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center border-b md:border-b-0 md:border-r border-white/10 group hover:bg-white/[0.02] transition-colors">
          <RotateCcw className="size-6 mb-4 text-white/60 group-hover:text-white transition-colors" />
          <span className="text-sm font-medium tracking-tight text-white/80">Easy returns within 30 days</span>
        </div>
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center border-b md:border-b-0 md:border-r border-white/10 group hover:bg-white/[0.02] transition-colors">
          <ShieldCheck className="size-6 mb-4 text-white/60 group-hover:text-white transition-colors" />
          <span className="text-sm font-medium tracking-tight text-white/80">Secure payments online</span>
        </div>
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center group hover:bg-white/[0.02] transition-colors">
          <Users className="size-6 mb-4 text-white/60 group-hover:text-white transition-colors" />
          <span className="text-sm font-medium tracking-tight text-white/80">24/7 customer support</span>
        </div>
      </div>

      {/* Main Footer Section */}
      <div className="max-w-[1440px] mx-auto px-8 py-24">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-16 lg:gap-32">
          
          {/* Brand & Copyright */}
          <div className="flex-1 space-y-8">
            <h2 className="text-8xl md:text-[160px] font-bold tracking-[-0.05em] leading-none">
              ORKI
            </h2>
            <p className="text-sm text-white/40 font-medium">
              © {currentYear} All Rights Reserved
            </p>
          </div>

          {/* Navigation Groups */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-16 lg:gap-24 pt-4">
            {/* Group 1: Navigation */}
            <div className="space-y-6">
              <span className="text-xs font-semibold text-white/40 block">(Navigation)</span>
              <ul className="space-y-4">
                <li><Link href="/" className="text-sm font-semibold hover:text-white/60 transition-colors">Home</Link></li>
                <li><Link href="/shop/men" className="text-sm font-semibold hover:text-white/60 transition-colors">Men</Link></li>
                <li><Link href="/shop/women" className="text-sm font-semibold hover:text-white/60 transition-colors">Women</Link></li>
                <li><Link href="/about" className="text-sm font-semibold hover:text-white/60 transition-colors">Our Story</Link></li>
              </ul>
            </div>

            {/* Group 2: Legal */}
            <div className="space-y-6">
              <span className="text-xs font-semibold text-white/40 block">(Legal)</span>
              <ul className="space-y-4">
                <li><Link href="/privacy" className="text-sm font-semibold hover:text-white/60 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-sm font-semibold hover:text-white/60 transition-colors">Terms of Service</Link></li>
              </ul>
            </div>

            {/* Group 3: Help */}
            <div className="space-y-6">
              <span className="text-xs font-semibold text-white/40 block">(Help)</span>
              <ul className="space-y-4">
                <li><Link href="/contact" className="text-sm font-semibold hover:text-white/60 transition-colors">Contact</Link></li>
                <li><Link href="/faq" className="text-sm font-semibold hover:text-white/60 transition-colors">FAQ</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
