import { expect, test } from '@testronaut/angular';
import { mount } from '@testronaut/angular/browser';
import { Clicker } from './clicker';

test('anonymous inPage containing an Angular-decorated component resolves correctly', async ({
  page,
  inPage,
}) => {
  await inPage(() => mount(Clicker));
  await expect(page.getByRole('button')).toBeVisible();
});
