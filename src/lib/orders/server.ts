import 'server-only';
import { revalidatePath } from 'next/cache';
import { eq, inArray, sql, and } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import {
  products,
  productSizes,
  orders,
  orderItems,
  orderEvents,
  cartItems,
} from '@/lib/db/schema';
import type {
  Order,
  OrderItem,
  OrderEvent,
  OrderStatus,
  Locale,
} from '@/types/domain';
import { getOrCreateCart } from '@/lib/cart/session';
import { getCart } from '@/lib/cart/server';
import { createClient } from '@/lib/supabase/server';
import { grantOrderView } from './order-access';
import { computeOrderTotals } from './pricing';
import { generateOrderReference } from './reference';
import { assertTransition, canTransition } from './state-machine';
import { OrderError, type OrderErrorCode } from './errors';
import { simulatePayment } from './payment';
import { checkoutSchema, type CheckoutInput } from '@/lib/checkout/schemas';
import {
  sendOrderConfirmed,
  sendOrderShipped,
  sendOrderCancelled,
  sendOrderRefunded,
} from '@/lib/email/send';

/**
 * Canonical Server Action result envelope. The client maps `code` + `messageKey`
 * via next-intl. Raw errors / SQL / stack are NEVER serialized — UNKNOWN code
 * carries the user-friendly fallback while the full error is logged server-side
 * with a request id for forensic correlation.
 */
type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | {
      ok: false;
      code: OrderErrorCode | 'INSUFFICIENT_STOCK';
      fields?: Record<string, string>;
      messageKey: string;
    };

function errorMessageKey(
  code: OrderErrorCode | 'INSUFFICIENT_STOCK'
): string {
  switch (code) {
    case 'STOCK_UNAVAILABLE':
    case 'INSUFFICIENT_STOCK':
      return 'Checkout.errors.stockUnavailable';
    case 'PAYMENT_DECLINED':
      return 'Checkout.errors.paymentDeclined';
    case 'CART_EMPTY':
      return 'Checkout.errors.cartEmpty';
    case 'PRODUCT_NOT_FOUND':
      return 'Checkout.errors.unknown';
    case 'VALIDATION':
      return 'Checkout.errors.validation';
    default:
      return 'Checkout.errors.unknown';
  }
}

function newRequestId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    Math.random().toString(36).slice(2)
  );
}

/**
 * The ONLY path to creating an Order row. Re-validates input with zod, resolves
 * the cart from the session cookie, opens a Drizzle transaction, locks the
 * relevant productSizes rows with `SELECT ... FOR UPDATE`, decrements stock,
 * inserts the order + items + events, simulates payment, transitions
 * pending → confirmed, deletes cart_items, and returns the public reference.
 *
 * Failure paths (validation, empty cart, stock, payment, db) preserve the cart
 * (UX-08) and return a typed error code with a localized message key.
 */
export async function submitCheckout(
  input: CheckoutInput
): Promise<ActionResult<{ reference: string; orderId: string }>> {
  const requestId = newRequestId();

  // 1. Server-side re-validation (UX-06: never trust the client).
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.join('.');
      if (!fields[path]) fields[path] = issue.message;
    }
    return {
      ok: false,
      code: 'VALIDATION',
      fields,
      messageKey: 'Checkout.errors.validation',
    };
  }
  const { shipping, payment, idempotencyKey } = parsed.data;

  // 1a. Idempotency pre-check. A double-click, a back-button resubmit, or a
  //     silent network retry can invoke this action twice for ONE customer
  //     intent. The client sends a stable key per checkout attempt; if an order
  //     already exists for it, return that SAME order — never decrement stock or
  //     charge a second time. (The DB unique constraint below is the hard
  //     guarantee; this check handles the common sequential-retry case cheaply.)
  {
    const prior = await db.query.orders.findFirst({
      where: eq(orders.idempotencyKey, idempotencyKey),
      columns: { id: true, reference: true },
    });
    if (prior) {
      // Re-grant this browser view access to its order, then return success.
      try {
        await grantOrderView(prior.reference);
      } catch {
        /* cookie grant is best-effort on the dedupe path */
      }
      return {
        ok: true,
        data: { reference: prior.reference, orderId: prior.id },
      };
    }
  }

  // 1b. Resolve the authenticated user, if any. Guests check out with userId
  //     null; logged-in users get the order tagged so it appears in their
  //     history and the orders_select_own RLS policy / IDOR guards apply.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? null;

  // 2. Resolve the active cart.
  const session = await getOrCreateCart();
  const cart = await getCart(session.id);
  if (!cart || cart.items.length === 0) {
    return {
      ok: false,
      code: 'CART_EMPTY',
      messageKey: 'Checkout.errors.cartEmpty',
    };
  }

  // 3. Authoritative server-side totals — the client total is informational.
  const totals = computeOrderTotals(
    cart.items.map((i) => ({
      // products.price is whole-SAR; halalas everywhere on order rows.
      unitPriceCents: i.product.price * 100,
      quantity: i.quantity,
    }))
  );

  let createdReference = '';
  let createdOrderId = '';

  try {
    await db.transaction(async (tx) => {
      // 4. Pessimistic lock on every size row we are about to decrement.
      //    Phase 7 did NOT implement this; Phase 8 owns the lock.
      const sizeIds = cart.items.map((i) => i.sizeId);
      const lockedSizes = await tx
        .select()
        .from(productSizes)
        .where(inArray(productSizes.id, sizeIds))
        .for('update');

      // 5. Verify stock for every cart item against the locked rows.
      for (const item of cart.items) {
        const size = lockedSizes.find((s) => s.id === item.sizeId);
        if (!size || size.stock < item.quantity) {
          throw new OrderError(
            'STOCK_UNAVAILABLE',
            `size ${item.sizeId}`,
            {
              sizeId: item.sizeId,
              requested: item.quantity,
              available: size?.stock ?? 0,
            }
          );
        }
      }

      // 6. Decrement stock atomically.
      for (const item of cart.items) {
        await tx
          .update(productSizes)
          .set({ stock: sql`${productSizes.stock} - ${item.quantity}` })
          .where(eq(productSizes.id, item.sizeId));
      }

      // 6b. Reconcile the derived inStock flags with the new stock levels so the
      //     catalog never advertises a size as in-stock at 0 units (parity with
      //     admin.updateSizeInventory). A size that hit 0 flips to inStock=false;
      //     the product flips when no size remains purchasable. We never force a
      //     positive-stock size back to TRUE here — an admin may have deliberately
      //     disabled it.
      const decrementedProductIds = [...new Set(cart.items.map((i) => i.productId))];
      for (const pid of decrementedProductIds) {
        const sizes = await tx
          .select()
          .from(productSizes)
          .where(eq(productSizes.productId, pid));
        for (const s of sizes) {
          if (s.stock <= 0 && s.inStock) {
            await tx
              .update(productSizes)
              .set({ inStock: false })
              .where(eq(productSizes.id, s.id));
          }
        }
        const anyInStock = sizes.some((s) => s.inStock && s.stock > 0);
        await tx
          .update(products)
          .set({ inStock: anyInStock })
          .where(eq(products.id, pid));
      }

      // 7. Insert the order row in 'pending' state with reference-collision retry.
      let reference = '';
      let orderRow: { id: string } | undefined;
      const MAX_REF_ATTEMPTS = 3;
      for (let attempt = 0; attempt < MAX_REF_ATTEMPTS; attempt++) {
        reference = generateOrderReference();
        try {
          const [row] = await tx
            .insert(orders)
            .values({
              reference,
              idempotencyKey,
              userId,
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
            })
            .returning();
          orderRow = row;
          break;
        } catch (insertErr) {
          const msg = (insertErr as Error)?.message ?? '';
          // Concurrent duplicate submit: another in-flight request with the
          // SAME idempotency key already inserted the order. Abort this txn
          // (rolls back the stock decrement) and return the winning order in
          // the outer catch — no second order, no second charge, no oversell.
          if (msg.includes('orders_idempotency_key_unique')) {
            throw new OrderError(
              'DUPLICATE_SUBMIT',
              'concurrent idempotent checkout',
              { idempotencyKey }
            );
          }
          // Otherwise a reference collision — retry with a fresh reference.
          const isRefViolation =
            msg.includes('orders_reference') ||
            msg.includes('duplicate key') ||
            msg.includes('unique constraint');
          if (!isRefViolation || attempt === MAX_REF_ATTEMPTS - 1) {
            throw insertErr;
          }
        }
      }
      if (!orderRow) {
        throw new OrderError(
          'UNKNOWN',
          'failed to insert order after retries'
        );
      }
      createdReference = reference;
      createdOrderId = orderRow.id;

      // 8. Insert order items — snapshot product name, size, unit price.
      await tx.insert(orderItems).values(
        cart.items.map((item) => ({
          orderId: orderRow!.id,
          productId: item.productId,
          sizeId: item.sizeId,
          sizeLabel: item.sizeLabel,
          productNameEn: item.product.name.en,
          productNameAr: item.product.name.ar,
          unitPriceCents: item.product.price * 100,
          quantity: item.quantity,
        }))
      );

      // 9. Audit: order created.
      await tx.insert(orderEvents).values({
        orderId: orderRow.id,
        type: 'created',
        metadata: { actor: 'system', requestId },
      });

      // 10. Simulate payment. Failure throws — Drizzle rolls the txn back.
      const paymentResult = await simulatePayment({
        phone: shipping.phone,
        method: payment.method,
      });
      if (!paymentResult.success) {
        // Note: this event row will roll back along with the order, by design.
        // We rely on server logs (the OrderError throw below logs the requestId)
        // for forensic data. See RESEARCH.md "No `failed` terminal state".
        await tx.insert(orderEvents).values({
          orderId: orderRow.id,
          type: 'payment_failed',
          metadata: { code: paymentResult.code, requestId },
        });
        throw new OrderError(
          'PAYMENT_DECLINED',
          `payment ${paymentResult.code}`,
          { code: paymentResult.code, requestId }
        );
      }

      // 11. Transition pending → confirmed (validated by the state machine).
      assertTransition('pending', 'confirmed');
      await tx
        .update(orders)
        .set({ status: 'confirmed', updatedAt: new Date() })
        .where(eq(orders.id, orderRow.id));
      await tx.insert(orderEvents).values({
        orderId: orderRow.id,
        type: 'confirmed',
        metadata: {
          fromStatus: 'pending',
          toStatus: 'confirmed',
          actor: 'system',
          requestId,
        },
      });

      // 12. Clear cart items only after payment is confirmed (UX-08).
      await tx.delete(cartItems).where(eq(cartItems.cartId, cart.id));
    });
  } catch (err) {
    // Concurrent idempotent submit: the racing winner committed the order while
    // this transaction rolled back. Fetch and return the winner as success —
    // the customer sees one order, charged once.
    if (err instanceof OrderError && err.code === 'DUPLICATE_SUBMIT') {
      const prior = await db.query.orders.findFirst({
        where: eq(orders.idempotencyKey, idempotencyKey),
        columns: { id: true, reference: true },
      });
      if (prior) {
        try {
          await grantOrderView(prior.reference);
        } catch {
          /* best-effort cookie grant */
        }
        return {
          ok: true,
          data: { reference: prior.reference, orderId: prior.id },
        };
      }
      // Winner not found (should never happen) — fall through to generic handling.
    }
    if (err instanceof OrderError) {
      console.error(
        `[submitCheckout][${requestId}] OrderError:`,
        err.code,
        err.details
      );
      return {
        ok: false,
        code: err.code,
        messageKey: errorMessageKey(err.code),
      };
    }
    console.error(`[submitCheckout][${requestId}] UNKNOWN:`, err);
    return {
      ok: false,
      code: 'UNKNOWN' as const,
      messageKey: 'Checkout.errors.unknown',
    };
  }

  // Post-commit side effects. Email failures must NOT roll back the order.
  // Authorize THIS browser to view the new order's confirmation page. Guests
  // have no account, so the httpOnly cookie is what binds confirmation viewing
  // to the session that placed the order (prevents reference-enumeration IDOR).
  try {
    await grantOrderView(createdReference);
  } catch (cookieErr) {
    console.error(
      `[submitCheckout][${requestId}] could not grant order-view for ${createdReference}`,
      cookieErr
    );
  }

  // CONTRACT: this block lives OUTSIDE the db.transaction(...) closure above —
  // the order is already committed by the time we get here.
  try {
    const persisted = await getOrderByReference(createdReference);
    if (persisted) {
      const result = await sendOrderConfirmed(persisted);
      if (!result.ok) {
        console.warn(
          `[submitCheckout][${requestId}] confirmation email returned ${result.code} for ${createdReference}`
        );
      }
    }
  } catch (emailErr) {
    console.error(
      `[submitCheckout][${requestId}] post-commit email error for ${createdReference}`,
      emailErr
    );
  }

  revalidatePath('/[locale]/checkout', 'page');
  revalidatePath('/[locale]/admin/orders', 'page');

  return {
    ok: true,
    data: { reference: createdReference, orderId: createdOrderId },
  };
}

/**
 * Public-reference lookup used by the customer confirmation page and admin
 * order-detail page. Returns null when the reference is not found.
 */
export async function getOrderByReference(
  reference: string
): Promise<Order | null> {
  const row = await db.query.orders.findFirst({
    where: eq(orders.reference, reference),
    with: {
      items: true,
      events: { orderBy: (e, { asc }) => [asc(e.createdAt)] },
    },
  });
  return row ? toOrder(row) : null;
}

/**
 * Internal-id lookup used by the post-commit email dispatch in
 * `transitionOrderStatus` (Plan 08-07). Mirrors `getOrderByReference` but keys
 * on `orders.id`. Returns null when the id is not found.
 */
export async function getOrderById(orderId: string): Promise<Order | null> {
  const row = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: {
      items: true,
      events: { orderBy: (e, { asc }) => [asc(e.createdAt)] },
    },
  });
  return row ? toOrder(row) : null;
}

/**
 * Phase 10 Plan 05 — per-user order history for /[locale]/account.
 *
 * Drizzle connects via the postgres-role connection string and BYPASSES RLS,
 * so the `userId` filter here is the ONLY enforcement of "users only see their
 * own orders" for this query path. RLS protects PostgREST consumers; the
 * cross-user-deny test (tests/rls/cross-user-deny.test.ts) proves the
 * PostgREST path is also locked down. Both paths exist by design — defence
 * in depth.
 *
 * Returns newest-first, paginated. Limit defaults to 20 per UI-SPEC.
 */
export async function getOrdersForUser(
  userId: string,
  opts: { limit?: number; offset?: number } = {}
): Promise<Order[]> {
  const limit = opts.limit ?? 20;
  const offset = opts.offset ?? 0;
  const rows = await db.query.orders.findMany({
    where: eq(orders.userId, userId),
    with: {
      items: true,
      events: { orderBy: (e, { asc }) => [asc(e.createdAt)] },
    },
    orderBy: (o, { desc: d }) => [d(o.placedAt)],
    limit,
    offset,
  });
  return rows.map(toOrder);
}

/**
 * Admin-list helper. Newest-placed first. Bounded by `limit` (default 200,
 * hard-capped at 500) so the admin list can't load the entire orders table
 * with all joins into memory as volume grows. Pagination UI can pass an offset
 * later; for now this is a defensive ceiling.
 */
export async function getAllOrders(limit = 200): Promise<Order[]> {
  const safeLimit = Math.min(Math.max(1, Math.floor(limit)), 500);
  const rows = await db.query.orders.findMany({
    with: {
      items: true,
      events: { orderBy: (e, { asc }) => [asc(e.createdAt)] },
    },
    orderBy: (o, { desc: d }) => [d(o.placedAt)],
    limit: safeLimit,
  });
  return rows.map(toOrder);
}

/**
 * Admin state-machine transition. Validates via canTransition, writes one
 * order_events row, and (only for pre-ship cancellations) restores stock by
 * adding each order item's quantity back into the matching productSizes row.
 *
 * Stock-restoration policy (CONTEXT.md "Order state machine"):
 *   pending → cancelled       → restore
 *   confirmed → cancelled     → restore
 *   shipped → cancelled       → DO NOT restore (goods in transit)
 *   * → refunded              → DO NOT restore (refund is bookkeeping)
 *
 * Email side effects are wired in Plan 08-07.
 */
export async function transitionOrderStatus(
  orderId: string,
  to: OrderStatus,
  opts: {
    actor?: string;
    trackingNumber?: string;
    reason?: string;
  } = {}
): Promise<ActionResult<null>> {
  // AUTHORIZATION NOTE: this is a privileged operation, but the auth gate lives
  // in the `'use server'` entry point (`transitionOrderAction` in
  // app/actions/orders.ts) — that is the only RPC-reachable boundary. Keeping
  // this lib function gate-free keeps it unit-testable in isolation.
  const requestId = newRequestId();
  let result: ActionResult<null>;
  try {
    result = await db.transaction(async (tx) => {
      const [current] = await tx
        .select()
        .from(orders)
        .where(eq(orders.id, orderId));
      if (!current) {
        return {
          ok: false as const,
          code: 'PRODUCT_NOT_FOUND' as const,
          messageKey: 'Checkout.errors.unknown',
        };
      }
      const fromStatus = current.status as OrderStatus;
      if (!canTransition(fromStatus, to)) {
        return {
          ok: false as const,
          code: 'VALIDATION' as const,
          messageKey: 'Checkout.errors.validation',
        };
      }

      // Stock-restoration on cancel: only for pre-ship cancellations.
      const restoreStock =
        to === 'cancelled' &&
        (fromStatus === 'pending' || fromStatus === 'confirmed');
      if (restoreStock) {
        const items = await tx
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, orderId));
        for (const it of items) {
          // Prefer the denormalized size_id (stable across label renames);
          // fall back to the (productId, sizeLabel) snapshot for legacy rows
          // written before size_id existed, or if the size was since deleted.
          const sized = it.sizeId
            ? await tx
                .select()
                .from(productSizes)
                .where(eq(productSizes.id, it.sizeId))
                .for('update')
            : it.productId
            ? await tx
                .select()
                .from(productSizes)
                .where(
                  and(
                    eq(productSizes.productId, it.productId),
                    eq(productSizes.label, it.sizeLabel)
                  )
                )
                .for('update')
            : // No sizeId and no productId (product was deleted) — nothing to
              // restore; its sizes were cascade-deleted with the product.
              [];
          const size = sized[0];
          if (size) {
            await tx
              .update(productSizes)
              .set({
                stock: sql`${productSizes.stock} + ${it.quantity}`,
              })
              .where(eq(productSizes.id, size.id));
          }
        }

        // Restored stock can bring a sold-out size/product back in stock —
        // re-enable any size that now has positive stock and recompute the
        // product flag (mirror of the checkout-decrement reconciliation).
        const restoredProductIds = [
          ...new Set(
            items
              .map((it) => it.productId)
              .filter((p): p is string => p !== null)
          ),
        ];
        for (const pid of restoredProductIds) {
          const sizes = await tx
            .select()
            .from(productSizes)
            .where(eq(productSizes.productId, pid));
          for (const s of sizes) {
            if (s.stock > 0 && !s.inStock) {
              await tx
                .update(productSizes)
                .set({ inStock: true })
                .where(eq(productSizes.id, s.id));
            }
          }
          const anyInStock = sizes.some((s) => s.stock > 0);
          await tx
            .update(products)
            .set({ inStock: anyInStock })
            .where(eq(products.id, pid));
        }
      }

      const updates: Record<string, unknown> = {
        status: to,
        updatedAt: new Date(),
      };
      if (to === 'shipped' && opts.trackingNumber) {
        updates.trackingNumber = opts.trackingNumber;
      }

      await tx.update(orders).set(updates).where(eq(orders.id, orderId));
      await tx.insert(orderEvents).values({
        orderId,
        type: to,
        metadata: {
          fromStatus,
          toStatus: to,
          actor: opts.actor ?? 'admin',
          reason: opts.reason,
          trackingNumber: opts.trackingNumber,
          stockRestored: restoreStock,
          requestId,
        },
      });

      revalidatePath('/[locale]/admin/orders', 'page');
      return { ok: true as const, data: null };
    });
  } catch (err) {
    console.error(
      `[transitionOrderStatus][${requestId}]`,
      orderId,
      to,
      err
    );
    return {
      ok: false,
      code: 'UNKNOWN',
      messageKey: 'Checkout.errors.unknown',
    };
  }

  // Post-commit email dispatch. Failures are logged, never re-thrown, and never
  // change the function's return value. Lives OUTSIDE the db.transaction(...)
  // closure above — only fires on a committed, successful transition.
  if (result.ok) {
    try {
      const persisted = await getOrderById(orderId);
      if (persisted) {
        let r: Awaited<ReturnType<typeof sendOrderShipped>> | undefined;
        if (to === 'shipped') r = await sendOrderShipped(persisted);
        else if (to === 'cancelled') r = await sendOrderCancelled(persisted);
        else if (to === 'refunded') r = await sendOrderRefunded(persisted);
        if (r && !r.ok) {
          console.warn(
            `[transitionOrderStatus][${requestId}] ${to} email returned ${r.code}`
          );
        }
      }
    } catch (emailErr) {
      console.error(
        `[transitionOrderStatus][${requestId}] post-commit email error`,
        emailErr
      );
    }
  }

  return result;
}

// ─── Row → Domain mapping ─────────────────────────────────────────────────────

interface OrderRowWithJoins {
  id: string;
  reference: string;
  userId: string | null;
  email: string;
  locale: string;
  status: string;
  subtotalCents: number;
  shippingCents: number;
  vatCents: number;
  totalCents: number;
  currency: string;
  shippingFirstName: string;
  shippingLastName: string;
  shippingPhone: string;
  shippingCity: string;
  shippingDistrict: string;
  shippingAddress: string;
  shippingApartment: string | null;
  paymentMethod: string;
  trackingNumber: string | null;
  placedAt: Date;
  updatedAt: Date;
  items?: Array<{
    id: string;
    productId: string | null;
    sizeLabel: string;
    productNameEn: string;
    productNameAr: string;
    unitPriceCents: number;
    quantity: number;
  }>;
  events?: Array<{
    id: string;
    type: string;
    metadata: unknown;
    createdAt: Date;
  }>;
}

function toOrder(row: OrderRowWithJoins): Order {
  return {
    id: row.id,
    reference: row.reference,
    userId: row.userId,
    email: row.email,
    locale: (row.locale as Locale) ?? 'en',
    status: row.status as OrderStatus,
    subtotalCents: row.subtotalCents,
    shippingCents: row.shippingCents,
    vatCents: row.vatCents,
    totalCents: row.totalCents,
    currency: 'SAR',
    shipping: {
      firstName: row.shippingFirstName,
      lastName: row.shippingLastName,
      phone: row.shippingPhone,
      city: row.shippingCity,
      district: row.shippingDistrict,
      address: row.shippingAddress,
      apartment: row.shippingApartment,
    },
    paymentMethod: row.paymentMethod,
    trackingNumber: row.trackingNumber,
    items: (row.items ?? []).map(
      (it): OrderItem => ({
        id: it.id,
        productId: it.productId,
        sizeLabel: it.sizeLabel,
        productName: { en: it.productNameEn, ar: it.productNameAr },
        unitPriceCents: it.unitPriceCents,
        quantity: it.quantity,
      })
    ),
    events: (row.events ?? []).map(
      (ev): OrderEvent => ({
        id: ev.id,
        type: ev.type,
        metadata: (ev.metadata as Record<string, unknown> | null) ?? null,
        createdAt: ev.createdAt,
      })
    ),
    placedAt: row.placedAt,
    updatedAt: row.updatedAt,
  };
}
