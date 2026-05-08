/**
 * Shared product logic — safe to import in both Client and Server components.
 * No database imports allowed here.
 */
import type { Product } from '@/types/domain';

export type StockState = 'in-stock' | 'partial' | 'out-of-stock';

/**
 * Derives 3-way stock state from a product's sizes array.
 * Synchronous — operates on already-fetched Product domain objects.
 */
export function getStockState(product: Product): StockState {
  const hasAnyInStock = product.sizes.some((s) => s.inStock);
  const hasAnyOOS = product.sizes.some((s) => !s.inStock);
  if (!hasAnyInStock) return 'out-of-stock';
  if (hasAnyOOS) return 'partial';
  return 'in-stock';
}
