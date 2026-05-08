import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { products, productSizes, productImages } from '@/lib/db/schema';
import { seedData } from '../../../../scripts/seed-data';

export async function GET() {
  try {
    const existing = await db.select().from(products).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ ok: true, message: 'Already seeded — skipped.' });
    }

    for (const product of seedData) {
      await db.insert(products).values({
        id: product.id,
        slug: product.slug,
        nameEn: product.name.en,
        nameAr: product.name.ar,
        descriptionEn: product.description.en,
        descriptionAr: product.description.ar,
        category: product.category,
        price: product.price,
        currency: product.currency,
        inStock: product.inStock,
      });

      for (const size of product.sizes) {
        await db.insert(productSizes).values({
          productId: product.id,
          label: size.label,
          stock: size.stock,
          inStock: size.inStock,
        });
      }

      for (let i = 0; i < product.images.length; i++) {
        await db.insert(productImages).values({
          productId: product.id,
          url: product.images[i],
          sortOrder: i,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      message: `Seeded ${seedData.length} products.`,
    });
  } catch (err) {
    console.error('Seed error:', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
