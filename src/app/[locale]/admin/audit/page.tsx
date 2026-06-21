/**
 * Phase 10 Plan 06 — /admin/audit (SEC-09 surface).
 *
 * Paginated read of public.auth_events for admin ops review.
 *
 * Data path: Drizzle (postgres-role connection) — BYPASSRLS by role grant, the
 * same effective access as a service-role PostgREST call. Drizzle is chosen for
 * consistency with the rest of the admin tree (admin/inventory/page.tsx uses
 * Drizzle). Either path satisfies the SEC-08 / SEC-09 contract.
 *
 * Access: reaching this page implies the parent admin/layout.tsx gate already
 * passed (auth + email allowlist). No additional checks here.
 *
 * Pagination: cursor-by-offset with PAGE_SIZE=50; "Older" link visible iff the
 * page is full (heuristic — no total count query to keep things cheap).
 *
 * Per UI-SPEC §"Header Changes" admin pages stay EN-only — no i18n.
 */
import { desc } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { authEvents } from '@/lib/db/schema';
import { AuditTable } from '@/components/admin/AuditTable';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ page?: string }>;
}

const PAGE_SIZE = 50;

export default async function AdminAuditPage({ searchParams }: Props) {
  const sp = await searchParams;
  const parsed = parseInt(sp.page ?? '1', 10);
  const page = Math.max(1, Number.isFinite(parsed) && parsed > 0 ? parsed : 1);
  const offset = (page - 1) * PAGE_SIZE;

  const rows = await db
    .select()
    .from(authEvents)
    .orderBy(desc(authEvents.createdAt))
    .limit(PAGE_SIZE)
    .offset(offset);

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-[12px] uppercase tracking-widest text-white/40 font-bold">Audit</p>
        <h1 className="text-4xl md:text-6xl font-bold uppercase tracking-tighter text-white leading-none">
          Auth events
        </h1>
        <p className="text-sm text-white/60">
          Page {page} · {rows.length} {rows.length === 1 ? 'row' : 'rows'}
        </p>
      </header>

      <AuditTable rows={rows} />

      <nav className="flex items-center gap-4 pt-6">
        {page > 1 && (
          <a
            href={`?page=${page - 1}`}
            className="text-sm underline underline-offset-4 text-white hover:opacity-70 transition-opacity"
          >
            ← Newer
          </a>
        )}
        {rows.length === PAGE_SIZE && (
          <a
            href={`?page=${page + 1}`}
            className="text-sm underline underline-offset-4 text-white hover:opacity-70 transition-opacity"
          >
            Older →
          </a>
        )}
      </nav>
    </section>
  );
}
