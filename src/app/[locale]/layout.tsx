import type { Metadata } from 'next';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { spaceGrotesk, ibmPlexArabic } from '@/lib/fonts';
import { Navbar } from '@/components/nav/Navbar';
import { Footer } from '@/components/footer/Footer';
import { StoreHydration } from '@/store/StoreHydration';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { PageTransition } from '@/components/PageTransition';
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
      className={`dark ${spaceGrotesk.variable} ${ibmPlexArabic.variable}`}
    >
      <body className="bg-black text-white antialiased min-h-screen flex flex-col">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <StoreHydration />
          <Navbar />
          <CartDrawer locale={locale as any} />
          <PageTransition>
            <main className="flex-1">
              {children}
            </main>
          </PageTransition>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
