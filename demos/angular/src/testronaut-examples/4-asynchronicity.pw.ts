import { test, expect } from '@testronaut/angular';
import { TestBed } from '@angular/core/testing';
import { Countdown } from './components/4-countdown';

/**
 * This test shows on how to deal with asynchronous tasks.
 * In most cases, Playwright's auto-waiting will be enough, since
 * the asynchronous tasks will usually run as soon as the thread
 * is free.
 *
 * But sometimes, asynchronous take longer and they should not
 * make the test running long.
 *
 * The countdown component counts down from 3 to 0 every second.
 * So a typical test would take 3 seconds for the component to
 * reach number 0.
 *
 * This example shows how to speed up the test by using the `page.clock` API.
 */

test('should speed up the countdown', async ({ inPage, page }) => {
  await page.clock.install();
  await inPage('mount2', () => TestBed.createComponent(Countdown));
  await expect(page.getByText('3')).toBeVisible();
  await page.clock.runFor(3000);
  await expect.configure({ timeout: 500 })(page.getByText('0')).toBeVisible();
});
