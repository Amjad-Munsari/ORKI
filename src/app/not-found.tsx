/**
 * Root-level 404 fallback. Catches unmatched URLs that fall through the
 * `[locale]` segment (e.g. `/en/nope`, `/random-path`) — without this file,
 * Next.js renders the framework-default `404: This page could not be found.`
 * page, bypassing the ORKI brand chrome.
 *
 * Hardcoded EN copy (Plan 11-13 Candidate A) because the request has no
 * locale context at this point — the middleware never matched a prefix, so
 * `next-intl`'s `getLocale()` / `getTranslations()` will not work here.
 * For paths under `/[locale]/...` that *did* match the locale prefix but
 * have no child match, the per-locale `[locale]/not-found.tsx` still fires
 * and uses translated copy.
 */
export default function RootNotFound() {
  return (
    <html lang="en">
      <body className="bg-black text-white">
        <div className="min-h-[100vh] bg-black flex items-center justify-center px-6">
          <div className="max-w-md text-center space-y-8">
            <h1 className="text-6xl md:text-[100px] font-bold leading-none tracking-tighter text-white">
              404 / NO DROP HERE
            </h1>
            <p className="text-lg text-white/60">
              That page isn&rsquo;t on the rack. The shop is.
            </p>
            <div className="flex gap-4 justify-center pt-4">
              <a
                href="/en/shop"
                className="inline-block px-6 py-3 bg-white text-black font-semibold rounded-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                Browse shop
              </a>
              <a
                href="/en"
                className="inline-block px-6 py-3 border border-white/30 text-white font-semibold rounded-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                Return home
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
