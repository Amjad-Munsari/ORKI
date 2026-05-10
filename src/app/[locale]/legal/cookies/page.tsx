import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { buildMetadata } from '@/lib/seo';
import { LegalArticle } from '@/components/legal/LegalArticle';
import { CookieTable } from '@/components/legal/CookieTable';
import type { Locale } from '@/types/domain';

type Props = { params: Promise<{ locale: Locale }> };

const SECTIONS = [
  'section1',
  'section2',
  'section3',
  'section4',
  'section5',
  'section6',
  'section7',
] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    path: '/legal/cookies',
    locale,
    titleKey: 'Legal.cookies.metaTitle',
    descriptionKey: 'Legal.cookies.metaDescription',
  });
}

export default async function CookiesPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Legal.cookies' });

  return (
    <LegalArticle
      eyebrow={t('eyebrow')}
      heading={t('heading')}
      lastUpdated="10 May 2026"
      locale={locale}
    >
      {SECTIONS.map((key) => (
        <section key={key} className="space-y-4">
          <h2 className="text-2xl md:text-4xl font-bold tracking-[-0.02em] leading-tight text-white">
            {t(`${key}.heading`)}
          </h2>
          <p className="leading-relaxed">{t(`${key}.body`)}</p>
          {key === 'section2' && (
            <div className="mt-6">
              <CookieTable locale={locale} />
            </div>
          )}
        </section>
      ))}
    </LegalArticle>
  );
}
