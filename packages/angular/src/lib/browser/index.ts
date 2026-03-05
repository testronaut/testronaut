import type { InputSignal, Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  BrowserTestingModule,
  platformBrowserTesting,
} from '@angular/platform-browser/testing';
import { TestronautAngularNotSetUpError } from '../playwright/testronaut-angular-not-set-up.error';

/**
 * Mounts a component in the browser using `TestBed`.
 *
 * @internal Note: Function is async to be future proof (e.g. opt-in for `whenStable`).
 */
export async function mount<CMP_TYPE extends Type<unknown>>(
  cmp: CMP_TYPE,
  opts?: BrowserMountOpts<InstanceType<CMP_TYPE>>
): Promise<void> {
  _assertIsSetUp();

  const fixture = TestBed.createComponent(cmp) as ComponentFixture<
    InstanceType<CMP_TYPE>
  >;

  Object.entries(opts?.inputs ?? {}).forEach(([key, value]) => {
    fixture.componentRef.setInput(key, value);
  });
}

export function setUpTestronautAngular() {
  TestBed.initTestEnvironment(BrowserTestingModule, platformBrowserTesting());

  isSetUp = true;
}

function _assertIsSetUp() {
  if (!isSetUp) {
    throw new TestronautAngularNotSetUpError();
  }
}

let isSetUp = false;

export interface BrowserMountOpts<CMP> {
  inputs?: Inputs<CMP>;
}

export type Inputs<CMP> = Partial<{
  [PROP in keyof CMP as CMP[PROP] extends InputSignal<unknown>
    ? PROP
    : never]: CMP[PROP] extends InputSignal<infer VALUE> ? VALUE : never;
}>;
