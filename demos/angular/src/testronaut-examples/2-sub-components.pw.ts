import { Component, Directive } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { expect, test } from '@testronaut/angular';
import { mount } from 'packages/angular/browser';
import { ClickMeWithSub } from './components/2-click-me-with-sub-components';
import { ShallowClickDirective } from './test-helpers/shallow-click.directive';
import { ShallowMessageComponent } from './test-helpers/shallow-message.component';

/**
 * Demonstrates shallow overrides (aka. stubs) of components, directives, and pipes
 * using Angular's TestBed inside a Playwright test.
 *
 * The test suite overrides both dependencies `MessageComponent` (selector `app-message`), and the
 * `ClickDirective` (selector `button[appClick]`) via `TestBed.overrideComponent`.
 *
 * Any code, which runs in the browser, has to be imported from a separate or has
 * be declared within the `inPageWithNamedFunction` function.
 *
 * This test shows both ways for shallowing the `MessageComponent` and the `ClickDirective`, via
 * `ShallowMessageComponent` and `ShallowClickDirective`.
 *
 */
test('no test doubles', async ({ inPage, page }) => {
  await inPage(() => mount(ClickMeWithSub));
  const buttonLocator = page.getByRole('button', { name: 'Click me' });

  await expect(buttonLocator).toHaveClass('unclicked');
  await expect(buttonLocator).toBeEnabled();

  await buttonLocator.click();
  await expect(page.getByText('Lift Off!')).toBeVisible();
  await expect(buttonLocator).toHaveClass('clicked');
  await expect(buttonLocator).toBeDisabled();
});

test('embedded shallow components', async ({
  inPage,
  page,
}) => {
  await inPage(() => {
    @Component({
      selector: 'app-message',
      template: `<p data-testid="shallowed-message">Shallowed</p>`,
    })
    class ShallowMessageComponent { }

    @Directive({
      selector: 'button[appClick]',
      host: {
        class: 'shallowed',
      },
    })
    class ShallowClickDirective { }

    TestBed.overrideComponent(ClickMeWithSub, {
      set: {
        imports: [ShallowMessageComponent, ShallowClickDirective],
      },
    });
  });

  await inPage(() => mount(ClickMeWithSub));
  const buttonLocator = page.getByRole('button', { name: 'Click me' });

  await expect(buttonLocator).toBeEnabled();

  await buttonLocator.click();
  await expect(buttonLocator).toHaveClass('shallowed');
  await expect(page.getByTestId('shallowed-message')).toHaveText('Shallowed');
});

test('externalized shallow components', async ({
  inPage,
  page,
}) => {
  await inPage(() => {
    TestBed.overrideComponent(ClickMeWithSub, {
      set: {
        imports: [ShallowMessageComponent, ShallowClickDirective],
      },
    });
  });

  await inPage(() => mount(ClickMeWithSub));
  const buttonLocator = page.getByRole('button', { name: 'Click me' });

  await expect(buttonLocator).toBeEnabled();

  await buttonLocator.click();
  await expect(buttonLocator).toHaveClass('shallowed');
  await expect(page.getByTestId('shallowed-message')).toHaveText('Shallowed');
});
