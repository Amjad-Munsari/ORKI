import { useTranslations } from 'next-intl';

export default function HomePage() {
  const t = useTranslations('Meta');
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-2xl font-semibold">{t('siteTitle')}</h1>
    </main>
  );
}
