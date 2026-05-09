---
phase: 08-cart-checkout-orders
plan: 09
type: execute
wave: 4
depends_on: [08-02, 08-03, 08-05, 08-06, 08-07, 08-08]
files_modified:
  - tests/integration/concurrent-stock.test.ts
  - tests/integration/cart-merge.test.ts
  - tests/integration/transitions.test.ts
  - tests/helpers/test-db.ts
  - tests/helpers/factories.ts
  - .planning/phases/08-cart-checkout-orders/08-UAT.md
autonomous: true
requirements: [UX-01, UX-02, UX-03, UX-04, UX-05, UX-06, UX-07, UX-08, UX-09, ECOM-02, ECOM-03, ECOM-04]
must_haves:
  truths:
    - "Concurrent-stock integration test demonstrates exactly one of two simultaneous checkouts of the last unit succeeds"
    - "Cart-merge integration test confirms migrateLocalStorageCart sums quantities into the DB cart"
    - "Transitions integration test exercises every legal state-machine transition end-to-end"
    - "08-UAT.md exists with bilingual happy-path checklist + payment-failure recovery + RTL + screen-reader scenarios"
    - "All tests run via `npm test` and exit 0"
  artifacts:
    - path: "tests/integration/concurrent-stock.test.ts"
      provides: "Two simultaneous checkouts; exactly one wins"
      contains: ".for('update')"
    - path: "tests/helpers/test-db.ts"
      provides: "Per-test DB cleanup or transaction-rollback wrapper"
    - path: "tests/helpers/factories.ts"
      provides: "Factories for product/cart/order rows used by integration tests"
    - path: ".planning/phases/08-cart-checkout-orders/08-UAT.md"
      provides: "Bilingual UAT checklist for the human verifier"
  key_links:
    - from: "tests/integration/concurrent-stock.test.ts"
      to: "src/lib/orders/server.ts submitCheckout"
      via: "Promise.allSettled of two parallel calls; one OrderError STOCK_UNAVAILABLE expected"
      pattern: "submitCheckout"
---

<objective>
Lock in the phase's correctness with three integration tests against the live DB (the same DB Plan 08-01 pushed to), plus a written UAT checklist for the human verifier. The concurrent-stock test is the most important — it proves the FOR UPDATE lock added in Plan 08-05 actually works end-to-end.

Purpose: Provide automated regression coverage for the highest-risk areas (race condition, cart merge, state transitions) and a structured UAT script for the parts that aren't easily automated (RTL, screen reader, mobile tap targets).

Output: Failing tests if anything regresses. A documented UAT pass for the user to sign off.
</objective>

<execution_context>
@C:/dev/Antigravity/ORKI/.claude/get-shit-done/workflows/execute-plan.md
@C:/dev/Antigravity/ORKI/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/08-cart-checkout-orders/08-CONTEXT.md
@.planning/phases/08-cart-checkout-orders/08-RESEARCH.md
@.planning/phases/08-cart-checkout-orders/08-PATTERNS.md
@CLAUDE.md
@src/lib/db/client.ts
@src/lib/db/schema.ts
@src/lib/orders/server.ts
@src/lib/cart/server.ts
@src/lib/cart/migrate.ts
@src/lib/orders/state-machine.ts
@vitest.config.ts
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Create test helpers (test-db.ts, factories.ts) + three integration tests</name>
  <files>tests/helpers/test-db.ts, tests/helpers/factories.ts, tests/integration/concurrent-stock.test.ts, tests/integration/cart-merge.test.ts, tests/integration/transitions.test.ts</files>
  <read_first>
    - src/lib/db/client.ts (db singleton — tests reuse it; no separate test DB this phase)
    - src/lib/db/schema.ts (tables to seed and clean)
    - src/lib/orders/server.ts (submitCheckout, transitionOrderStatus signatures)
    - src/lib/cart/migrate.ts (migrateLocalStorageCart signature)
    - src/lib/cart/session.ts (getOrCreateCart — tests need to mock or supply a cookie context)
    - vitest.config.ts (jsdom is for components; integration tests use node environment by default)
    - .planning/phases/08-cart-checkout-orders/08-CONTEXT.md "Tests" section ("concurrent-stock test (2 simultaneous checkouts of last item — exactly one wins)")
    - .planning/phases/08-cart-checkout-orders/08-RESEARCH.md "Pitfall 4" + "Drizzle .for('update') undocumented but real"
  </read_first>
  <behavior>
    - tests/helpers/test-db.ts exports `cleanDb()`: TRUNCATE the Phase 8 tables (cart_items, carts, order_events, order_items, orders) and reset productSizes.stock to known values for the seeded fixture. Uses the project's `db` singleton (NO separate test DB — clear data between tests).
    - tests/helpers/factories.ts exports:
      - `seedProductWithSize(opts: { id?, name?, price?, sizeLabel?, stock? }): Promise<{ productId, sizeId }>` — inserts product + a single size row
      - `mintCartWithItem(productId, sizeId, qty): Promise<string>` — creates a carts row + cart_items row directly, returns cartId
      - `validShipping`, `validPayment` — fixture objects with valid Saudi phone (e.g. '+966 50 123 4567') and method 'mada'
    - concurrent-stock.test.ts: seed product + size with stock=1; create TWO carts (different sessionIds) each with quantity=1 of that size; mock `getOrCreateCart` to return cart A and cart B in alternation. Call `submitCheckout` for both in `Promise.allSettled`. Assert exactly one returns `{ ok: true }` and one returns `{ ok: false, code: 'STOCK_UNAVAILABLE' }`. Verify the productSizes.stock end-state is 0, NOT -1.
    - cart-merge.test.ts: seed product + size; create a fresh cart; call `migrateLocalStorageCart(cartId, [{ productId, selectedSize: sizeLabel, quantity: 2 }])`; verify cart_items has one row with quantity=2. Call again with quantity=3; verify the row's quantity is now 5 (UPSERT sums).
    - transitions.test.ts: insert an order in 'confirmed' state directly (skip the full submit); call `transitionOrderStatus(id, 'shipped', { actor: 'admin', trackingNumber: 'AWB123' })`; verify status='shipped', trackingNumber='AWB123', and an order_events row of type 'shipped' exists. Then call `transitionOrderStatus(id, 'delivered')`; verify success. Then `transitionOrderStatus(id, 'shipped')` (illegal — backward); verify ok:false with code VALIDATION. Finally test pre-ship cancel restores stock: insert an order with one item that decremented productSizes.stock from 5 to 4; call `transitionOrderStatus(id, 'cancelled')`; verify stock is back to 5.
    - All tests skip themselves if `process.env.DATABASE_URL && !process.env.STORAGE_URL` is unset (in CI without DB) — use Vitest's `it.skipIf` or a top-level `if` guard.
  </behavior>
  <action>
    Create `tests/helpers/test-db.ts`:

    ```typescript
    import { db } from '@/lib/db/client';
    import { sql } from 'drizzle-orm';

    /**
     * Truncates Phase 8 tables. Products + product_sizes are NOT truncated —
     * factories control the test fixture explicitly.
     */
    export async function cleanPhase8Tables(): Promise<void> {
      // Order matters due to FKs.
      await db.execute(sql`TRUNCATE TABLE order_events, order_items, orders, cart_items, carts CASCADE`);
    }

    export async function resetSizeStock(sizeId: string, stock: number): Promise<void> {
      await db.execute(sql`UPDATE product_sizes SET stock = ${stock} WHERE id = ${sizeId}`);
    }

    export const hasDbUrl = Boolean(process.env.DATABASE_URL || process.env.STORAGE_URL);
    ```

    Create `tests/helpers/factories.ts`:

    ```typescript
    import { db } from '@/lib/db/client';
    import { products, productSizes } from '@/lib/db/schema';
    import { eq, and } from 'drizzle-orm';

    export interface SeededProduct { productId: string; sizeId: string; sizeLabel: string; stock: number; }

    export async function seedProductWithSize(opts: {
      id?: string; sizeLabel?: string; stock?: number; price?: number;
    } = {}): Promise<SeededProduct> {
      const id = opts.id ?? `test-${Math.random().toString(36).slice(2, 8)}`;
      const sizeLabel = opts.sizeLabel ?? 'M';
      const stock = opts.stock ?? 1;

      // Upsert product
      await db.insert(products).values({
        id, slug: id,
        nameEn: 'Test Product', nameAr: 'منتج اختبار',
        descriptionEn: 'Test', descriptionAr: 'اختبار',
        category: 'tops',
        price: opts.price ?? 100,
        currency: 'SAR',
        inStock: true,
      }).onConflictDoNothing();

      // Insert (or fetch existing) size
      let [size] = await db.select().from(productSizes)
        .where(and(eq(productSizes.productId, id), eq(productSizes.label, sizeLabel)));
      if (!size) {
        [size] = await db.insert(productSizes).values({
          productId: id, label: sizeLabel, stock, inStock: stock > 0,
        }).returning();
      } else {
        await db.update(productSizes).set({ stock, inStock: stock > 0 }).where(eq(productSizes.id, size.id));
        size = { ...size, stock, inStock: stock > 0 };
      }
      return { productId: id, sizeId: size.id, sizeLabel, stock };
    }

    export const validShipping = {
      firstName: 'Test', lastName: 'User',
      email: 'test@example.com',
      phone: '+966 50 123 4567',
      city: 'Riyadh', district: 'Olaya', address: 'Test Street 123',
    };

    export const validCheckoutInput = (overrides: Partial<typeof validShipping> = {}) => ({
      shipping: { ...validShipping, ...overrides },
      payment: { method: 'mada' as const },
    });
    ```

    Create `tests/integration/concurrent-stock.test.ts`:

    ```typescript
    import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
    import { hasDbUrl, cleanPhase8Tables, resetSizeStock } from '../helpers/test-db';
    import { seedProductWithSize, validCheckoutInput } from '../helpers/factories';
    import { db } from '@/lib/db/client';
    import { carts, cartItems, productSizes } from '@/lib/db/schema';
    import { eq } from 'drizzle-orm';

    // Mock cookies-based session resolution. Each test mints two carts and feeds them
    // to submitCheckout via the mocked getOrCreateCart.
    const cartHandle = { stack: [] as Array<{ id: string; sessionId: string; locale: 'en' | 'ar' }> };
    vi.mock('@/lib/cart/session', () => ({
      getOrCreateCart: vi.fn(async () => {
        const next = cartHandle.stack.shift();
        if (!next) throw new Error('cartHandle.stack empty — populate before submitCheckout');
        return next;
      }),
      readCartSessionId: vi.fn(async () => null),
    }));
    // next/cache mock so revalidatePath doesn't error in node env
    vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
    // Email send is no-op in tests
    vi.mock('@/lib/email/send', () => ({
      sendOrderConfirmed: vi.fn(async () => ({ ok: true, alreadySent: true })),
      sendOrderShipped: vi.fn(async () => ({ ok: true, alreadySent: true })),
      sendOrderCancelled: vi.fn(async () => ({ ok: true, alreadySent: true })),
      sendOrderRefunded: vi.fn(async () => ({ ok: true, alreadySent: true })),
    }));

    import { submitCheckout } from '@/lib/orders/server';

    describe.skipIf(!hasDbUrl)('FOR UPDATE concurrency', () => {
      let seed: Awaited<ReturnType<typeof seedProductWithSize>>;

      beforeAll(async () => {
        seed = await seedProductWithSize({ stock: 1, sizeLabel: 'M' });
      });

      beforeEach(async () => {
        await cleanPhase8Tables();
        await resetSizeStock(seed.sizeId, 1);
        cartHandle.stack = [];
      });

      it('with stock=1 and two simultaneous checkouts, exactly one wins', async () => {
        // Mint two carts each holding one unit of the last in-stock item
        const sessionA = `sess-a-${Math.random().toString(36).slice(2)}`;
        const sessionB = `sess-b-${Math.random().toString(36).slice(2)}`;
        const [cA] = await db.insert(carts).values({ sessionId: sessionA, locale: 'en' }).returning();
        const [cB] = await db.insert(carts).values({ sessionId: sessionB, locale: 'en' }).returning();
        await db.insert(cartItems).values([
          { cartId: cA.id, productId: seed.productId, sizeId: seed.sizeId, quantity: 1 },
          { cartId: cB.id, productId: seed.productId, sizeId: seed.sizeId, quantity: 1 },
        ]);
        cartHandle.stack = [
          { id: cA.id, sessionId: sessionA, locale: 'en' },
          { id: cB.id, sessionId: sessionB, locale: 'en' },
        ];

        const [resA, resB] = await Promise.all([
          submitCheckout(validCheckoutInput()),
          submitCheckout(validCheckoutInput()),
        ]);

        const okCount = [resA, resB].filter(r => r.ok).length;
        const failCount = [resA, resB].filter(r => !r.ok).length;
        expect(okCount).toBe(1);
        expect(failCount).toBe(1);

        const failure = [resA, resB].find(r => !r.ok)!;
        if (!failure.ok) expect(failure.code).toBe('STOCK_UNAVAILABLE');

        const [size] = await db.select().from(productSizes).where(eq(productSizes.id, seed.sizeId));
        expect(size.stock).toBe(0); // never -1
      }, 30_000);
    });
    ```

    Create `tests/integration/cart-merge.test.ts`:

    ```typescript
    import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
    import { hasDbUrl, cleanPhase8Tables } from '../helpers/test-db';
    import { seedProductWithSize } from '../helpers/factories';
    import { db } from '@/lib/db/client';
    import { carts, cartItems } from '@/lib/db/schema';
    import { eq } from 'drizzle-orm';
    import { migrateLocalStorageCart } from '@/lib/cart/migrate';

    describe.skipIf(!hasDbUrl)('migrateLocalStorageCart', () => {
      let seed: Awaited<ReturnType<typeof seedProductWithSize>>;
      let cartId: string;

      beforeAll(async () => { seed = await seedProductWithSize({ stock: 10, sizeLabel: 'M' }); });

      beforeEach(async () => {
        await cleanPhase8Tables();
        const [c] = await db.insert(carts).values({ sessionId: `merge-${Math.random()}`, locale: 'en' }).returning();
        cartId = c.id;
      });

      it('inserts new items', async () => {
        const r = await migrateLocalStorageCart(cartId, [
          { productId: seed.productId, selectedSize: seed.sizeLabel, quantity: 2 },
        ]);
        expect(r.migrated).toBe(1);
        const items = await db.select().from(cartItems).where(eq(cartItems.cartId, cartId));
        expect(items.length).toBe(1);
        expect(items[0].quantity).toBe(2);
      });

      it('sums quantity on conflict', async () => {
        await migrateLocalStorageCart(cartId, [
          { productId: seed.productId, selectedSize: seed.sizeLabel, quantity: 2 },
        ]);
        await migrateLocalStorageCart(cartId, [
          { productId: seed.productId, selectedSize: seed.sizeLabel, quantity: 3 },
        ]);
        const items = await db.select().from(cartItems).where(eq(cartItems.cartId, cartId));
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
    ```

    Create `tests/integration/transitions.test.ts`:

    ```typescript
    import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
    import { hasDbUrl, cleanPhase8Tables, resetSizeStock } from '../helpers/test-db';
    import { seedProductWithSize } from '../helpers/factories';
    import { db } from '@/lib/db/client';
    import { orders, orderItems, orderEvents, productSizes } from '@/lib/db/schema';
    import { eq } from 'drizzle-orm';

    vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
    vi.mock('@/lib/email/send', () => ({
      sendOrderConfirmed: vi.fn(async () => ({ ok: true })),
      sendOrderShipped:   vi.fn(async () => ({ ok: true })),
      sendOrderCancelled: vi.fn(async () => ({ ok: true })),
      sendOrderRefunded:  vi.fn(async () => ({ ok: true })),
    }));

    import { transitionOrderStatus } from '@/lib/orders/server';

    describe.skipIf(!hasDbUrl)('transitionOrderStatus', () => {
      let seed: Awaited<ReturnType<typeof seedProductWithSize>>;

      beforeAll(async () => { seed = await seedProductWithSize({ stock: 5, sizeLabel: 'M' }); });

      async function makeOrder(initialStatus: 'confirmed' | 'shipped' | 'pending') {
        await cleanPhase8Tables();
        await resetSizeStock(seed.sizeId, 4); // simulate 1-unit decrement
        const [order] = await db.insert(orders).values({
          reference: `ORK-T${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
          email: 'a@b.com', locale: 'en', status: initialStatus,
          subtotalCents: 10000, shippingCents: 2500, vatCents: 1875, totalCents: 14375,
          shippingFirstName: 'A', shippingLastName: 'B', shippingPhone: '+966 50 1234567',
          shippingCity: 'Riyadh', shippingDistrict: 'D', shippingAddress: 'Addr',
          paymentMethod: 'mada',
        }).returning();
        await db.insert(orderItems).values({
          orderId: order.id, productId: seed.productId, sizeLabel: seed.sizeLabel,
          productNameEn: 'Test Product', productNameAr: 'منتج', unitPriceCents: 10000, quantity: 1,
        });
        return order;
      }

      it('confirmed → shipped sets trackingNumber and writes audit event', async () => {
        const o = await makeOrder('confirmed');
        const r = await transitionOrderStatus(o.id, 'shipped', { actor: 'admin', trackingNumber: 'AWB123' });
        expect(r.ok).toBe(true);
        const [updated] = await db.select().from(orders).where(eq(orders.id, o.id));
        expect(updated.status).toBe('shipped');
        expect(updated.trackingNumber).toBe('AWB123');
        const events = await db.select().from(orderEvents).where(eq(orderEvents.orderId, o.id));
        expect(events.some(e => e.type === 'shipped')).toBe(true);
      });

      it('rejects illegal backward transition (shipped → confirmed)', async () => {
        const o = await makeOrder('shipped');
        const r = await transitionOrderStatus(o.id, 'confirmed' as any);
        expect(r.ok).toBe(false);
      });

      it('confirmed → cancelled restores stock', async () => {
        const o = await makeOrder('confirmed');
        // stock was reset to 4 by makeOrder (simulating the order's decrement)
        const r = await transitionOrderStatus(o.id, 'cancelled', { actor: 'admin', reason: 'test' });
        expect(r.ok).toBe(true);
        const [size] = await db.select().from(productSizes).where(eq(productSizes.id, seed.sizeId));
        expect(size.stock).toBe(5); // restored
      });

      it('shipped → cancelled does NOT restore stock', async () => {
        const o = await makeOrder('shipped');
        const r = await transitionOrderStatus(o.id, 'cancelled', { actor: 'admin' });
        expect(r.ok).toBe(true);
        const [size] = await db.select().from(productSizes).where(eq(productSizes.id, seed.sizeId));
        expect(size.stock).toBe(4); // not restored — goods in transit
      });
    });
    ```

    Run `npm test`. All tests including unit tests from prior plans must pass.
  </action>
  <verify>
    <automated>npm test 2>&amp;1 | tail -20; test ${PIPESTATUS[0]} -eq 0</automated>
  </verify>
  <acceptance_criteria>
    - `test -f tests/helpers/test-db.ts`
    - `test -f tests/helpers/factories.ts`
    - `test -f tests/integration/concurrent-stock.test.ts`
    - `test -f tests/integration/cart-merge.test.ts`
    - `test -f tests/integration/transitions.test.ts`
    - `grep -c "submitCheckout" tests/integration/concurrent-stock.test.ts` outputs at least 1
    - `grep -c "STOCK_UNAVAILABLE" tests/integration/concurrent-stock.test.ts` outputs at least 1
    - `grep -c "migrateLocalStorageCart" tests/integration/cart-merge.test.ts` outputs at least 1
    - `grep -c "transitionOrderStatus" tests/integration/transitions.test.ts` outputs at least 1
    - `npm test` exits 0 with at least 25 tests passing total (unit tests from 03/04/05 + 3-4 integration tests per file here)
  </acceptance_criteria>
  <done>Integration tests demonstrate FOR UPDATE works, cart merge sums quantities, and transitions follow the state machine with proper stock restoration semantics.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Write 08-UAT.md checklist (bilingual happy-path, payment-failure, RTL, screen reader, mobile)</name>
  <files>.planning/phases/08-cart-checkout-orders/08-UAT.md</files>
  <read_first>
    - .planning/phases/08-cart-checkout-orders/08-CONTEXT.md "Tests" section ("E2E (manual UAT this phase, automated deferred): mobile flow, RTL flow, payment-failure recovery, screen-reader pass.")
    - .planning/phases/07-product-catalog/07-UAT.md (existing UAT format reference, if it exists)
    - .planning/REQUIREMENTS.md (every UX-XX, ECOM-XX referenced in the checklist)
  </read_first>
  <behavior>
    - File is markdown with one `## Scenario` section per scenario.
    - Each scenario has: `Pre-conditions`, `Steps`, `Expected`, `Result (passed/failed/blocked)`.
    - Covers at minimum:
      1. EN happy path (UX-01, UX-02, UX-03, ECOM-02)
      2. AR happy path with RTL visual sanity (UX-02, UX-03)
      3. Payment-failure recovery via phone "+966 50 123 4911" (UX-06, UX-08)
      4. Validation errors highlight fields and preserve data (UX-05, UX-09)
      5. Mobile (375px viewport) tap targets all >= 44x44 (UX-04)
      6. Screen reader (VoiceOver / NVDA) reads errors, step changes (UX-09)
      7. Trust signals visible above place-order button (UX-07)
      8. Email arrival in EN and AR (ECOM-03) — if RESEND_API_KEY set
      9. Admin: ship → email, cancel-pre-ship → stock restored, refund (ECOM-02, ECOM-04)
    - File ends with a sign-off line.
  </behavior>
  <action>
    Create `.planning/phases/08-cart-checkout-orders/08-UAT.md`:

    ```markdown
    # Phase 8 UAT — Cart, Checkout State & Order Flow

    **Tester:** ___
    **Build SHA:** ___
    **Date:** ___
    **Environment:** local dev (npm run dev) at http://localhost:3000 with the live DB

    Run each scenario in order. Mark Result as `passed`, `failed`, or `blocked` (with reason).

    ---

    ## Scenario 1 — EN happy path (UX-01, UX-02, UX-03, ECOM-02, ECOM-03)

    **Pre-conditions:**
    - Dev server running, EN locale (`/en/...`).
    - At least one product in stock (admin → /admin/inventory).
    - `RESEND_API_KEY` set in .env.local (optional but verifies ECOM-03).

    **Steps:**
    1. Visit `/en/shop`; click any product; pick a size; "Add to Cart".
    2. Open cart drawer; verify item present.
    3. Refresh the page. Verify cart persists (UX-08 baseline; cookie-backed).
    4. Click "Checkout".
    5. Confirm CheckoutSteps shows "Step 1 of 2" and step 1 is highlighted.
    6. Fill all fields with valid Saudi data (e.g. phone "+966 50 123 4567"). Click "Continue to Payment".
    7. Confirm CheckoutSteps shows "Step 2 of 2".
    8. Pick a payment method (mada).
    9. Confirm OrderSummary shows: Subtotal, Shipping (with "Free" if subtotal >= 300 SAR), VAT (15%), Total — four distinct lines.
    10. Confirm TrustSignals (Lock + Returns + SSL) visible above the "Complete Purchase" button.
    11. Click "Complete Purchase".
    12. Land on `/en/checkout/confirmation?ref=ORK-XXXXXX`. Verify reference shown matches database.
    13. (If Resend is configured) check inbox for "Your ORKI order is confirmed" email. Verify EN copy.
    14. Visit `/en/admin/orders`. Verify the new order appears with status "confirmed".

    **Expected:** Steps 1–14 all behave as described. No raw error strings anywhere.

    **Result:** _____

    ---

    ## Scenario 2 — AR happy path with RTL (UX-02, UX-03, ECOM-03)

    **Pre-conditions:** dev server running.

    **Steps:**
    1. Visit `/ar/shop`; verify `<html dir="rtl" lang="ar">` (DevTools → Elements).
    2. Add an item; open cart drawer; verify all icons mirror correctly (chevrons point inward).
    3. Click checkout. Verify all labels are Arabic, all logical CSS properties render the form correctly mirrored.
    4. Fill fields; submit. Land on confirmation page; verify Arabic copy.
    5. (If Resend configured) Verify the email subject is the AR variant ("تم تأكيد طلبك من ORKI").

    **Expected:** Full AR flow works; no mixed-direction layout bugs.

    **Result:** _____

    ---

    ## Scenario 3 — Payment failure recovery (UX-06, UX-08)

    **Pre-conditions:** cart has items.

    **Steps:**
    1. On checkout, fill shipping with phone `+966 50 123 4911` (last three digits 911 → simulated decline).
    2. Click "Complete Purchase".
    3. Confirm error banner appears with the localized text from `Checkout.errors.paymentDeclined` (no raw "Error: PAYMENT_DECLINED").
    4. Open cart drawer. Verify the cart still has the same items (UX-08).
    5. Edit shipping phone to a valid value, retry. Order completes successfully.

    **Expected:** Cart preserved on failure; user-friendly bilingual error.

    **Result:** _____

    ---

    ## Scenario 4 — Validation errors (UX-05, UX-09)

    **Steps:**
    1. On the shipping form, leave all fields empty and click "Continue to Payment".
    2. Verify each empty required field shows a red message under it (e.g. "This field is required").
    3. Verify focus moves to the FIRST invalid field automatically.
    4. Verify entered data is NOT erased by clicking continue.
    5. Submit an invalid email (e.g. `notanemail`). Verify the email field shows "Please enter a valid email".
    6. Inspect the email input in DevTools: it should have `aria-invalid="true"` and `aria-describedby="email-error"`. The `<p>` with id `email-error` should have `role="alert"`.

    **Expected:** ARIA wiring correct; data preserved; first-invalid focus management works.

    **Result:** _____

    ---

    ## Scenario 5 — Mobile tap targets (UX-04)

    **Steps:**
    1. DevTools → device emulation 375×812 (iPhone X).
    2. Use the Lighthouse "Tap targets are sized appropriately" audit, OR manually inspect:
       - Place Order button height >= 44px
       - PaymentGrid cards height >= 88px (per Pitfall 8 + UX-04)
       - Form inputs height >= 44px
       - Cart quantity +/- buttons height >= 44px
    3. Confirm no hover-only interactions (i.e. all CTAs have :focus-visible AND tappable behavior).

    **Expected:** No tap target < 44×44.

    **Result:** _____

    ---

    ## Scenario 6 — Screen reader pass (UX-09)

    **Tools:** VoiceOver (macOS, Cmd+F5) or NVDA (Windows).

    **Steps:**
    1. Navigate the checkout flow with screen reader on.
    2. On step transition (after clicking "Continue to Payment"), verify the live region announces "Step 2 of 2: Payment Method" (or AR equivalent).
    3. On a validation error, the screen reader should announce the error message via `role="alert"`.
    4. Tab through every interactive element — keyboard navigation order should make sense (no skipped controls, no traps).
    5. The progress indicator should announce "Step 1, current" / "Step 2, current" via `aria-current="step"`.

    **Expected:** All ARIA wiring is consumed correctly by the screen reader.

    **Result:** _____

    ---

    ## Scenario 7 — Admin: ship + cancel-pre-ship + refund (ECOM-02, ECOM-04)

    **Pre-conditions:** at least 3 confirmed orders in the DB (run Scenario 1 three times).

    **Steps:**
    1. Visit `/en/admin/orders`. Verify the table shows all three orders with status "confirmed".
    2. Click order A → detail page → click "Mark Shipped" with tracking number "AWB-123" → verify status becomes "shipped" and an event row appears.
    3. (If Resend configured) verify the customer received the shipped email with tracking.
    4. Click order B → detail → "Cancel Order" with reason "test" → verify status "cancelled" and an event "cancelled" appears. Verify productSizes.stock is restored (compare /admin/inventory before/after).
    5. Click order C → detail → "Mark Shipped" → "Mark Delivered" → "Refund Order" → verify status flows confirmed → shipped → delivered → refunded with each event in the audit log.
    6. On a refunded order, attempt "Mark Shipped" — button must be disabled (terminal state).

    **Expected:** All transitions follow state-machine.ts. Stock restoration only on pre-ship cancel.

    **Result:** _____

    ---

    ## Scenario 8 — Email graceful degradation (ECOM-03)

    **Pre-conditions:** unset `RESEND_API_KEY` in .env.local; restart dev server.

    **Steps:**
    1. Complete a checkout (Scenario 1 abbreviated).
    2. Verify the order confirmation page renders normally (success).
    3. Verify the dev console shows a warning "RESEND_API_KEY missing — skipping confirmation email…".
    4. Verify the database has the order row but NO `email_sent.confirmation` event row.

    **Expected:** Missing API key never breaks checkout.

    **Result:** _____

    ---

    ## Sign-off

    Tested by: __________________ Date: __________
    All scenarios pass: yes / no
    Phase 8 UAT status: passed / failed
    ```
  </action>
  <verify>
    <automated>test -f .planning/phases/08-cart-checkout-orders/08-UAT.md; grep -c "Scenario " .planning/phases/08-cart-checkout-orders/08-UAT.md; grep -cE "UX-(01|02|03|04|05|06|07|08|09)" .planning/phases/08-cart-checkout-orders/08-UAT.md; grep -cE "ECOM-(02|03|04)" .planning/phases/08-cart-checkout-orders/08-UAT.md</automated>
  </verify>
  <acceptance_criteria>
    - `test -f .planning/phases/08-cart-checkout-orders/08-UAT.md`
    - `grep -c "## Scenario " .planning/phases/08-cart-checkout-orders/08-UAT.md` outputs at least 8
    - `grep -cE "UX-0[1-9]" .planning/phases/08-cart-checkout-orders/08-UAT.md` outputs at least 9 (one per requirement)
    - `grep -cE "ECOM-0[2-4]" .planning/phases/08-cart-checkout-orders/08-UAT.md` outputs at least 3
    - `grep -c "Sign-off" .planning/phases/08-cart-checkout-orders/08-UAT.md` outputs 1
  </acceptance_criteria>
  <done>UAT checklist exists with all phase requirements addressed.</done>
</task>

</tasks>

<verification>
- `npm test` exits 0 with all unit + integration tests passing
- 08-UAT.md exists and references every UX-01..09, ECOM-02..04 requirement
</verification>

<success_criteria>
Phase 8 has automated regression coverage on the riskiest paths and a written UAT checklist for the human verifier. The user can confidently sign off on Phase 8.
</success_criteria>

<output>
After completion, create `.planning/phases/08-cart-checkout-orders/08-09-SUMMARY.md`
</output>
