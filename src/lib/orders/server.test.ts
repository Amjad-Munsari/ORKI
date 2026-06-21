import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Pre-flight unit tests for `submitCheckout`. We intentionally cover ONLY
 * the branches that complete BEFORE entering `db.transaction(...)`:
 *
 *   - VALIDATION  — zod fails; transaction never opens
 *   - CART_EMPTY  — cart has no items / cart is null
 *
 * Full FOR UPDATE concurrency coverage (the linchpin of Phase 8) is owned
 * by Plan 08-09's integration test against a real database.
 */

// Mock cart layer so submitCheckout can run without a real DB.
vi.mock('@/lib/cart/session', () => ({
  getOrCreateCart: vi.fn(async () => ({
    id: 'cart-1',
    sessionId: 'sess',
    locale: 'en' as const,
  })),
}));

vi.mock('@/lib/cart/server', () => ({
  getCart: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// submitCheckout resolves the authenticated user via the SSR Supabase client
// (cookies()). No request scope in unit tests — mock to a guest (userId null).
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: vi.fn(async () => ({ data: { user: null } })) },
  })),
}));

// Stub the DB so even if the txn opens (it shouldn't for these tests), the
// chain calls don't blow up. The handlers below are no-ops; the tests only
// assert on the pre-flight return envelope.
vi.mock('@/lib/db/client', () => {
  const chain: Record<string, unknown> = {};
  // Make every method on the chain return the chain itself so any
  // builder-style call sequence resolves without TypeError. Terminal
  // awaits resolve to an empty array.
  const handler: ProxyHandler<typeof chain> = {
    get(target, prop) {
      if (prop === 'then') return undefined;
      return () => proxy;
    },
  };
  const proxy: typeof chain = new Proxy(chain, handler);

  return {
    db: {
      transaction: vi.fn(async (cb: (tx: unknown) => unknown) => {
        // Hand the chain proxy in as the tx; queries will short-circuit.
        return cb(proxy);
      }),
      query: {
        orders: {
          findFirst: vi.fn(async () => null),
          findMany: vi.fn(async () => []),
        },
      },
    },
  };
});

import { submitCheckout } from './server';
import { db } from '@/lib/db/client';
import * as cartServer from '@/lib/cart/server';

const validInput = {
  shipping: {
    firstName: 'A',
    lastName: 'B',
    email: 'a@b.com',
    phone: '+966 50 123 4567',
    city: 'Riyadh',
    district: 'Olaya',
    address: 'Street 123 Building 4',
  },
  payment: { method: 'mada' as const },
  idempotencyKey: '11111111-1111-4111-8111-111111111111',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('submitCheckout', () => {
  it('returns VALIDATION on bad input (bad email)', async () => {
    const result = await submitCheckout({
      ...validInput,
      shipping: { ...validInput.shipping, email: 'not-email' },
      // Intentionally bad payload — cast through unknown for the test.
    } as unknown as typeof validInput);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('VALIDATION');
      expect(result.messageKey).toBe('Checkout.errors.validation');
      expect(result.fields?.['shipping.email']).toBe('Checkout.errors.email');
    }
  });

  it('returns CART_EMPTY when cart has no items', async () => {
    (cartServer.getCart as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: 'cart-1',
      sessionId: 's',
      userId: null,
      locale: 'en',
      items: [],
      updatedAt: new Date(),
    });

    const result = await submitCheckout(validInput);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('CART_EMPTY');
      expect(result.messageKey).toBe('Checkout.errors.cartEmpty');
    }
  });

  it('returns CART_EMPTY when getCart returns null', async () => {
    (cartServer.getCart as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      null
    );

    const result = await submitCheckout(validInput);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('CART_EMPTY');
    }
  });

  it('returns VALIDATION when idempotencyKey is missing/invalid', async () => {
    const result = await submitCheckout({
      ...validInput,
      idempotencyKey: 'not-a-uuid',
    } as unknown as typeof validInput);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('VALIDATION');
  });

  it('dedupes a double-submit: returns the existing order without creating a new one', async () => {
    // An order already exists for this idempotency key (the customer's first
    // click already succeeded). The retry must return THAT order — no new
    // transaction, no second stock decrement, no second charge.
    (db.query.orders.findFirst as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      { id: 'order-existing', reference: 'ORK-EXIST' }
    );

    const result = await submitCheckout(validInput);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.reference).toBe('ORK-EXIST');
      expect(result.data.orderId).toBe('order-existing');
    }
    // The pre-check short-circuits BEFORE any transaction opens.
    expect(db.transaction).not.toHaveBeenCalled();
  });
});
