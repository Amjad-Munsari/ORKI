/**
 * ⚠ SUPERSEDED by migration 0003_phase11_sizeid_and_constraints.sql — these
 * statements now live in the Drizzle journal and apply via `npm run db:migrate`.
 * Kept only for historical reference (Phase 11 planning docs link here). Prefer
 * db:migrate; running this directly is harmless (idempotent) but unnecessary.
 *
 * One-off applicator for Phase 11 order_items.size_id (review batch 2/2).
 *
 * Adds a nullable size_id FK to order_items so stock restoration on cancel can
 * match the exact size row (stable across label renames) instead of the
 * fragile (product_id, size_label) snapshot. ON DELETE SET NULL keeps the
 * historical order line if a size is later deleted. Existing rows are
 * backfilled by (product_id, label). Idempotent.
 *
 * Run: npx tsx scripts/apply-11-order-sizeid.ts
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

const statements: string[] = [
  `ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS size_id uuid;`,
  `DO $$ BEGIN
     ALTER TABLE public.order_items ADD CONSTRAINT order_items_size_id_fk
       FOREIGN KEY (size_id) REFERENCES public.product_sizes(id) ON DELETE SET NULL;
   EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `CREATE INDEX IF NOT EXISTS order_items_size_id_idx ON public.order_items (size_id);`,
  `UPDATE public.order_items oi
     SET size_id = ps.id
     FROM public.product_sizes ps
     WHERE oi.size_id IS NULL
       AND ps.product_id = oi.product_id
       AND ps.label = oi.size_label;`,
];

async function main() {
  console.log(`[apply-11-order-sizeid] applying ${statements.length} statements…`);
  for (const stmt of statements) {
    const label = stmt.split('\n')[0].slice(0, 80);
    const res = await sql.unsafe(stmt);
    const note = stmt.startsWith('UPDATE') ? ` (backfilled ${res.count} rows)` : '';
    console.log(`  ✓ ${label}${note}`);
  }
  console.log('[apply-11-order-sizeid] done.');
  await sql.end();
}

main().catch(async (err) => {
  console.error('[apply-11-order-sizeid] FAILED:', err);
  await sql.end();
  process.exit(1);
});
