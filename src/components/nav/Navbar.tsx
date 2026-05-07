import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { Search } from 'lucide-react'
import { LanguageSwitcher } from './LanguageSwitcher'
import { MobileNavDrawer } from './MobileNavDrawer'
import { CartTrigger } from './CartTrigger'

export async function Navbar() {
  const t = await getTranslations('Nav')

  return (
    <header className="fixed top-0 z-50 w-full bg-white text-black border-b border-black/5">
      <div className="max-w-[1440px] mx-auto px-8 h-[80px] grid grid-cols-2 md:grid-cols-[1fr_auto_1fr] items-center">

        {/* Left Side: Navigation Links */}
        <nav className="hidden md:flex items-center gap-10 justify-start" aria-label="Main navigation">
          {[
            { href: '/shop/tops', label: 'Tops' },
            { href: '/shop/bottoms', label: 'Bottoms' },
            { href: '/about', label: 'Our Story' },
            { href: '/contact', label: 'Contact' },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-sm font-semibold tracking-tight hover:opacity-60 transition-opacity leading-none"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Center: Logo */}
        <div className="flex items-center justify-start md:justify-center">
          <Link
            href="/"
            className="text-2xl font-bold tracking-[-0.05em] hover:opacity-80 transition-opacity leading-none"
          >
            <span dir="ltr">ORKI</span>
          </Link>
        </div>

        {/* Right Side: Icons & Lang */}
        <div className="flex items-center gap-6 justify-end">
          <button
            aria-label="Search"
            className="flex items-center justify-center min-h-[44px] min-w-[44px] hover:opacity-60 transition-opacity"
          >
            <Search className="size-5" strokeWidth={2.5} />
          </button>
          <CartTrigger ariaLabel={t('cart')} />
          <LanguageSwitcher />
          <div className="md:hidden">
            <MobileNavDrawer />
          </div>
        </div>

      </div>
    </header>
  )
}