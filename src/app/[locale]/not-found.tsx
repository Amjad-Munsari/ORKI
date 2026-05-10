import { getTranslations, getLocale } from 'next-intl/server';
import { BrandedErrorPage } from '@/components/error/BrandedErrorPage';
import type { Locale } from '@/types/domain';

/**
 * Per-locale 404 page (Server Component). Triggered by `notFound()` calls
 * inside the [locale] segment. No `role="alert"` (UI-SPEC line 304 — 404
 * is not an error event for AT users).
 */
export default async function LocaleNotFound() {
  const t = await getTranslations('Errors.notFound');
  const locale = (await getLocale()) as Locale;

  return (
    <BrandedErrorPage
      variant="404"
      heading={t('heading')}
      body={t('body')}
      ctaLabel={t('browseShop')}
      ctaHref="/shop"
      secondaryLabel={t('returnHome')}
      secondaryHref="/"
      locale={locale}
      isRtl={locale === 'ar'}
    />
  );
}
