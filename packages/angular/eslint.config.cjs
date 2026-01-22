const baseConfig = require('../../eslint.config.cjs');

module.exports = [
  ...baseConfig,
  {
    ignores: ['**/schematics/**/files/**', 'package.json'],
  },
  {
    files: ['**/*.json'],
    languageOptions: {
      parser: require('jsonc-eslint-parser'),
    },
  },
  {
    files: ['**/package.json', '**/collections.json'],
    rules: {
      '@nx/nx-plugin-checks': 'error',
    },
    languageOptions: {
      parser: require('jsonc-eslint-parser'),
    },
  },
];
