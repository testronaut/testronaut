import {
  provideExperimentalZonelessChangeDetection,
  Provider,
  type Type,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import { TestronautAngularNotSetUpError } from './lib/testronaut-angular-not-set-up.error';

export async function mount(
  cmp: Type<unknown>,
  { inputs = {} }: { inputs?: Record<string, unknown> } = {}
) {
  assertIsSetUp();

  const fixture = TestBed.createComponent(cmp);

  Object.entries(inputs).forEach(([key, value]) => {
    fixture.componentRef.setInput(key, value);
  });

  await fixture.whenStable();
}

export async function configure({ providers }: { providers: Provider[] }) {
  assertIsSetUp();

  TestBed.configureTestingModule({ providers });
}

export async function setUpTestronautAngular() {
  // TODO: replace with BrowserTestingModule & platformBrowserTesting
  // when Angular 20 is released.
  TestBed.initTestEnvironment(
    BrowserDynamicTestingModule,
    platformBrowserDynamicTesting()
  );

  TestBed.configureTestingModule({
    providers: [provideExperimentalZonelessChangeDetection()],
  });

  isSetUp = true;
}

function assertIsSetUp() {
  if (!isSetUp) {
    throw new TestronautAngularNotSetUpError();
  }
}

let isSetUp = false;
