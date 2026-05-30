import 'server-only';
import { Resend } from 'resend';
import { env } from '../env';

/**
 * Resend singleton. Mirrors the db/client.ts HMR-safe global pattern.
 *
 * Resolves to `null` when RESEND_API_KEY is absent so the whole email
 * subsystem degrades to a logged no-op in local dev (Plan 08-07). Order
 * creation NEVER depends on this being non-null.
 */
const globalForResend = globalThis as unknown as { resend: Resend | null };

export const resend: Resend | null =
  globalForResend.resend ??
  (env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null);

if (env.NODE_ENV !== 'production' && resend) {
  globalForResend.resend = resend;
}

export const FROM_EMAIL = env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev';
