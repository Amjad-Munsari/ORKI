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
            // Pre-existing test debt — calls async getAllProducts() as if sync.
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
          // Vitest 4: pool options are top-level (forks pool with singleFork).
          pool: 'forks',
          forks: { singleFork: true },
          fileParallelism: false,
          testTimeout: 30_000,
          hookTimeout: 30_000,
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
