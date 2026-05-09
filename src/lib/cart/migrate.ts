/**
 * One-shot migration: localStorage cart (Phase 3 Zustand persist payload) →
 * DB-backed cart. Called from `migrateLocalCartAction` exactly once on
 * client mount when an `orki-cart` localStorage key still exists.
 *
 * Resolves each (productId, selectedSize-label) → sizeId via productSizes.
 * Items whose product or size no longer exist are silently skipped — the
 * old localStorage payload may reference SKUs we have since deleted.
 */
import 'server-only';
import { db } from '@/lib/db/client';
import { cartItems, productSizes } from '@/lib/db/schema';
import { and, eq, sql } from 'drizzle-orm';

export interface LegacyCartItem {
  productId: string;
  selectedSize: string; // size label, e.g. 'M'
  quantity: number;
}

export async function migrateLocalStorageCart(
  cartId: string,
  legacy: LegacyCartItem[]
): Promise<{ migrated: number; skipped: number }> {
  let migrated = 0;
  let skipped = 0;

  for (const li of legacy) {
    if (!li.productId || !li.selectedSize || !(li.quantity > 0)) {
      skipped++;
      continue;
    }
    const size = await db.query.productSizes.findFirst({
      where: and(
        eq(productSizes.productId, li.productId),
        eq(productSizes.label, li.selectedSize)
      ),
    });
    if (!size) {
      skipped++;
      continue;
    }
    await db
      .insert(cartItems)
      .values({
        cartId,
        productId: li.productId,
        sizeId: size.id,
        quantity: li.quantity,
      })
      .onConflictDoUpdate({
        target: [cartItems.cartId, cartItems.productId, cartItems.sizeId],
        set: { quantity: sql`${cartItems.quantity} + ${li.quantity}` },
      });
    migrated++;
  }

  return { migrated, skipped };
}
