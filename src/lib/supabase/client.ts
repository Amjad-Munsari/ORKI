'use client';
/**
 * Browser-only Supabase client. Anon key + cookies-handled-by-browser.
 *
 * Use from Client Components / client islands when client-side Supabase access
 * is needed (rare in Phase 10 — most reads happen via the SSR client). This
 * file MUST NOT mark itself server-restricted or attach cookies; doing so
 * would break client bundles and contradict the @supabase/ssr browser pattern.
 *
 * Single function export — do NOT cache (Supabase docs recommend
 * factory-per-call so the client picks up the latest cookie state).
 */
import { createBrowserClient } from '@supabase/ssr';
import { clientEnv } from '@/lib/env.client';

export function createClient() {
  return createBrowserClient(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
