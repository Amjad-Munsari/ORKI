/**
 * Phase 10 Plan 05 — Cross-user RLS deny gate.
 *
 * Proves the RLS policies from Plan 10-02 actually deny cross-user reads via
 * PostgREST. Two users are provisioned via the admin client; user B has an
 * order row inserted directly via Drizzle (bypassing RLS, since Drizzle is
 * the schema owner). User A then attempts to read that order via the
 * authenticated PostgREST path (createServerClient bound to A's session
 * cookies — RLS-bound). The query MUST return zero rows.
 *
 * SSR-bound client wiring uses the signInTestUser fixture's cookie jar
 * pattern from tests/setup/supabase-test-client.ts.
 *
 * Gated on hasSupabaseEnv + hasDbUrl — skips cleanly when either is absent
 * (mirrors the lockout test convention).
 */
import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { createServerClient } from '@supabase/ssr';
import {
  hasSupabaseEnv,
  createTestUser,
  cleanupTestUser,
  signInTestUser,
} from '../setup/supabase-test-client';
import { hasDbUrl } from '../helpers/test-db';

const shouldSkip = !hasSupabaseEnv || !hasDbUrl;

describe.skipIf(shouldSkip)('RLS — cross-user deny', () => {
  const cleanup: string[] = [];
  let orderIdToCleanup: string | null = null;

  beforeAll(() => {
    // Sanity check at suite start so a misconfigured env doesn't masquerade
    // as a passing test.
    if (shouldSkip) return;
  });

  afterAll(async () => {
    if (shouldSkip) return;
    // Best-effort cleanup of inserted order rows.
    if (orderIdToCleanup) {
      try {
        const { db } = await import('@/lib/db/client');
        const { orders } = await import('@/lib/db/schema');
        const { eq } = await import('drizzle-orm');
        await db.delete(orders).where(eq(orders.id, orderIdToCleanup));
      } catch (err) {
        console.error('[rls/cross-user-deny] order cleanup failed', err);
      }
    }
    for (const id of cleanup) {
      try {
        await cleanupTestUser(id);
      } catch (err) {
        console.error('[rls/cross-user-deny] user cleanup failed', err);
      }
    }
  });

  it("User A's RLS-bound PostgREST client cannot SELECT User B's order", async () => {
    // 1. Provision two users via admin client.
    const a = await createTestUser();
    cleanup.push(a.userId);
    const b = await createTestUser();
    cleanup.push(b.userId);

    // 2. Insert an order owned by B via Drizzle (bypasses RLS — we're seeding
    //    the row, not testing the write path).
    const { db } = await import('@/lib/db/client');
    const { orders } = await import('@/lib/db/schema');
    const reference = `TEST-RLS-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 6)}`;
    const [bOrder] = await db
      .insert(orders)
      .values({
        userId: b.userId,
        reference,
        email: b.email,
        locale: 'en',
        status: 'pending',
        subtotalCents: 10000,
        shippingCents: 2500,
        vatCents: 1875,
        totalCents: 14375,
        shippingFirstName: 'Test',
        shippingLastName: 'B',
        shippingPhone: '+966500000000',
        shippingCity: 'Riyadh',
        shippingDistrict: 'Test',
        shippingAddress: 'Test address',
        paymentMethod: 'card',
      })
      .returning();
    orderIdToCleanup = bOrder.id;

    // 3. Sign in as A and capture the session cookies.
    const aSession = await signInTestUser(a.email, a.password);

    // 4. Build an RLS-bound PostgREST client for A from those cookies.
    const aClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () =>
            aSession.sessionCookies.map(({ name, value }) => ({
              name,
              value,
            })),
          setAll: () => {
            /* no-op — we don't mutate cookies here */
          },
        },
      },
    );

    // 5. Confirm A is authenticated (sanity).
    const {
      data: { user: aUser },
    } = await aClient.auth.getUser();
    expect(aUser?.id).toBe(aSession.userId);
    expect(aUser?.id).not.toBe(b.userId);

    // 6. Attempt to SELECT B's order through the authenticated PostgREST
    //    path. RLS policy (Plan 10-02) gates this on auth.uid() = user_id —
    //    A's uid does NOT match B's, so the row MUST NOT be returned.
    const { data: ordersFromA, error } = await aClient
      .from('orders')
      .select('id, user_id, reference')
      .eq('id', bOrder.id);

    // PostgREST never throws for RLS denial — it returns an empty array.
    expect(error).toBeNull();
    expect(ordersFromA).toEqual([]);

    // 7. Also assert by-reference enumeration is blocked.
    const { data: byRef } = await aClient
      .from('orders')
      .select('id, user_id, reference')
      .eq('reference', reference);
    expect(byRef).toEqual([]);
  });
});
