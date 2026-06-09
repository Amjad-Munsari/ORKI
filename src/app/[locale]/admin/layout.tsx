/**
 * Phase 10 Plan 06 — admin route gate (SEC-08).
 *
 * Two-step check at the top of the layout, BEFORE any chrome renders:
 *   1. supabase.auth.getUser() — proves the cookie is a valid Supabase JWT.
 *      Using getUser() (not getSession()) is mandatory: getSession() trusts the
 *      cookie verbatim and is spoofable; getUser() revalidates against Supabase
 *      Auth (RESEARCH §7 #3).
 *   2. isAdminEmail(user.email) — email allowlist (server-only env).
 *
 * Failure path: writeAuthEvent with type='admin_action', metadata.denied=true,
 * reason='not_in_allowlist'. Then redirect('/login') — note the redirect is
 * intentionally to /login (not notFound()) per 10-06-PLAN.md frontmatter +
 * SEC-08 disposition.
 *
 * Audit writes are best-effort (writeAuthEvent never throws). The redirect
 * happens unconditionally on failure.
 */
import { redirect } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/auth/admin-allowlist';
import { writeAuthEvent } from '@/lib/auth/audit';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  if (!isAdminEmail(user.email)) {
    await writeAuthEvent({
      type: 'admin_action',
      userId: user.id,
      email: user.email ?? null,
      metadata: { denied: true, reason: 'not_in_allowlist' },
    });
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black">
      {/* Sidebar */}
      <aside className="w-64 border-e-2 border-white/20 flex flex-col sticky top-0 h-screen bg-[#0a0a0a]">
        <div className="p-8 border-b-2 border-white/20">
          <Link href="/admin" className="text-2xl font-black tracking-tighter uppercase text-white">
            ORKI ADMIN
          </Link>
          <div className="text-[10px] mt-1 font-mono uppercase opacity-40 text-white">
            Internal Systems v1.0
          </div>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-2">
          <Link
            href="/admin/inventory"
            className="p-3 border-2 border-transparent hover:border-white transition-all flex justify-between items-center group"
          >
            <span className="text-sm font-bold uppercase tracking-tight">Inventory</span>
            <span className="text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity">→</span>
          </Link>
          <Link
            href="/admin/orders"
            className="p-3 border-2 border-transparent hover:border-white transition-all flex justify-between items-center group"
          >
            <span className="text-sm font-bold uppercase tracking-tight">Orders</span>
            <span className="text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity">→</span>
          </Link>
          <Link
            href="/admin/audit"
            className="p-3 border-2 border-transparent hover:border-white transition-all flex justify-between items-center group"
          >
            <span className="text-sm font-bold uppercase tracking-tight">Audit</span>
            <span className="text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity">→</span>
          </Link>
        </nav>

        <div className="p-4 border-t-2 border-white/20 flex flex-col gap-3">
          <div className="px-1">
            <div className="text-[10px] font-mono uppercase opacity-40">Signed in as</div>
            <div className="text-xs font-bold tracking-tight truncate" dir="ltr">{user.email}</div>
          </div>
          <Link
            href="/"
            className="px-3 py-2 border-2 border-white bg-white text-black text-center text-xs font-bold uppercase tracking-tight block hover:bg-black hover:text-white transition-colors"
          >
            Exit Admin
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-black">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
