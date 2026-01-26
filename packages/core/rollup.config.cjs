const {
  createRollupConfig,
} = require('../build-utils/create-rollup-config.cjs');

module.exports = createRollupConfig({
  main: './src/index.ts',
  input: {
    devkit: './src/devkit.ts',
    browser: './src/browser.ts',
  },
});
