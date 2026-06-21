/**
 * Phase 10 Plan 03 — Per-test in-memory cookie store for `next/headers`.
 *
 * The Supabase SSR client (src/lib/supabase/server.ts) reads/writes cookies
 * via `next/headers`'s `cookies()` API, which only works inside a Next.js
 * request scope. Vitest is not such a scope, so calls throw without a mock.
 *
 * Usage (per test file that exercises createClient()):
 *   import './path/to/next-cookies-mock';   // side-effect: registers mocks
 *   import { resetCookieJar } from '...';
 *   beforeEach(() => resetCookieJar());
 *
 * The jar persists across calls within a single test, so signIn followed by
 * a getUser() in the same `it()` body sees the freshly-set sb-* cookies.
 */
import { vi } from 'vitest';

type StoredCookie = { name: string; value: string; options?: unknown };

const jar: StoredCookie[] = [];

export function resetCookieJar(): void {
  jar.length = 0;
}

export function getCookieJar(): ReadonlyArray<StoredCookie> {
  return jar;
}

// Top-level mock declarations — vi.mock is hoisted to the top of the importing
// module, so these run before any user code in the test file.
vi.mock('next/headers', () => ({
  cookies: async () => ({
    getAll: () => jar.map(({ name, value }) => ({ name, value })),
    get: (name: string) => {
      const c = jar.find((x) => x.name === name);
      return c ? { name: c.name, value: c.value } : undefined;
    },
    set: (
      name: string | { name: string; value: string; options?: unknown },
      value?: string,
      options?: unknown
    ) => {
      if (typeof name === 'object') {
        const idx = jar.findIndex((c) => c.name === name.name);
        const entry = { name: name.name, value: name.value, options: name.options };
        if (idx >= 0) jar[idx] = entry;
        else jar.push(entry);
        return;
      }
      const idx = jar.findIndex((c) => c.name === name);
      const entry = { name, value: value ?? '', options };
      if (idx >= 0) jar[idx] = entry;
      else jar.push(entry);
    },
    delete: (name: string) => {
      const idx = jar.findIndex((c) => c.name === name);
      if (idx >= 0) jar.splice(idx, 1);
    },
  }),
  headers: async () => ({
    get: () => null,
  }),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    const e = new Error(`NEXT_REDIRECT;${url}`);
    (e as unknown as { digest: string }).digest = `NEXT_REDIRECT;${url}`;
    throw e;
  },
}));
