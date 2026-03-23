import { test, expect } from '@testronaut/core';

test.describe('general', () => {
  test('named inPageWithNamedFunction', async ({
    page,
    inPageWithNamedFunction,
  }) => {
    await inPageWithNamedFunction('hello', () => {
      document.body.textContent = 'Hello!';
    });

    await expect(page.getByText('Hello!')).toBeVisible();
  });

  test('named inPageWithNamedFunction with args', async ({
    page,
    inPageWithNamedFunction,
  }) => {
    await inPageWithNamedFunction('hello foo', { name: 'Foo' }, ({ name }) => {
      document.body.textContent = `Hello ${name}!`;
    });

    await expect(page.getByText('Hello Foo!')).toBeVisible();
  });
})

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

  test.fail(
    'inPageWithNamedFunction must not use a name starting with __lax__',
    async ({ inPageWithNamedFunction }) => {
      await inPageWithNamedFunction('__lax__userChosenName', () => void true);
    }
  );
});