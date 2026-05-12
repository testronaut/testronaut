import { expect, test } from '@testronaut/angular';
import { mount } from '@testronaut/angular/browser';
import { Clicker } from './clicker';

// Regression test for https://github.com/testronaut/testronaut/issues/134
// Angular's @Component decorator transforms the class body significantly,
// which broke the lax-hash approach. The line-number approach is immune
// because it uses the source location, not fn.toString().
test('anonymous inPage containing an Angular-decorated component resolves correctly', async ({
  page,
  inPage,
}) => {
  await inPage(() => mount(Clicker));
  await expect(page.getByRole('button')).toBeVisible();
});
