export function throwIfNullish<T>(
    value: T | undefined,
    message = 'Value is nullish'
  ): T {
    if (value === undefined || value === null) {
      throw new Error(message);
    }
    return value;
  }