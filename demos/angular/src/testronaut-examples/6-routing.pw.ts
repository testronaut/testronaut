import { provideLocationMocks } from '@angular/common/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { expect, test } from '@testronaut/angular';
import { RoutingMessage } from './components/6-click-me-with-routing';

test('routing', async ({ mount, page, inPageWithFunctionName }) => {
  await inPageWithFunctionName('mount', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(
          [{ path: 'lift-off/:message', component: RoutingMessage }],
          withComponentInputBinding(),
        ),
        provideLocationMocks(),
      ],
    });

    await RouterTestingHarness.create('/lift-off/Go');
  });
  await expect(page.getByText('Go')).toBeVisible();
});
