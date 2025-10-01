import { InputSignal, Type } from '@angular/core';

export const OUTPUT_BUS_VARIABLE_NAME = '__TESTRONAUT_OUTPUT_BUS';

export interface BrowserMount<CMP_TYPE extends Type<unknown>> {
  (cmp: CMP_TYPE, opts?: BrowserMountOpts<InstanceType<CMP_TYPE>>): Promise<{
    outputNames: Array<keyof OutputTypes<InstanceType<CMP_TYPE>>>;
  }>;
}

export interface BrowserMountOpts<CMP> {
  inputs?: Inputs<CMP>;
}

export interface OutputEvent<
  CMP,
  OUTPUT_NAME extends keyof OutputTypes<CMP> = keyof OutputTypes<CMP>
> {
  outputName: OUTPUT_NAME;
  value: CMP[OUTPUT_NAME] extends {
    subscribe: (fn: (v: infer VALUE) => void) => unknown;
  }
    ? VALUE
    : unknown;
}

export type Inputs<CMP> = Partial<{
  [PROP in keyof CMP as CMP[PROP] extends InputSignal<unknown>
    ? PROP
    : never]: CMP[PROP] extends InputSignal<infer VALUE> ? VALUE : never;
}>;

export type OutputTypes<CMP> = {
  [PROP in keyof CMP as CMP[PROP] extends {
    subscribe: (fn: () => void) => unknown;
  }
    ? PROP
    : never]: OutputValue<CMP, PROP>;
};

type OutputValue<CMP, PROP extends keyof CMP> = CMP[PROP] extends {
  subscribe: (fn: (value: infer VALUE) => void) => unknown;
}
  ? VALUE
  : never;
