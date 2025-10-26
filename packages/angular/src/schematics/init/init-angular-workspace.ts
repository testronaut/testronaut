export const angularJsonTemplate = {
  $schema: './node_modules/@angular/cli/lib/config/schema.json',
  version: 1,
  cli: {
    packageManager: 'pnpm',
  },
  projects: {
    eternal: {
      projectType: 'application',
      root: 'projects/test',
      sourceRoot: 'src',
      prefix: 'app',
      architect: {
        build: {
          builder: '@angular/build:application',
          options: {
            outputPath: 'dist/eternal',
            index: 'projects/test/src/index.html',
            browser: 'projects/test/src/main.ts',
            tsConfig: 'projects/test/tsconfig.app.json',
            inlineStyleLanguage: 'scss',
            assets: [
              'projects/test/src/favicon.ico',
              'projects/test/src/assets',
            ],
            styles: [
              '@angular/material/prebuilt-themes/indigo-pink.css',
              'projects/test/src/styles.scss',
            ],
            scripts: [],
          },
          configurations: {
            production: {
              budgets: [
                {
                  type: 'initial',
                  maximumWarning: '500kb',
                  maximumError: '1mb',
                },
                {
                  type: 'anyComponentStyle',
                  maximumWarning: '2kb',
                  maximumError: '4kb',
                },
              ],
              outputHashing: 'all',
            },
            development: {
              optimization: false,
              extractLicenses: false,
              sourceMap: true,
              fileReplacements: [
                {
                  replace: 'projects/test/src/environments/environment.ts',
                  with: 'projects/test/src/environments/environment.development.ts',
                },
              ],
            },
            defaultConfiguration: 'production',
          },
        },
        serve: {
          builder: '@angular/build:dev-server',
          configurations: {
            production: {
              buildTarget: 'eternal:build:production',
            },
            development: {
              buildTarget: 'eternal:build:development',
            },
          },
          defaultConfiguration: 'development',
        },
      },
    },
  },
};
