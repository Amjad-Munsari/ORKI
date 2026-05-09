/**
 * Product data access layer — single integration point between frontend and DB.
 *
 * All components import from this file only. When the backend changes
 * (e.g. Supabase migration), only this file changes — zero component updates.
 *
 * Public API (signatures unchanged from Phase 1-4 static version, but now async):
 *   getAllProducts()          → Promise<Product[]>
 *   getProductBySlug(slug)   → Promise<Product | undefined>
 *   getProductsByCategory()  → Promise<Product[]>
 *   getRelatedProducts()     → Promise<Product[]>
 *   getStockState(product)   → StockState
 *
 * Note: Functions are now async. Server Components and Server Actions must
 * await them.
 */
import 'server-only';
import { db } from '@/lib/db/client';
import { products, productSizes, productImages } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { Product, Size } from '@/types/domain';
export { getStockState, type StockState } from './products-logic';

// ─── Row-to-domain mapper ─────────────────────────────────────────────────────

/**
 * Maps Drizzle DB rows (joined) to the frontend Product domain type.
 * This is the only place where column names (nameEn) map to interface fields (name.en).
 *
 * Exported so server-side cart/order layers can reuse the canonical mapper
 * without duplicating row→domain logic. (Phase 8)
 */
export function toProduct(
  data: typeof products.$inferSelect & {
    sizes: (typeof productSizes.$inferSelect)[];
    images: (typeof productImages.$inferSelect)[];
  }
): Product {
  return {
    id: data.id,
    slug: data.slug,
    name: { en: data.nameEn, ar: data.nameAr },
    description: { en: data.descriptionEn, ar: data.descriptionAr },
    category: data.category as 'tops' | 'bottoms',
    price: data.price,
    currency: data.currency as 'SAR',
    sizes: (data.sizes || [])
      .sort((a, b) => {
        const order = ['XS', 'S', 'M', 'L', 'XL'];
        return order.indexOf(a.label) - order.indexOf(b.label);
      })
      .map((s): Size => ({ 
        id: s.id,
        label: s.label, 
        stock: s.stock,
        inStock: s.inStock 
      })),
    images: (data.images || [])
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((i) => i.url),
    inStock: data.inStock,
  };
}

// ─── Data access functions ────────────────────────────────────────────────────

/**
 * Returns all products with their sizes and images.
 */
export async function getAllProducts(): Promise<Product[]> {
  const result = await db.query.products.findMany({
    with: {
      sizes: true,
      images: {
        orderBy: (images, { asc }) => [asc(images.sortOrder)],
      },
    },
  });
  
  return result.map(toProduct);
}

/**
 * Returns a single product by slug, or undefined if not found.
 */
export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const result = await db.query.products.findFirst({
    where: eq(products.slug, slug),
    with: {
      sizes: true,
      images: {
        orderBy: (images, { asc }) => [asc(images.sortOrder)],
      },
    },
  });

  if (!result) return undefined;
  return toProduct(result);
}

/**
 * Returns a single product by its primary id, or undefined if not found.
 */
export async function getProductById(id: string): Promise<Product | undefined> {
  const result = await db.query.products.findFirst({
    where: eq(products.id, id),
    with: {
      sizes: true,
      images: {
        orderBy: (images, { asc }) => [asc(images.sortOrder)],
      },
    },
  });

  if (!result) return undefined;
  return toProduct(result);
}

/**
 * Returns all products in a category.
 */
export async function getProductsByCategory(
  category: 'tops' | 'bottoms'
): Promise<Product[]> {
  const result = await db.query.products.findMany({
    where: eq(products.category, category),
    with: {
      sizes: true,
      images: {
        orderBy: (images, { asc }) => [asc(images.sortOrder)],
      },
    },
  });
  
  return result.map(toProduct);
}

/**
 * Returns related products (same category, excluding current product).
 */
export async function getRelatedProducts(
  currentId: string,
  category: 'tops' | 'bottoms',
  limit = 4
): Promise<Product[]> {
  const result = await db.query.products.findMany({
    where: (products, { and, eq, ne }) => 
      and(eq(products.category, category), ne(products.id, currentId)),
    limit,
    with: {
      sizes: true,
      images: {
        orderBy: (images, { asc }) => [asc(images.sortOrder)],
      },
    },
  });

  return result.map(toProduct);
}


