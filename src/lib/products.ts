import {Product} from '@/types/domain';
import {products} from '@/data/products';

// All product data access flows through this file only.
// When Medusa v2 backend is integrated, only this file changes.

export function getAllProducts(): Product[] {
  return products;
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getProductsByCategory(
  category: 'tops' | 'bottoms'
): Product[] {
  return products.filter((p) => p.category === category);
}
