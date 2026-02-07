import { test, expect } from '@testronaut/angular';
import { TestBed } from '@angular/core/testing';
import { ClickMe } from './components/1-click-me';

test('should show the click me component', async ({
  inPageWithNamedFunction,
  page,
}) => {
  await inPageWithNamedFunction('mount1', () =>
    TestBed.createComponent(ClickMe)
  );
  await page.getByRole('button', { name: 'Click me' }).click();
  await expect(page.getByText('Lift Off!')).toBeVisible();
});

// Mount with options is not supported at the moment. Will be re-introduced in issue #107.
// test('should change the click me label', async ({ mount, page }) => {
//   await mount('mount2', ClickMe, { inputs: { clickMeLabel: 'Press me' } });
//   await page.getByRole('button', { name: 'Press me' }).click();
//   await expect(page.getByText('Lift Off!')).toBeVisible();
// });

// test('should emit an event on click', async ({ mount, page }) => {
//   const { outputs } = await mount('mount3', ClickMe);
//   await page.getByRole('button', { name: 'Click me' }).click();
//   await expect(outputs.clicked.calls).toEqual([1]);
//
//   await page.getByRole('button', { name: 'Click me' }).click();
//   await page.getByRole('button', { name: 'Click me' }).click();
//   await expect(outputs.clicked.calls).toEqual([1, 2, 3]);
// });
