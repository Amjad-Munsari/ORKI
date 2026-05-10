import 'server-only';
/**
 * SSR Supabase client. Anon key + per-request cookies → RLS-bound.
 *
 * Use in Server Components, Server Actions, and Route Handlers. The cookies()
 * adapter binds the user's JWT to every Postgres request so Row Level Security
 * policies evaluate against `auth.uid()` automatically.
 *
 * IMPORTANT: For security gates (auth checks, allowlists, RLS-anchored reads),
 * always call `supabase.auth.getUser()` — NOT `getSession()`. `getSession()`
 * trusts the cookie verbatim and is spoofable; `getUser()` revalidates the
 * JWT against Supabase Auth (RESEARCH §7 #3).
 *
 * The empty try/catch around setAll is INTENTIONAL per Supabase docs: Server
 * Components cannot write cookies, so writes during a render pass are silently
 * dropped. Middleware refresh covers cookie writes for those flows.
 */
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — ignore. Middleware refresh
            // covers cookie writes for those flows.
          }
        },
      },
    },
  );
}
