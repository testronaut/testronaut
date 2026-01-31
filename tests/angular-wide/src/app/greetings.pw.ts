import { expect, test } from '@testronaut/angular';
import { configure } from '@testronaut/angular/browser';
import { TestBed } from '@angular/core/testing';
import { Greetings, provideGreeting } from './greetings.ng';

test(`anonymous mount`, async ({ page, inPage }) => {
  await inPage(() => TestBed.createComponent(Greetings));

  await expect(page.getByRole('heading')).toHaveText('Hello Guest!');
});

/* Inputs support is temporarily disabled.
 * @see https://github.com/testronaut/testronaut/issues/107 */
test.skip(`named mount with inputs`, async ({ page: _page, inPage: _inPage }) => {
  // await inPage('hello foo', { inputs: { name: 'Foo' } }, ({ inputs }) =>
  //   mount(Greetings, { inputs })
  // );
  //
  // await expect(page.getByRole('heading')).toHaveText('Hello Foo!');
});

test(`named mount with DI`, async ({ page, inPage }) => {
  await inPage('configure providers', () =>
    configure({ providers: [provideGreeting('Servus')] })
  );

  await inPage('hello austria', () => TestBed.createComponent(Greetings));

  await expect(page.getByRole('heading')).toHaveText('Servus Guest!');
});
