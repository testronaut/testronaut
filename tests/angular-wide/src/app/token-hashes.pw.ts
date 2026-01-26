import { test, expect } from '@testronaut/angular';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Clicker } from './clicker';
import { CommonModule } from '@angular/common';
import { word1, word2 } from './token-hashes.values';

test.describe('token hashes', () => {
  test(`anonymous mount`, async ({ page, runInBrowser }) => {
    await runInBrowser(() => TestBed.createComponent(Clicker));

    await page.getByRole('button').click();

    await expect(page.getByText('You clicked me')).toBeVisible();
    await runInBrowser(() => console.log('Hello!'));
  });

  test('multipe anonymous runs', async ({ runInBrowser }) => {
    await runInBrowser(() =>
      TestBed.configureTestingModule({
        providers: [provideHttpClient(), provideHttpClientTesting()],
      })
    );
    await runInBrowser(() =>
      TestBed.overrideComponent(Clicker, {
        set: { imports: [CommonModule] },
      })
    );
    await runInBrowser(() => TestBed.createComponent(Clicker));

    const httpTestingController = await runInBrowser(() =>
      TestBed.inject(HttpTestingController)
    );

    await runInBrowser({ word1, word2 }, ({ word1, word2 }) => {
      console.log(word1, word2);
    });

    await runInBrowser({ word1, word2 }, (data) => {
      console.log(data.word1, data.word2);
    });

    await runInBrowser({ foo: 'bar' }, (data) => {
      console.log(data.foo);
    });

    const n1 = 1;
    const n2 = 2;
    await runInBrowser({ n1, n2 }, (data) => {
      console.log(data.n1 + data.n2);
    });

    expect(httpTestingController).toBeDefined();
  });
});
