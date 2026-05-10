'use client';

import { useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { BrandedErrorPage } from '@/components/error/BrandedErrorPage';
import type { Locale } from '@/types/domain';

/**
 * Per-locale error boundary. Fires when an error happens inside the
 * [locale] segment (i.e. after the locale layout has rendered). Has full
 * next-intl access — uses `useTranslations('Errors')`.
 */
export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('Errors');
  const locale = useLocale() as Locale;

  useEffect(() => {
    console.error('[locale-error]', error);
  }, [error]);

  return (
    <BrandedErrorPage
      variant="error"
      heading={t('heading')}
      body={t('body')}
      ctaLabel={t('retry')}
      ctaHref="/"
      onPrimary={() => reset()}
      secondaryLabel={t('home')}
      secondaryHref="/"
      locale={locale}
      isRtl={locale === 'ar'}
      errorDigest={error.digest}
    />
  );
}
