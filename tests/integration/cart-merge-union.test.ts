/**
 * Phase 10 Plan 08 — Cart-merge UNION regression test (Gap: Test 10).
 *
 * Proves that `mergeGuestCartIntoUserCart` unions cart_items (summing quantity
 * on the (cartId, productId, sizeId) unique index) rather than destroying them
 * via CASCADE delete.
 *
 * Mirrors tests/integration/cart-merge.test.ts structure:
 *  - `describe.skipIf(!hasDbUrl)` gates live-DB tests
 *  - `seedProductWithSize` / `cleanPhase8Tables` / `deleteTestProduct` lifecycle
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
import { eq, and, isNull } from 'drizzle-orm';
import { mergeGuestCartIntoUserCart } from '@/lib/cart/merge-on-signin';

const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';
const USER_SID = 'user-sid-merge-union-test';
const GUEST_SID = 'guest-sid-merge-union-test';

describe.skipIf(!hasDbUrl)('mergeGuestCartIntoUserCart — item-level union', () => {
  let seed: Awaited<ReturnType<typeof seedProductWithSize>>;

  beforeAll(async () => {
    seed = await seedProductWithSize({ stock: 10, sizeLabel: 'L' });
  });

  afterAll(async () => {
    await cleanPhase8Tables();
    await deleteTestProduct(seed.productId);
  });

  beforeEach(async () => {
    await cleanPhase8Tables();
  });

  it('Test A — unions overlapping items: user qty 1 + guest qty 2 = 3', async () => {
    // Create user cart with qty 1
    const [userCart] = await db
      .insert(carts)
      .values({ sessionId: USER_SID, userId: TEST_USER_ID, locale: 'en' })
      .returning();
    await db.insert(cartItems).values({
      cartId: userCart.id,
      productId: seed.productId,
      sizeId: seed.sizeId,
      quantity: 1,
    });

    // Create guest cart with qty 2 (same product+size)
    const [guestCart] = await db
      .insert(carts)
      .values({ sessionId: GUEST_SID, locale: 'en' })
      .returning();
    await db.insert(cartItems).values({
      cartId: guestCart.id,
      productId: seed.productId,
      sizeId: seed.sizeId,
      quantity: 2,
    });

    await mergeGuestCartIntoUserCart(TEST_USER_ID, GUEST_SID);

    const items = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.cartId, userCart.id));

    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(3); // 1 + 2 unioned
  });

  it('Test B — distinct guest item is moved to user cart at original quantity', async () => {
    // Create a second seed product that the user cart does NOT have
    const seed2 = await seedProductWithSize({
      id: `test-b-${Math.random().toString(36).slice(2, 8)}`,
      stock: 5,
      sizeLabel: 'M',
    });

    // User cart: only the first product
    const [userCart] = await db
      .insert(carts)
      .values({ sessionId: USER_SID, userId: TEST_USER_ID, locale: 'en' })
      .returning();
    await db.insert(cartItems).values({
      cartId: userCart.id,
      productId: seed.productId,
      sizeId: seed.sizeId,
      quantity: 1,
    });

    // Guest cart: only the second product at qty 3
    const [guestCart] = await db
      .insert(carts)
      .values({ sessionId: GUEST_SID, locale: 'en' })
      .returning();
    await db.insert(cartItems).values({
      cartId: guestCart.id,
      productId: seed2.productId,
      sizeId: seed2.sizeId,
      quantity: 3,
    });

    await mergeGuestCartIntoUserCart(TEST_USER_ID, GUEST_SID);

    const items = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.cartId, userCart.id));

    // user cart should now have both items
    expect(items).toHaveLength(2);
    const movedItem = items.find(
      (i) => i.productId === seed2.productId && i.sizeId === seed2.sizeId,
    );
    expect(movedItem).toBeDefined();
    expect(movedItem!.quantity).toBe(3);

    // clean up seed2
    await deleteTestProduct(seed2.productId);
  });

  it('Test C — guest cart row is removed after merge', async () => {
    // User cart + guest cart with same item
    const [userCart] = await db
      .insert(carts)
      .values({ sessionId: USER_SID, userId: TEST_USER_ID, locale: 'en' })
      .returning();
    await db.insert(cartItems).values({
      cartId: userCart.id,
      productId: seed.productId,
      sizeId: seed.sizeId,
      quantity: 1,
    });

    const [guestCart] = await db
      .insert(carts)
      .values({ sessionId: GUEST_SID, locale: 'en' })
      .returning();
    await db.insert(cartItems).values({
      cartId: guestCart.id,
      productId: seed.productId,
      sizeId: seed.sizeId,
      quantity: 2,
    });

    await mergeGuestCartIntoUserCart(TEST_USER_ID, GUEST_SID);

    const remaining = await db
      .select()
      .from(carts)
      .where(and(eq(carts.sessionId, GUEST_SID), isNull(carts.userId)));
    expect(remaining).toHaveLength(0);
  });

  it('Test D — claim branch: when no user cart exists, guest cart is claimed', async () => {
    // No user cart — only a guest cart with an item
    const [guestCart] = await db
      .insert(carts)
      .values({ sessionId: GUEST_SID, locale: 'en' })
      .returning();
    await db.insert(cartItems).values({
      cartId: guestCart.id,
      productId: seed.productId,
      sizeId: seed.sizeId,
      quantity: 4,
    });

    await mergeGuestCartIntoUserCart(TEST_USER_ID, GUEST_SID);

    // Guest cart should now be owned by the user
    const claimed = await db
      .select()
      .from(carts)
      .where(eq(carts.sessionId, GUEST_SID));
    expect(claimed).toHaveLength(1);
    expect(claimed[0].userId).toBe(TEST_USER_ID);

    // Items should be intact
    const items = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.cartId, guestCart.id));
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(4);
  });
});
