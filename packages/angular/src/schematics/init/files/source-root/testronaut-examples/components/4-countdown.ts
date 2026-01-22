import { Component, signal } from '@angular/core';

@Component({
  template: `
    <div>
      <p>{{ countdown() }}</p>
    </div>
  `,
})
export class Countdown {
  protected readonly countdown = signal(3);

  constructor() {
    const intervalId = setInterval(() => {
      if (this.countdown() === 0) {
        clearInterval(intervalId);
        return;
      }

      this.countdown.update((value) => value - 1);
    }, 1000);
  }
}
