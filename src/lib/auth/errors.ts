/**
 * Phase 10 Plan 03 — Auth Server Action result envelope + Supabase error mapper.
 *
 * Mirrors src/app/actions/cart.ts:30-37 with auth-specific codes.
 *
 * SEC-06 (no enumeration): wrong-email and wrong-password BOTH map to
 * INVALID_CREDENTIALS / 'Auth.errors.invalidCredentials'. Never differentiate.
 *
 * SEC-06 (no enumeration, signup variant): existing-email signup is also
 * collapsed to UNKNOWN — see UI-SPEC §Anti-patterns #11. The auth_events row
 * carries `metadata: { collision: true }` so the signal survives for ops.
 *
 * `EMAIL_IN_USE` exists in the discriminated union for completeness (future
 * internal-only branching) but the mapper NEVER returns it.
 */

export type AuthActionResult<T = unknown> =
  | { ok: true; data: T }
  | {
      ok: false;
      code:
        | 'INVALID_CREDENTIALS'
        | 'EMAIL_IN_USE'
        | 'WEAK_PASSWORD'
        | 'RATE_LIMITED'
        | 'VALIDATION'
        | 'UNKNOWN';
      fields?: Record<string, string>;
      messageKey: string;
    };

interface SupabaseAuthErrorShape {
  message?: string;
  status?: number;
  code?: string;
}

type AuthErrorCode = Exclude<
  Extract<AuthActionResult, { ok: false }>['code'],
  'VALIDATION'
>;

/**
 * Map any Supabase auth error to AuthActionResult code + messageKey.
 *
 * Anti-enumeration:
 *   - wrong-email and wrong-password BOTH produce INVALID_CREDENTIALS.
 *   - existing-email signup is collapsed to UNKNOWN (the audit log preserves
 *     the collision signal for ops).
 */
export function mapSupabaseError(err: unknown): {
  code: AuthErrorCode;
  messageKey: string;
} {
  const e = (err ?? {}) as SupabaseAuthErrorShape;
  const msg = (e.message ?? '').toLowerCase();
  const code = (e.code ?? '').toLowerCase();
  const status = e.status ?? 0;

  // Rate limit (429 from Supabase Auth or message contains 'rate' / 'too many')
  if (status === 429 || /rate.?limit/.test(msg) || /too.?many/.test(msg)) {
    return { code: 'RATE_LIMITED', messageKey: 'Auth.errors.tooManyAttempts' };
  }
  // Weak password (422 weak-password / explicit length error)
  if (
    status === 422 ||
    /password.*(short|weak|requirement|length)/.test(msg) ||
    /weak.*password/.test(msg)
  ) {
    return { code: 'WEAK_PASSWORD', messageKey: 'Auth.errors.passwordTooShort' };
  }
  // Existing-email signup — UI-SPEC §Anti-patterns #11: do NOT surface
  // 'EMAIL_IN_USE' to the wire. Map to UNKNOWN; auth_events records the truth.
  if (/already.*registered|user.*(?:exists|already)|email.*(?:exists|already)/.test(msg)) {
    return { code: 'UNKNOWN', messageKey: 'Auth.errors.unknown' };
  }
  // Invalid credentials — collapse wrong-email + wrong-password.
  // WR-06 (Phase 10 review): trust the Supabase error code first, fall back
  // to the message regex. The previous `status === 400` fallback collapsed
  // every 400 response (malformed payloads, validation errors from
  // updateUser, etc.) to INVALID_CREDENTIALS — misleading. Unknown 400s now
  // fall through to UNKNOWN, where the audit log preserves the raw
  // code/status for ops triage.
  if (
    code === 'invalid_credentials' ||
    code === 'invalid_login_credentials' ||
    /invalid.*(login|credentials|email|password)/.test(msg) ||
    /invalid.?login.?credentials/.test(msg)
  ) {
    return {
      code: 'INVALID_CREDENTIALS',
      messageKey: 'Auth.errors.invalidCredentials',
    };
  }
  return { code: 'UNKNOWN', messageKey: 'Auth.errors.unknown' };
}
