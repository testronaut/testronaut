export const angularJsonTemplate = {
  $schema: './node_modules/@angular/cli/lib/config/schema.json',
  version: 1,
  cli: {
    packageManager: 'pnpm',
  },
  projects: {
    eternal: {
      projectType: 'application',
      root: '',
      sourceRoot: 'src',
      prefix: 'app',
      architect: {
        build: {
          builder: '@angular/build:application',
          options: {
            outputPath: 'dist/eternal',
            index: 'src/index.html',
            browser: 'src/main.ts',
            tsConfig: 'tsconfig.app.json',
            inlineStyleLanguage: 'scss',
            assets: ['src/favicon.ico', 'src/assets'],
            styles: [
              '@angular/material/prebuilt-themes/indigo-pink.css',
              'src/styles.scss',
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
                  replace: 'src/environments/environment.ts',
                  with: 'src/environments/environment.development.ts',
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
