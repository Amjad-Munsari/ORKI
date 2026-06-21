/**
 * Phase 8 Plan 09 — Cart-merge integration test.
 *
 * Exercises `migrateLocalStorageCart` (Plan 08-02) against the real DB:
 *   - inserts new items
 *   - sums quantity on conflict (UPSERT-on (cartId, productId, sizeId))
 *   - skips items whose product/size no longer exists (stale localStorage SKUs)
 */
import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import {
  hasDbUrl,
  cleanPhase8Tables,
  deleteTestProduct,
} from '../helpers/test-db';
import { seedProductWithSize } from '../helpers/factories';
import { db } from '@/lib/db/client';
import { carts, cartItems } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { migrateLocalStorageCart } from '@/lib/cart/migrate';

describe.skipIf(!hasDbUrl)('migrateLocalStorageCart', () => {
  let seed: Awaited<ReturnType<typeof seedProductWithSize>>;
  let cartId: string;

  beforeAll(async () => {
    seed = await seedProductWithSize({ stock: 10, sizeLabel: 'M' });
  });

  afterAll(async () => {
    await cleanPhase8Tables();
    await deleteTestProduct(seed.productId);
  });

  beforeEach(async () => {
    await cleanPhase8Tables();
    const [c] = await db
      .insert(carts)
      .values({
        sessionId: `merge-${Math.random().toString(36).slice(2, 10)}`,
        locale: 'en',
      })
      .returning();
    cartId = c.id;
  });

  it('inserts new items', async () => {
    const r = await migrateLocalStorageCart(cartId, [
      {
        productId: seed.productId,
        selectedSize: seed.sizeLabel,
        quantity: 2,
      },
    ]);
    expect(r.migrated).toBe(1);
    expect(r.skipped).toBe(0);
    const items = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.cartId, cartId));
    expect(items.length).toBe(1);
    expect(items[0].quantity).toBe(2);
  });

  it('sums quantity on conflict', async () => {
    await migrateLocalStorageCart(cartId, [
      {
        productId: seed.productId,
        selectedSize: seed.sizeLabel,
        quantity: 2,
      },
    ]);
    await migrateLocalStorageCart(cartId, [
      {
        productId: seed.productId,
        selectedSize: seed.sizeLabel,
        quantity: 3,
      },
    ]);
    const items = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.cartId, cartId));
    expect(items.length).toBe(1);
    expect(items[0].quantity).toBe(5);
  });

  it('skips unknown product/size', async () => {
    const r = await migrateLocalStorageCart(cartId, [
      { productId: 'nonexistent', selectedSize: 'XXL', quantity: 1 },
    ]);
    expect(r.migrated).toBe(0);
    expect(r.skipped).toBe(1);
  });
});
