import { expect, test } from '@testronaut/angular';
/* HACK: Rename the `mount` function to bypass the Angular transform.
 * Disabling the transform would break other tests and pollute the PR. */
import { mount as ngMount } from '@testronaut/angular/browser';
import { getEventBus } from '@testronaut/core/browser';
import { Rating } from './rating';

test('mount listens to outputs', async ({ page, runInBrowser }) => {
  const { outputs } = await runInBrowser(() => ngMount(Rating));

  await page.getByRole('button').nth(4).click();

  await page.getByRole('button').nth(2).click();

  expect(outputs.ratingChange.calls).toEqual([5, 3]);
});

test('some custom integration', async ({ page, runInBrowser }) => {
  const { myEvents } = await runInBrowser('custom events', () => {
    const eventBus = getEventBus<{ message: string; counterChange: number }>();

    eventBus.emit('message', 'initialized');

    let counter = 0;
    document.body.innerHTML = '<button>Click me</button>';
    document.body.querySelector('button')?.addEventListener('click', () => {
      eventBus.emit('counterChange', ++counter);
    });

    return {
      myEvents: eventBus.events,
    };
  });

  expect(myEvents.message.calls).toEqual(['initialized']);

  await page.getByRole('button').click();
  await page.getByRole('button').click();
  await page.getByRole('button').click();

  expect(myEvents.counterChange.calls).toEqual([1, 2, 3]);
});
