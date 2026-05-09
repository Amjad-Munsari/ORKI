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
          ],
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
