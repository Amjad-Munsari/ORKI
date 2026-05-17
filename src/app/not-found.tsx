import { headers } from 'next/headers';

/**
 * Root-level 404 fallback. Catches unmatched URLs that fall through the
 * `[locale]` segment (e.g. `/en/nope`, `/random-path`) — without this file,
 * Next.js renders the framework-default `404: This page could not be found.`
 * page, bypassing the ORKI brand chrome.
 *
 * Locale detection: the middleware sets `x-pathname` on the request so we
 * can sniff the `/ar/` prefix here. next-intl's `getLocale()` /
 * `getTranslations()` are not available at the root (no locale context).
 *
 * For paths under `/[locale]/...` that *did* match the locale prefix but
 * have no child match, the per-locale `[locale]/not-found.tsx` still fires
 * and uses translations directly (this file is the fallthrough below it).
 */
export default async function RootNotFound() {
  const h = await headers();
  const pathname = h.get('x-pathname') ?? '';
  const isRtl = pathname.startsWith('/ar');

  const copy = isRtl
    ? {
        heading: '٤٠٤ / ما في دروب هنا',
        body: 'ما الصفحة هذي على الرف. المتجر هو اللي على الرف.',
        browseShop: 'تصفح المتجر',
        returnHome: 'العودة للرئيسية',
        shopHref: '/ar/shop',
        homeHref: '/ar',
        lang: 'ar',
        dir: 'rtl' as const,
      }
    : {
        heading: '404 / NO DROP HERE',
        body: "That page isn't on the rack. The shop is.",
        browseShop: 'Browse shop',
        returnHome: 'Return home',
        shopHref: '/en/shop',
        homeHref: '/en',
        lang: 'en',
        dir: 'ltr' as const,
      };

  return (
    <html lang={copy.lang} dir={copy.dir}>
      <body className="bg-black text-white">
        <div className="min-h-[100vh] bg-black flex items-center justify-center px-6">
          <div className="max-w-md text-center space-y-8">
            <h1 className="text-6xl md:text-[100px] font-bold leading-none tracking-tighter text-white">
              {copy.heading}
            </h1>
            <p className="text-lg text-white/60">{copy.body}</p>
            <div className="flex gap-4 justify-center pt-4">
              <a
                href={copy.shopHref}
                className="inline-block px-6 py-3 bg-white text-black font-semibold rounded-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                {copy.browseShop}
              </a>
              <a
                href={copy.homeHref}
                className="inline-block px-6 py-3 border border-white/30 text-white font-semibold rounded-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                {copy.returnHome}
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
