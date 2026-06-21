import 'server-only';
/**
 * Service-role Supabase client. Bypasses RLS. NEVER import outside admin paths.
 *
 * Boundary enforcement (defense in depth):
 *   1. `'server-only'` (above) — Next.js refuses to bundle into client code.
 *   2. SUPABASE_SERVICE_ROLE_KEY has no NEXT_PUBLIC_ prefix → bundler refuses
 *      to inline the value.
 *   3. ESLint `no-restricted-imports` blocks imports outside
 *      src/app/actions/admin/**, src/app/[locale]/admin/**, and tests/**
 *      (where the admin client is used to provision fixtures).
 *   4. Verifier-agent in 10-07 greps the production client bundle for the
 *      key prefix.
 *
 * Per Supabase docs, the service-role bypass is determined by the
 * Authorization header. If a user JWT leaks via cookies, the JWT wins and
 * RLS engages. Empty getAll/setAll is the documented escape hatch — it
 * guarantees this client always speaks as `service_role` regardless of
 * whatever cookies the surrounding request carries.
 *
 * Anti-pattern: do NOT export a top-level singleton (`export const
 * supabaseAdmin = createAdminClient()`). Factory function only — keeps the
 * `'server-only'` semantics intact across hot-reloads.
 */
import { createServerClient } from '@supabase/ssr';
import { env } from '@/lib/env';

export function createAdminClient() {
  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          /* intentionally empty — see docblock */
        },
      },
    },
  );
}
