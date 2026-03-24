import { expect, test } from '@testronaut/angular';
import { mount } from '@testronaut/angular/browser';
import { TestBed } from '@angular/core/testing';
import { Greetings, provideGreeting } from './greetings.ng';

test(`anonymous mount`, async ({ page, inPage }) => {
  await inPage(() => mount(Greetings));

  await expect(page.getByRole('heading')).toHaveText('Hello Guest!');
});

test(`named mount with inputs`, async ({ page, inPage }) => {
  await inPage(() =>
    mount(Greetings, {
      inputs: {
        name: 'Foo',
      },
    })
  );

  await expect(page.getByRole('heading')).toHaveText('Hello Foo!');
});

test(`named mount with DI`, async ({ page, inPage }) => {
  await inPage(() =>
    TestBed.configureTestingModule({ providers: [provideGreeting('Servus')] })
  );

  await inPage({ hello: 'hello' }, ({ hello }) => {
    console.log(hello);
    const a: string = hello;
  })

  await inPage(() => mount(Greetings));

  await expect(page.getByRole('heading')).toHaveText('Servus Guest!');
});
