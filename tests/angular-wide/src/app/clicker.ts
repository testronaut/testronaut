import { Component, inject, signal } from '@angular/core';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';

@Component({
  selector: 'app-clicker',
  template: `
    <button (click)="onClick()">Click me</button>
    <p>{{ message() }}</p>
  `,
})
export class Clicker {
  readonly #isServer = isPlatformServer(inject(PLATFORM_ID));
  protected readonly message = signal('');

  onClick() {
    this.message.set(
      this.#isServer ? 'You cannot click on the server' : 'You clicked me'
    );
  }
}
