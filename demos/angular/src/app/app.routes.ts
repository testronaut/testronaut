import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  { path: 'basket', loadComponent: () => import('./basket/basket.ng') },
];
