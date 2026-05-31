/**
 * One-off applicator for Phase 11 DB invariants (whole-codebase-review batch).
 *
 * Adds belt-and-suspenders constraints the application already enforces in
 * code, so the database itself rejects bad data:
 *   - products: price >= 0, category in (tops|bottoms), currency = SAR
 *   - product_sizes: stock >= 0, UNIQUE(product_id, label)
 *   - cart_items / order_items: quantity > 0
 *   - carts / orders: locale in (en|ar); orders currency = SAR
 *
 * Does NOT touch the hand-authored auth FKs (carts/orders.user_id) or RLS —
 * those live outside schema.ts (see 0002 NOTES). CHECK constraints are added
 * NOT VALID (enforced on all future writes; existing rows not re-scanned) so
 * the script is safe to run against any state. Every statement is idempotent.
 *
 * Run: npx tsx scripts/apply-11-constraints.ts
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

import postgres from 'postgres';

const url = process.env.DATABASE_URL ?? process.env.STORAGE_URL;
if (!url) {
  console.error('DATABASE_URL / STORAGE_URL missing');
  process.exit(1);
}

const sql = postgres(url, { prepare: false, max: 1, ssl: 'require' });

// Each CHECK is wrapped so a re-run (constraint already present) is a no-op.
function addCheck(table: string, name: string, expr: string): string {
  return `DO $$ BEGIN
    ALTER TABLE public.${table} ADD CONSTRAINT ${name} CHECK (${expr}) NOT VALID;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;`;
}

const statements: string[] = [
  addCheck('products', 'products_price_nonneg', 'price >= 0'),
  addCheck('products', 'products_category_valid', "category in ('tops', 'bottoms')"),
  addCheck('products', 'products_currency_valid', "currency = 'SAR'"),
  `CREATE UNIQUE INDEX IF NOT EXISTS product_sizes_product_label_unq ON public.product_sizes (product_id, label);`,
  addCheck('product_sizes', 'product_sizes_stock_nonneg', 'stock >= 0'),
  addCheck('cart_items', 'cart_items_quantity_positive', 'quantity > 0'),
  addCheck('carts', 'carts_locale_valid', "locale in ('en', 'ar')"),
  addCheck('orders', 'orders_currency_valid', "currency = 'SAR'"),
  addCheck('orders', 'orders_locale_valid', "locale in ('en', 'ar')"),
  addCheck('order_items', 'order_items_quantity_positive', 'quantity > 0'),
];

async function main() {
  console.log(`[apply-11-constraints] applying ${statements.length} statements…`);
  for (const stmt of statements) {
    const label = stmt.split('\n')[0].slice(0, 80);
    await sql.unsafe(stmt);
    console.log(`  ✓ ${label}`);
  }
  console.log('[apply-11-constraints] done.');
  await sql.end();
}

main().catch(async (err) => {
  console.error('[apply-11-constraints] FAILED:', err);
  await sql.end();
  process.exit(1);
});
