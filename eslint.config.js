import js from '@eslint/js';
import ts from 'typescript-eslint';
import globals from 'globals';

// These are rules required because of legacy code,
// but we probably will want to enable these lints
// in the future.
const legacyRules = {
  '@typescript-eslint/no-var-requires': 'off',
  '@typescript-eslint/no-this-alias': 'off',
  '@typescript-eslint/no-unused-vars': 'off',
  '@typescript-eslint/no-empty-object-type': 'off',
  '@typescript-eslint/no-unused-expressions': 'off',
  '@typescript-eslint/no-unsafe-function-type': 'off'
};

const rules = {
  'comma-dangle': ['error', 'never'],
  'no-console': 'error',
  'no-cond-assign': 'off',
  'no-fallthrough': ['error', { commentPattern: 'break omitted' }],
  semi: 'error',
  quotes: ['error', 'single', { avoidEscape: true }],
  'prefer-const': 'error',
  'sort-imports': [
    'error',
    {
      ignoreCase: false,
      ignoreDeclarationSort: true
    }
  ],
  ...legacyRules
};

export default [
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    rules
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.d.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    rules: {
      ...rules,
      '@typescript-eslint/ban-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': 'off'
    }
  },
  {
    ignores: [
      'docs',
      '**/build',
      '**/node_modules',
      'packages/vega-typings/tests/dataflow/**.ts'
    ]
  }
];
