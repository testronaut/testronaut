import { expect, test } from '@testronaut/angular';
import { Rating } from './rating';

test.skip('🚧 outputs', async ({ page, mount }) => {
  /* @ts-expect-error - 🚧 work in progress */
  const { outputs } = await mount(Rating);

  await page.getByRole('button').nth(4).click();

  await page.getByRole('button').nth(2).click();

  expect(outputs.ratingChange.calls).toEqual([5, 3]);
});
