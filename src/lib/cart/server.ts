/**
 * Cart server-side data layer (Phase 8 Plan 02).
 *
 * Pure DB ops on a cart that has already been resolved to a concrete `cartId`.
 * Cookie / session resolution lives in `cart/session.ts` — Server Actions
 * compose the two; this file MUST stay request-context-free so a future
 * background job or admin tool can call into it with an explicit cartId.
 *
 * Mirrors `src/lib/products.ts` row→domain mapper conventions.
 */
import 'server-only';
import { db } from '@/lib/db/client';
import { cartItems, carts } from '@/lib/db/schema';
import { and, eq, sql } from 'drizzle-orm';
import { toProduct } from '@/lib/products';
import type { Cart, ServerCartItem, Locale } from '@/types/domain';

/**
 * Returns the full cart (with joined items + product snapshots), or null when
 * the cart row no longer exists.
 */
export async function getCart(cartId: string): Promise<Cart | null> {
  const cart = await db.query.carts.findFirst({
    where: eq(carts.id, cartId),
    with: {
      items: {
        with: {
          product: { with: { sizes: true, images: true } },
          size: true,
        },
      },
    },
  });
  if (!cart) return null;
  return toCart(cart);
}

/**
 * UPSERT an item onto the cart. Increments quantity on conflict via the
 * unique composite index (cartId, productId, sizeId).
 */
export async function addItemToCart(
  cartId: string,
  productId: string,
  sizeId: string,
  quantity: number
): Promise<void> {
  await db
    .insert(cartItems)
    .values({ cartId, productId, sizeId, quantity })
    .onConflictDoUpdate({
      target: [cartItems.cartId, cartItems.productId, cartItems.sizeId],
      set: { quantity: sql`${cartItems.quantity} + ${quantity}` },
    });
  await db
    .update(carts)
    .set({ updatedAt: new Date() })
    .where(eq(carts.id, cartId));
}

/**
 * Sets an absolute quantity for a cart item. quantity <= 0 deletes the row.
 */
export async function updateCartItemQuantity(
  cartId: string,
  cartItemId: string,
  quantity: number
): Promise<void> {
  if (quantity <= 0) {
    await db
      .delete(cartItems)
      .where(and(eq(cartItems.id, cartItemId), eq(cartItems.cartId, cartId)));
  } else {
    await db
      .update(cartItems)
      .set({ quantity })
      .where(and(eq(cartItems.id, cartItemId), eq(cartItems.cartId, cartId)));
  }
  await db
    .update(carts)
    .set({ updatedAt: new Date() })
    .where(eq(carts.id, cartId));
}

export async function removeCartItem(
  cartId: string,
  cartItemId: string
): Promise<void> {
  await db
    .delete(cartItems)
    .where(and(eq(cartItems.id, cartItemId), eq(cartItems.cartId, cartId)));
  await db
    .update(carts)
    .set({ updatedAt: new Date() })
    .where(eq(carts.id, cartId));
}

export async function clearCartItems(cartId: string): Promise<void> {
  await db.delete(cartItems).where(eq(cartItems.cartId, cartId));
  await db
    .update(carts)
    .set({ updatedAt: new Date() })
    .where(eq(carts.id, cartId));
}

// ─── Row → Domain mapping ─────────────────────────────────────────────────────

type CartItemWithJoins = {
  id: string;
  cartId: string;
  productId: string;
  sizeId: string;
  quantity: number;
  product: Parameters<typeof toProduct>[0];
  size: { label: string } | null;
};

type CartWithJoins = {
  id: string;
  sessionId: string;
  userId: string | null;
  locale: string;
  updatedAt: Date;
  items: CartItemWithJoins[];
};

function toCart(row: CartWithJoins): Cart {
  return {
    id: row.id,
    sessionId: row.sessionId,
    userId: row.userId,
    locale: (row.locale as Locale) ?? 'en',
    items: (row.items ?? []).map(
      (it): ServerCartItem => ({
        id: it.id,
        productId: it.productId,
        sizeId: it.sizeId,
        sizeLabel: it.size?.label ?? '',
        quantity: it.quantity,
        product: toProduct(it.product),
      })
    ),
    updatedAt: row.updatedAt,
  };
}
