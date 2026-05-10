'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { readCookieConsent, writeCookieConsent } from '@/lib/cookie-consent';

interface Props {
  // Reserved for future use; banner is locale-agnostic in copy via next-intl.
  // Kept on the prop signature so the future flip is a one-line render change.
  locale?: 'en' | 'ar';
}

/**
 * CookieBanner — future-proofing scaffold built in Phase 9 (CONTEXT §2).
 * NOT MOUNTED in any layout this phase. When marketing/analytics cookies are added,
 * mount in src/app/[locale]/layout.tsx as <CookieBanner locale={locale} />.
 *
 * RTL note (Issue #7): the symmetric `p-6 m-6` utilities below are logical-CSS-safe
 * in Tailwind v4 — they apply equal padding/margin on both inline-start and inline-end,
 * so the layout is correct in both LTR and RTL without using `ps-`/`pe-`/`ms-`/`me-`.
 * CLAUDE.md's directional-class prohibition targets `pl-`/`pr-`/`ml-`/`mr-` only.
 */
export function CookieBanner(_props: Props) {
  const [show, setShow] = useState(false);
  const t = useTranslations('CookieBanner');

  useEffect(() => {
    setShow(readCookieConsent() === 'pending');
  }, []);

  if (!show) return null;

  return (
    <div
      className="fixed bottom-0 inset-inline-end-0 z-50 max-w-md p-6 m-6 bg-[#111111] border border-white/10 space-y-4"
      role="region"
      aria-label="Cookie consent"
    >
      <p className="text-sm text-white/80 leading-relaxed">{t('body')}</p>
      <Link
        href="/legal/cookies"
        className="text-xs text-white/60 underline inline-block"
      >
        {t('secondaryLink')}
      </Link>
      <div>
        <button
          onClick={() => {
            writeCookieConsent('accepted');
            setShow(false);
          }}
          className="px-4 py-2 bg-white text-black text-sm font-semibold rounded-none"
        >
          {t('primaryCta')}
        </button>
      </div>
    </div>
  );
}
