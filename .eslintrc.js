module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.eslint.json', './packages/**/*/tsconfig.json']
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ],
  rules: {
    'prettier/prettier': 'error',
    'simple-import-sort/imports': 'error',
  },
  plugins: [
    '@typescript-eslint',
    'prettier',
    'simple-import-sort'
  ],
};
