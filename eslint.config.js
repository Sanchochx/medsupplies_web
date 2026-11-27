// @ts-check
import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import astro from 'eslint-plugin-astro';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  {
    ignores: [
      'dist/',
      '.astro/',
      '.vercel/',
      'node_modules/',
      '.claude/',
      'demo_design/',
      'scratch/',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strict,
  ...astro.configs['flat/recommended'],
  ...astro.configs['flat/jsx-a11y-recommended'],
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      'no-console': 'error',
    },
  },
  {
    // The data access layer is the only entry point to content (CLAUDE.md rule 5).
    files: ['src/pages/**', 'src/layouts/**', 'src/components/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'astro:content',
              message: 'Read content through the data access layer (src/lib/data) instead.',
            },
          ],
          patterns: [
            {
              regex: '(^|/)lib/data/(?!index$).+',
              message: 'Import from the data access layer entry point (src/lib/data) only.',
            },
          ],
        },
      ],
    },
  },
);
