import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
      '.agents/**',
      '.claude/**',
      '.planning/**',
    ],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      // Ban raw <img> elements — enforced by @next/eslint-plugin-next (included via next/core-web-vitals)
      '@next/next/no-img-element': 'error',

      // Ban physical directional Tailwind classes in JSX className Literal (plain string) values.
      // Template literal classNames are exempt from this AST rule — use code review for those.
      // Banned: ml-*, mr-*, pl-*, pr-*, border-l-*, border-r-*
      // Use logical alternatives: ms-/me- (margin), ps-/pe- (padding), border-s-/border-e-
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'JSXAttribute[name.name="className"] > Literal[value=/\\b(ml|mr|pl|pr|border-l|border-r)-/]',
          message:
            'Physical Tailwind direction class detected. Use logical properties: ms-/me- (margin), ps-/pe- (padding), border-s-/border-e-. These work in both LTR and RTL.',
        },
      ],

      // Phase 10 — fence the Supabase service-role admin client. The admin
      // client carries SUPABASE_SERVICE_ROLE_KEY and bypasses RLS; importing
      // it from anywhere outside the allowlisted directories risks bundling
      // the key into client code.
      // Allowlisted callers (see override below): src/app/actions/admin/**,
      // src/app/[locale]/admin/**, and tests/**.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/lib/supabase/admin'],
              message:
                'The Supabase admin (service-role) client may only be imported from src/app/actions/admin/**, src/app/[locale]/admin/**, or tests/**. Importing elsewhere risks bundling SUPABASE_SERVICE_ROLE_KEY into client code.',
            },
          ],
        },
      ],
    },
  },
  // Allowlist: turn the no-restricted-imports rule OFF inside admin paths
  // and tests so the admin client can be legitimately consumed there.
  {
    files: [
      'src/app/actions/admin/**/*',
      'src/app/[locale]/admin/**/*',
      'tests/**/*',
    ],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
  // CommonJS build/devops scripts genuinely need `require()` — they are not
  // bundled and must remain executable as plain Node CJS. Scope the override
  // tightly to scripts/**/*.cjs so it does not loosen anything in src/** or
  // shadow the supabase admin fence above.
  {
    files: ['scripts/**/*.cjs'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
];

export default eslintConfig;
