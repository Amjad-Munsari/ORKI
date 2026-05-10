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
  const [titleNs, ...titleRest] = titleKey.split('.');
  const titleSubKey = titleRest.join('.');
  // next-intl types `namespace` as a literal union derived from messages; this helper
  // accepts dynamic 'ns.key' strings by design, so we widen to `never` to satisfy
  // the overload while preserving runtime behavior.
  const tTitle = await getTranslations({
    locale,
    namespace: titleNs as never,
  });

  const [descNs, ...descRest] = descriptionKey.split('.');
  const descSubKey = descRest.join('.');
  const tDesc = await getTranslations({
    locale,
    namespace: descNs as never,
  });

  const title = tTitle(titleSubKey as never);
  const description = tDesc(descSubKey as never);
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
