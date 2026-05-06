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
    },
  },
];

export default eslintConfig;
