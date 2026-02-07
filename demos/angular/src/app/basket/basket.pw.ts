import { expect, test } from '@testronaut/angular';
import { TestBed } from '@angular/core/testing';
import { Basket } from './basket.ng';

test('load the basket', async ({ page, inPage }) => {
  await inPage(() => TestBed.createComponent(Basket));
  await expect(page.getByRole('listitem')).toHaveText([
    /Apple/,
    /Water/,
    /Bread/,
  ]);
});
