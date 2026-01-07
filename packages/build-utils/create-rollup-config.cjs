const { withNx } = require('@nx/rollup/with-nx');

/**
 * @param {import('@nx/rollup/with-nx').RollupWithNxPluginOptions} & {keepPath?: {pattern: RegExp, dirname: string} options
 */
exports.createRollupConfig = ({ main, input = {}, assets = [] }) => {
  const base = withNx({
    generatePackageJson: false,
    outputPath: './dist',
    tsConfig: './tsconfig.lib.json',
    compiler: 'tsc',
    format: ['esm'],
    main,
    assets,
  });

  return {
    ...base,
    input: {
      ...base.input,
      ...input,
    },
    output: base.output.map((output) => ({
      ...output,
      chunkFileNames: '[name].mjs',
      entryFileNames: '[name].mjs',
    })),
  };
};
