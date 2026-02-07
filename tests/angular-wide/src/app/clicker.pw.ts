import { expect, test } from '@testronaut/angular';
import { TestBed } from '@angular/core/testing';
import { Clicker } from './clicker';

test(`anonymous mount`, async ({ page, inPage }) => {
  await inPage(() => TestBed.createComponent(Clicker));
  await page.getByRole('button').click();

  await expect(page.getByText('You clicked me')).toBeVisible();
});
