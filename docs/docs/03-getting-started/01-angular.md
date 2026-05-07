import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Angular

## Quick glance

Better code than words, here is a simple example of an Angular Testronaut test:

```ts
import { expect, test } from '@testronaut/angular';
import { mount } from '@testronaut/angular/browser';
import { SpaceshipLauncher } from './spaceship-launcher';

test('take off', async ({ inPage, page }) => {
  await inPage(() => mount(SpaceshipLauncher));
  await page.getByRole('button', { name: 'Take off' }).click();
  await expect(page.getByRole('status')).toHaveText('Spaceship launched!');
});
```

This test will work just like any other Playwright test, but the `SpaceshipLauncher` component will be mounted in the browser.

## Setup

<Tabs>
  <TabItem value="angular-cli" label="Angular CLI" default>
    ```sh
    npm exec ng add @testronaut/angular
    ```
  </TabItem>
  <TabItem value="nx" label="Nx">
    ```sh
    npm exec nx add @testronaut/angular
    ```
  </TabItem>
</Tabs>

## Run the tests

```sh
npm exec playwright test -c playwright-testronaut.config.mts
```
