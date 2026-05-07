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

// Stock state helper — derives 3-way state from sizes array.
// DO NOT add a new field to Product — the domain type is the backend contract.
export type StockState = 'in-stock' | 'partial' | 'out-of-stock';

export function getStockState(product: Product): StockState {
  const hasAnyInStock = product.sizes.some((s) => s.inStock);
  const hasAnyOOS = product.sizes.some((s) => !s.inStock);
  if (!hasAnyInStock) return 'out-of-stock';
  if (hasAnyOOS) return 'partial';
  return 'in-stock';
}

export function getRelatedProducts(
  currentId: string,
  category: 'tops' | 'bottoms',
  limit = 4
): Product[] {
  return products
    .filter((p) => p.category === category && p.id !== currentId)
    .slice(0, limit);
}
