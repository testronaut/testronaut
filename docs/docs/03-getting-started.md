# Getting Started

## Quick glance

Better code than words, here is a simple example of an Angular Testronaut test:

```ts
import { test, expect } from '@testronaut/angular';
import { Basket } from './basket.ng';

test('should be able to login', async ({ page, mount }) => {
  await mount(Basket);
  await expect(page.getByRole('button', { name: 'Clear basket' })).toBeVisible();
});
```

This test will work just like any other Playwright test, but the `Basket` component will be mounted in the browser.

## Setup

Since we recommend using `pnpm` as package manager, all the examples use pnpm. Testronaut also works `npm` and `yarn`, though.

### Schematics

The recommended way to get started is by using schematics. It will also generate example tests, to get you started as quickly as possible.

If you're running the Angular CLI, simply execute:

```bash
pnpm ng add @testronaut/angular
```

If you're using Nx instead, install the package and initialize it with:

```bash
pnpm i @testronaut/angular
pnpm nx g @testronaut/angular:init
```

### Manual Setup

If you prefer not to use schematics, you can also set up Testronaut manually.

The following instructions apply to an Angular CLI application.  
If you're using Nx, place the files inside your app folder, for example: `apps/my-app`.

#### 1. Install Playwright and Testronaut

```sh
pnpm add -D @playwright/test @testronaut/angular @testronaut/core

# or use npm if you prefer when things are slow so that you can grab some coffee and relax ☕️
npm add -D @playwright/test @testronaut/angular @testronaut/core
```

#### 2. Create Test Server files

```sh
mkdir -p testronaut

cp src/index.html testronaut/
```

**testronaut/main.ts**

```ts
import { setUpTestronautAngular } from '@testronaut/angular/browser';
import './generated';
setUpTestronautAngular();
```

**testronaut/tsconfig.json**

```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "outDir": "../../dist/out-tsc",
    "types": []
  },
  "files": ["main.ts"],
  "include": ["**/*.d.ts"]
}
```

**testronaut/.gitignore**

```
generated
```

**testronaut/generated/index.ts**

```ts
// This is just an empty file
```

#### 3. Configure Test Server

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

#### 4. Configure Playwright

Create a `playwright-testronaut.config.mts` file:

```ts
import { defineConfig, devices } from '@playwright/test';
import { withTestronautAngular } from '@testronaut/angular';

const config = defineConfig(
  withTestronautAngular({
    configPath: new URL(import.meta.url).pathname,
    testServer: {
      command: 'pnpm ng serve --configuration testronaut --port {port} --live-reload false',
    },
  }),
  {
    projects: [
      {
        name: 'chromium',
        use: { ...devices['Desktop Chrome'] },
      },
    ],
  }
);

export default config;
```
