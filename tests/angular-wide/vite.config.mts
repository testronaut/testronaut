import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { defineConfig, mergeConfig } from 'vite';
import { defineConfig as defineVitestConfig } from 'vitest/config';

const allTestFiles = ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'];
const wideTestFiles = [
  'src/**/*.wide.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
];

export default mergeConfig(
  defineConfig({
    root: __dirname,
    cacheDir: '../../node_modules/.vite/packages/angular',
    plugins: [nxViteTsPaths(), nxCopyAssetsPlugin(['*.md'])],
  }),
  defineVitestConfig({
    test: {
      /* Use forks to allow chdir. */
      pool: 'forks',
      typecheck: {
        enabled: true,
        tsconfig: 'tsconfig.spec.json',
      },
      watch: false,
      globals: true,
      environment: 'node',
      include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      reporters: ['default'],
      coverage: {
        reportsDirectory: '../../coverage/packages/angular',
        provider: 'v8',
      },
      projects: [
        {
          test: {
            name: 'narrow',
            include: allTestFiles,
            exclude: wideTestFiles,
          },
        },
        {
          test: {
            name: 'wide',
            include: wideTestFiles,
            /* These wide tests are slow as we generate apps, install packages, etc... */
            testTimeout: 120_000,
          },
        },
      ],
    },
  })
);
