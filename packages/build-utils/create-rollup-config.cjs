const { withNx } = require('@nx/rollup/with-nx');

/**
 * @param {import('@nx/rollup/with-nx').RollupWithNxPluginOptions} & {keepPath?: {pattern: RegExp, dirname: string} options
 */
exports.createRollupConfig = (options) => {
  const defaultOptions = {
    generatePackageJson: false,
    outputPath: './dist',
    tsConfig: './tsconfig.lib.json',
    compiler: 'tsc',
    format: ['esm'],
    assets: [],
  };

  const base = withNx({ ...defaultOptions, ...options });

  return {
    ...base,
    output: base.output.map((output) => ({
      ...output,
      chunkFileNames: '[name].mjs',
      entryFileNames: '[name].mjs',
    })),
  };
};
