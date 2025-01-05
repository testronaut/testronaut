import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NxWelcomeComponent } from './nx-welcome.component';

@Component({
  imports: [NxWelcomeComponent, RouterModule],
  selector: 'app-root',
  template: `<app-nx-welcome></app-nx-welcome> <router-outlet></router-outlet>`,
  styles: ``,
})
export class AppComponent {
  title = 'demos-angular';
}
