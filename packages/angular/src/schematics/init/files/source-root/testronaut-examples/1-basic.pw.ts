import { test, expect } from '@testronaut/angular';
import { ClickMe } from './components/1-click-me';
import { mount } from '@testronaut/angular/browser';

test('should show the click me component', async ({
  inPageWithNamedFunction,
  page,
}) => {
  await inPageWithNamedFunction('mount click me', () => mount(ClickMe));
  await page.getByRole('button', { name: 'Click me' }).click();
  await expect(page.getByText('Lift Off!')).toBeVisible();
});

test('should change the click me label', async ({
  inPageWithNamedFunction,
  page,
}) => {
  await inPageWithNamedFunction('mount click me with inputs', () =>
    mount(ClickMe, { inputs: { clickMeLabel: 'Press me' } })
  );
  await page.getByRole('button', { name: 'Press me' }).click();
  await expect(page.getByText('Lift Off!')).toBeVisible();
});
