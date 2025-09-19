const { withNx } = require('@nx/rollup/with-nx');

/**
 * @param {string} main
 * @param {string[]} additionalEntryPoints
 */
exports.createRollupConfig = ({ main, additionalEntryPoints }) => {
  const base = withNx({
    main,
    additionalEntryPoints,
    generatePackageJson: false,
    outputPath: './dist',
    tsConfig: './tsconfig.lib.json',
    compiler: 'tsc',
    format: ['esm'],
  });

  return {
    ...base,
    output: base.output.map((output) => ({
      ...output,
      chunkFileNames: '[name].mjs',
      entryFileNames: '[name].mjs',
    })),
  };
};
