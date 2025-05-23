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

Here is how you get such an example to work:

## Install Testronaut

## Create a test server configuration

## Make sure the `generated` folder is ignored
