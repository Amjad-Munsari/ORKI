/**
 * Environment variable validation using Zod — SERVER-SIDE intent.
 *
 * This module validates all required env vars at import time. It is also
 * imported by `next.config.ts` at build start so missing env vars fail the
 * build, not the first request — therefore it cannot carry `'server-only'`
 * (Next.js loads next.config.ts in a context that the `server-only` package
 * treats as a Client Component and refuses to import).
 *
 * Client components MUST import `@/lib/env.client` instead. The split was
 * introduced by CR-01 (Phase 10 review) because the prior shape crashed
 * the browser when client.ts imported this file — `SUPABASE_SERVICE_ROLE_KEY`
 * is stripped from client bundles, and zod's `min(100)` validation threw at
 * module load. The split is now the boundary; this file is server-by-convention
 * (no `NEXT_PUBLIC_` prefix on the service-role + admin keys ensures Next.js
 * cannot inline them even if a client component accidentally imports here).
 *
 * Add new env vars when new phases introduce them.
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
