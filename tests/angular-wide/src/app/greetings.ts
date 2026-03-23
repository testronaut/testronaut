import {
  ChangeDetectionStrategy,
  Component,
  inject,
  InjectionToken,
  input,
  Provider,
} from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-greetings',
  template: `<h1>{{ greeting }} {{ name() }}!</h1>`,
})
export class Greetings {
  readonly name = input('Guest');
  protected readonly greeting =
    inject(GreetingToken, { optional: true }) ?? 'Hello';
}

export function provideGreeting(greeting: string): Provider[] {
  return [{ provide: GreetingToken, useValue: greeting }];
}

const GreetingToken = new InjectionToken<string>('GreetingToken');
