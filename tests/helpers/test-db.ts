/**
 * Live-DB test helpers (Phase 8 Plan 09).
 *
 * The integration suite runs against the project's real Drizzle `db` singleton
 * — there is no separate test database this phase. Helpers here keep the
 * fixture footprint small (a single seeded test product per file) and clean up
 * Phase-8-owned tables between tests so re-runs don't pollute the live DB.
 *
 * Tests gated on `hasDbUrl` skip themselves when no DATABASE_URL/STORAGE_URL
 * is available (e.g. CI without DB credentials).
 */
import { db } from '@/lib/db/client';
import { sql } from 'drizzle-orm';

/**
 * Truncates every Phase-8-owned table. products + product_sizes + product_images
 * are NOT truncated — factories control the test fixture explicitly so unrelated
 * production seed data is not destroyed.
 *
 * Order matters because of FK cascades; CASCADE ensures rows referencing the
 * truncated tables are also removed.
 */
export async function cleanPhase8Tables(): Promise<void> {
  await db.execute(
    sql`TRUNCATE TABLE order_events, order_items, orders, cart_items, carts CASCADE`
  );
}

/**
 * Resets the stock value on a single product_sizes row. Used between concurrent
 * checkout iterations where a previous test consumed the unit.
 */
export async function resetSizeStock(
  sizeId: string,
  stock: number
): Promise<void> {
  await db.execute(
    sql`UPDATE product_sizes SET stock = ${stock}, in_stock = ${stock > 0} WHERE id = ${sizeId}`
  );
}

/**
 * Removes a seeded test product (and its sizes/images via cascade). Used in
 * afterAll to keep the live DB tidy across re-runs.
 */
export async function deleteTestProduct(productId: string): Promise<void> {
  await db.execute(sql`DELETE FROM products WHERE id = ${productId}`);
}

/** True when DATABASE_URL or STORAGE_URL is present — gates DB integration tests. */
export const hasDbUrl = Boolean(
  process.env.DATABASE_URL || process.env.STORAGE_URL
);
