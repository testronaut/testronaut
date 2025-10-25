import { httpResource } from '@angular/common/http';
import { Component, signal } from '@angular/core';

@Component({
  template: `
    <div>
      <button (click)="handleClick()">Click me</button>
      @if (message.hasValue()) {
      <p>{{ message.value() }}</p>
      } @else {
      <p>&nbsp;</p>
      } >
    </div>
  `,
})
export class ClickMeWithResource {
  readonly #isActive = signal(false);

  protected readonly message = httpResource(
    () => {
      if (!this.#isActive()) {
        return undefined;
      }

      return {
        url: 'https://testronaut.dev/lift-off',
      };
    },
    {
      parse: String,
    }
  );

  handleClick() {
    this.#isActive.set(true);
  }
}
