/**
 * Phase 8 Plan 09 — Order state-machine integration test.
 *
 * Walks orders through the legal transition graph against the live DB and
 * asserts the audit log + stock-restoration policy from Plan 08-05:
 *
 *   pending|confirmed → cancelled  → restore stock
 *   shipped → cancelled            → DO NOT restore (goods in transit)
 *   shipped → confirmed            → REJECTED (backward illegal)
 *   confirmed → shipped            → sets trackingNumber + emits 'shipped' event
 *
 * Email side-effects (Plan 08-07) are deferred — no email module imports here.
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import {
  hasDbUrl,
  cleanPhase8Tables,
  resetSizeStock,
  deleteTestProduct,
} from '../helpers/test-db';
import { seedProductWithSize } from '../helpers/factories';

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import { db } from '@/lib/db/client';
import {
  orders,
  orderItems,
  orderEvents,
  productSizes,
} from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import {
  transitionOrderStatus,
} from '@/lib/orders/server';
import type { OrderStatus } from '@/types/domain';

describe.skipIf(!hasDbUrl)('transitionOrderStatus', () => {
  let seed: Awaited<ReturnType<typeof seedProductWithSize>>;

  beforeAll(async () => {
    seed = await seedProductWithSize({ stock: 5, sizeLabel: 'M' });
  });

  afterAll(async () => {
    await cleanPhase8Tables();
    await deleteTestProduct(seed.productId);
  });

  /**
   * Inserts a fresh order in the requested initial state with a single item
   * referencing the seeded product/size, and resets product_sizes.stock to 4
   * (simulating that this order's 1-unit decrement already happened).
   */
  async function makeOrder(
    initialStatus: OrderStatus
  ): Promise<{ id: string; reference: string }> {
    await cleanPhase8Tables();
    await resetSizeStock(seed.sizeId, 4);
    const reference = `ORK-T${Math.random()
      .toString(36)
      .slice(2, 8)
      .toUpperCase()}`;
    const [order] = await db
      .insert(orders)
      .values({
        reference,
        email: 'a@b.com',
        locale: 'en',
        status: initialStatus,
        subtotalCents: 10000,
        shippingCents: 2500,
        vatCents: 1875,
        totalCents: 14375,
        shippingFirstName: 'A',
        shippingLastName: 'B',
        shippingPhone: '+966 50 1234567',
        shippingCity: 'Riyadh',
        shippingDistrict: 'Olaya',
        shippingAddress: 'Test Street 123',
        paymentMethod: 'mada',
      })
      .returning();
    await db.insert(orderItems).values({
      orderId: order.id,
      productId: seed.productId,
      sizeLabel: seed.sizeLabel,
      productNameEn: 'Test Product',
      productNameAr: 'منتج',
      unitPriceCents: 10000,
      quantity: 1,
    });
    return { id: order.id, reference };
  }

  it('confirmed → shipped sets trackingNumber and writes audit event', async () => {
    const o = await makeOrder('confirmed');
    const r = await transitionOrderStatus(o.id, 'shipped', {
      actor: 'admin',
      trackingNumber: 'AWB123',
    });
    expect(r.ok).toBe(true);
    const [updated] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, o.id));
    expect(updated.status).toBe('shipped');
    expect(updated.trackingNumber).toBe('AWB123');
    const events = await db
      .select()
      .from(orderEvents)
      .where(eq(orderEvents.orderId, o.id));
    expect(events.some((e) => e.type === 'shipped')).toBe(true);
  });

  it('shipped → delivered → refunded walks the legal graph', async () => {
    const o = await makeOrder('shipped');
    const r1 = await transitionOrderStatus(o.id, 'delivered', {
      actor: 'admin',
    });
    expect(r1.ok).toBe(true);
    const r2 = await transitionOrderStatus(o.id, 'refunded', {
      actor: 'admin',
      reason: 'customer-request',
    });
    expect(r2.ok).toBe(true);
    const [final] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, o.id));
    expect(final.status).toBe('refunded');
    const events = await db
      .select()
      .from(orderEvents)
      .where(eq(orderEvents.orderId, o.id));
    expect(events.map((e) => e.type)).toEqual(
      expect.arrayContaining(['delivered', 'refunded'])
    );
  });

  it('rejects illegal backward transition (shipped → confirmed)', async () => {
    const o = await makeOrder('shipped');
    const r = await transitionOrderStatus(
      o.id,
      'confirmed' as OrderStatus
    );
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.code).toBe('VALIDATION');
    }
  });

  it('confirmed → cancelled restores stock', async () => {
    const o = await makeOrder('confirmed');
    // makeOrder reset stock to 4 — the +1 restoration must take it back to 5.
    const r = await transitionOrderStatus(o.id, 'cancelled', {
      actor: 'admin',
      reason: 'test',
    });
    expect(r.ok).toBe(true);
    const [size] = await db
      .select()
      .from(productSizes)
      .where(eq(productSizes.id, seed.sizeId));
    expect(size.stock).toBe(5);
  });

  it('shipped → cancelled does NOT restore stock', async () => {
    const o = await makeOrder('shipped');
    const r = await transitionOrderStatus(o.id, 'cancelled', {
      actor: 'admin',
    });
    expect(r.ok).toBe(true);
    const [size] = await db
      .select()
      .from(productSizes)
      .where(eq(productSizes.id, seed.sizeId));
    // Stock stays at 4 — goods in transit are not returned to inventory.
    expect(size.stock).toBe(4);
  });
});
