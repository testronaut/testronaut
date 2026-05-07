# Why Testronaut

A strong frontend testing strategy usually blends several kinds of tests. End-to-end tests with testing frameworks like [Playwright](https://playwright.dev) exercise full pages and user flows; "narrower" tests such as component tests let you zoom in on UI and behavior in isolation.

Adopting a separate stack for component tests would mean **two ways** to query and drive the DOM, duplicated efforts,and Playwright habits that do not always carry over to component tests.

## Meet Testronaut

**Testronaut** is a new approach to component testing. It provides an `inPage` Playwright fixture where instead of navigating to a page, you can mount a component in the browser — or execute arbitrary code within the browser.

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

:::info
What is unique about Testronaut is that the code inside `inPage` and whatever it is importing goes through the exact same build process as your application code _(e.g. Angular CLI's Dev Server, Vite with React Compiler, etc.)_.
:::

## Benefits

- **Production Symmetry**: The exercised code is built exactly like your application code. This means that the component behaves exactly as it does in production.
- **Clear Boundaries**: Testronaut provides clear boundaries between what is running in the browser and what is running in the test runner.
- **Readable and Maintainable**: You can read and understand the test code just like you would read any other Playwright test.
- **All Playwright Features**: Testronaut is **not** a testing framework, **nor** a wrapper. Therefore, you can use all Playwright features within your tests.
  - **Playwright's Page API**: You can use Playwright's Page API to query and interact with the component in the browser _(e.g. Drag and Drop etc...)_, just like you would in an E2E test.
  - **Record**: You can use Playwright's record feature to generate tests while you are manually interacting with the component in the browser.
  - **Visual Debugging**: You can **visually debug** and inspect rendered output.
  - **AI-Assisted Testing**: You can use Playwright's AI-assisted testing features to generate or debug tests.
