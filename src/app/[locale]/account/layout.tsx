/**
 * Phase 10 Plan 05 — /[locale]/account auth gate.
 *
 * Calls supabase.auth.getUser() (revalidates the JWT against Supabase — see
 * src/lib/supabase/server.ts docblock for the spoofability rationale of the
 * legacy session API, ADR-002 §SEC-01) and redirects unauthenticated users
 * to /login.
 *
 * Belt-and-braces: every page nested under /account also calls getUser() and
 * 404s defensively. The layout gate is the primary enforcement.
 */
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return <>{children}</>;
}
