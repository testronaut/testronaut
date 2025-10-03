import {
  OutputRef,
  Provider,
  provideZonelessChangeDetection,
  Type,
} from '@angular/core';

import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  BrowserTestingModule,
  platformBrowserTesting,
} from '@angular/platform-browser/testing';
import {
  BrowserMount,
  OUTPUT_BUS_VARIABLE_NAME,
  OutputEvent,
  OutputTypes,
} from '../common';
import { TestronautAngularNotSetUpError } from '../playwright/testronaut-angular-not-set-up.error';
import { getComponentOutputs } from './ng-internals';

export const mount = async <CMP_TYPE extends Type<unknown>>(
  ...args: Parameters<BrowserMount<CMP_TYPE>>
): ReturnType<BrowserMount<CMP_TYPE>> => {
  const [cmp, { inputs = {} } = {}] = args;

  assertIsSetUp();
  const g = globalThis as unknown as {
    [OUTPUT_BUS_VARIABLE_NAME]: (
      outputEvent: OutputEvent<InstanceType<typeof cmp>>
    ) => void;
  };

  const fixture = TestBed.createComponent(cmp) as ComponentFixture<
    InstanceType<CMP_TYPE>
  >;

  Object.entries(inputs).forEach(([key, value]) => {
    fixture.componentRef.setInput(key, value);
  });

  await fixture.whenStable();

  const outputNames = getComponentOutputs(cmp);

  for (const outputName of outputNames) {
    subscribeToOutput(fixture.componentInstance, outputName, (value) => {
      g[OUTPUT_BUS_VARIABLE_NAME]({
        outputName,
        value,
      });
    });
  }

  return { outputNames };
};

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

function subscribeToOutput<CMP, PROP extends keyof OutputTypes<CMP>>(
  componentInstance: CMP,
  outputName: PROP,
  callback: (value: OutputTypes<CMP>[PROP]) => void
) {
  (componentInstance[outputName] as OutputRef<CMP[PROP]>)?.subscribe(
    callback as (value: CMP[PROP]) => void
  );
}
let isSetUp = false;
