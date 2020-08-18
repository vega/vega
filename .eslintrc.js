module.exports = {
  extends: [
    'eslint:recommended'
  ],
  env: {
    es6: true,
    browser: true,
    node: true
  },
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module'
  },
  rules: {
    'comma-dangle': ['error', 'never'],
    'no-console': 'error',
    'no-cond-assign': 'off',
    'no-fallthrough': ['error', { commentPattern: 'break omitted' }],
    'semi': 'error',
    'quotes': ['error', 'single', { avoidEscape: true }],
    'prefer-const': 'warn',  // TODO: make error when we don't define multiple variables at once anymore
    'sort-imports': ['error', {
      ignoreCase: false,
      ignoreDeclarationSort: true
    }]
  }
};
