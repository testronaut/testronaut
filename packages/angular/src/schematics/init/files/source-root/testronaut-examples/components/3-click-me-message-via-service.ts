import { Component, inject, Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class MessageService {
  getMessage() {
    return 'Lift Off!';
  }
}

@Component({
  template: `
    <div>
      <button appClick (click)="handleClick()">Click me</button>
      <p>{{ message() }}</p>
    </div>
  `,
})
export class ClickMe {
  protected readonly message = signal('');

  readonly #messageService = inject(MessageService);

  handleClick() {
    const message = this.#messageService.getMessage();
    this.message.set(message);
  }
}
