import { Component } from '@angular/core';
import { RouterLinkWithHref, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  template: `<h1>Angular Demo for Playwright Component Testing</h1>
    <p>
      This application contains two components which are tested by Playwright CT
    </p>
    <ul>
      <li><a routerLink="/basket">Shop Basket</a></li>
      <li><a routerLink="/quiz">Quiz</a></li>
    </ul>

    <router-outlet /> `,
  imports: [RouterOutlet, RouterLinkWithHref],
})
export class AppComponent {}
