import 'server-only';
/**
 * Phase 10 Plan 03 — admin email allowlist (SEC-08 helper).
 *
 * Compares `email` against SUPABASE_ADMIN_EMAILS (comma-separated env var).
 * Both the env values and the input are trimmed + lowercased before comparison
 * (RESEARCH §7 #8 — case insensitivity is non-negotiable for email).
 *
 * Consumed by Plan 10-06 (admin route gate) + future audit-action wrappers.
 */
import { env } from '@/lib/env';

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const allow = (env.SUPABASE_ADMIN_EMAILS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return allow.includes(email.trim().toLowerCase());
}
