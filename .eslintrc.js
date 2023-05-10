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
  ]
};

module.exports = {
  extends: ['eslint:recommended'],
  env: {
    es2022: true,
    browser: true,
    node: true
  },
  parserOptions: {
    parser: '@babel/eslint-parser',
    sourceType: 'module',
    requireConfigFile: false
  },
  rules: rules,
  overrides: [
    {
      files: ['*.{ts,tsx}'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint'],
      extends: ['plugin:@typescript-eslint/recommended'],
      rules: {
        ...rules,
        '@typescript-eslint/ban-types': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/no-unused-vars': 'off'
      }
    }
  ]
};
