import 'server-only';
/**
 * Authorization guard for privileged Server Actions and Route Handlers.
 *
 * WHY THIS EXISTS: `admin/layout.tsx` gates admin *page rendering*, but Next.js
 * Server Actions and Route Handlers are independent POST/GET endpoints that DO
 * NOT inherit a layout's auth check. A `'use server'` mutation is callable by
 * anyone who can craft the request, regardless of which page is rendered. Every
 * privileged mutation must therefore re-assert authorization itself.
 *
 * Mirrors the two-step gate in `admin/layout.tsx`:
 *   1. supabase.auth.getUser() — revalidates the JWT (getUser, never getSession).
 *   2. isAdminEmail(user.email) — server-only env allowlist.
 *
 * On failure it writes a denied `admin_action` audit row (best-effort, never
 * throws from the audit write) and then throws `AdminAuthError`. Callers that
 * return a typed envelope may catch it; void actions can let it propagate (the
 * caller receives a generic server error — acceptable for an unauthorized hit).
 */
import { createClient } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/auth/admin-allowlist';
import { writeAuthEvent } from '@/lib/auth/audit';

export class AdminAuthError extends Error {
  constructor(public readonly reason: 'unauthenticated' | 'not_in_allowlist') {
    super(`admin authorization failed: ${reason}`);
    this.name = 'AdminAuthError';
  }
}

export interface AdminUser {
  id: string;
  email: string | null;
}

export async function requireAdmin(action?: string): Promise<AdminUser> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    await writeAuthEvent({
      type: 'admin_action',
      metadata: { denied: true, reason: 'unauthenticated', action },
    });
    throw new AdminAuthError('unauthenticated');
  }

  if (!isAdminEmail(user.email)) {
    await writeAuthEvent({
      type: 'admin_action',
      userId: user.id,
      email: user.email ?? null,
      metadata: { denied: true, reason: 'not_in_allowlist', action },
    });
    throw new AdminAuthError('not_in_allowlist');
  }

  return { id: user.id, email: user.email ?? null };
}
