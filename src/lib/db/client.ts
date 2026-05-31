/**
 * Drizzle ORM singleton client.
 *
 * Uses a global singleton to prevent connection exhaustion during Next.js
 * Hot Module Replacement (HMR) in development. In production, creates a
 * fresh connection pool on startup.
 *
 * Usage: import { db } from '@/lib/db/client'
 */
import 'server-only';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '../env';

// Singleton pattern — reuse across HMR restarts in development only
const globalForDb = globalThis as unknown as {
  conn: ReturnType<typeof postgres> | undefined;
};

const conn =
  globalForDb.conn ??
  postgres(env.DB_URL!, {
    max: env.NODE_ENV === 'production' ? 10 : 1,
    connect_timeout: 10,
    ssl: 'require',
    // Supabase's transaction pooler (PgBouncer) does not support prepared
    // statements; disabling them keeps the same connection string working on
    // the pooler, the session pooler, and a direct connection. Bound idle/max
    // lifetimes so the pooler can reclaim connections without surfacing as
    // intermittent "connection closed" errors.
    prepare: false,
    idle_timeout: 20,
    max_lifetime: 60 * 30,
  });

if (env.NODE_ENV !== 'production') {
  globalForDb.conn = conn;
}

export const db = drizzle(conn, {
  schema,
  // Dev-time SQL logger — emits every statement to stdout in `next dev`.
  // Strict gate: OFF in Vercel Preview AND Production (both run NODE_ENV=production).
  // Mitigates T-09-05-02 (information disclosure via SQL in prod logs).
  logger: env.NODE_ENV !== 'production',
});
