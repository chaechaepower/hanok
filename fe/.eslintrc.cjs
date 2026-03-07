module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: [
    '@typescript-eslint',
    'react-hooks',
    'react-refresh',
    'vitest-globals',
    'simple-import-sort',
    'unused-imports',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react-refresh/recommended',
    'plugin:prettier/recommended',
  ],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    'no-console': 'off',
    'no-alert': 'off',
    'react/react-in-jsx-scope': 'off',

    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',

    'react-refresh/only-export-components': 'off',

    'prettier/prettier': ['error', { endOfLine: 'auto' }],

    'simple-import-sort/imports': 'error',
    'simple-import-sort/exports': 'error',

    'unused-imports/no-unused-imports': 'error',

    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': 'off',

    'unused-imports/no-unused-vars': [
      'warn',
      {
        vars: 'all',
        varsIgnorePattern: '^_',
        args: 'after-used',
        argsIgnorePattern: '^_',
      },
    ],
  },
  overrides: [
    {
      files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
      env: {
        'vitest-globals/env': true,
      },
    },
  ],
  ignorePatterns: ['dist', 'node_modules', 'vite.config.ts'],
};
