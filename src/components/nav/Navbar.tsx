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
      <div className="max-w-[1440px] mx-auto px-8 h-14 flex items-center justify-between">
        
        {/* Left Side: Navigation Links */}
        <nav className="hidden md:flex items-center gap-10 flex-1" aria-label="Main navigation">
          <Link href="/shop/tops" className="text-sm font-semibold tracking-tight hover:opacity-60 transition-opacity">
            Tops
          </Link>
          <Link href="/shop/bottoms" className="text-sm font-semibold tracking-tight hover:opacity-60 transition-opacity">
            Bottoms
          </Link>
          <Link href="/about" className="text-sm font-semibold tracking-tight hover:opacity-60 transition-opacity">
            Our Story
          </Link>
          <Link href="/contact" className="text-sm font-semibold tracking-tight hover:opacity-60 transition-opacity">
            Contact
          </Link>
        </nav>

        {/* Center: Logo */}
        <div className="flex-1 flex justify-center">
          <Link
            href="/"
            className="text-2xl font-bold tracking-[-0.05em] hover:opacity-80 transition-opacity"
          >
            <span dir="ltr">ORKI</span>
          </Link>
        </div>

        {/* Right Side: Icons & Lang */}
        <div className="flex items-center justify-end gap-6 flex-1">
          <button className="hover:opacity-60 transition-opacity">
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
