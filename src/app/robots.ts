import type { MetadataRoute } from 'next';

const HOST = 'https://orki.sa';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        // Both the bare path and the trailing-slash form — a trailing slash
        // alone leaves /en/admin (no slash) crawlable.
        '/en/admin',
        '/en/admin/',
        '/ar/admin',
        '/ar/admin/',
        '/en/checkout',
        '/en/checkout/',
        '/ar/checkout',
        '/ar/checkout/',
        '/api/',
      ],
    },
    sitemap: `${HOST}/sitemap.xml`,
    host: HOST,
  };
}
