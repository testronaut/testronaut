import { expect, test } from '@testronaut/angular';
import { Clicker } from './clicker';

test.describe('clicker', () => {
  test(`anonymous mount`, async ({ page, mount }) => {
    await mount(Clicker);
    await page.getByRole('button').click();

    await expect(page.getByText('You clicked me')).toBeVisible();
  });
});
