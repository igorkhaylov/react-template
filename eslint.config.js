//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'
import prettierConfig from 'eslint-config-prettier'

export default [
  ...tanstackConfig,
  prettierConfig,
  {
    // public/ holds static assets served as-is (env-config.js is generated at
    // container start) — they are outside the TS project, so type-aware linting
    // cannot parse them.
    ignores: ['dist/**', 'coverage/**', 'node_modules/**', 'public/**', '**/*.gen.ts'],
  },
  {
    rules: {
      'no-console': 'warn',
      'prefer-const': 'error',
      'no-var': 'error',
      'no-shadow': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unnecessary-condition': 'off',
    },
  },
  {
    // getEnv<K extends keyof EnvConfig> uses a single-letter type parameter that
    // the TanStack naming-convention rule rejects (wants T/TXxx). Scoped off
    // instead of renaming to keep env.ts stable for other tooling.
    files: ['src/env.ts'],
    rules: {
      '@typescript-eslint/naming-convention': 'off',
    },
  },
]
