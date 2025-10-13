import { Directive } from '@angular/core';

@Directive({
  selector: 'button[appClick]',
  host: {
    class: 'shallowed',
  },
})
export class ShallowClickDirective {}
