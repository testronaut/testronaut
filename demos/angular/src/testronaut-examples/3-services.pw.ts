import { test, expect } from '@testronaut/angular';
import {
  ClickMe,
  MessageService,
} from './components/3-click-me-message-via-service';
import { TestBed } from '@angular/core/testing';
import { MockedMessageService } from './test-helpers/mocked-message-service';
import { Injectable } from '@angular/core';
import {
  injectMessageServiceFake,
  provideMessageServiceFake,
} from './test-helpers/message-service-fake';

/**
 * Demonstrates mocking and faking services.
 *
 * The test suite overrides both the `MessageService` via `TestBed.configureTestingModule`.
 *
 * Any code, which runs in the browser, has to be imported from a separate or has
 * be declared within the `inPageWithFunctionName` function.
 *
 * A unique `inPageWithFunctionName` identifier is provided because this file performs multiple browser actions
 * (e.g. `mount` and `inPageWithFunctionName`).
 */
test('should use the real message service', async ({ mount, page }) => {
  await mount('mount1', ClickMe);
  await page.getByRole('button', { name: 'Click me' }).click();
  await expect(page.getByText('Lift Off!')).toBeVisible();
});

test.describe('mocks', () => {
  test('should mock the message service embedded', async ({
    mount,
    page,
    inPageWithFunctionName,
  }) => {
    await inPageWithFunctionName('mock the message service', () => {
      class EmbeddedMockedMessageService {
        getMessage() {
          return 'Mocked Lift Off!';
        }
      }

      TestBed.configureTestingModule({
        providers: [
          {
            provide: MessageService,
            useClass: EmbeddedMockedMessageService,
          },
        ],
      });
    });

    await mount('mount2', ClickMe);
    await page.getByRole('button', { name: 'Click me' }).click();
    await expect(page.getByText('Mocked Lift Off!')).toBeVisible();
  });

  test('should mock the message service (externalized)', async ({
    mount,
    page,
    inPageWithFunctionName,
  }) => {
    await inPageWithFunctionName('mock the message service externalized', () => {
      TestBed.configureTestingModule({
        providers: [
          { provide: MessageService, useClass: MockedMessageService },
        ],
      });
    });
    await mount('mount3', ClickMe);
    await page.getByRole('button', { name: 'Click me' }).click();
    await expect(page.getByText('Mocked Lift Off!')).toBeVisible();
  });
});

test.describe('fakes', () => {
  test('should fake the message service embedded', async ({
    mount,
    page,
    inPageWithFunctionName,
  }) => {
    await inPageWithFunctionName('fake the message service embedded', () => {
      @Injectable({ providedIn: 'root' })
      class MessageServiceFake implements MessageService {
        #message = '';
        getMessage() {
          return this.#message;
        }
        setMessage(message: string) {
          this.#message = message;
        }
      }

      TestBed.configureTestingModule({
        providers: [
          {
            provide: MessageService,
            useExisting: MessageServiceFake,
          },
        ],
      });

      TestBed.inject(MessageServiceFake).setMessage('Fake Lift Off!');
    });

    await mount('mount4', ClickMe);
    await page.getByRole('button', { name: 'Click me' }).click();
    await expect(page.getByText('Fake Lift Off!')).toBeVisible();
  });

  test('should fake the message service externalized', async ({
    mount,
    page,
    inPageWithFunctionName,
  }) => {
    await inPageWithFunctionName('fake the message service externalized', () => {
      TestBed.configureTestingModule({
        providers: [provideMessageServiceFake()],
      });

      injectMessageServiceFake().setMessage('Fake Lift Off!');
    });

    await mount('mount5', ClickMe);
    await page.getByRole('button', { name: 'Click me' }).click();
    await expect(page.getByText('Fake Lift Off!')).toBeVisible();
  });
});
