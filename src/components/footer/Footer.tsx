import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
import {Separator} from '@/components/ui/separator';

export function Footer() {
  const t = useTranslations('Footer');

  return (
    <footer className="w-full bg-black border-t border-white/[0.12] mt-auto">
      <div className="max-w-[1280px] mx-auto px-6 py-8">

        {/* Policy links row */}
        <nav
          className="flex flex-wrap items-center gap-6 mb-6"
          aria-label="Footer navigation"
        >
          <Link
            href="/shipping"
            className="text-sm font-normal text-white/60 hover:text-white transition-opacity duration-150 min-h-[44px] flex items-center"
          >
            {t('shipping')}
          </Link>
          <Link
            href="/returns"
            className="text-sm font-normal text-white/60 hover:text-white transition-opacity duration-150 min-h-[44px] flex items-center"
          >
            {t('returns')}
          </Link>
          <Link
            href="/contact"
            className="text-sm font-normal text-white/60 hover:text-white transition-opacity duration-150 min-h-[44px] flex items-center"
          >
            {t('contact')}
          </Link>
        </nav>

        <Separator className="bg-white/[0.12] mb-6" />

        {/* Copyright — use t('copyright') from the translation system.
            messages/en.json: "© 2026 ORKI. All rights reserved."
            messages/ar.json: "© 2026 ORKI. جميع الحقوق محفوظة."
            The Unicode Bidi algorithm handles the embedded Latin "ORKI" in RTL context
            correctly in all modern browsers. No explicit dir="ltr" wrapper is needed. */}
        <p className="text-xs font-normal text-white/40">
          {t('copyright')}
        </p>

      </div>
    </footer>
  );
}
