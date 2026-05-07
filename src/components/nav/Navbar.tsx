import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
import {LanguageSwitcher} from './LanguageSwitcher';
import {MobileNavDrawer} from './MobileNavDrawer';

export function Navbar() {
  const t = useTranslations('Nav');

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

        {/* Desktop nav links — hidden below md (768px) */}
        <nav
          className="hidden md:flex items-center gap-8"
          aria-label="Main navigation"
        >
          <Link
            href="/shop/tops"
            className="text-base font-normal text-white/60 hover:text-white transition-opacity duration-150"
          >
            {t('tops')}
          </Link>
          <Link
            href="/shop/bottoms"
            className="text-base font-normal text-white/60 hover:text-white transition-opacity duration-150"
          >
            {t('bottoms')}
          </Link>
          <Link
            href="/about"
            className="text-base font-normal text-white/60 hover:text-white transition-opacity duration-150"
          >
            {t('about')}
          </Link>
        </nav>

        {/* Inline-end cluster: language switcher + hamburger (mobile) */}
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          {/* Mobile hamburger — visible below md, hidden at md+ */}
          <div className="md:hidden">
            <MobileNavDrawer />
          </div>
        </div>

      </div>
    </header>
  );
}
