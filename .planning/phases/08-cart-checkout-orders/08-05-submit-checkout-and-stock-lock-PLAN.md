---
phase: 08-cart-checkout-orders
plan: 05
type: execute
wave: 2
depends_on: [08-02, 08-03, 08-04]
files_modified:
  - src/lib/orders/server.ts
  - src/lib/orders/server.test.ts
  - src/lib/orders/payment.ts
  - src/app/actions/orders.ts
  - src/lib/products.ts
autonomous: true
requirements: [UX-06, UX-08, ECOM-02]
must_haves:
  truths:
    - "submitCheckout owns the SELECT … FOR UPDATE stock lock at checkout time (Phase 7 did NOT implement it; Phase 8 owns it)"
    - "All work happens inside a single Drizzle db.transaction(...) — order rows + decrement + cart clear commit atomically"
    - "Server-side re-pricing is authoritative; client-supplied totals are ignored"
    - "Payment failure rolls back the transaction; cart_items remain (UX-08)"
    - "Successful checkout transitions order pending → confirmed via assertTransition + writes one order_events row per state change"
    - "Returns canonical envelope { ok: true, data: { reference } } | { ok: false, code, messageKey, fields? }"
    - "Raw errors never leak to the client; UNKNOWN code is returned and full error logged server-side with a request id"
  artifacts:
    - path: "src/lib/orders/server.ts"
      provides: "submitCheckout, getOrderByReference, getAllOrders, transitionOrderStatus"
      contains: ".for('update')"
    - path: "src/app/actions/orders.ts"
      provides: "'use server' re-export of submitCheckoutAction + admin transition actions"
      contains: "'use server'"
    - path: "src/lib/orders/payment.ts"
      provides: "simulatePayment(input) — deterministic for tests + dev-friendly failure trigger"
  key_links:
    - from: "src/lib/orders/server.ts"
      to: "productSizes table"
      via: ".for('update') inside db.transaction"
      pattern: "\\.for\\(['\"]update['\"]\\)"
    - from: "src/lib/orders/server.ts"
      to: "src/lib/orders/state-machine.ts"
      via: "assertTransition('pending', 'confirmed')"
      pattern: "assertTransition\\("
    - from: "src/app/actions/orders.ts"
      to: "src/lib/orders/server.ts"
      via: "'use server' re-export"
      pattern: "export \\{.*submitCheckoutAction"
---

<objective>
Implement the heart of Phase 8: a single Server Action `submitCheckout` that re-validates input with zod, resolves the cart from cookie, opens a Drizzle transaction, locks the relevant `productSizes` rows with `SELECT … FOR UPDATE`, decrements stock, inserts the order + items + events, simulates payment, transitions pending→confirmed, deletes cart items, and returns `{ ok: true, data: { reference } }`. Failure preserves the cart (UX-08) and returns a typed error code.

Per the planning brief: **Phase 8 owns the stock lock**. There is no `.for('update')` anywhere in the existing codebase. This plan introduces it.

Purpose: ECOM-02 (state machine activation), UX-06 (no raw errors), UX-08 (cart preserved on failure).

Output: A submitCheckout function that is the ONLY path to creating an Order row, plus admin transition helpers (used by Plan 08-08), plus a deterministic simulatePayment.
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
@src/lib/db/schema.ts
@src/lib/db/client.ts
@src/lib/cart/session.ts
@src/lib/cart/server.ts
@src/lib/orders/state-machine.ts
@src/lib/orders/pricing.ts
@src/lib/orders/reference.ts
@src/lib/orders/errors.ts
@src/lib/checkout/schemas.ts
@src/app/actions/admin.ts

<interfaces>
After Plan 08-04, `checkoutSchema` is available with type `CheckoutInput = { shipping, payment }`.

Stock column: `productSizes.stock` (integer). NOT `quantity`. Note: `cartItems.quantity` is its own column.

Drizzle 0.45.2 supports `.for('update')` on a select chain inside a transaction (per RESEARCH.md citation).

Order locale snapshot: must come from `cart.locale` (set by Plan 08-02 cart session).
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Implement simulatePayment + submitCheckout with FOR UPDATE lock + state machine + events</name>
  <files>src/lib/orders/payment.ts, src/lib/orders/server.ts, src/lib/products.ts</files>
  <read_first>
    - src/lib/db/client.ts (db singleton; Drizzle client supports .transaction)
    - src/lib/db/schema.ts (carts, cartItems, productSizes, orders, orderItems, orderEvents — note `productSizes.stock` not `quantity`)
    - src/lib/cart/session.ts (getOrCreateCart)
    - src/lib/cart/server.ts (getCart, clearCartItems)
    - src/lib/orders/state-machine.ts (assertTransition)
    - src/lib/orders/pricing.ts (computeOrderTotals — input is unitPriceCents per item)
    - src/lib/orders/reference.ts (generateOrderReference)
    - src/lib/orders/errors.ts (OrderError + codes)
    - src/lib/checkout/schemas.ts (checkoutSchema, CheckoutInput)
    - src/lib/products.ts (existing data-access; verify whether toProduct mapper is exported — needed by cart/server.ts)
    - src/app/actions/admin.ts (Server Action conventions)
    - .planning/phases/08-cart-checkout-orders/08-CONTEXT.md "Stock locking" section (authoritative pattern)
    - .planning/phases/08-cart-checkout-orders/08-RESEARCH.md lines 484-595 (full transaction sketch — but stock column is `stock` not `quantity`)
    - .planning/phases/08-cart-checkout-orders/08-PATTERNS.md "src/lib/orders/server.ts" section
  </read_first>
  <behavior>
    - `payment.ts` exports `simulatePayment(input: { phone: string; method: string }): Promise<{ success: true } | { success: false; code: 'CARD_DECLINED' | 'NETWORK_ERROR' }>`. Deterministic: phone ending in `911` returns `{ success: false, code: 'CARD_DECLINED' }`; phone ending in `000` returns `{ success: false, code: 'NETWORK_ERROR' }`; everything else returns success. (Deterministic for testability — replace with real PSP later.)
    - `server.ts` exports:
      - `submitCheckout(input: CheckoutInput): Promise<{ ok: true; data: { reference: string; orderId: string } } | { ok: false; code; messageKey; fields? }>`
      - `getOrderByReference(reference: string): Promise<Order | null>`
      - `getAllOrders(): Promise<Order[]>` (for admin list)
      - `transitionOrderStatus(orderId: string, to: OrderStatus, opts?: { actor?: string; trackingNumber?: string; reason?: string }): Promise<{ ok: true } | { ok: false; code; messageKey }>` — used by admin (Plan 08-08). Reads current status, calls `assertTransition`, updates row, writes order_events row. If `to === 'cancelled'` AND `from in ('pending','confirmed')`: also restores stock (loop +qty back into productSizes for each orderItem). For `shipped → cancelled`: do NOT restore stock per CONTEXT.md. For refund: never restore stock.
    - submitCheckout body, in order:
      1. `const validation = checkoutSchema.safeParse(input)` — on failure return `{ ok: false, code: 'VALIDATION', fields: ..., messageKey: 'Checkout.errors.validation' }` (map zod issues to a flat `fields: Record<string, string>` keyed by dotted path).
      2. `const session = await getOrCreateCart(...)`. `const cart = await getCart(session.id)`. If `!cart || cart.items.length === 0` return `{ ok: false, code: 'CART_EMPTY', messageKey: 'Checkout.errors.cartEmpty' }`.
      3. Compute totals server-side via `computeOrderTotals(cart.items.map(i => ({ unitPriceCents: i.product.price * 100, quantity: i.quantity })))`.
      4. Open `db.transaction(async (tx) => { ... })`.
      5. Inside the transaction: `const sizeIds = cart.items.map(i => i.sizeId); const lockedSizes = await tx.select().from(productSizes).where(inArray(productSizes.id, sizeIds)).for('update');`
      6. For each cart item, find the locked size; if missing or `size.stock < item.quantity`, throw `new OrderError('STOCK_UNAVAILABLE', ...)`.
      7. For each cart item, `tx.update(productSizes).set({ stock: sql\`${productSizes.stock} - ${item.quantity}\` }).where(eq(productSizes.id, item.sizeId))`.
      8. Insert orders row with `reference = generateOrderReference()`, `status: 'pending'`, snapshot shipping fields, halalas totals, `locale: cart.locale`. Capture orderId.
      9. Insert orderItems for each cart item (snapshot productNameEn, productNameAr, unitPriceCents = `product.price * 100`, sizeLabel, quantity).
      10. Insert orderEvents `{ orderId, type: 'created' }`.
      11. Call `simulatePayment({ phone: shipping.phone, method: payment.method })`. If failure: insert orderEvents `{ orderId, type: 'payment_failed', metadata: { code } }` then `throw new OrderError('PAYMENT_DECLINED', ...)`. **NOTE:** because we throw, Drizzle rolls back — the order row WILL NOT exist after rollback. The `payment_failed` event row also rolls back. That is expected — see RESEARCH.md "No `failed` terminal state" decision. We rely on server logs for forensic data.
      12. `assertTransition('pending', 'confirmed')` (compile-time gate, also asserts at runtime).
      13. `tx.update(orders).set({ status: 'confirmed', updatedAt: new Date() }).where(eq(orders.id, orderId))`.
      14. Insert orderEvents `{ orderId, type: 'confirmed', metadata: { fromStatus: 'pending', toStatus: 'confirmed' } }`.
      15. `tx.delete(cartItems).where(eq(cartItems.cartId, cart.id))`.
    - Wrap the `await db.transaction(...)` in try/catch. On `OrderError` map code → user envelope:
      - `STOCK_UNAVAILABLE` → `messageKey: 'Checkout.errors.stockUnavailable'`
      - `PAYMENT_DECLINED` → `messageKey: 'Checkout.errors.paymentDeclined'`
      - any other thrown error: `console.error('[submitCheckout]', requestId, err)` and return `{ ok: false, code: 'UNKNOWN', messageKey: 'Checkout.errors.unknown' }`. `requestId = crypto.randomUUID()` so logs are correlatable.
    - On success return `{ ok: true, data: { reference, orderId } }`. Also `revalidatePath('/[locale]/checkout', 'page')` and `revalidatePath('/[locale]/admin/orders', 'page')` (admin list).
  </behavior>
  <action>
    Create `src/lib/orders/payment.ts`:

    ```typescript
    import 'server-only';

    export type PaymentFailureCode = 'CARD_DECLINED' | 'NETWORK_ERROR';
    export type PaymentResult =
      | { success: true }
      | { success: false; code: PaymentFailureCode };

    /**
     * Deterministic payment simulator (Phase 8 — no real PSP yet).
     * Phone ending in 911 → declined; 000 → network error; else → success.
     * Replace with real Moyasar/Mada/STC Pay integration in a future milestone.
     */
    export async function simulatePayment(input: {
      phone: string; method: string;
    }): Promise<PaymentResult> {
      // Normalize phone to digits only and inspect last 3
      const digits = input.phone.replace(/\D/g, '');
      const tail = digits.slice(-3);
      if (tail === '911') return { success: false, code: 'CARD_DECLINED' };
      if (tail === '000') return { success: false, code: 'NETWORK_ERROR' };
      // Tiny artificial delay for realism — bounded so tests stay fast.
      await new Promise(r => setTimeout(r, 25));
      return { success: true };
    }
    ```

    If `src/lib/products.ts` does not export a `getProductById(id: string)` helper yet, ADD it (mirror `getProductBySlug` lines 86-99). Also EXPORT `toProduct` so Plan 08-02's `cart/server.ts` and this plan's `getOrderByReference` can map joined rows. If 08-02 already added these, leave alone.

    Create `src/lib/orders/server.ts`:

    ```typescript
    import 'server-only';
    import { revalidatePath } from 'next/cache';
    import { eq, inArray, sql, desc } from 'drizzle-orm';
    import { db } from '@/lib/db/client';
    import {
      productSizes, orders, orderItems, orderEvents, cartItems,
    } from '@/lib/db/schema';
    import type { Order, OrderItem, OrderEvent, OrderStatus, Locale } from '@/types/domain';
    import { getOrCreateCart } from '@/lib/cart/session';
    import { getCart } from '@/lib/cart/server';
    import { computeOrderTotals } from './pricing';
    import { generateOrderReference } from './reference';
    import { assertTransition, canTransition } from './state-machine';
    import { OrderError, type OrderErrorCode } from './errors';
    import { simulatePayment } from './payment';
    import { checkoutSchema, type CheckoutInput } from '@/lib/checkout/schemas';

    type ActionResult<T = unknown> =
      | { ok: true; data: T }
      | {
          ok: false;
          code: OrderErrorCode | 'INSUFFICIENT_STOCK';
          fields?: Record<string, string>;
          messageKey: string;
        };

    function errorMessageKey(code: OrderErrorCode | 'INSUFFICIENT_STOCK'): string {
      switch (code) {
        case 'STOCK_UNAVAILABLE':
        case 'INSUFFICIENT_STOCK':
          return 'Checkout.errors.stockUnavailable';
        case 'PAYMENT_DECLINED':  return 'Checkout.errors.paymentDeclined';
        case 'CART_EMPTY':        return 'Checkout.errors.cartEmpty';
        case 'PRODUCT_NOT_FOUND': return 'Checkout.errors.unknown';
        case 'VALIDATION':        return 'Checkout.errors.validation';
        default:                  return 'Checkout.errors.unknown';
      }
    }

    export async function submitCheckout(
      input: CheckoutInput
    ): Promise<ActionResult<{ reference: string; orderId: string }>> {
      const requestId = (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2));

      // 1. Server-side re-validation (UX-06: never trust client)
      const parsed = checkoutSchema.safeParse(input);
      if (!parsed.success) {
        const fields: Record<string, string> = {};
        for (const issue of parsed.error.issues) {
          const path = issue.path.join('.');
          if (!fields[path]) fields[path] = issue.message;
        }
        return {
          ok: false, code: 'VALIDATION', fields,
          messageKey: 'Checkout.errors.validation',
        };
      }
      const { shipping, payment } = parsed.data;

      // 2. Resolve cart
      const session = await getOrCreateCart();
      const cart = await getCart(session.id);
      if (!cart || cart.items.length === 0) {
        return { ok: false, code: 'CART_EMPTY', messageKey: 'Checkout.errors.cartEmpty' };
      }

      // 3. Authoritative totals (server-side)
      const totals = computeOrderTotals(
        cart.items.map(i => ({
          unitPriceCents: i.product.price * 100, // products.price is whole-SAR
          quantity: i.quantity,
        }))
      );

      let createdReference = '';
      let createdOrderId = '';

      try {
        await db.transaction(async (tx) => {
          // 4. Lock the size rows we're about to decrement
          const sizeIds = cart.items.map(i => i.sizeId);
          const lockedSizes = await tx
            .select().from(productSizes)
            .where(inArray(productSizes.id, sizeIds))
            .for('update'); // PESSIMISTIC LOCK — Phase 8 owns this

          // 5. Verify stock for every cart item
          for (const item of cart.items) {
            const size = lockedSizes.find(s => s.id === item.sizeId);
            if (!size || size.stock < item.quantity) {
              throw new OrderError('STOCK_UNAVAILABLE', `size ${item.sizeId}`, {
                sizeId: item.sizeId, requested: item.quantity, available: size?.stock ?? 0,
              });
            }
          }

          // 6. Decrement stock atomically
          for (const item of cart.items) {
            await tx.update(productSizes)
              .set({ stock: sql`${productSizes.stock} - ${item.quantity}` })
              .where(eq(productSizes.id, item.sizeId));
          }

          // 7. Insert order (status='pending')
          const reference = generateOrderReference();
          const [order] = await tx.insert(orders).values({
            reference,
            email: shipping.email,
            locale: cart.locale,
            status: 'pending',
            subtotalCents: totals.subtotalCents,
            shippingCents: totals.shippingCents,
            vatCents: totals.vatCents,
            totalCents: totals.totalCents,
            shippingFirstName: shipping.firstName,
            shippingLastName: shipping.lastName,
            shippingPhone: shipping.phone,
            shippingCity: shipping.city,
            shippingDistrict: shipping.district,
            shippingAddress: shipping.address,
            shippingApartment: shipping.apartment || null,
            paymentMethod: payment.method,
          }).returning();
          createdReference = reference;
          createdOrderId = order.id;

          // 8. Insert order items (price snapshot — products.price * 100)
          await tx.insert(orderItems).values(cart.items.map(item => ({
            orderId: order.id,
            productId: item.productId,
            sizeLabel: item.sizeLabel,
            productNameEn: item.product.name.en,
            productNameAr: item.product.name.ar,
            unitPriceCents: item.product.price * 100,
            quantity: item.quantity,
          })));

          // 9. Audit: order created
          await tx.insert(orderEvents).values({
            orderId: order.id, type: 'created',
            metadata: { actor: 'system', requestId },
          });

          // 10. Simulate payment
          const paymentResult = await simulatePayment({
            phone: shipping.phone, method: payment.method,
          });
          if (!paymentResult.success) {
            // Logged via OrderError throw → entire txn rolls back.
            throw new OrderError('PAYMENT_DECLINED', `payment ${paymentResult.code}`, {
              code: paymentResult.code, requestId,
            });
          }

          // 11. Transition pending → confirmed (validated)
          assertTransition('pending', 'confirmed');
          await tx.update(orders)
            .set({ status: 'confirmed', updatedAt: new Date() })
            .where(eq(orders.id, order.id));
          await tx.insert(orderEvents).values({
            orderId: order.id, type: 'confirmed',
            metadata: { fromStatus: 'pending', toStatus: 'confirmed', actor: 'system', requestId },
          });

          // 12. Clear cart items (UX-08: only after payment confirmed)
          await tx.delete(cartItems).where(eq(cartItems.cartId, cart.id));
        });
      } catch (err) {
        if (err instanceof OrderError) {
          console.error(`[submitCheckout][${requestId}] OrderError:`, err.code, err.details);
          return {
            ok: false, code: err.code,
            messageKey: errorMessageKey(err.code),
          };
        }
        console.error(`[submitCheckout][${requestId}] UNKNOWN:`, err);
        return {
          ok: false, code: 'UNKNOWN' as const,
          messageKey: 'Checkout.errors.unknown',
        };
      }

      revalidatePath('/[locale]/checkout', 'page');
      revalidatePath('/[locale]/admin/orders', 'page');

      return { ok: true, data: { reference: createdReference, orderId: createdOrderId } };
    }

    export async function getOrderByReference(reference: string): Promise<Order | null> {
      const row = await db.query.orders.findFirst({
        where: eq(orders.reference, reference),
        with: {
          items: true,
          events: { orderBy: (e, { asc }) => [asc(e.createdAt)] },
        },
      });
      return row ? toOrder(row) : null;
    }

    export async function getAllOrders(): Promise<Order[]> {
      const rows = await db.query.orders.findMany({
        with: {
          items: true,
          events: { orderBy: (e, { asc }) => [asc(e.createdAt)] },
        },
        orderBy: (o, { desc: d }) => [d(o.placedAt)],
      });
      return rows.map(toOrder);
    }

    export async function transitionOrderStatus(
      orderId: string,
      to: OrderStatus,
      opts: { actor?: string; trackingNumber?: string; reason?: string } = {}
    ): Promise<ActionResult<null>> {
      try {
        return await db.transaction(async (tx) => {
          const [current] = await tx.select().from(orders).where(eq(orders.id, orderId));
          if (!current) {
            return { ok: false as const, code: 'PRODUCT_NOT_FOUND' as const,
              messageKey: 'Checkout.errors.unknown' };
          }
          if (!canTransition(current.status as OrderStatus, to)) {
            return { ok: false as const, code: 'VALIDATION' as const,
              messageKey: 'Checkout.errors.validation' };
          }

          // Stock restoration on cancel: only for pre-ship cancellations
          const restoreStock =
            to === 'cancelled' &&
            (current.status === 'pending' || current.status === 'confirmed');
          if (restoreStock) {
            const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));
            for (const it of items) {
              // Match the productSizes row by productId + sizeLabel snapshot
              const [size] = await tx
                .select().from(productSizes)
                .where(sql`${productSizes.productId} = ${it.productId} AND ${productSizes.label} = ${it.sizeLabel}`)
                .for('update');
              if (size) {
                await tx.update(productSizes)
                  .set({ stock: sql`${productSizes.stock} + ${it.quantity}` })
                  .where(eq(productSizes.id, size.id));
              }
            }
          }

          const updates: Record<string, unknown> = { status: to, updatedAt: new Date() };
          if (to === 'shipped' && opts.trackingNumber) updates.trackingNumber = opts.trackingNumber;

          await tx.update(orders).set(updates).where(eq(orders.id, orderId));
          await tx.insert(orderEvents).values({
            orderId, type: to,
            metadata: {
              fromStatus: current.status, toStatus: to,
              actor: opts.actor ?? 'admin', reason: opts.reason,
              trackingNumber: opts.trackingNumber,
              stockRestored: restoreStock,
            },
          });

          revalidatePath('/[locale]/admin/orders', 'page');
          return { ok: true as const, data: null };
        });
      } catch (err) {
        const requestId = (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2));
        console.error(`[transitionOrderStatus][${requestId}]`, err);
        return { ok: false, code: 'UNKNOWN', messageKey: 'Checkout.errors.unknown' };
      }
    }

    function toOrder(row: any): Order {
      return {
        id: row.id,
        reference: row.reference,
        userId: row.userId,
        email: row.email,
        locale: row.locale,
        status: row.status,
        subtotalCents: row.subtotalCents,
        shippingCents: row.shippingCents,
        vatCents: row.vatCents,
        totalCents: row.totalCents,
        currency: row.currency,
        shipping: {
          firstName: row.shippingFirstName, lastName: row.shippingLastName,
          phone: row.shippingPhone, city: row.shippingCity, district: row.shippingDistrict,
          address: row.shippingAddress, apartment: row.shippingApartment,
        },
        paymentMethod: row.paymentMethod,
        trackingNumber: row.trackingNumber,
        items: (row.items ?? []).map((it: any): OrderItem => ({
          id: it.id, productId: it.productId, sizeLabel: it.sizeLabel,
          productName: { en: it.productNameEn, ar: it.productNameAr },
          unitPriceCents: it.unitPriceCents, quantity: it.quantity,
        })),
        events: (row.events ?? []).map((ev: any): OrderEvent => ({
          id: ev.id, type: ev.type, metadata: ev.metadata, createdAt: ev.createdAt,
        })),
        placedAt: row.placedAt,
        updatedAt: row.updatedAt,
      };
    }
    ```

    Run `npx tsc --noEmit` and fix any type errors (likely on Drizzle's relational query result types — use `as any` for the inner row mappers, or define explicit types).
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&amp;1 | grep -E "orders/server|orders/payment" | grep -i error; test $? -ne 0</automated>
  </verify>
  <acceptance_criteria>
    - `grep -c "\.for('update')" src/lib/orders/server.ts` outputs at least 2 (submit + transition)
    - `grep -c "db.transaction(" src/lib/orders/server.ts` outputs at least 2
    - `grep -c "assertTransition\\('pending', 'confirmed'\\)" src/lib/orders/server.ts` outputs 1
    - `grep -c "OrderError" src/lib/orders/server.ts` outputs at least 3
    - `grep -c "checkoutSchema.safeParse" src/lib/orders/server.ts` outputs 1
    - `grep -c "computeOrderTotals" src/lib/orders/server.ts` outputs 1
    - `grep -c "generateOrderReference" src/lib/orders/server.ts` outputs 1
    - `grep -c "tx.delete(cartItems)" src/lib/orders/server.ts` outputs 1
    - `grep -c "import 'server-only'" src/lib/orders/server.ts` outputs 1
    - `grep -c "import 'server-only'" src/lib/orders/payment.ts` outputs 1
    - `grep -c "tail === '911'" src/lib/orders/payment.ts` outputs 1
    - `npx tsc --noEmit` exits 0 with no errors in `src/lib/orders/**`
  </acceptance_criteria>
  <done>submitCheckout exists, type-checks, contains the FOR UPDATE lock, runs all logic inside a transaction, and maps all errors to user-facing message keys.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Create src/app/actions/orders.ts Server Action shim + unit tests for submitCheckout error paths</name>
  <files>src/app/actions/orders.ts, src/lib/orders/server.test.ts</files>
  <read_first>
    - src/lib/orders/server.ts (just-created)
    - src/app/actions/admin.ts (Server Action shim convention)
    - .planning/phases/08-cart-checkout-orders/08-PATTERNS.md "src/app/actions/orders.ts" section (it's a thin re-export)
  </read_first>
  <behavior>
    - `src/app/actions/orders.ts` starts with `'use server';` and re-exports submitCheckout, transitionOrderStatus from `@/lib/orders/server` (and exposes them under client-friendly names: `submitCheckoutAction`, `transitionOrderAction`).
    - Unit tests in `src/lib/orders/server.test.ts` mock the DB layer (or use Drizzle's in-memory pglite if easy; otherwise mock cart/session and db.transaction) and verify:
      - VALIDATION code is returned when zod fails (no DB call needed)
      - CART_EMPTY code is returned when cart has no items
      - The phone "+966 50 000 0000" path returns ok:false with code PAYMENT_DECLINED (network error → maps via simulatePayment)
      - Phone "+966 50 123 4911" returns ok:false with code PAYMENT_DECLINED (card declined)
      Tests can mock `getOrCreateCart` and `getCart` via `vi.mock` to avoid needing a real DB. Full integration test (with FOR UPDATE concurrency) is owned by Plan 08-09.
  </behavior>
  <action>
    Create `src/app/actions/orders.ts`:

    ```typescript
    'use server';

    export { submitCheckout as submitCheckoutAction } from '@/lib/orders/server';
    export { transitionOrderStatus as transitionOrderAction } from '@/lib/orders/server';
    ```

    Create `src/lib/orders/server.test.ts`:

    ```typescript
    import { describe, it, expect, vi, beforeEach } from 'vitest';

    // Mock cart layer so submitCheckout can run without a real DB
    vi.mock('@/lib/cart/session', () => ({
      getOrCreateCart: vi.fn(async () => ({ id: 'cart-1', sessionId: 'sess', locale: 'en' })),
    }));
    vi.mock('@/lib/cart/server', () => ({
      getCart: vi.fn(),
    }));
    vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

    // Mock db so the transaction body is a no-op (we only test pre-flight error paths here)
    vi.mock('@/lib/db/client', () => ({
      db: {
        transaction: vi.fn(async (cb: any) => {
          const tx = {
            select: () => ({ from: () => ({ where: () => ({ for: () => [] }) }) }),
            update: () => ({ set: () => ({ where: async () => {} }) }),
            insert: () => ({ values: async () => [{ id: 'order-1' }], returning: async () => [{ id: 'order-1' }] }),
            delete: () => ({ where: async () => {} }),
          };
          return cb(tx);
        }),
        query: { orders: { findFirst: vi.fn(), findMany: vi.fn(async () => []) } },
      },
    }));

    import { submitCheckout } from './server';
    import * as cartServer from '@/lib/cart/server';

    const validInput = {
      shipping: {
        firstName: 'A', lastName: 'B',
        email: 'a@b.com',
        phone: '+966 50 123 4567',
        city: 'Riyadh', district: 'Olaya', address: 'Street 123',
      },
      payment: { method: 'mada' as const },
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    describe('submitCheckout', () => {
      it('returns VALIDATION on bad input', async () => {
        const result = await submitCheckout({
          ...validInput,
          shipping: { ...validInput.shipping, email: 'not-email' },
        } as any);
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.code).toBe('VALIDATION');
          expect(result.fields?.['shipping.email']).toBe('Checkout.errors.email');
        }
      });

      it('returns CART_EMPTY when cart has no items', async () => {
        (cartServer.getCart as any).mockResolvedValueOnce({
          id: 'cart-1', sessionId: 's', userId: null, locale: 'en', items: [], updatedAt: new Date(),
        });
        const result = await submitCheckout(validInput);
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.code).toBe('CART_EMPTY');
          expect(result.messageKey).toBe('Checkout.errors.cartEmpty');
        }
      });

      it('returns CART_EMPTY when getCart returns null', async () => {
        (cartServer.getCart as any).mockResolvedValueOnce(null);
        const result = await submitCheckout(validInput);
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.code).toBe('CART_EMPTY');
      });
    });
    ```

    Note: full FOR UPDATE concurrency test is owned by Plan 08-09 (integration test against a real DB). This plan's tests cover the pre-flight branches.
  </action>
  <verify>
    <automated>npx vitest run src/lib/orders/server.test.ts 2>&amp;1 | tail -10</automated>
  </verify>
  <acceptance_criteria>
    - `head -n 1 src/app/actions/orders.ts | grep -c "'use server'"` outputs 1
    - `grep -c "submitCheckoutAction" src/app/actions/orders.ts` outputs 1
    - `grep -c "transitionOrderAction" src/app/actions/orders.ts` outputs 1
    - `npx vitest run src/lib/orders/server.test.ts` exits 0 with at least 3 tests passing
    - `npx tsc --noEmit` exits 0
  </acceptance_criteria>
  <done>Server Action shim exposes submitCheckoutAction + transitionOrderAction. Unit tests cover VALIDATION + CART_EMPTY paths.</done>
</task>

</tasks>

<verification>
- `grep -c "\.for('update')" src/lib/orders/server.ts` outputs at least 2
- `grep -c "db.transaction(" src/lib/orders/server.ts` outputs at least 2
- `npx vitest run src/lib/orders/` passes
- `npx tsc --noEmit` exits 0
</verification>

<success_criteria>
Plan 08-06 (UI) can `import { submitCheckoutAction } from '@/app/actions/orders'` and call it with a `CheckoutInput`. On success it gets `{ ok: true, data: { reference } }` and routes to `/checkout/confirmation?ref={reference}`. On failure it gets a typed code + messageKey to render via `useTranslations`.
</success_criteria>

<output>
After completion, create `.planning/phases/08-cart-checkout-orders/08-05-SUMMARY.md`
</output>
