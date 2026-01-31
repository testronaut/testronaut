import { expect, test } from '@testronaut/angular';
import { configure, mount } from '@testronaut/angular/browser';
import { Greetings, provideGreeting } from './greetings.ng';

test(`anonymous mount`, async ({ page, inPage }) => {
  await inPage(() => mount(Greetings));

  await expect(page.getByRole('heading')).toHaveText('Hello Guest!');
});

test(`named mount with inputs`, async ({ page, inPage }) => {
  await inPage('hello foo', { inputs: { name: 'Foo' } }, ({ inputs }) =>
    mount(Greetings, { inputs })
  );

  await expect(page.getByRole('heading')).toHaveText('Hello Foo!');
});

test(`named mount with DI`, async ({ page, inPage }) => {
  await inPage('configure providers', () =>
    configure({ providers: [provideGreeting('Servus')] })
  );

  await inPage('hello austria', () => mount(Greetings));

  await expect(page.getByRole('heading')).toHaveText('Servus Guest!');
});
