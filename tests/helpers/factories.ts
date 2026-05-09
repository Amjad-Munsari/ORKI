/**
 * Factories for integration tests (Phase 8 Plan 09).
 *
 * Builds the minimal fixture surface — one product + one size — that the
 * concurrent-stock, cart-merge, and transitions tests need. Idempotent on the
 * (id, label) pair: re-running a test re-uses the same product/size rows and
 * just resets stock so we don't churn FK history.
 */
import { db } from '@/lib/db/client';
import { products, productSizes } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export interface SeededProduct {
  productId: string;
  sizeId: string;
  sizeLabel: string;
  stock: number;
}

export async function seedProductWithSize(
  opts: {
    id?: string;
    sizeLabel?: string;
    stock?: number;
    price?: number;
  } = {}
): Promise<SeededProduct> {
  const id =
    opts.id ?? `test-${Math.random().toString(36).slice(2, 10)}`;
  const sizeLabel = opts.sizeLabel ?? 'M';
  const stock = opts.stock ?? 1;
  const price = opts.price ?? 100;

  await db
    .insert(products)
    .values({
      id,
      slug: id,
      nameEn: 'Test Product',
      nameAr: 'منتج اختبار',
      descriptionEn: 'Integration test fixture',
      descriptionAr: 'تجهيز اختبار التكامل',
      category: 'tops',
      price,
      currency: 'SAR',
      inStock: true,
    })
    .onConflictDoNothing();

  // Insert (or fetch existing) size row.
  const existing = await db
    .select()
    .from(productSizes)
    .where(
      and(
        eq(productSizes.productId, id),
        eq(productSizes.label, sizeLabel)
      )
    );
  let sizeId: string;
  if (existing.length === 0) {
    const [row] = await db
      .insert(productSizes)
      .values({
        productId: id,
        label: sizeLabel,
        stock,
        inStock: stock > 0,
      })
      .returning();
    sizeId = row.id;
  } else {
    sizeId = existing[0].id;
    await db
      .update(productSizes)
      .set({ stock, inStock: stock > 0 })
      .where(eq(productSizes.id, sizeId));
  }

  return { productId: id, sizeId, sizeLabel, stock };
}

/** Valid Saudi shipping fixture — passes shippingSchema KSA_PHONE_PATTERN. */
export const validShipping = {
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  phone: '+966 50 123 4567',
  city: 'Riyadh',
  district: 'Olaya',
  address: 'Test Street 123 Building 4',
};

export const validCheckoutInput = (
  overrides: Partial<typeof validShipping> = {}
) => ({
  shipping: { ...validShipping, ...overrides },
  payment: { method: 'mada' as const },
});
