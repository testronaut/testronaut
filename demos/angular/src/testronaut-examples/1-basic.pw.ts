import { expect, test } from '@testronaut/angular';
import { mount } from '@testronaut/angular/browser';
import { ClickMe } from './components/1-click-me';

test('should show the click me component', async ({ inPage, page }) => {
  await inPage(() => mount(ClickMe));
  await page.getByRole('button', { name: 'Click me' }).click();
  await expect(page.getByText('Lift Off!')).toBeVisible();
});

test('should change the click me label', async ({
  inPage,
  page,
}) => {
  await inPage(() =>
    mount(ClickMe, { inputs: { clickMeLabel: 'Press me' } })
  );
  await page.getByRole('button', { name: 'Press me' }).click();
  await expect(page.getByText('Lift Off!')).toBeVisible();
});
