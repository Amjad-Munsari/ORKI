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
 */
function toProduct(
  row: typeof products.$inferSelect,
  sizes: (typeof productSizes.$inferSelect)[],
  images: (typeof productImages.$inferSelect)[]
): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: { en: row.nameEn, ar: row.nameAr },
    description: { en: row.descriptionEn, ar: row.descriptionAr },
    category: row.category as 'tops' | 'bottoms',
    price: row.price,
    currency: row.currency as 'SAR',
    sizes: sizes
      .sort((a, b) => {
        const order = ['XS', 'S', 'M', 'L', 'XL'];
        return order.indexOf(a.label) - order.indexOf(b.label);
      })
      .map((s): Size => ({ label: s.label, inStock: s.inStock })),
    images: images
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((i) => i.url),
    inStock: row.inStock,
  };
}

// ─── Data access functions ────────────────────────────────────────────────────

/**
 * Returns all products with their sizes and images.
 * Use in Server Components or Server Actions only.
 */
export async function getAllProducts(): Promise<Product[]> {
  const productRows = await db.select().from(products);
  
  const result: Product[] = [];
  for (const row of productRows) {
    const sizes = await db
      .select()
      .from(productSizes)
      .where(eq(productSizes.productId, row.id));
    const images = await db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, row.id))
      .orderBy(productImages.sortOrder);
    
    result.push(toProduct(row, sizes, images));
  }
  
  return result;
}

/**
 * Returns a single product by slug, or undefined if not found.
 * Use in Server Components for PDP pages.
 */
export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const rows = await db
    .select()
    .from(products)
    .where(eq(products.slug, slug))
    .limit(1);

  if (rows.length === 0) return undefined;

  const row = rows[0];
  const sizes = await db
    .select()
    .from(productSizes)
    .where(eq(productSizes.productId, row.id));
  const images = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, row.id))
    .orderBy(productImages.sortOrder);

  return toProduct(row, sizes, images);
}

/**
 * Returns all products in a category.
 * Use in Server Components for catalog/category pages.
 */
export async function getProductsByCategory(
  category: 'tops' | 'bottoms'
): Promise<Product[]> {
  const productRows = await db
    .select()
    .from(products)
    .where(eq(products.category, category));

  const result: Product[] = [];
  for (const row of productRows) {
    const sizes = await db
      .select()
      .from(productSizes)
      .where(eq(productSizes.productId, row.id));
    const images = await db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, row.id))
      .orderBy(productImages.sortOrder);
    
    result.push(toProduct(row, sizes, images));
  }
  
  return result;
}

/**
 * Returns related products (same category, excluding current product).
 * Use on PDP pages for recommendations.
 */
export async function getRelatedProducts(
  currentId: string,
  category: 'tops' | 'bottoms',
  limit = 4
): Promise<Product[]> {
  const all = await getProductsByCategory(category);
  return all.filter((p) => p.id !== currentId).slice(0, limit);
}


