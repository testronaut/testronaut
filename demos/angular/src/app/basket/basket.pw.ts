import { expect, test } from '@testronaut/angular';
import { Basket } from './basket.ng';

test('load the basket', async ({ page, mount }) => {
  await mount(Basket);
  await expect(page.getByRole('listitem')).toHaveText([
    /Apple/,
    /Water/,
    /Bread/,
  ]);
});
