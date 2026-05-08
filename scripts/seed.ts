/**
 * Database seed script — populates orki_dev with the 6 existing static products.
 * Source of truth: src/data/products.ts
 *
 * Run: npm run db:seed
 * Safe to run multiple times — deletes existing data before inserting (idempotent).
 *
 * IMPORTANT: Requires DATABASE_URL in .env.local and Docker container running.
 */
import { config } from 'dotenv';
config({ path: '.env.local' });
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../src/lib/db/schema';
import { seedData } from './seed-data';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set. Check your .env.local file.');
  process.exit(1);
}

const conn = postgres(DATABASE_URL, { max: 1 });
const db = drizzle(conn, { schema });

async function seed() {
  console.log('🌱 Seeding ORKI database...');

  // Clear existing data in correct FK order (images → sizes → products)
  console.log('  Clearing existing data...');
  await db.delete(schema.productImages);
  await db.delete(schema.productSizes);
  await db.delete(schema.products);

  // Insert products
  console.log(`  Inserting ${seedData.length} products...`);
  for (const product of seedData) {
    // Insert product row
    await db.insert(schema.products).values({
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

    // Insert sizes
    for (const size of product.sizes) {
      await db.insert(schema.productSizes).values({
        productId: product.id,
        label: size.label,
        stock: size.stock,
        inStock: size.inStock,
      });
    }

    // Insert images
    for (let i = 0; i < product.images.length; i++) {
      await db.insert(schema.productImages).values({
        productId: product.id,
        url: product.images[i],
        sortOrder: i,
      });
    }

    console.log(`  ✓ ${product.name.en}`);
  }

  console.log('✅ Seed complete!');
  console.log(`   Products: ${seedData.length}`);
  console.log(`   Sizes: ${seedData.reduce((acc, p) => acc + p.sizes.length, 0)}`);
  console.log(`   Images: ${seedData.reduce((acc, p) => acc + p.images.length, 0)}`);

  await conn.end();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
