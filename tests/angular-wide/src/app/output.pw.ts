import { expect, test } from '@testronaut/angular';
import { Rating } from './rating';

/* Outputs support is temporarily disabled.
 * @see https://github.com/testronaut/testronaut/issues/107 */
test.skip('mount listens to outputs', async ({ page, inPage }) => {
  await inPage('mount', () => {
    // TODO: Implement outputs support via #107
  });

  await page.getByRole('button').nth(4).click();

  await page.getByRole('button').nth(2).click();

  // expect(outputs.ratingChange.calls).toEqual([5, 3]);
});
