import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { products, productSizes, productImages } from '@/lib/db/schema';
import { requireAdmin, AdminAuthError } from '@/lib/auth/require-admin';
import { seedData } from '../../../../scripts/seed-data';

export async function POST(request: Request) {
  // AUTHORIZATION: this route writes (and with ?force=1 destructively wipes) the
  // product catalog. The middleware matcher excludes /api, so it is otherwise
  // wholly ungated. Require an authenticated admin in EVERY environment — the
  // prior NODE_ENV==='production' gate left preview/dev deployments open to an
  // unauthenticated catalog wipe. Local seeding should use `npm run db:seed`
  // (scripts/seed.ts), which bypasses this route entirely.
  //
  // This is a POST (not GET) so it cannot be triggered by prefetch, crawlers,
  // or a CSRF <img>/<link> tag.
  try {
    await requireAdmin('seed');
  } catch (authErr) {
    const status = authErr instanceof AdminAuthError ? 403 : 401;
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status });
  }

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
    // Log full internals server-side for forensics; NEVER leak DB error
    // detail/hint/stack in the HTTP response.
    const e = err as { message?: string; cause?: unknown; stack?: string };
    console.error('Seed error:', {
      message: e.message ?? String(err),
      cause: e.cause,
      stack: e.stack?.split('\n').slice(0, 5),
    });
    return NextResponse.json(
      { ok: false, error: 'Seeding failed. Check server logs.' },
      { status: 500 }
    );
  }
}
