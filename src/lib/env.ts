/**
 * Environment variable validation using Zod.
 * This module validates all required env vars at import time.
 * Imported in next.config.ts to fail at build time, not at runtime.
 *
 * Add new env vars here when new phases introduce them
 * (Phase 6: auth vars, Phase 7: CDN vars, etc.)
 */
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url({
    message:
      'DATABASE_URL must be a valid PostgreSQL connection URL ' +
      '(e.g. postgresql://user:pass@localhost:5432/orki_dev)',
  }),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
