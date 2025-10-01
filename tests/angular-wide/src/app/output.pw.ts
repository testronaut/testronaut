import { expect, test } from '@testronaut/angular';
import { Rating } from './rating';

test('mount listens to outputs', async ({ page, mount }) => {
  const { outputs } = await mount(Rating);

  await page.getByRole('button').nth(4).click();

  await page.getByRole('button').nth(2).click();

  expect(outputs.ratingChange.calls).toEqual([5, 3]);
});
