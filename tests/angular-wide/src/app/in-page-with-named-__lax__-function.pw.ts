import { test } from '@testronaut/core';

test.fail(
  'inPageWithNamedFunction must not use a name starting with __lax__',
  async ({ inPageWithNamedFunction }) => {
    await inPageWithNamedFunction('__lax__userChosenName', () => void true);
  }
);