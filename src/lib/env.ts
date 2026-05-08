/**
 * Environment variable validation using Zod.
 * This module validates all required env vars at import time.
 * Imported in next.config.ts to fail at build time, not at runtime.
 *
 * Add new env vars here when new phases introduce them
 * (Phase 6: auth vars, Phase 7: CDN vars, etc.)
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
  })
  .transform((data) => ({
    DB_URL: data.STORAGE_URL ?? data.DATABASE_URL,
    NODE_ENV: data.NODE_ENV,
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
