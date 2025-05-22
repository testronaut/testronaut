import { expect, test } from '@testronaut/angular';
import { configure } from '@testronaut/angular/browser';
import { Greetings, provideGreeting } from './greetings.ng';

test(`anonymous mount`, async ({ page, mount }) => {
  await mount(Greetings);

  await expect(page.getByRole('heading')).toHaveText('Hello Guest!');
});

test(`named mount with inputs`, async ({ page, mount }) => {
  await mount('hello foo', Greetings, {
    inputs: {
      name: 'Foo',
    },
  });

  await expect(page.getByRole('heading')).toHaveText('Hello Foo!');
});

test(`named mount with DI`, async ({ page, mount, runInBrowser }) => {
  await runInBrowser('configure providers', () =>
    configure({ providers: [provideGreeting('Servus')] })
  );

  await mount('hello austria', Greetings);

  await expect(page.getByRole('heading')).toHaveText('Servus Guest!');
});
