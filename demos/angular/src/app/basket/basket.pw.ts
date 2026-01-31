import { expect, test } from '@testronaut/angular';
import { mount } from '@testronaut/angular/browser';
import { Basket } from './basket.ng';

test('load the basket', async ({ page, inPage }) => {
  await inPage(() => mount(Basket));
  await expect(page.getByRole('listitem')).toHaveText([
    /Apple/,
    /Water/,
    /Bread/,
  ]);
});
