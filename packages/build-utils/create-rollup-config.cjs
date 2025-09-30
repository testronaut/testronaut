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

  const base = withNx({...defaultOptions, ...options});

  return {
    ...base,
    output: base.output.map((output) => ({
      ...output,
      chunkFileNames: '[name].mjs',
      entryFileNames: (chunk) => {
        const absolutePath = (chunk.facadeModuleId || '').replace(/\\/g, '/'); // normalize
        if (options.keepPath && options.keepPath.pattern.test(absolutePath)) {
          
        const relFromSrc = absolutePath.slice(options.keepPath.dirname.length + 1);
        const withoutExt = relFromSrc.replace(/\.[^.]+$/, '');

        console.log('relative path', relFromSrc);
        console.log('without extension', withoutExt);


        return `${withoutExt}.mjs`;
        }
        return '[name].mjs';
      },
    }))
  };
};
