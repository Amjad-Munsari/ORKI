/**
 * Shared product logic — safe to import in both Client and Server components.
 * No database imports allowed here.
 */
import type { Product } from '@/types/domain';

export type StockState = 'in-stock' | 'partial' | 'low-stock' | 'out-of-stock';

/**
 * Derives 3-way stock state from a product's sizes array.
 * Synchronous — operates on already-fetched Product domain objects.
 */
export function getStockState(product: Product): StockState {
  const hasAnyInStock = product.sizes.some((s) => s.inStock && s.stock > 0);
  if (!hasAnyInStock) return 'out-of-stock';

  const hasAnyLowStock = product.sizes.some((s) => s.stock > 0 && s.stock <= 5);
  if (hasAnyLowStock) return 'low-stock';

  const hasAnyOOS = product.sizes.some((s) => !s.inStock || s.stock === 0);
  if (hasAnyOOS) return 'partial';

  return 'in-stock';
}

/**
 * Returns true if a product size has low stock (1 to 5 units).
 */
export function isLowStock(size: { stock: number }): boolean {
  return size.stock > 0 && size.stock <= 5;
}
