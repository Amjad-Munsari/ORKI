/**
 * Phase 10 Plan 06 — AuditTable.
 *
 * Presentational table for `public.auth_events` rows. Used by /admin/audit
 * (gated by the admin layout). No data fetching, no state — pure render.
 *
 * Reference fields (timestamps, IDs, IPs, emails) carry dir="ltr" so they
 * render LTR even when the surrounding admin chrome is RTL.
 */
import type { AuthEventRow } from '@/lib/db/schema';

interface Props {
  rows: AuthEventRow[];
}

export function AuditTable({ rows }: Props) {
  if (rows.length === 0) {
    return (
      <div className="bg-[#111111] border border-white/10 rounded-lg p-12 text-center">
        <p className="text-sm text-white/60">No events yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#111111] border border-white/10 rounded-lg overflow-x-auto">
      <table className="w-full text-sm border-spacing-0">
        <thead className="text-[12px] uppercase tracking-widest text-white/40 font-bold border-b border-white/10">
          <tr>
            <th className="text-start px-4 py-3">Time</th>
            <th className="text-start px-4 py-3">Event</th>
            <th className="text-start px-4 py-3">Email</th>
            <th className="text-start px-4 py-3">User ID</th>
            <th className="text-start px-4 py-3">IP</th>
            <th className="text-start px-4 py-3">Metadata</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-white/5 align-top">
              <td className="px-4 py-3 text-white/80 whitespace-nowrap" dir="ltr">
                {row.createdAt.toISOString()}
              </td>
              <td className="px-4 py-3 text-white font-medium">{row.event}</td>
              <td className="px-4 py-3 text-white/80" dir="ltr">
                {row.email ?? '—'}
              </td>
              <td className="px-4 py-3 text-white/40 font-mono text-xs" dir="ltr">
                {row.userId ?? '—'}
              </td>
              <td className="px-4 py-3 text-white/60" dir="ltr">
                {row.ipAddress ?? '—'}
              </td>
              <td className="px-4 py-3 text-white/60 font-mono text-xs break-all max-w-md">
                {row.metadata ? JSON.stringify(row.metadata) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
