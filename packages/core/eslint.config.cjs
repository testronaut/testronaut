const baseConfig = require('../../eslint.config.cjs');

module.exports = [
  ...baseConfig,
  {
    ignores: ['devkit.d.ts'],
  },
  {
    files: ['**/*.json'],
    languageOptions: {
      parser: require('jsonc-eslint-parser'),
    },
  },
];
