/**
 * Shared Phase 10 test fixture.
 *
 * - createTestUser({ email, password }): provisions a fresh Supabase auth user
 *   via the service-role admin client, returns { userId, email, password }.
 * - signInTestUser({ email, password }): signs in via SSR client semantics,
 *   returns { sessionCookies, accessToken, refreshToken } so integration +
 *   Playwright tests can attach cookies on subsequent requests.
 * - cleanupTestUser(userId): deletes the user via admin client.
 *
 * All fixtures are gated on `hasSupabaseEnv` — tests skip cleanly when env is
 * absent (mirrors `tests/helpers/test-db.ts:hasDbUrl` precedent).
 *
 * NOTE: Tests live under `tests/**` which is allowlisted in eslint.config.mjs
 * for the `no-restricted-imports` rule fencing the admin client. We use
 * createServerClient directly here (not @/lib/supabase/admin) because tests
 * run against `process.env` keys without going through the zod-validated
 * `env` import — that way tests can no-op when env is absent without
 * crashing on import.
 */
import { createServerClient } from '@supabase/ssr';

export const hasSupabaseEnv =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  !!process.env.SUPABASE_SERVICE_ROLE_KEY;

export function adminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } },
  );
}

export async function createTestUser(opts?: {
  email?: string;
  password?: string;
}) {
  const email =
    opts?.email ??
    `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@orki.test`;
  const password = opts?.password ?? 'test-password-12345';
  const admin = adminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  return { userId: data.user.id, email, password };
}

export async function cleanupTestUser(userId: string) {
  const admin = adminClient();
  await admin.auth.admin.deleteUser(userId);
}

export async function signInTestUser(email: string, password: string) {
  const cookieJar: Array<{ name: string; value: string; options?: unknown }> =
    [];
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieJar.map(({ name, value }) => ({ name, value })),
        setAll: (toSet) => {
          cookieJar.push(...toSet);
        },
      },
    },
  );
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return {
    sessionCookies: cookieJar,
    accessToken: data.session!.access_token,
    refreshToken: data.session!.refresh_token,
    userId: data.user!.id,
  };
}
