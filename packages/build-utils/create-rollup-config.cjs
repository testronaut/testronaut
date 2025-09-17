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
    format: ['cjs', 'esm'],
  });

  return {
    ...base,
    output: base.output.map((output) => {
      const fileNames = output.format === 'cjs' ? '[name].cjs' : '[name].mjs';

      return {
        ...output,
        chunkFileNames: fileNames,
        entryFileNames: fileNames,
      };
    }),
  };
};
