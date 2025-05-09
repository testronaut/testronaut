import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  selector: 'app-hello',
  template: `<h1>Welcome to Playwright CT</h1>`,
})
export class Hello {}
