import { test, expect } from '@testronaut/core';

test.describe('error cases', () => {
  /* TODO: once we make `inPageWithNamedFunction` throw instead,
   * we can `expect(() => inPageWithNamedFunction(...)).rejects.toThrow()` instead.
   * @yjaaidi: Do we really want that? 
   */
  test.skip('inPageWithNamedFunction throws within expect', async ({ inPageWithNamedFunction }) => {
    expect(() => inPageWithNamedFunction('duplicate name', () => void true)).toThrow();
  });

  test.fail('inPageWithNamedFunction', async ({ inPageWithNamedFunction }) => {
    await inPageWithNamedFunction('duplicate name', () => {
      document.body.textContent = 'Hi!';
    });
  });

  test.fail(
    'another inPageWithNamedFunction with the same name',
    async ({ inPageWithNamedFunction }) => {
      await inPageWithNamedFunction('duplicate name', () => {
        document.body.textContent = 'Bye!';
      });
    }
  );
});