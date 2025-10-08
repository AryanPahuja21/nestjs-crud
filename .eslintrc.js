module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  rules: {
    // ✅ Enforce camelCase for variables & functions
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'variableLike',
        format: ['camelCase'],
        leadingUnderscore: 'allow',
      },
      {
        selector: 'function',
        format: ['camelCase'],
      },
      // ✅ Enforce PascalCase for classes, interfaces, and types
      {
        selector: 'typeLike',
        format: ['PascalCase'],
      },
    ],

    // Optional: consistent import ordering
    'sort-imports': ['warn', { ignoreDeclarationSort: true }],

    // Optional: enforce semicolons and consistent quotes
    semi: ['error', 'always'],
    quotes: ['error', 'single'],
  },
};
