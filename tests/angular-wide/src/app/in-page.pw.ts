import { test } from '@testronaut/core';

test.describe('general', () => {
  test('no collision for semicolon differences (implementation detail)', async ({
    inPage,
  }) => {
    // collision based on transpiler, which adds a semicolon

    await inPage(() => {
      // prettier-ignore
      document.body.textContent = 'Hi!';
    });

    await inPage(() => {
      // prettier-ignore
      document.body.textContent = 'Hi!'
    });
  });

  test('inPage with comments', async ({ inPage }) => {
    await inPage(() => {
      // This is a comment
      /* Multi-line
         comment */
      console.log('comment test');
    });
  });

  test('multiple in page calls', async ({ inPage }) => {
    await inPage(() => console.log(0));
    await inPage(() => console.log(0));
    await inPage(() => console.log(1));
    await inPage(() => console.log(2));
    await inPage(() => console.log(3));
    await inPage(() => console.log(4));
  });
});