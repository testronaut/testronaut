import {
  Component,
  computed,
  Directive,
  HostListener,
  input,
  signal,
} from '@angular/core';

@Directive({
  selector: 'button[appClick]',
  host: {
    '[class]': 'className()',
    '[disabled]': 'clicked()',
  },
})
export class ClickDirective {
  protected readonly clicked = signal(false);

  protected readonly className = computed(() =>
    this.clicked() ? 'clicked' : 'unclicked',
  );

  @HostListener('click')
  handleClick(): void {
    this.clicked.set(true);
  }
}

@Component({
  selector: 'app-message',
  template: `<p>{{ message() }}</p>`,
})
export class MessageComponent {
  readonly message = input.required<string>();
}

@Component({
  imports: [MessageComponent, ClickDirective],
  template: `
    <div>
      <button appClick (click)="handleClick()">Click me</button>
      @if (message()) {
        <app-message [message]="message()" />
      }
    </div>
  `,
})
export class ClickMeWithSub {
  protected readonly message = signal('');

  handleClick() {
    this.message.set('Lift Off!');
  }
}
