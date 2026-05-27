import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { expect, test } from '@testronaut/angular';
import { mount } from '@testronaut/angular/browser';
import {
  ClickMe,
  MessageService,
} from './components/3-click-me-message-via-service';
import {
  injectMessageServiceFake,
  provideMessageServiceFake,
} from './test-helpers/message-service-fake';
import { MockedMessageService } from './test-helpers/mocked-message-service';

/**
 * Demonstrates mocking and faking services.
 *
 * The test suite overrides both the `MessageService` via `TestBed.configureTestingModule`.
 *
 * Any code, which runs in the browser, has to be imported from a separate or has
 * be declared within the `inPage` function.
 */
test('should use the real message service', async ({ inPage, page }) => {
  await inPage(() => mount(ClickMe));
  await page.getByRole('button', { name: 'Click me' }).click();
  await expect(page.getByText('Lift Off!')).toBeVisible();
});

test.describe('mocks', () => {
  test('should mock the message service embedded', async ({ inPage, page }) => {
    await inPage(() => {
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

    await inPage(() => TestBed.createComponent(ClickMe));
    await page.getByRole('button', { name: 'Click me' }).click();
    await expect(page.getByText('Mocked Lift Off!')).toBeVisible();
  });

  test('should mock the message service (externalized)', async ({
    inPage,
    page,
  }) => {
    await inPage(() => {
      TestBed.configureTestingModule({
        providers: [
          { provide: MessageService, useClass: MockedMessageService },
        ],
      });
    });
    await inPage(() => TestBed.createComponent(ClickMe));
    await page.getByRole('button', { name: 'Click me' }).click();
    await expect(page.getByText('Mocked Lift Off!')).toBeVisible();
  });
});

test.describe('fakes', () => {
  test('should fake the message service embedded', async ({
    inPage,
    inPageWithNamedFunction,
    page,
  }) => {
    await inPageWithNamedFunction('fake the message service', () => {
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

    await inPage(() => TestBed.createComponent(ClickMe));
    await page.getByRole('button', { name: 'Click me' }).click();
    await expect(page.getByText('Fake Lift Off!')).toBeVisible();
  });

  test('should fake the message service externalized', async ({
    inPage,
    page,
  }) => {
    await inPage(() => {
      TestBed.configureTestingModule({
        providers: [provideMessageServiceFake()],
      });

      injectMessageServiceFake().setMessage('Fake Lift Off!');
    });

    await inPage(() => TestBed.createComponent(ClickMe));
    await page.getByRole('button', { name: 'Click me' }).click();
    await expect(page.getByText('Fake Lift Off!')).toBeVisible();
  });
});
