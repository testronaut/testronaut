import { expect, test } from '@testronaut/angular';
import { mount } from '@testronaut/angular/browser';
import { Clicker } from './clicker';

test(`anonymous mount`, async ({ page, inPage }) => {
  await inPage(() => mount(Clicker));
  await page.getByRole('button').click();

  await expect(page.getByText('You clicked me')).toBeVisible();
});
