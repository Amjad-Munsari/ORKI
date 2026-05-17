import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { LanguageSwitcher } from './LanguageSwitcher'
import { MobileNavDrawer } from './MobileNavDrawer'
import { CartTrigger } from './CartTrigger'
import { ShopDropdown } from './ShopDropdown'
import { UserMenu } from '@/components/auth/UserMenu'
import { createClient } from '@/lib/supabase/server'

export async function Navbar() {
  const t = await getTranslations('Nav')
  // Phase 10 Plan 05 — auth slot. supabase.auth.getUser() revalidates the JWT
  // against Supabase Auth (NOT the legacy session API — see lib/supabase/
  // server.ts docblock for the spoofability rationale).
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const authedUser = user ? { id: user.id, email: user.email ?? '' } : null

  return (
    <header className="fixed top-0 z-50 w-full bg-black/80 backdrop-blur text-white border-b border-white/[0.08]">
      {/*
        h-16 (64px) chrome height. items-center on the grid centers each column to
        its content height — interior elements no longer use h-full so hit areas
        match their visible padding, not the full navbar strip. Pair with
        layout.tsx `<main pt-16>` and any sticky-element offsets (PDPLayout).
      */}
      <div className="w-full px-12 h-16 grid grid-cols-3 items-center">

        {/* Left Side: Navigation Links */}
        <nav className="flex items-center gap-12 justify-start" aria-label="Main navigation">
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
              className="text-sm font-medium tracking-tight whitespace-nowrap focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              <span className="link-underline inline-block leading-none py-2">{label}</span>
            </Link>
          ))}
        </nav>

        {/* Center: Logo */}
        <div className="flex items-center justify-center">
          <Link
            href="/"
            className="text-2xl font-bold tracking-[0.05em] inline-flex items-center transition-transform duration-[var(--duration-base)] ease-[var(--ease-out-soft)] hover:scale-105 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            <span dir="ltr">ORKI</span>
          </Link>
        </div>

        {/* Right Side: Icons & Lang */}
        <div className="flex items-center gap-12 justify-end">
          <CartTrigger ariaLabel={t('cart')} />
          <div className="hidden md:flex items-center">
            <UserMenu user={authedUser} />
          </div>
          <LanguageSwitcher />
          <div className="md:hidden flex items-center">
            <MobileNavDrawer user={authedUser} />
          </div>
        </div>

      </div>
    </header>
  )
}
