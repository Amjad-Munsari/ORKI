import type { MetadataRoute } from 'next';

const HOST = 'https://orki.sa';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/en/admin/',
        '/ar/admin/',
        '/en/checkout/',
        '/ar/checkout/',
        '/api/',
      ],
    },
    sitemap: `${HOST}/sitemap.xml`,
    host: HOST,
  };
}
