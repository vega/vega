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
    'no-console': 'off',
    'no-cond-assign': 'off',
    'no-fallthrough': ['error', { 'commentPattern': 'break omitted' }],
    'semi': 'error',
    'quotes': ['error', 'single', { 'avoidEscape': true }]
  }
};
