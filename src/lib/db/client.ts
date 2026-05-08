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
    ssl: env.NODE_ENV === 'production' ? 'require' : false,
  });

if (env.NODE_ENV !== 'production') {
  globalForDb.conn = conn;
}

export const db = drizzle(conn, { schema });
