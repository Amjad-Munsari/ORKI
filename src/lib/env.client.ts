/**
 * Client-safe environment variable accessors.
 *
 * Validates ONLY the `NEXT_PUBLIC_*` keys that Next.js inlines into the
 * browser bundle. Safe to import from `'use client'` modules.
 *
 * Companion to `@/lib/env` (the strict server-only validator). Do NOT add
 * non-`NEXT_PUBLIC_*` keys here — they will be `undefined` in the browser
 * and crash module load (the bug CR-01 fixed in the Phase 10 review).
 */
import { z } from 'zod';

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(100),
});

// Build a literal object so Next.js can inline each NEXT_PUBLIC_* value at
// build time. Reading from `process.env` via a dynamic key would defeat the
// inlining and leave the value undefined in the client bundle.
const parsed = clientEnvSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

if (!parsed.success) {
  const formatted = parsed.error.format();
  throw new Error(
    `Missing or invalid NEXT_PUBLIC_* environment variables in the client bundle: ${Object.keys(
      formatted,
    )
      .filter((k) => k !== '_errors')
      .join(', ')}`,
  );
}

export const clientEnv = parsed.data;
