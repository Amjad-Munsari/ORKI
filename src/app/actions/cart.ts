'use server';

/**
 * Cart Server Actions (Phase 8 Plan 02).
 *
 * Each action:
 *  1. Resolves the active cart via `getOrCreateCart()` (mints orki_sid cookie
 *     on first call — Server Action context allows cookie writes).
 *  2. Mutates via `cart/server.ts` helpers.
 *  3. Returns the fresh `Cart` snapshot wrapped in the canonical envelope so
 *     the client can replace its Zustand state without a separate fetch.
 *  4. Errors are logged with stack and surfaced as
 *     `{ ok: false, code: 'UNKNOWN', messageKey: 'Checkout.errors.unknown' }`.
 *     Raw errors NEVER cross the wire.
 */
import { revalidatePath } from 'next/cache';
import type { Cart, Locale } from '@/types/domain';
import { getOrCreateCart } from '@/lib/cart/session';
import {
  getCart,
  addItemToCart,
  updateCartItemQuantity,
  removeCartItem,
} from '@/lib/cart/server';
import {
  migrateLocalStorageCart,
  type LegacyCartItem,
} from '@/lib/cart/migrate';

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | {
      ok: false;
      code: 'INSUFFICIENT_STOCK' | 'PRODUCT_NOT_FOUND' | 'VALIDATION' | 'UNKNOWN';
      fields?: Record<string, string>;
      messageKey: string;
    };

export async function addToCartAction(
  productId: string,
  sizeId: string,
  quantity: number = 1
): Promise<ActionResult<Cart>> {
  try {
    const session = await getOrCreateCart();
    await addItemToCart(session.id, productId, sizeId, quantity);
    const cart = await getCart(session.id);
    if (!cart) return { ok: false, code: 'UNKNOWN', messageKey: 'Checkout.errors.unknown' };
    revalidatePath('/[locale]/checkout', 'page');
    return { ok: true, data: cart };
  } catch (err) {
    console.error('[addToCartAction]', err);
    return { ok: false, code: 'UNKNOWN', messageKey: 'Checkout.errors.unknown' };
  }
}

export async function updateQtyAction(
  cartItemId: string,
  quantity: number
): Promise<ActionResult<Cart>> {
  try {
    const session = await getOrCreateCart();
    await updateCartItemQuantity(session.id, cartItemId, quantity);
    const cart = await getCart(session.id);
    if (!cart) return { ok: false, code: 'UNKNOWN', messageKey: 'Checkout.errors.unknown' };
    revalidatePath('/[locale]/checkout', 'page');
    return { ok: true, data: cart };
  } catch (err) {
    console.error('[updateQtyAction]', err);
    return { ok: false, code: 'UNKNOWN', messageKey: 'Checkout.errors.unknown' };
  }
}

export async function removeItemAction(
  cartItemId: string
): Promise<ActionResult<Cart>> {
  try {
    const session = await getOrCreateCart();
    await removeCartItem(session.id, cartItemId);
    const cart = await getCart(session.id);
    if (!cart) return { ok: false, code: 'UNKNOWN', messageKey: 'Checkout.errors.unknown' };
    revalidatePath('/[locale]/checkout', 'page');
    return { ok: true, data: cart };
  } catch (err) {
    console.error('[removeItemAction]', err);
    return { ok: false, code: 'UNKNOWN', messageKey: 'Checkout.errors.unknown' };
  }
}

/**
 * One-shot migration: receives the parsed Phase 3 localStorage payload and
 * folds it into the DB cart, then returns the merged snapshot. Called
 * exactly once on the client when an `orki-cart` localStorage entry is
 * still present at hydration time.
 */
export async function migrateLocalCartAction(
  items: LegacyCartItem[],
  locale?: Locale
): Promise<ActionResult<Cart>> {
  try {
    const session = await getOrCreateCart(locale);
    if (items.length > 0) {
      await migrateLocalStorageCart(session.id, items);
    }
    const cart = await getCart(session.id);
    if (!cart) return { ok: false, code: 'UNKNOWN', messageKey: 'Checkout.errors.unknown' };
    return { ok: true, data: cart };
  } catch (err) {
    console.error('[migrateLocalCartAction]', err);
    return { ok: false, code: 'UNKNOWN', messageKey: 'Checkout.errors.unknown' };
  }
}
