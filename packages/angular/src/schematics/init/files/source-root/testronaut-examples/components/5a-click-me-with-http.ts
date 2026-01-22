import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';

@Component({
  template: `
    <div>
      <button (click)="handleClick()">Click me</button>
      <p>{{ message() }}</p>
    </div>
  `,
})
export class ClickMeWithHttp {
  readonly #http = inject(HttpClient);
  protected readonly message = signal('');

  handleClick() {
    console.log('received click');
    this.#http.get<string>('https://testronaut.dev/lift-off').subscribe({
      next: (value) => {
        console.log('received value', value);
        return this.message.set(value);
      },
      error: console.error,
    });
  }
}
