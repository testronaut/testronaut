import { test, expect } from '@testronaut/angular';
import { mount } from '@testronaut/angular/browser';
import { ClickMe } from './components/1-click-me';

test('should show the click me component', async ({ inPage, page }) => {
  await inPage('mount1', () => mount(ClickMe));
  await page.getByRole('button', { name: 'Click me' }).click();
  await expect(page.getByText('Lift Off!')).toBeVisible();
});

test('should change the click me label', async ({ inPage, page }) => {
  await inPage('mount2', { inputs: { clickMeLabel: 'Press me' } }, ({ inputs }) =>
    mount(ClickMe, { inputs })
  );
  await page.getByRole('button', { name: 'Press me' }).click();
  await expect(page.getByText('Lift Off!')).toBeVisible();
});

/* Outputs support is temporarily disabled.
 * @see https://github.com/testronaut/testronaut/issues/107 */
test.skip('should emit an event on click', async ({ inPage, page }) => {
  await inPage('mount3', () => mount(ClickMe));
  await page.getByRole('button', { name: 'Click me' }).click();
  // await expect(outputs.clicked.calls).toEqual([1]);

  await page.getByRole('button', { name: 'Click me' }).click();
  await page.getByRole('button', { name: 'Click me' }).click();
  // await expect(outputs.clicked.calls).toEqual([1, 2, 3]);
});
