import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { defineConfig, mergeConfig } from 'vite';
import { defineConfig as defineVitestConfig } from 'vitest/config';

export default mergeConfig(
  defineConfig({
    root: __dirname,
    cacheDir: '../../node_modules/.vite/packages/core',
    plugins: [nxViteTsPaths(), nxCopyAssetsPlugin(['*.md'])],
  }),
  defineVitestConfig({
    test: {
      watch: false,
      globals: true,
      environment: 'node',
      include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      reporters: ['default'],

      coverage: {
        reportsDirectory: '../../coverage/packages/core',
        provider: 'v8',
      },
    },
  })
);
