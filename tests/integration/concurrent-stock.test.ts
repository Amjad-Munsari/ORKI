/**
 * Phase 8 Plan 09 — Concurrent stock integration test (linchpin).
 *
 * Proves the FOR UPDATE pessimistic lock added in Plan 08-05 actually works
 * end-to-end against real Postgres. The submitCheckout transaction issues
 * `tx.select().from(productSizes).where(...).for('update')` to lock every
 * size row before decrementing — without that lock two parallel checkouts
 * of stock=1 would both see stock=1, both decrement, and land on stock=-1.
 *
 * This test asserts the post-condition: two simultaneous checkouts of the
 * same last-in-stock unit MUST resolve to exactly one success and one
 * STOCK_UNAVAILABLE failure, with the final stock landing on 0 (never -1).
 *
 * Mocking the lock is meaningless — the lock only matters under real
 * contention. So this test runs against the live Supabase Postgres DB used
 * by the rest of the app. Cleans up after itself in afterAll.
 */
import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest';
import {
  hasDbUrl,
  cleanPhase8Tables,
  resetSizeStock,
  deleteTestProduct,
} from '../helpers/test-db';
import { seedProductWithSize, validCheckoutInput } from '../helpers/factories';

// Mock cart session resolution. Each test populates `cartHandle.stack` with
// the carts that the two parallel `submitCheckout` calls should resolve to.
const cartHandle = {
  stack: [] as Array<{ id: string; sessionId: string; locale: 'en' | 'ar' }>,
};
vi.mock('@/lib/cart/session', () => ({
  getOrCreateCart: vi.fn(async () => {
    const next = cartHandle.stack.shift();
    if (!next) {
      throw new Error(
        'cartHandle.stack empty — populate before submitCheckout'
      );
    }
    return next;
  }),
  readCartSessionId: vi.fn(async () => null),
}));

// next/cache.revalidatePath is not callable from a node test environment.
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

// submitCheckout resolves the authenticated user (for order.userId tagging) via
// the SSR Supabase client, which reads cookies(). In a node test there is no
// request scope — mock it to a guest (orders get userId null).
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: vi.fn(async () => ({ data: { user: null } })) },
  })),
}));

// NOTE: Plan 08-07 (Resend email) is deferred — no @/lib/email/send module
// exists yet, and submitCheckout/transitionOrderStatus do not import one.
// When 08-07 lands, add a vi.mock factory here to no-op the email send.

import { submitCheckout } from '@/lib/orders/server';
import { db } from '@/lib/db/client';
import { carts, cartItems, productSizes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

describe.skipIf(!hasDbUrl)('FOR UPDATE concurrency', () => {
  let seed: Awaited<ReturnType<typeof seedProductWithSize>>;

  beforeAll(async () => {
    seed = await seedProductWithSize({ stock: 1, sizeLabel: 'M' });
  });

  afterAll(async () => {
    await cleanPhase8Tables();
    await deleteTestProduct(seed.productId);
  });

  beforeEach(async () => {
    await cleanPhase8Tables();
    await resetSizeStock(seed.sizeId, 1);
    cartHandle.stack = [];
  });

  it('with stock=1 and two simultaneous checkouts, exactly one wins', async () => {
    // Mint two carts each holding one unit of the last in-stock item.
    const sessionA = `sess-a-${Math.random().toString(36).slice(2, 10)}`;
    const sessionB = `sess-b-${Math.random().toString(36).slice(2, 10)}`;
    const [cA] = await db
      .insert(carts)
      .values({ sessionId: sessionA, locale: 'en' })
      .returning();
    const [cB] = await db
      .insert(carts)
      .values({ sessionId: sessionB, locale: 'en' })
      .returning();
    await db.insert(cartItems).values([
      {
        cartId: cA.id,
        productId: seed.productId,
        sizeId: seed.sizeId,
        quantity: 1,
      },
      {
        cartId: cB.id,
        productId: seed.productId,
        sizeId: seed.sizeId,
        quantity: 1,
      },
    ]);
    cartHandle.stack = [
      { id: cA.id, sessionId: sessionA, locale: 'en' },
      { id: cB.id, sessionId: sessionB, locale: 'en' },
    ];

    const [resA, resB] = await Promise.all([
      submitCheckout(validCheckoutInput()),
      submitCheckout(validCheckoutInput()),
    ]);

    const okCount = [resA, resB].filter((r) => r.ok).length;
    const failCount = [resA, resB].filter((r) => !r.ok).length;
    expect(okCount).toBe(1);
    expect(failCount).toBe(1);

    const failure = [resA, resB].find((r) => !r.ok)!;
    if (!failure.ok) {
      // Either the canonical INSUFFICIENT_STOCK alias or the underlying
      // STOCK_UNAVAILABLE OrderError code — both denote the same loser path.
      expect(['STOCK_UNAVAILABLE', 'INSUFFICIENT_STOCK']).toContain(
        failure.code
      );
    }

    const [size] = await db
      .select()
      .from(productSizes)
      .where(eq(productSizes.id, seed.sizeId));
    // Final stock MUST be 0 — never -1 (lock prevented the race).
    expect(size.stock).toBe(0);
  }, 30_000);
});
