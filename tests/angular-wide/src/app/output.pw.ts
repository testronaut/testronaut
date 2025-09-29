import { expect, test } from '@testronaut/angular';
import { Rating } from './rating';

/* TODO: remove this test once we finish implementing output listening (i.e. next test). */
test('🚧 mount detects outputs', async ({ page, mount }) => {
  const { outputs } = await mount(Rating);

  expect(outputs).toEqual({
    ratingChange: { calls: [] },
  });
});

test.skip('🚧 mount listens to outputs', async ({ page, mount }) => {
  const { outputs } = await mount('listen to rating change', Rating);

  await page.getByRole('button').nth(4).click();

  await page.getByRole('button').nth(2).click();

  expect(outputs.ratingChange.calls).toEqual([5, 3]);
});
