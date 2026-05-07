import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { ShoppingCart } from 'lucide-react'
import { LanguageSwitcher } from './LanguageSwitcher'
import { MobileNavDrawer } from './MobileNavDrawer'
import { CartTrigger } from './CartTrigger'

// async Server Component — getLocale() and getTranslations() are async
export async function Navbar() {
  const t = await getTranslations('Nav')

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.12] bg-black">
      <div className="max-w-[1280px] mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo — inline-start */}
        <Link
          href="/"
          className="text-xl font-semibold tracking-[-0.02em] text-white hover:opacity-80 transition-opacity duration-150"
        >
          {/* ORKI always renders in Latin characters — wrap in ltr span for AR context */}
          <span dir="ltr">ORKI</span>
        </Link>

        {/* Desktop nav — hidden below md (768px) */}
        <nav
          className="hidden md:flex items-center gap-8"
          aria-label="Main navigation"
        >
          <Link
            href="/shop"
            className="text-base font-normal text-white/60 hover:text-white transition-opacity duration-150"
          >
            {t('shop')}
          </Link>
          <Link
            href="/about"
            className="text-base font-normal text-white/60 hover:text-white transition-opacity duration-150"
          >
            {t('about')}
          </Link>
        </nav>

        {/* Inline-end cluster: cart icon + language switcher + hamburger (mobile) */}
        <div className="flex items-center gap-4">
          <div className="relative hidden md:flex">
            <CartTrigger ariaLabel={t('cart')} />
          </div>

          <LanguageSwitcher />

          <div className="md:hidden">
            <MobileNavDrawer />
          </div>
        </div>

      </div>
    </header>
  )
}
