const { withNx } = require('@nx/rollup/with-nx');

module.exports = withNx({
  main: './src/index.ts',
  additionalEntryPoints: ['./src/browser.ts'],
  generatePackageJson: false,
  outputPath: './dist',
  tsConfig: './tsconfig.lib.json',
  compiler: 'tsc',
  format: ['cjs', 'esm'],
});
