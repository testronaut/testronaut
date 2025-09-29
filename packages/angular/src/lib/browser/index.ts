import { Provider, provideZonelessChangeDetection } from '@angular/core';

import { TestBed } from '@angular/core/testing';
import {
  BrowserTestingModule,
  platformBrowserTesting,
} from '@angular/platform-browser/testing';
import { BrowserMount } from '../common';
import { TestronautAngularNotSetUpError } from '../playwright/testronaut-angular-not-set-up.error';
import { getComponentOutputs } from './ng-internals';

export const mount: BrowserMount = async (cmp, { inputs = {} } = {}) => {
  assertIsSetUp();

  const fixture = TestBed.createComponent(cmp);

  Object.entries(inputs).forEach(([key, value]) => {
    fixture.componentRef.setInput(key, value);
  });

  await fixture.whenStable();

  return { outputNames: getComponentOutputs(cmp) };
};

export async function configure({ providers }: { providers: Provider[] }) {
  assertIsSetUp();

  TestBed.configureTestingModule({ providers });
}

export async function setUpTestronautAngular() {
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
