import type { Metadata } from 'next';
import type { Locale } from '@/types/domain';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { geist, ibmPlexArabic } from '@/lib/fonts';
import { Navbar } from '@/components/nav/Navbar';
import { Footer } from '@/components/footer/Footer';
import { StoreHydration } from '@/store/StoreHydration';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { PageTransition } from '@/components/PageTransition';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import '@/app/globals.css';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  metadataBase: new URL('https://orki.sa'),
  title: {
    default: 'ORKI — Saudi Streetwear',
    template: '%s | ORKI',
  },
  description: 'Saudi streetwear. Dark. Underground.',
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  const messages = await getMessages();

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html
      lang={locale}
      dir={dir}
      className={`dark ${geist.variable} ${ibmPlexArabic.variable}`}
    >
      <body
        className="bg-black text-white antialiased min-h-screen flex flex-col"
        suppressHydrationWarning
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <StoreHydration />
          <Navbar />
          <CartDrawer locale={locale as Locale} />
          <PageTransition>
            <main className="flex-1 pt-20">
              {children}
            </main>
          </PageTransition>
          <Footer />
        </NextIntlClientProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
