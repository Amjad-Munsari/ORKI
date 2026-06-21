/**
 * Phase 10 — Order Detail ownership enforced (UAT Test 9).
 *
 * Closes the manual-UAT gap that was BLOCKED on "no order data exists". Drives
 * the REAL account order-detail Server Component
 * (src/app/[locale]/account/orders/[reference]/page.tsx) over REAL rows in the
 * live database. The page enforces ownership INLINE (there is no extractable
 * function) at page.tsx:34-43:
 *
 *   const { data: { user } } = await supabase.auth.getUser();
 *   if (!user) notFound();
 *   const order = await getOrderByReference(reference);
 *   if (!order) notFound();
 *   if (order.userId !== user.id) notFound();   // anti-enumeration: never 403
 *
 * Only the identity boundary (auth.getUser) and the page's leaf view components
 * are mocked — getOrderByReference runs against the real Postgres DB. notFound()
 * is mocked to throw a sentinel so we can assert the 404 path. Proven:
 *   - owner reads their own order               → renders (no notFound)
 *   - signed-in user reads ANOTHER user's order → notFound (404, never 403, never leaks)
 *   - missing reference                         → notFound (404)
 *   - unauthenticated                           → notFound
 *
 * Seed + asserts live in ONE test body (matching cart-merge-union.test.ts) so
 * inserts and reads share immediate context — avoids Supabase-pooler
 * read-after-write lag across a beforeAll→test boundary.
 *
 * Layered with the DB-level guarantee in tests/rls/cross-user-deny.test.ts
 * (Test 17). Live DB + Supabase env required; self-skips otherwise.
 */
import { describe, it, expect, afterAll, vi } from 'vitest';
import { inArray } from 'drizzle-orm';
import { hasDbUrl } from '../helpers/test-db';
import {
  hasSupabaseEnv,
  createTestUser,
  cleanupTestUser,
} from '../setup/supabase-test-client';
import { db } from '@/lib/db/client';
import { orders } from '@/lib/db/schema';

// notFound() throws in real Next; mock it to throw a sentinel we can assert on.
const NOT_FOUND = Symbol('next-not-found');
const mockGetUser = vi.fn();

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw NOT_FOUND;
  },
}));
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({ auth: { getUser: mockGetUser } })),
}));
// Neutralize the page's leaf view components so importing the page doesn't pull
// heavy client deps — the ownership gate returns before any of these render.
vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(async () =>
    Object.assign((k: string) => k, { rich: () => null }),
  ),
}));
vi.mock('@/i18n/navigation', () => ({ Link: () => null }));
vi.mock('@/components/ui/ArrowCta', () => ({ ArrowCta: () => null }));
vi.mock('@/components/order/OrderDetailView', () => ({
  OrderDetailView: () => null,
}));

const canRun = hasDbUrl && hasSupabaseEnv;

function seedOrder(reference: string, userId: string) {
  return db.insert(orders).values({
    reference,
    userId,
    email: `${reference}@orki-test.dev`,
    locale: 'en',
    status: 'pending',
    subtotalCents: 10000,
    shippingCents: 2500,
    vatCents: 1875,
    totalCents: 14375,
    shippingFirstName: 'Test',
    shippingLastName: 'Owner',
    shippingPhone: '+966500000000',
    shippingCity: 'Riyadh',
    shippingDistrict: 'Test',
    shippingAddress: 'Test address',
    paymentMethod: 'card',
  });
}

const asUser = (user: { id: string; email?: string } | null) =>
  mockGetUser.mockResolvedValue({ data: { user } });

describe.skipIf(!canRun)('Order Detail page — ownership enforced (Test 9)', () => {
  const stamp = Date.now();
  const refA = `OWN-A-${stamp}`;
  const refB = `OWN-B-${stamp}`;
  const missingRef = `OWN-MISSING-${stamp}`;
  const createdUserIds: string[] = [];

  afterAll(async () => {
    await db.delete(orders).where(inArray(orders.reference, [refA, refB]));
    for (const id of createdUserIds) {
      await cleanupTestUser(id).catch(() => undefined);
    }
  });

  it('renders for the owner and 404s every other case, over real DB rows', async () => {
    // 1. Two real users, one real order each.
    const a = await createTestUser();
    createdUserIds.push(a.userId);
    const b = await createTestUser();
    createdUserIds.push(b.userId);
    await seedOrder(refA, a.userId);
    await seedOrder(refB, b.userId);

    // 2. Read-after-write: wait until both seeded rows are visible through the
    //    app's own read path before invoking the page.
    const { getOrderByReference } = await import('@/lib/orders/server');
    let seededA = null;
    for (let i = 0; i < 40; i++) {
      const [ra, rb] = await Promise.all([
        getOrderByReference(refA),
        getOrderByReference(refB),
      ]);
      if (ra && rb) {
        seededA = ra;
        break;
      }
      await new Promise((r) => setTimeout(r, 250));
    }
    expect(seededA).not.toBeNull();
    expect(seededA!.userId).toBe(a.userId);

    // 3. Invoke the REAL page component.
    const { default: AccountOrderDetailPage } = await import(
      '@/app/[locale]/account/orders/[reference]/page'
    );
    const callPage = (reference: string) =>
      AccountOrderDetailPage({
        params: Promise.resolve({ reference, locale: 'en' }),
      });

    // Owner → renders (no notFound thrown).
    asUser({ id: a.userId, email: a.email });
    await expect(callPage(refA)).resolves.toBeTruthy();

    // Cross-user → notFound (404, never 403, never leaks the other user's data).
    asUser({ id: a.userId, email: a.email });
    await expect(callPage(refB)).rejects.toBe(NOT_FOUND);

    // Missing reference → notFound (404).
    asUser({ id: a.userId, email: a.email });
    await expect(callPage(missingRef)).rejects.toBe(NOT_FOUND);

    // Unauthenticated → notFound.
    asUser(null);
    await expect(callPage(refA)).rejects.toBe(NOT_FOUND);

    // Order B's real owner still sees it (sanity: rows are real, not blanket-denied).
    asUser({ id: b.userId, email: b.email });
    await expect(callPage(refB)).resolves.toBeTruthy();
  });
});
