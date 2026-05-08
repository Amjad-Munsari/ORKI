import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { Search } from 'lucide-react'
import { LanguageSwitcher } from './LanguageSwitcher'
import { MobileNavDrawer } from './MobileNavDrawer'
import { CartTrigger } from './CartTrigger'
import { ShopDropdown } from './ShopDropdown'

export async function Navbar() {
  const t = await getTranslations('Nav')

  return (
    <header className="fixed top-0 z-50 w-full bg-white text-black border-b border-black/5">
      <div className="w-full px-12 h-[80px] grid grid-cols-3 items-stretch">

        {/* Left Side: Navigation Links */}
        <nav className="hidden md:flex h-full items-center gap-12 justify-start" aria-label="Main navigation">
          <ShopDropdown 
            label={t('shop')} 
            items={[
              { href: '/shop/tops', label: t('tops') },
              { href: '/shop/bottoms', label: t('bottoms') },
            ]} 
          />
          {[
            { href: '/about', label: t('about') },
            { href: '/contact', label: t('contact') },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="h-full flex items-center text-sm font-medium tracking-tight hover:opacity-60 transition-opacity whitespace-nowrap"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Center: Logo */}
        <div className="h-full flex items-center justify-center">
          <Link
            href="/"
            className="text-2xl font-bold tracking-[0.05em] hover:opacity-80 transition-opacity flex items-center"
          >
            <span dir="ltr">ORKI</span>
          </Link>
        </div>

        {/* Right Side: Icons & Lang */}
        <div className="h-full flex items-center gap-12 justify-end">
          <button
            aria-label="Search"
            className="h-full flex items-center justify-center hover:opacity-60 transition-opacity"
          >
            <Search className="size-5" strokeWidth={2.5} />
          </button>
          <div className="h-full flex items-center justify-center">
            <CartTrigger ariaLabel={t('cart')} />
          </div>
          <div className="h-full flex items-center justify-center">
            <LanguageSwitcher />
          </div>
          <div className="md:hidden h-full flex items-center justify-center">
            <MobileNavDrawer />
          </div>
        </div>

      </div>
    </header>
  )
}