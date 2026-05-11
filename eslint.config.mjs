import js from '@eslint/js'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import importPlugin from 'eslint-plugin-import'

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        Response: 'readonly',
        Request: 'readonly',
        Headers: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        fetch: 'readonly',
        crypto: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      import: importPlugin,
    },
    rules: {
      'no-console': 'error',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc' },
        },
      ],
      'import/no-duplicates': 'error',
      'no-nested-ternary': 'error',
      'max-depth': ['error', 2],
      'max-params': ['error', 3],
    },
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        vi: 'readonly',
      },
    },
  },
  {
    files: ['apps/api/**/*.ts'],
    languageOptions: {
      globals: {
        KVNamespace: 'readonly',
        DurableObjectNamespace: 'readonly',
        ExecutionContext: 'readonly',
        CryptoKey: 'readonly',
        CryptoKeyPair: 'readonly',
        JsonWebKey: 'readonly',
        TextEncoder: 'readonly',
        TextDecoder: 'readonly',
        RequestInit: 'readonly',
        Buffer: 'readonly',
        performance: 'readonly',
        atob: 'readonly',
        btoa: 'readonly',
        FormData: 'readonly',
        Blob: 'readonly',
        File: 'readonly',
        caches: 'readonly',
        Ai: 'readonly',
      },
    },
  },
  {
    files: ['apps/web/**/*.ts', 'apps/web/**/*.tsx'],
    languageOptions: {
      globals: {
        React: 'readonly',
        JSX: 'readonly',
        window: 'readonly',
        document: 'readonly',
        HTMLDivElement: 'readonly',
        HTMLCanvasElement: 'readonly',
        HTMLInputElement: 'readonly',
        MouseEvent: 'readonly',
        KeyboardEvent: 'readonly',
        IntersectionObserver: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        RequestInit: 'readonly',
        process: 'readonly',
        File: 'readonly',
        FileReader: 'readonly',
        Blob: 'readonly',
        BlobPart: 'readonly',
        FormData: 'readonly',
        Image: 'readonly',
        atob: 'readonly',
        btoa: 'readonly',
        createImageBitmap: 'readonly',
      },
    },
  },
  {
    files: ['**/scripts/**/*.ts', '**/drizzle.config.ts', '**/scripts/**/*.js'],
    languageOptions: {
      globals: {
        process: 'readonly',
        __ENV: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
      'no-nested-ternary': 'off',
    },
  },
  {
    ignores: [
      '**/node_modules/',
      '**/dist/',
      '**/.next/',
      '**/.wrangler/',
      '**/coverage/',
      '*.config.*',
      'drizzle/',
    ],
  },
]
