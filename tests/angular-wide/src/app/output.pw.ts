import { test } from '@testronaut/angular';

// Mount with options (outputs) is not supported at the moment. Will be re-introduced in issue #107.
// test('mount listens to outputs', async ({ page, mount }) => {
//   const { outputs } = await mount(Rating);
//
//   await page.getByRole('button').nth(4).click();
//
//   await page.getByRole('button').nth(2).click();
//
//   expect(outputs.ratingChange.calls).toEqual([5, 3]);
// });
