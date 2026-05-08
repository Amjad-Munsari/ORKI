import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { products, productSizes, productImages } from '@/lib/db/schema';
import { seedData } from '../../../../scripts/seed-data';

export async function GET(request: Request) {
  try {
    const force = new URL(request.url).searchParams.get('force') === '1';

    if (force) {
      // Cascade deletes via FK rules clear sizes + images automatically.
      await db.delete(products);
    } else {
      const existing = await db.select().from(products).limit(1);
      if (existing.length > 0) {
        return NextResponse.json({
          ok: true,
          message: 'Already seeded — skipped. Append ?force=1 to wipe and re-seed.',
        });
      }
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
    const e = err as { message?: string; cause?: unknown; stack?: string };
    const cause = e.cause as { message?: string; code?: string; detail?: string; severity?: string; hint?: string } | undefined;
    const payload = {
      ok: false,
      error: e.message ?? String(err),
      cause: cause
        ? {
            message: cause.message,
            code: cause.code,
            detail: cause.detail,
            severity: cause.severity,
            hint: cause.hint,
          }
        : null,
      stack: e.stack?.split('\n').slice(0, 5),
    };
    console.error('Seed error:', JSON.stringify(payload, null, 2));
    return NextResponse.json(payload, { status: 500 });
  }
}
