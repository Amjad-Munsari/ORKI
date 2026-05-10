/**
 * One-off migration applicator for Plan 10-02.
 *
 * `npm run db:migrate` tries to apply 0000+0001 from scratch because the
 * `drizzle.__drizzle_migrations` tracking table is empty (the schema was
 * originally bootstrapped via `db:push`, which doesn't write to that table).
 *
 * Per Plan 10-02 Task 2.4 fallback: apply the SQL directly via the postgres
 * driver, then register all three migrations in __drizzle_migrations so
 * future `db:migrate` runs skip them.
 *
 * Delete this script after Plan 10-02 lands (it's a one-off bridge).
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

import postgres from 'postgres';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const url = process.env.DATABASE_URL!;
if (!url) {
  console.error('DATABASE_URL missing');
  process.exit(1);
}

const sql = postgres(url, { prepare: false, max: 1 });

function fileHash(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

async function main() {
  console.log('→ Reading 0002_phase10_auth_fk_and_rls.sql');
  const migrationSqlRaw = readFileSync(
    'src/lib/db/migrations/0002_phase10_auth_fk_and_rls.sql',
    'utf8'
  );

  // Split on drizzle's statement-breakpoint marker, like drizzle-orm's
  // migrate() internal does.
  const statements = migrationSqlRaw
    .split('--> statement-breakpoint')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  console.log(`→ ${statements.length} statements to apply.`);

  // Ensure the drizzle bookkeeping table exists.
  await sql.unsafe(`
    CREATE SCHEMA IF NOT EXISTS drizzle;
    CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    );
  `);

  // Check whether 0002 was already applied (idempotency).
  const existing = await sql<{ hash: string }[]>`
    SELECT hash FROM drizzle.__drizzle_migrations
    WHERE hash = ${fileHash('src/lib/db/migrations/0002_phase10_auth_fk_and_rls.sql')}
  `;
  if (existing.length > 0) {
    console.log('→ 0002 already applied (hash matches). Skipping body.');
    await sql.end();
    return;
  }

  // Apply each statement inside a transaction so half-applied state is impossible.
  console.log('→ Applying migration in a single transaction…');
  await sql.begin(async (tx) => {
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      const preview = stmt.split('\n')[0].slice(0, 80);
      process.stdout.write(`  [${i + 1}/${statements.length}] ${preview}…`);
      try {
        await tx.unsafe(stmt);
        process.stdout.write(' ok\n');
      } catch (e: any) {
        process.stdout.write(' FAIL\n');
        throw new Error(`stmt #${i + 1} failed: ${e.message}\n--- SQL ---\n${stmt}`);
      }
    }

    // Backfill all three migration hashes so future db:migrate is a no-op.
    const migrations = [
      ['0000_furry_ink', 'src/lib/db/migrations/0000_furry_ink.sql', 1778245645896],
      ['0001_phase8_cart_orders', 'src/lib/db/migrations/0001_phase8_cart_orders.sql', 1778361000149],
      ['0002_phase10_auth_fk_and_rls', 'src/lib/db/migrations/0002_phase10_auth_fk_and_rls.sql', 1778803200000],
    ] as const;

    for (const [tag, path, when] of migrations) {
      const h = fileHash(path);
      // INSERT only if not already present (0000/0001 may or may not be there).
      await tx.unsafe(
        `INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
         SELECT $1, $2
         WHERE NOT EXISTS (SELECT 1 FROM drizzle.__drizzle_migrations WHERE hash = $1)`,
        [h, when]
      );
      console.log(`  ✓ registered ${tag} (hash=${h.slice(0, 12)}…)`);
    }
  });

  console.log('→ All statements applied + journal backfilled.');
  await sql.end();
}

main().catch((e) => {
  console.error('\n❌ MIGRATION FAILED:', e.message || e);
  process.exit(1);
});
