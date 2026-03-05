import { expect, test } from '@testronaut/angular';
import { mount } from '@testronaut/angular/browser';
import { TestBed } from '@angular/core/testing';
import { Greetings, provideGreeting } from './greetings.ng';

test(`anonymous mount`, async ({ page, inPage }) => {
  await inPage(() => mount(Greetings));

  await expect(page.getByRole('heading')).toHaveText('Hello Guest!');
});

test(`named mount with inputs`, async ({ page, inPageWithNamedFunction }) => {
  await inPageWithNamedFunction('hello foo', () =>
    mount(Greetings, {
      inputs: {
        name: 'Foo',
      },
    })
  );

  await expect(page.getByRole('heading')).toHaveText('Hello Foo!');
});

<<<<<<< HEAD
test(`named mount with DI`, async ({ page, inPageWithNamedFunction }) => {
  await inPageWithNamedFunction('configure providers', () =>
    TestBed.configureTestingModule({ providers: [provideGreeting('Servus')] })
=======
test(`named mount with DI`, async ({ page, mount, inPageWithNamedFunction }) => {
  await inPageWithNamedFunction('configure providers', () =>
    configure({ providers: [provideGreeting('Servus')] })
>>>>>>> main
  );

  await inPageWithNamedFunction('hello austria', () => mount(Greetings));

  await expect(page.getByRole('heading')).toHaveText('Servus Guest!');
});
