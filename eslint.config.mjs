import prettierConfig from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import prettierPlugin from 'eslint-plugin-prettier';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    ignores: [
      'node_modules/',
      '.next/',
      'out/',
      'build/',
      'dist/',
      'public/',
      '*.js.map',
      'next-env.d.ts',
    ],
  },
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
      import: importPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      ...prettierConfig.rules,

      // Import/export ordering (groups mirror selfxyz/self)
      'import/order': 'off',
      'no-duplicate-imports': 'off',
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            // Node.js built-ins
            ['^node:'],
            ['^node:.*/'],
            // External packages (including @-prefixed external packages)
            ['^[a-zA-Z]', '^@(?!selfxyz|/)'],
            // Internal workspace packages
            ['^@selfxyz/'],
            // Internal alias imports
            ['^@/'],
            // Internal relative imports
            ['^[./]'],
          ],
        },
      ],
      'simple-import-sort/exports': 'error',
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/no-duplicates': 'error',
      'import/no-unresolved': 'off',

      // Formatting / whitespace
      'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0, maxBOF: 1 }],
      'prettier/prettier': ['warn', {}, { usePrettierrc: true }],

      // TypeScript
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          disallowTypeAnnotations: false,
        },
      ],
      '@typescript-eslint/ban-ts-comment': 'off',

      // Prevent export * (bad for tree shaking)
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ExportAllDeclaration',
          message:
            'export * is forbidden. Use selective exports for better tree shaking.',
        },
      ],

      // General
      'no-console': 'off',
      'prefer-const': 'warn',
    },
  },
];

export default eslintConfig;
