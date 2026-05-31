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
import { cartItems, carts, productSizes } from '@/lib/db/schema';
import { and, eq, sql } from 'drizzle-orm';
import { toProduct } from '@/lib/products';
import type { Cart, ServerCartItem, Locale } from '@/types/domain';

/**
 * Typed cart-mutation failure so Server Actions can map it to a precise
 * client envelope (validation / product-not-found / insufficient-stock)
 * instead of collapsing everything to UNKNOWN.
 */
export class CartMutationError extends Error {
  constructor(
    public readonly code: 'VALIDATION' | 'PRODUCT_NOT_FOUND' | 'INSUFFICIENT_STOCK'
  ) {
    super(code);
    this.name = 'CartMutationError';
  }
}

/** Largest quantity a single cart line may hold, independent of stock. */
const MAX_LINE_QUANTITY = 99;

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
 *
 * Validates that `quantity` is a positive integer and caps the resulting line
 * quantity at the size's available stock (and a hard MAX_LINE_QUANTITY). The
 * cap is also enforced in SQL (LEAST) so the increment-on-conflict path can't
 * exceed stock either. Final authoritative stock is still re-checked under a
 * row lock at checkout — this is a cart-side guard against unbounded growth.
 */
export async function addItemToCart(
  cartId: string,
  productId: string,
  sizeId: string,
  quantity: number
): Promise<void> {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new CartMutationError('VALIDATION');
  }

  const size = await db.query.productSizes.findFirst({
    where: and(eq(productSizes.id, sizeId), eq(productSizes.productId, productId)),
  });
  if (!size) throw new CartMutationError('PRODUCT_NOT_FOUND');

  const available = Math.min(size.stock ?? 0, MAX_LINE_QUANTITY);
  if (available < 1) throw new CartMutationError('INSUFFICIENT_STOCK');

  const insertQty = Math.min(quantity, available);
  await db
    .insert(cartItems)
    .values({ cartId, productId, sizeId, quantity: insertQty })
    .onConflictDoUpdate({
      target: [cartItems.cartId, cartItems.productId, cartItems.sizeId],
      // Cap the incremented quantity at available stock.
      set: { quantity: sql`LEAST(${cartItems.quantity} + ${quantity}, ${available})` },
    });
  await db
    .update(carts)
    .set({ updatedAt: new Date() })
    .where(eq(carts.id, cartId));
}

/**
 * Sets an absolute quantity for a cart item. A non-positive (or non-integer
 * <= 0) quantity deletes the row; otherwise the value is validated as a
 * positive integer and capped at the size's available stock (and
 * MAX_LINE_QUANTITY).
 */
export async function updateCartItemQuantity(
  cartId: string,
  cartItemId: string,
  quantity: number
): Promise<void> {
  if (!Number.isInteger(quantity)) throw new CartMutationError('VALIDATION');

  if (quantity <= 0) {
    await db
      .delete(cartItems)
      .where(and(eq(cartItems.id, cartItemId), eq(cartItems.cartId, cartId)));
  } else {
    const item = await db.query.cartItems.findFirst({
      where: and(eq(cartItems.id, cartItemId), eq(cartItems.cartId, cartId)),
      with: { size: true },
    });
    if (!item) throw new CartMutationError('PRODUCT_NOT_FOUND');

    const available = Math.min(item.size?.stock ?? 0, MAX_LINE_QUANTITY);
    if (available < 1) throw new CartMutationError('INSUFFICIENT_STOCK');

    const capped = Math.min(quantity, available);
    await db
      .update(cartItems)
      .set({ quantity: capped })
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
