import { describe, expect, it } from 'vitest';
import { ImpossibleError } from './impossible.error';

describe(ImpossibleError, () => {
  it('formats the error message with a pre-filled issue link', () => {
    const error = new ImpossibleError(
      'Could not determine `inPage` call line from stack trace'
    );
    expect(error.message).toEqual(`\
Could not determine \`inPage\` call line from stack trace

This seems to be a problem in Testronaut, not in your tests. Please file an issue so we can investigate:

https://github.com/testronaut/testronaut/issues/new?body=%0A%23%23+Error+message%0A%0A%60%60%60%0ACould+not+determine+%60inPage%60+call+line+from+stack+trace%0A%60%60%60%0A%0A%23%23+Additional+context%0A%0A%28Please+add+any+relevant+details+about+how+you+encountered+this+error.%29
`);
  });
});
