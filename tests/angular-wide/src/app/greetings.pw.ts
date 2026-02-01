import { expect, test } from '@testronaut/angular';
import { configure } from '@testronaut/angular/browser';
import { TestBed } from '@angular/core/testing';
import { Greetings, provideGreeting } from './greetings.ng';

test(`anonymous mount`, async ({ page, inPage }) => {
  await inPage(() => TestBed.createComponent(Greetings));

  await expect(page.getByRole('heading')).toHaveText('Hello Guest!');
});

// Mount with options is not supported at the moment. Will be re-introduced in issue #107.
// test(`named mount with inputs`, async ({ page, mount }) => {
//   await mount('hello foo', Greetings, {
//     inputs: {
//       name: 'Foo',
//     },
//   });
//
//   await expect(page.getByRole('heading')).toHaveText('Hello Foo!');
// });

test(`named mount with DI`, async ({ page, inPageWithNamedFunction }) => {
  await inPageWithNamedFunction('configure providers', () =>
    configure({ providers: [provideGreeting('Servus')] })
  );

  await inPageWithNamedFunction('hello austria', () =>
    TestBed.createComponent(Greetings)
  );

  await expect(page.getByRole('heading')).toHaveText('Servus Guest!');
});
