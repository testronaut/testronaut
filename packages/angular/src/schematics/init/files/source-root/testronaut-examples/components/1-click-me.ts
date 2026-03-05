import { Component, input, output, signal } from '@angular/core';

@Component({
  template: `
    <div>
      <button (click)="setMessage()">{{ clickMeLabel() }}</button>
      <p>{{ message() }}</p>
    </div>
  `,
})
export class ClickMe {
  clicked = output<number>();
  clickMeLabel = input('Click me');
  #clickCounter = 0;

  protected readonly message = signal('');
  setMessage() {
    this.message.set('Lift Off!');
    this.clicked.emit(++this.#clickCounter);
  }
}
