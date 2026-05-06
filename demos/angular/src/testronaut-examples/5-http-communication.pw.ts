import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { expect, test } from '@testronaut/angular';
import { mount } from '@testronaut/angular/browser';
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
      inPage,
    }) => {
      await inPage(() => {
        TestBed.configureTestingModule({
          providers: [provideHttpClient(), provideHttpClientTesting()],
        });
      });

      await inPage(() => {
        return mount(
          (name.endsWith('httpResource')
            ? ClickMeWithResource
            : ClickMeWithHttp) as Type<unknown>
        );
      });
      await page.getByRole('button', { name: 'Click me' }).click();

      await inPage(() => {
        const httpTestingController = TestBed.inject(HttpTestingController);
        httpTestingController
          .expectOne('https://testronaut.dev/lift-off')
          .flush('Lift Off!');
      });
      await expect(page.getByText('Lift Off!')).toBeVisible();
    });

    test('respond via page.route', async ({
      page,
      inPage,
    }) => {
      await inPage(() => {
        TestBed.configureTestingModule({
          providers: [provideHttpClient()],
        });
      });

      await inPage(() => {
        TestBed.createComponent(
          (name.endsWith('httpResource')
            ? ClickMeWithResource
            : ClickMeWithHttp) as Type<unknown>
        );
      });

      await page.route('https://testronaut.dev/lift-off', (route) =>
        route.fulfill({
          json: 'Lift Off!',
        })
      );

      await page.getByRole('button', { name: 'Click me' }).click();
      await expect(page.getByText('Lift Off!')).toBeVisible();
    });
  });
}
