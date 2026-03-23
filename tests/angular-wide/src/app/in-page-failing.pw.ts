import { test } from '@testronaut/core';


test.fail('collision because of trailing comma', async ({ inPage }) => {
  await inPage(() => {
    // prettier-ignore
    const _numbers = [1, 2, 3,];
  });

  await inPage(() => {
    // prettier-ignore
    const _numbers = [1, 2, 3];
  });
});