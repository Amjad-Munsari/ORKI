'use client';

import { useEffect } from 'react';
import { geist, ibmPlexArabic } from '@/lib/fonts';
import { BrandedErrorPage } from '@/components/error/BrandedErrorPage';

/**
 * Top-level error boundary. Fires when an uncaught error escapes the
 * locale layout (i.e. before [locale]/error.tsx can catch it). Owns its
 * own <html>/<body> because the locale layout has been replaced.
 *
 * Caveats (RESEARCH.md Pattern 6 + Pitfall 1):
 *  - DO NOT use next-intl here (no NextIntlClientProvider in scope).
 *  - DO NOT mount Analytics or SpeedInsights here (Pitfall 1).
 *  - DO NOT export `metadata` (not supported in global-error).
 */

const COPY = {
  en: {
    heading: 'Something broke.',
    body: "We're working on it. Try again, or head back home.",
    retry: 'Try again',
    home: 'Return home',
  },
  ar: {
    heading: 'حدث خطأ ما.',
    body: 'نحن نعمل على إصلاحه. حاول مرة أخرى أو عُد إلى الصفحة الرئيسية.',
    retry: 'إعادة المحاولة',
    home: 'العودة إلى الرئيسية',
  },
} as const;

type SupportedLang = keyof typeof COPY;

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('[global-error]', error);
  }, [error]);

  const detected =
    typeof document !== 'undefined'
      ? (document.documentElement.lang as SupportedLang)
      : 'en';
  const lang: SupportedLang = detected === 'ar' ? 'ar' : 'en';
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const t = COPY[lang];

  return (
    <html
      lang={lang}
      dir={dir}
      className={`dark ${geist.variable} ${ibmPlexArabic.variable}`}
    >
      <body className="bg-black text-white antialiased min-h-screen flex flex-col">
        <BrandedErrorPage
          variant="error"
          heading={t.heading}
          body={t.body}
          ctaLabel={t.retry}
          ctaHref="/"
          onPrimary={() => reset()}
          secondaryLabel={t.home}
          secondaryHref="/"
          locale={lang}
          isRtl={dir === 'rtl'}
          errorDigest={error.digest}
        />
      </body>
    </html>
  );
}
