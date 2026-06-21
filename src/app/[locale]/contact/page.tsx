import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import { ContactClient } from './ContactClient';
import type { Locale } from '@/types/domain';

type Props = {
  params: Promise<{ locale: Locale }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    path: '/contact',
    locale,
    titleKey: 'Meta.contact.title',
    descriptionKey: 'Meta.contact.description',
  });
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  return <ContactClient locale={locale} />;
}
