import 'server-only';
/**
 * One-shot guest-cart merge on first authenticated request.
 *
 * Phase 10 Plan 05 — Wave 2.
 *
 * Semantics (CONTEXT.md §"Guest cart merge behavior"):
 *  - If user has no server cart → claim the guest cart by setting userId = userId.
 *  - If user already has a server cart → union the guest cart's items into the
 *    user cart (upsert with onConflictDoUpdate summing quantity on the
 *    (cartId, productId, sizeId) unique index, mirroring addItemToCart in
 *    server.ts:42-59), then delete the now-empty guest cart row.
 *
 * Race-safety (RESEARCH §7 #9): wrapped in db.transaction with SELECT ... FOR
 * UPDATE on the user's cart row. Two simultaneous tabs both calling this
 * function for the same user will see one of two states post-acquisition:
 *   1. No user cart yet → first tab claims the guest cart; second tab sees the
 *      guest cart already userId-bound (or absent) and the WHERE userId IS NULL
 *      guard makes the second UPDATE a no-op.
 *   2. User cart present → both tabs proceed to the union branch; the second
 *      tab will find the guest cart already gone and return early (no-op).
 *
 * Idempotent. Never throws raw — all errors are swallowed via the
 * migrateLocalCartAction precedent (src/app/actions/cart.ts:96-112). Auth flow
 * must NEVER break on merge failure (T-10-05-03 mitigation acceptance criterion).
 */
import { and, eq, isNull, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { carts, cartItems } from '@/lib/db/schema';

export async function mergeGuestCartIntoUserCart(
  userId: string,
  sessionId: string | null | undefined,
): Promise<void> {
  if (!sessionId) return;
  try {
    await db.transaction(async (tx) => {
      // 1. Lock the user's existing cart row (if any) for the duration of the
      //    transaction. Phase-8 precedent: src/lib/orders/server.ts uses
      //    `.for('update')` on the productSizes rows during submitCheckout.
      const userCart = await tx
        .select()
        .from(carts)
        .where(eq(carts.userId, userId))
        .for('update');

      if (userCart.length > 0) {
        const userCartId = userCart[0].id;

        // Resolve the guest cart row (sessionId + NULL userId guard).
        // If a concurrent tab already claimed it, this is a no-op.
        const guestCart = await tx
          .select()
          .from(carts)
          .where(and(eq(carts.sessionId, sessionId), isNull(carts.userId)));
        if (guestCart.length === 0) return; // already merged / no guest cart

        // Load all items from the guest cart.
        const guestItems = await tx
          .select()
          .from(cartItems)
          .where(eq(cartItems.cartId, guestCart[0].id));

        // Upsert each guest item into the user cart, summing quantities on
        // conflict (cartId, productId, sizeId) — mirrors addItemToCart in
        // src/lib/cart/server.ts:42-59.
        for (const item of guestItems) {
          await tx
            .insert(cartItems)
            .values({
              cartId: userCartId,
              productId: item.productId,
              sizeId: item.sizeId,
              quantity: item.quantity,
            })
            .onConflictDoUpdate({
              target: [cartItems.cartId, cartItems.productId, cartItems.sizeId],
              set: { quantity: sql`${cartItems.quantity} + ${item.quantity}` },
            });
        }

        // Bump the user cart's updatedAt timestamp.
        await tx
          .update(carts)
          .set({ updatedAt: sql`now()` })
          .where(eq(carts.id, userCartId));

        // Delete the now-empty guest cart row.
        // Guest items were already moved above; the CASCADE only removes any
        // remaining (already-unioned) guest items, which is harmless.
        await tx
          .delete(carts)
          .where(
            and(eq(carts.sessionId, sessionId), isNull(carts.userId)),
          );
        return;
      }

      // 2. No user cart → claim the guest cart by assigning userId.
      //    The NULL-userId guard prevents a second tab from re-claiming a row
      //    another tab already updated.
      await tx
        .update(carts)
        .set({ userId, updatedAt: sql`now()` })
        .where(
          and(eq(carts.sessionId, sessionId), isNull(carts.userId)),
        );
    });
  } catch (err) {
    console.error('[mergeGuestCartIntoUserCart]', err);
    // Never throw — auth flow must not break on merge failure.
  }
}
