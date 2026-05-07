import type { Metadata } from 'next';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { spaceGrotesk, ibmPlexArabic } from '@/lib/fonts';
import { Navbar } from '@/components/nav/Navbar';
import { Footer } from '@/components/footer/Footer';
import '@/app/globals.css';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: 'ORKI — Underground Streetwear',
  description: 'Saudi streetwear. Dark. Underground.',
};

export default async function LocaleLayout({ children, params }: Props) {
  // Await params — Next.js 15 params is a Promise
  const { locale } = await params;

  // Reject invalid locale values — hasLocale guard prevents open-redirect via locale segment
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Set direction from locale — BOTH lang and dir update atomically (non-negotiable architectural rule)
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html
      lang={locale}
      dir={dir}
      className={`dark ${spaceGrotesk.variable} ${ibmPlexArabic.variable}`}
    >
      <body className="bg-black text-white antialiased min-h-screen flex flex-col">
        <NextIntlClientProvider>
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
