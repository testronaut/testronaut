# Getting Started

## Quick glance

Better code than words, here is a simple example of an Angular Testronaut test:

```ts
import { test, expect } from '@testronaut/angular';
import { Basket } from './basket.ng';

test('should render clear basket button', async ({ page, mount }) => {
  await mount(Basket);
  await expect(page.getByRole('button', { name: 'Clear basket' })).toBeVisible();
});
```

This test will work just like any other Playwright test, but the `Basket` component will be mounted in the browser.

## Setup

Here is how you can get this to work. _(It's a bit boilerplat-y for now, but we're working on a better experience for the next release)_

### 1. Install Playwright and Testronaut

```sh
pnpm add -D @playwright/test @testronaut/angular @testronaut/core
# or use npm if you prefer when things are slow so that you can grab some coffee and relax ☕️
npm add -D @playwright/test @testronaut/angular @testronaut/core
```

### 2. Create Test Server files

```sh
mkdir -p testronaut

cp src/index.html testronaut/

cat > testronaut/main.ts <<EOF
import { setUpTestronautAngular } from '@testronaut/angular/browser';
import './generated';
setUpTestronautAngular();
EOF

cat > testronaut/tsconfig.json <<EOF
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "outDir": "../../dist/out-tsc",
    "types": []
  },
  "files": ["main.ts"],
  "include": ["**/*.d.ts"]
}
EOF

echo generated > testronaut/.gitignore
```

### 3. Configure Test Server

Update `angular.json` _(or `project.json` if you are using Nx)_ by adding a `testronaut` configuration:

```json
{
  ...
  "build": {
    "configurations": {
      "testronaut": {
        "optimization": false,
        "extractLicenses": false,
        "sourceMap": true,
        "browser": "testronaut/main.ts",
        "index": "testronaut/index.html",
        "tsConfig": "testronaut/tsconfig.json"
      }
    }
  },
  "serve": {
    "configurations": {
      "testronaut": {
        "buildTarget": "demos-angular:build:testronaut"
      }
    }
  },
  ...
}
```

### 4. Configure Playwright

Create a `playwright-testronaut.config.ts` file:

```ts
import { defineConfig, devices, withTestronautAngular } from '@testronaut/angular';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);

export default defineConfig(
  withTestronautAngular({
    configPath: __filename,
    testServer: {
      command: 'ng serve --configuration testronaut --port {port} --live-reload false',
    },
  }),
  {
    testDir: '.',
    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: !!process.env['CI'],
    /* Retry on CI only */
    retries: process.env['CI'] ? 2 : 0,
    reporter: 'html',
    use: {
      trace: 'on-first-retry',
    },

    projects: [
      { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
      { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
      { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    ],
  }
);
```
