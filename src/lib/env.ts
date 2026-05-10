/**
 * Environment variable validation using Zod.
 * This module validates all required env vars at import time.
 * Imported in next.config.ts to fail at build time, not at runtime.
 *
 * Add new env vars here when new phases introduce them
 * (Phase 6: auth vars, Phase 7: CDN vars, etc.)
 *
 * Phase 10 (auth): adds Supabase URL + anon key + service-role key + admin
 * email allowlist. Note: SUPABASE_SERVICE_ROLE_KEY and SUPABASE_ADMIN_EMAILS
 * intentionally have NO `NEXT_PUBLIC_` prefix — that prefix would force
 * Next.js to inline them into the client bundle (RESEARCH §7 #7, §2.5).
 */
import { z } from 'zod';

const envSchema = z
  .object({
    // Production (Vercel/Neon) uses STORAGE_URL; local dev uses DATABASE_URL.
    // Whichever is present wins — STORAGE_URL takes priority.
    STORAGE_URL: z.string().url().optional(),
    DATABASE_URL: z.string().url().optional(),
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
    // Phase 10 — Supabase auth
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(100),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(100),
    SUPABASE_ADMIN_EMAILS: z.string().min(1),
  })
  .transform((data) => ({
    DB_URL: data.STORAGE_URL ?? data.DATABASE_URL,
    NODE_ENV: data.NODE_ENV,
    NEXT_PUBLIC_SUPABASE_URL: data.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: data.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: data.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_ADMIN_EMAILS: data.SUPABASE_ADMIN_EMAILS,
  }))
  .refine((data) => Boolean(data.DB_URL), {
    message:
      'A PostgreSQL connection URL is required. Set STORAGE_URL (Vercel/Neon) or DATABASE_URL (local dev).',
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const formatted = parsed.error.format();
  console.error('❌ Invalid environment variables:', JSON.stringify(formatted, null, 2));
  throw new Error(
    `Missing or invalid environment variables:\n${Object.keys(formatted)
      .filter((k) => k !== '_errors')
      .join(', ')}`
  );
}

export const env = parsed.data;
