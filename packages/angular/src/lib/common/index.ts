import { EventEmitter, InputSignal, Type } from '@angular/core';

export const OUTPUT_BUS_VARIABLE_NAME = '__TESTRONAUT_OUTPUT_BUS';

export interface BrowserMount<CMP_TYPE extends Type<unknown>> {
  (
    cmp: ValueOrAsyncFactory<CMP_TYPE>,
    opts?: BrowserMountOpts<InstanceType<CMP_TYPE>>
  ): Promise<{
    outputNames: Array<keyof OutputTypes<InstanceType<CMP_TYPE>>>;
  }>;
}

export type ValueOrAsyncFactory<T> = T | AsyncFactory<T>;
export type AsyncFactory<T> = () => Promise<T>;

export interface BrowserMountOpts<CMP> {
  inputs?: Inputs<CMP>;
}

export interface OutputEvent<
  CMP,
  OUTPUT_NAME extends keyof OutputTypes<CMP> = keyof OutputTypes<CMP>
> {
  outputName: OUTPUT_NAME;
  value: CMP[OUTPUT_NAME] extends ComponentOutput<infer VALUE>
    ? VALUE
    : unknown;
}

export type Inputs<CMP> = Partial<{
  [PROP in keyof CMP as CMP[PROP] extends InputSignal<unknown>
    ? PROP
    : never]: CMP[PROP] extends InputSignal<infer VALUE> ? VALUE : never;
}>;

export type OutputTypes<CMP> = {
  [PROP in keyof CMP as CMP[PROP] extends ComponentOutput<unknown>
    ? PROP
    : never]: OutputValue<CMP, PROP>;
};

type OutputValue<
  CMP,
  PROP extends keyof CMP
> = CMP[PROP] extends ComponentOutput<infer VALUE> ? VALUE : never;

export type ComponentOutput<T> =
  | EventEmitter<T>
  | {
      subscribe: (fn: (value: T) => void) => unknown;
    };
