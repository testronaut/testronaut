import { throwIfNullish } from "./throw-if-nullish";

export function assertNotNullish<T>(value: T | undefined): asserts value is T {
    throwIfNullish(value);
  }