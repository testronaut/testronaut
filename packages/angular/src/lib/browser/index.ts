import { Provider, provideZonelessChangeDetection } from '@angular/core';

import { TestBed } from '@angular/core/testing';
import {
  BrowserTestingModule,
  platformBrowserTesting,
} from '@angular/platform-browser/testing';
import { TestronautAngularNotSetUpError } from '../playwright/testronaut-angular-not-set-up.error';

export function configure({ providers }: { providers: Provider[] }) {
  assertIsSetUp();

  TestBed.configureTestingModule({ providers });
}

export function setUpTestronautAngular() {
  TestBed.initTestEnvironment(BrowserTestingModule, platformBrowserTesting());

  TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection()],
  });

  isSetUp = true;
}

function assertIsSetUp() {
  if (!isSetUp) {
    throw new TestronautAngularNotSetUpError();
  }
}

let isSetUp = false;
