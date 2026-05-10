import 'server-only';
/**
 * Phase 10 Plan 03 — auth audit-log writer (SEC-09).
 *
 * Inserts a row into `public.auth_events` for every auth lifecycle event.
 *
 * Implementation note (WR-03): writes happen via Drizzle, NOT via the
 * service-role admin client. The postgres connection-string role used by
 * Drizzle has BYPASSRLS, so writes succeed against the no-policies
 * `auth_events` table set up by Plan 10-02. If you ever swap the Drizzle
 * connection to a less-privileged role, audit writes will start failing
 * silently (the try/catch below swallows them) — at that point refactor
 * this function to use `createAdminClient()` from `@/lib/supabase/admin`.
 *
 * IMPORTANT: failures are caught + logged but NEVER thrown — audit failures
 * must not break the user's auth flow (T-10-03-06). We accept the risk that
 * a transient DB outage will lose forensic rows; durability is a deliberate
 * trade-off against availability.
 */
import { db } from '@/lib/db/client';
import { authEvents } from '@/lib/db/schema';

export type AuthEventType =
  | 'signup'
  | 'signin'
  | 'signin_failed'
  | 'password_reset_requested'
  | 'password_changed'
  | 'signout'
  | 'admin_action';

export interface WriteAuthEventParams {
  type: AuthEventType;
  userId?: string | null;
  email?: string | null;
  metadata?: Record<string, unknown>;
  /**
   * Optional Request to extract IP + user-agent from. Most callers should
   * pass the Server Action / Route Handler's incoming Request when available.
   * Server Actions don't receive a Request directly — Plan 10-03 actions read
   * IP/UA from `headers()` and pass a synthesized Request, OR they pass the
   * headers in the metadata object. For Wave 1 we keep the parameter optional.
   */
  request?: Request;
}

export async function writeAuthEvent(params: WriteAuthEventParams): Promise<void> {
  try {
    let ipAddress: string | null = null;
    let userAgent: string | null = null;
    if (params.request) {
      const xff = params.request.headers.get('x-forwarded-for');
      ipAddress =
        xff?.split(',')[0]?.trim() ??
        params.request.headers.get('x-real-ip') ??
        null;
      userAgent = params.request.headers.get('user-agent') ?? null;
    }

    await db.insert(authEvents).values({
      userId: params.userId ?? null,
      email: params.email ?? null,
      event: params.type,
      metadata: params.metadata
        ? (params.metadata as unknown as Record<string, unknown>)
        : null,
      ipAddress,
      userAgent,
    });
  } catch (err) {
    // Audit failures must NEVER break the user's auth flow.
    console.error('[writeAuthEvent]', err);
  }
}
