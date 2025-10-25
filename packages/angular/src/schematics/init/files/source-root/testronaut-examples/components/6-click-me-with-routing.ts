import { Component, input } from '@angular/core';

@Component({
  template: `
    <div>
      <p>{{ message() }}</p>
    </div>
  `,
})
export class RoutingMessage {
  message = input.required<string>();
}
