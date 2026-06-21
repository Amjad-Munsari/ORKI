import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * Vitest 4.x removed `environmentMatchGlobs`; use `projects` instead.
 * Two projects:
 *   - "node" — pure-logic tests (state machine, pricing, reference, products, cart store).
 *     Faster, no jsdom side effects.
 *   - "jsdom" — component / DOM tests (anything in src/components, src/app, or .tsx tests).
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    // Maps `@/foo` → `./src/foo` (matches tsconfig paths used across the app).
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    projects: [
      {
        extends: true,
        plugins: [react()],
        test: {
          name: 'node',
          environment: 'node',
          globals: true,
          setupFiles: ['./tests/setup.ts'],
          include: [
            'src/**/*.test.ts',
            'tests/**/*.test.ts',
          ],
          exclude: [
            'node_modules',
            'dist',
            '.next',
            // Pre-existing assertion debt — file now type-checks cleanly
            // (await + Size shape fixed during Phase 10 cleanup), but the
            // hard-coded fixture-count assertions ("3 tops", "3 bottoms")
            // and the specific product IDs (orki-washed-tee-ecru,
            // orki-heavy-tee-black) no longer match the Phase 5 DB seed.
            // Tracked in .planning/phases/08-cart-checkout-orders/deferred-items.md.
            'tests/products.test.ts',
            // Integration tests run in a dedicated serial project below.
            'tests/integration/**',
          ],
        },
      },
      {
        // Integration tests hit the live Supabase Postgres DB. They TRUNCATE
        // shared tables between cases and seed shared product fixtures, which
        // means parallel execution across files deadlocks. Pin to a single
        // fork and disable file-level parallelism so the suite is serial.
        extends: true,
        plugins: [react()],
        test: {
          name: 'integration',
          environment: 'node',
          globals: true,
          setupFiles: ['./tests/setup.ts'],
          include: ['tests/integration/**/*.test.ts'],
          exclude: ['node_modules', 'dist', '.next'],
          // Vitest 4: `poolOptions.forks.singleFork: true` was removed from
          // the public type. The equivalent serial-pool behavior is achieved
          // with `maxWorkers: 1` + `fileParallelism: false` — required
          // because integration tests TRUNCATE shared Postgres tables between
          // cases and parallel execution deadlocks. Isolation is left at
          // the default (true) so module state resets between files.
          pool: 'forks',
          maxWorkers: 1,
          fileParallelism: false,
          testTimeout: 30_000,
          hookTimeout: 30_000,
          // Vitest 4: projects with different `maxWorkers` must declare a
          // unique `sequence.groupOrder`. Run integration last so the serial
          // pool doesn't block parallel projects.
          sequence: { groupOrder: 1 },
        },
      },
      {
        extends: true,
        plugins: [react()],
        test: {
          name: 'jsdom',
          environment: 'jsdom',
          globals: true,
          setupFiles: ['./tests/setup.ts'],
          include: [
            'src/**/*.test.tsx',
            'src/components/**/*.test.ts',
            'src/app/**/*.test.ts',
            'tests/**/*.test.tsx',
            'tests/components/**/*.test.ts',
          ],
          exclude: [
            'node_modules',
            'dist',
            '.next',
          ],
        },
      },
    ],
  },
});
