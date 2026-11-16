import eslint from '@eslint/js';
import * as astroParser from 'astro-eslint-parser';
import prettierConfig from 'eslint-config-prettier';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettierPlugin from 'eslint-plugin-prettier';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import unusedImports from 'eslint-plugin-unused-imports';
import tseslint from 'typescript-eslint';

const sharedPlugins = {
  'simple-import-sort': simpleImportSort,
  'unused-imports': unusedImports,
};

const sharedRules = {
  'prettier/prettier': ['error', { singleQuote: true, endOfLine: 'auto' }],
  '@typescript-eslint/consistent-type-imports': 'error',
  'simple-import-sort/imports': 'error',
  'simple-import-sort/exports': 'error',
  '@typescript-eslint/no-unused-vars': 'off',
  'unused-imports/no-unused-imports': 'error',
  'unused-imports/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  '@typescript-eslint/no-explicit-any': 'off',
};

export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '.baseline/**',
      '.astro/**',
      'scripts/**',
      'public/assets/js/**',
    ],
  },

  eslint.configs.recommended,
  prettierConfig,
  {
    plugins: { prettier: prettierPlugin },
    rules: {
      'prettier/prettier': ['error', { singleQuote: true, endOfLine: 'auto' }],
    },
  },

  // TypeScript source files
  {
    files: ['src/**/*.ts'],
    extends: tseslint.configs.recommended,
    plugins: sharedPlugins,
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { project: './tsconfig.json' },
    },
    rules: sharedRules,
  },

  // React TSX files
  {
    files: ['src/**/*.tsx'],
    extends: tseslint.configs.recommended,
    plugins: {
      ...sharedPlugins,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'jsx-a11y': jsxA11y,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { project: './tsconfig.json' },
    },
    settings: { react: { version: 'detect' } },
    rules: {
      ...sharedRules,
      ...jsxA11y.configs.recommended.rules,
      'react/destructuring-assignment': 'off',
      'react/require-default-props': 'off',
      'react/jsx-props-no-spreading': 'off',
    },
  },

  // Config files and e2e specs
  {
    files: ['e2e/**/*.ts', '*.config.ts', 'vitest.setup.ts'],
    extends: [...tseslint.configs.recommended, tseslint.configs.disableTypeChecked],
    plugins: sharedPlugins,
    languageOptions: { parser: tseslint.parser },
    rules: {
      ...sharedRules,
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },

  // Root-level JS/MJS config files (Astro, Prettier, etc.) — Node.js environment
  {
    files: ['*.config.mjs', '*.config.js'],
    languageOptions: {
      globals: { process: 'readonly' },
    },
    rules: {
      'no-undef': 'off',
    },
  },

  // Astro files
  {
    files: ['**/*.astro'],
    extends: tseslint.configs.recommended,
    plugins: sharedPlugins,
    languageOptions: {
      parser: astroParser,
      parserOptions: {
        parser: tseslint.parser,
        project: './tsconfig.json',
        extraFileExtensions: ['.astro'],
      },
      globals: { Astro: 'readonly' },
    },
    rules: sharedRules,
  },

  // Files that Prettier's Astro plugin cannot parse (inline scripts with object literals,
  // HTML entities in JSX attributes, adjacent JSX in ternaries) — disable prettier rule only.
  // This override must come AFTER the Astro files block to take precedence.
  {
    files: [
      'src/layouts/Base.astro',
      'src/layouts/Post.astro',
      'src/pages/cv.astro',
      'src/components/Giscus.astro',
    ],
    rules: { 'prettier/prettier': 'off' },
  },
);
