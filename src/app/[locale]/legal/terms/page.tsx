import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { buildMetadata } from '@/lib/seo';
import { LegalArticle } from '@/components/legal/LegalArticle';
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
  'section8',
  'section9',
  'section10',
  'section11',
  'section12',
  'section13',
  'section14',
  'section15',
  'section16',
] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    path: '/legal/terms',
    locale,
    titleKey: 'Legal.terms.metaTitle',
    descriptionKey: 'Legal.terms.metaDescription',
  });
}

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Legal.terms' });

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
        </section>
      ))}
    </LegalArticle>
  );
}
