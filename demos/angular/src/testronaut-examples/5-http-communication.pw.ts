import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { expect, test } from '@testronaut/angular';
import { ClickMeWithHttp } from './components/5a-click-me-with-http';
import { ClickMeWithResource } from './components/5b-click-me-with-resource';
import { Type } from '@angular/core';

for (const name of [
  'Component using HttpClient',
  'Component using httpResource',
]) {
  test.describe(name, () => {
    test('respond via `HttpTestingController', async ({
      page,
      runInBrowser,
    }) => {
      await runInBrowser('config1', () => {
        TestBed.configureTestingModule({
          providers: [provideHttpClient(), provideHttpClientTesting()],
        });
      });

      await runInBrowser('mount1', { name }, ({ name }) => {
        TestBed.createComponent(
          (name.endsWith('httpResource')
            ? ClickMeWithResource
            : ClickMeWithHttp) as Type<unknown>,
        );
      });
      await page.getByRole('button', { name: 'Click me' }).click();

      await runInBrowser('respond1', () => {
        const httpTestingController = TestBed.inject(HttpTestingController);
        httpTestingController
          .expectOne('https://testronaut.dev/lift-off')
          .flush('Lift Off!');
      });
      await expect(page.getByText('Lift Off!')).toBeVisible();
    });

    test('respond via page.route', async ({ page, runInBrowser }) => {
      await runInBrowser('config2', () => {
        TestBed.configureTestingModule({
          providers: [provideHttpClient()],
        });
      });

      await runInBrowser('mount2', { name }, ({ name }) => {
        TestBed.createComponent(
          (name.endsWith('httpResource')
            ? ClickMeWithResource
            : ClickMeWithHttp) as Type<unknown>,
        );
      });

      await page.route('https://testronaut.dev/lift-off', (route) => {
        route.fulfill({
          json: 'Lift Off!',
        });
      });

      await page.getByRole('button', { name: 'Click me' }).click();
      await expect(page.getByText('Lift Off!')).toBeVisible();
    });
  });
}
