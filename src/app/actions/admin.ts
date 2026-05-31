'use server';

import { db } from '@/lib/db/client';
import { products, productSizes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/require-admin';
import { writeAuthEvent } from '@/lib/auth/audit';

/**
 * Toggles the overall stock status of a product.
 * In a real app, this might also affect size availability.
 */
export async function toggleProductStock(productId: string, inStock: boolean) {
  const admin = await requireAdmin('toggleProductStock');

  await db
    .update(products)
    .set({
      inStock,
      updatedAt: new Date()
    })
    .where(eq(products.id, productId));

  await writeAuthEvent({
    type: 'admin_action',
    userId: admin.id,
    email: admin.email,
    metadata: { action: 'toggleProductStock', productId, inStock },
  });

  revalidatePath('/[locale]/admin/inventory', 'page');
  revalidatePath('/[locale]/shop', 'page');
  revalidatePath('/[locale]/shop/[category]', 'page');
  revalidatePath('/[locale]/shop/[category]/[slug]', 'page');
  revalidatePath('/', 'layout');
}

/**
 * Updates basic product details.
 */
export async function updateProductDetails(
  productId: string,
  data: {
    nameEn: string;
    nameAr: string;
    descriptionEn: string;
    descriptionAr: string;
    price: number;
    category: string;
  }
) {
  const admin = await requireAdmin('updateProductDetails');

  // Domain-contract sanity: price is whole-SAR non-negative, category is constrained.
  if (!Number.isInteger(data.price) || data.price < 0) {
    throw new Error('price must be a non-negative integer (whole SAR)');
  }
  if (data.category !== 'tops' && data.category !== 'bottoms') {
    throw new Error(`invalid category: ${data.category}`);
  }

  await db
    .update(products)
    .set({
      ...data,
      updatedAt: new Date()
    })
    .where(eq(products.id, productId));

  await writeAuthEvent({
    type: 'admin_action',
    userId: admin.id,
    email: admin.email,
    metadata: {
      action: 'updateProductDetails',
      productId,
      price: data.price,
      category: data.category,
    },
  });

  revalidatePath('/[locale]/admin/inventory', 'page');
  revalidatePath('/[locale]/shop', 'page');
  revalidatePath('/[locale]/shop/[category]', 'page');
  revalidatePath('/[locale]/shop/[category]/[slug]', 'page');
}

/**
 * Updates inventory for a specific size (stock and status).
 */
export async function updateSizeInventory(
  sizeId: string,
  data: { stock?: number; inStock?: boolean }
) {
  const admin = await requireAdmin('updateSizeInventory');

  if (typeof data.stock === 'number' && (!Number.isInteger(data.stock) || data.stock < 0)) {
    throw new Error('stock must be a non-negative integer');
  }

  // If stock is provided and is 0, auto-set inStock to false
  const updateData: Partial<{ stock: number; inStock: boolean }> = { ...data };
  if (typeof data.stock === 'number' && data.stock === 0) {
    updateData.inStock = false;
  } else if (typeof data.stock === 'number' && data.stock > 0 && data.inStock === undefined) {
    // If stock > 0 and inStock not explicitly changed, ensure it's true
    updateData.inStock = true;
  }

  await db
    .update(productSizes)
    .set(updateData)
    .where(eq(productSizes.id, sizeId));

  // Find the product to revalidate all its related pages
  const size = await db.query.productSizes.findFirst({
    where: eq(productSizes.id, sizeId),
    with: {
      product: true
    }
  });

  if (size?.product) {
    // Also update the product's top-level inStock status if needed
    // (If any size is in stock, the product is in stock)
    const allSizes = await db
      .select()
      .from(productSizes)
      .where(eq(productSizes.productId, size.product.id));
    
    const anyInStock = allSizes.some(s => s.inStock && s.stock > 0);
    
    await db
      .update(products)
      .set({ inStock: anyInStock })
      .where(eq(products.id, size.product.id));

    // Revalidate storefront pages
    revalidatePath('/[locale]/shop', 'page');
    revalidatePath('/[locale]/shop/[category]', 'page');
    revalidatePath(`/[locale]/shop/${size.product.category}/${size.product.slug}`, 'page');
  }

  await writeAuthEvent({
    type: 'admin_action',
    userId: admin.id,
    email: admin.email,
    metadata: {
      action: 'updateSizeInventory',
      sizeId,
      stock: data.stock,
      inStock: updateData.inStock,
    },
  });

  revalidatePath('/[locale]/admin/inventory', 'page');
}
