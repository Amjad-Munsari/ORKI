import type { MetadataRoute } from 'next';
import { getAllProducts } from '@/lib/products';

const HOST = 'https://orki.sa'; // No trailing slash

// Re-render at most every hour (CONTEXT §4 locked).
export const revalidate = 3600;

type Url = MetadataRoute.Sitemap[number];

function buildAlternates(path: string): Url['alternates'] {
  const suffix = path === '/' ? '' : path;
  return {
    languages: {
      en: `${HOST}/en${suffix}`,
      ar: `${HOST}/ar${suffix}`,
      'x-default': `${HOST}/en${suffix}`,
    },
  };
}

function bilingualEntry(path: string, lastModified: Date = new Date()): Url[] {
  const suffix = path === '/' ? '' : path;
  const alternates = buildAlternates(path);
  return [
    { url: `${HOST}/en${suffix}`, lastModified, alternates },
    { url: `${HOST}/ar${suffix}`, lastModified, alternates },
  ];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getAllProducts();

  const staticPaths = [
    '/',
    '/shop',
    '/shop/tops',
    '/shop/bottoms',
    '/about',
    '/contact',
    '/legal/privacy',
    '/legal/terms',
    '/legal/cookies',
  ];

  const productPaths = products.map((p) => `/shop/${p.category}/${p.slug}`);

  return [
    ...staticPaths.flatMap((p) => bilingualEntry(p)),
    ...productPaths.flatMap((p) => bilingualEntry(p)),
  ];
}
