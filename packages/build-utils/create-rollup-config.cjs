const { withNx } = require('@nx/rollup/with-nx');

/**
 * @param {import('@nx/rollup/with-nx').RollupWithNxPluginOptions} & {keepPath?: {pattern: RegExp, dirname: string} options
 */
exports.createRollupConfig = ({ main, input = {}, assets = [] }) => {
  const base = withNx({
    /* This is the executor's default behavior,
     * and also the most straightforward way as
     * it does not create a temporary tsconfig
     * with paths to dist etc...
     * This also fixes build on windows
     * Cf. https://github.com/nrwl/nx/issues/33073.  */
    buildLibsFromSource: true,
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
