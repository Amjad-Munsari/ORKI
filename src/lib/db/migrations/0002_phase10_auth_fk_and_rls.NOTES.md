# 0002_phase10_auth_fk_and_rls — Idempotency notes

**Status:** Applied to production Supabase on **2026-05-10** via the Drizzle migration runner. The journal hash is recorded in `meta/_journal.json` and verified by `scripts/apply-10-02-migration.ts`.

**Do not rewrite the `.sql` file body.** Doing so changes the file hash and will cause the runner to re-attempt application (most statements below fail on re-run, breaking the DB schema mid-flight).

## WR-07 (Phase 10 review)

The reviewer correctly noted that most statements in this migration are NOT idempotent. The hash-check in `scripts/apply-10-02-migration.ts` is the primary protection against re-application, but if a future operator reaches for this file directly (via `psql`, the Supabase migration UI, or a CI pipeline that bypasses the Drizzle journal), they will encounter "already exists" errors mid-application with no rollback unless they wrap the whole thing in a transaction manually.

## Re-application checklist (fresh DB only)

If you need to re-apply this migration against a clean database (local dev reset, CI integration database, disaster-recovery rebuild), use a **copy** of the SQL file with the following changes — do not edit the original.

| Statement | Idempotency status | Remediation |
|-----------|-------------------|-------------|
| `DROP INDEX IF EXISTS carts_user_id_idx` | ✓ already idempotent | none |
| `DROP INDEX IF EXISTS orders_user_id_idx` | ✓ already idempotent | none |
| `ALTER TABLE public.carts ALTER COLUMN user_id TYPE uuid USING user_id::uuid` | one-way | Harmless if the column is already `uuid` (Postgres no-ops). |
| `ALTER TABLE public.orders ALTER COLUMN user_id TYPE uuid USING user_id::uuid` | one-way | Same as above. |
| `ALTER TABLE ... ADD CONSTRAINT carts_user_id_fk FK ...` | ✗ fails on re-run | Precede with `ALTER TABLE public.carts DROP CONSTRAINT IF EXISTS carts_user_id_fk;` or wrap in a `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'carts_user_id_fk') THEN ... END IF; END $$;` block. |
| `ALTER TABLE ... ADD CONSTRAINT orders_user_id_fk FK ...` | ✗ fails on re-run | Same pattern as above. |
| `CREATE INDEX carts_user_id_idx ...` | ✗ fails on re-run | Change to `CREATE INDEX IF NOT EXISTS ...`. |
| `CREATE INDEX orders_user_id_idx ...` | ✗ fails on re-run | Same. |
| `CREATE TABLE public.auth_events (...)` | ✗ fails on re-run | Change to `CREATE TABLE IF NOT EXISTS ...`. |
| `CREATE INDEX auth_events_user_id_idx ...` | ✗ fails on re-run | `IF NOT EXISTS`. |
| `CREATE INDEX auth_events_event_idx ...` | ✗ fails on re-run | `IF NOT EXISTS`. |
| `CREATE INDEX auth_events_created_at_idx ...` | ✗ fails on re-run | `IF NOT EXISTS`. |
| `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` (× 6) | ✓ Postgres-idempotent | none |
| `CREATE POLICY "carts_select_own" ...` (and 8 more) | ✗ fails on re-run; no `IF NOT EXISTS` syntax | Precede each policy with `DROP POLICY IF EXISTS "<name>" ON public.<table>;` |

## Why not just rewrite the original file?

The `apply-10-02-migration.ts` script compares the file's SHA hash against the row in `drizzle.__drizzle_migrations` to decide whether to apply. Changing the SQL body (even comments) changes the hash, so production would think the migration was never applied and re-attempt — fatal because none of the statements above accept the idempotency guards already.

The header comment at the top of `0002_phase10_auth_fk_and_rls.sql` was added in commit `fix(10-review): WR-07 ...`. That edit changes the hash too — but the script is excluded from any npm runner (CR-CHECK-6), so the production database is unaffected. Anyone who later runs the script manually will see the hash mismatch and should consult this NOTES file before proceeding.

## Future migration (Phase 11+ recommendation)

Author all future hand-rolled SQL with idempotency guards baked in from day one. Either:

- Use `IF NOT EXISTS` / `IF EXISTS` everywhere Postgres allows it.
- Wrap object-creating statements without an `IF NOT EXISTS` form (notably `ADD CONSTRAINT` and `CREATE POLICY`) in a `DO $$ ... END $$;` block that checks the appropriate system catalog (`information_schema.table_constraints`, `pg_policy`, etc.) first.

This way the migration is safe to run on a fresh DB, a partially-migrated DB, or a fully-migrated DB — without the operator needing to read sidecar notes.
