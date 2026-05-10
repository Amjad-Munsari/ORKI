import 'server-only';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/types/domain';

const HOST = 'https://orki.sa';
const DEFAULT_OG_IMAGE = `${HOST}/og-default.png`;

interface BuildMetadataInput {
  /** Path relative to the locale prefix, e.g. '/about', '/legal/privacy', '/' */
  path: string;
  /** Required current locale */
  locale: Locale;
  /**
   * next-intl `namespace.key` for the title (e.g. `'Meta.about.title'`).
   * Returned as the BARE page name; root layout's `title.template` applies `'%s | ORKI'`.
   */
  titleKey: string;
  /** next-intl `namespace.key` for the description */
  descriptionKey: string;
  /** Optional override for OG image (absolute URL). Defaults to `/og-default.png`. */
  ogImage?: string;
}

export async function buildMetadata({
  path,
  locale,
  titleKey,
  descriptionKey,
  ogImage,
}: BuildMetadataInput): Promise<Metadata> {
  // Single translator scoped to the locale (no namespace) — `t('Meta.about.title')`
  // works because next-intl resolves dotted paths against the root messages tree.
  // Drops the dual getTranslations call + redundant per-namespace splits.
  const t = await getTranslations({ locale });
  const title = t(titleKey as never);
  const description = t(descriptionKey as never);
  const image = ogImage ?? DEFAULT_OG_IMAGE;

  const suffix = path === '/' ? '' : path;
  const canonical = `${HOST}/${locale}${suffix}`;

  return {
    title, // bare; root layout sets title.template = '%s | ORKI'
    description,
    alternates: {
      canonical,
      languages: {
        en: `${HOST}/en${suffix}`,
        ar: `${HOST}/ar${suffix}`,
        'x-default': `${HOST}/en${suffix}`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'ORKI',
      locale: locale === 'ar' ? 'ar_SA' : 'en_US',
      type: 'website',
      images: [{ url: image, width: 1200, height: 630, alt: 'ORKI' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}
