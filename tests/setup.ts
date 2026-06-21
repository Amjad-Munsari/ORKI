// Vitest global setup. Add DOM matchers / polyfills here as the suite grows.
import { vi } from 'vitest';
import '@testing-library/react';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

// `server-only` throws at import time when not running in an RSC environment.
// Vitest is not an RSC environment, so stub the module so files that begin
// with `import 'server-only'` (e.g. src/lib/orders/state-machine.ts,
// src/lib/orders/reference.ts) can be imported under unit tests.
vi.mock('server-only', () => ({}));

// Polyfill webcrypto for runners that lack it. Node 18+ has crypto.randomUUID natively.
if (typeof globalThis.crypto === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  globalThis.crypto = require('node:crypto').webcrypto as Crypto;
}

// Lightweight .env.local loader for integration tests that hit the live DB.
// Vitest doesn't auto-load .env.* files; only populate keys not already in process.env.
// Skip in production-like CI environments (DATABASE_URL/STORAGE_URL already injected).
if (!process.env.DATABASE_URL && !process.env.STORAGE_URL) {
  const envPath = resolve(process.cwd(), '.env.local');
  if (existsSync(envPath)) {
    const lines = readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq < 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      // Strip surrounding quotes.
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  }
}
