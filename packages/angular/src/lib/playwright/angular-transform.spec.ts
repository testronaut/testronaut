import {
  type TransformResult,
  createFileData,
  createImportedIdentifier,
} from '@testronaut/core/devkit';
import { describe } from 'vitest';

import { angularTransform } from './angular-transform';

describe(angularTransform.name, () => {
  it('replaces anonymous mount call with named runInBrowser + mount', () => {
    const result = transform(`
import { test } from '@testronaut/angular';
import { Hello } from './hello.component';

test('hello', async ({ mount }) => {
  await mount(Hello);
});
    `);

    const generatedName = firstElement(result.generatedNames);
    expect(result.content).toContain(`\
import { test } from '@testronaut/angular';
import { Hello } from './hello.component';
test('hello', async ({ runInBrowser }) => {
    await runInBrowser("${generatedName}", () => mount(Hello));
});
`);
  });

  it('replaces mount call with runInBrowser + mount', () => {
    const result = transform(`
import { test } from '@testronaut/angular';
import { Hello } from './hello.component';

test('hello', async ({ mount }) => {
  await mount('hello', Hello);
});
    `);

    expect(result.content).toContain(`\
import { test } from '@testronaut/angular';
import { Hello } from './hello.component';
test('hello', async ({ runInBrowser }) => {
    await runInBrowser('hello', () => mount(Hello));
});
`);
  });

  it('returns `mount` import from `@testronaut/angular/browser` in the imported identifiers to be added', () => {
    const result = transform(`
import { test } from '@testronaut/angular';
import { Hello } from './hello.component';

test('hello', async ({ mount }) => {
  await mount(Hello);
});
    `);

    expect(result.importedIdentifiers).toEqual([
      createImportedIdentifier({
        name: 'mount',
        module: '@testronaut/angular/browser',
      }),
    ]);
  });

  it('does nothing if there is no mount function', () => {
    const result = transform(`
import { test } from '@testronaut/angular';

test('hello', async ({ runInBrowser }) => {
  await runInBrowser(() => {
    console.log('hello');
  });
});
    `);

    expect.soft(result.importedIdentifiers).toHaveLength(0);
    expect.soft(result.content).not.toContain('mount');
  });

  describe('name generation', () => {
    it('does not generate name for named mount call', () => {
      const result = transform(`
import { test } from '@testronaut/angular';
import { Hello } from './hello.component';

test('hello', async ({ mount }) => {
  await mount('my-test', Hello);
});
    `);

      expect(result.generatedNames).toHaveLength(0);
    });

    it('generates deterministic name for anonymous mount call', () => {
      const result = transform(`
import { test } from '@testronaut/angular';
import { Hello } from './hello.component';

test('hello', async ({ mount }) => {
  await mount(Hello);
});
    `);

      const generatedName = firstElement(result.generatedNames);
      expect(generatedName).toMatch(/^__testronaut__[a-f0-9]+$/);
      expect(result.content).toContain(
        `runInBrowser("${generatedName}", () => mount(Hello))`
      );
    });

    it('generates same name for identical anonymous mount calls', () => {
      const result = transform(`
import { test } from '@testronaut/angular';
import { Hello } from './hello.component';

test('test1', async ({ mount }) => {
  await mount(Hello);
});

test('test2', async ({ mount }) => {
  await mount(Hello);
});
    `);

      expect(result.generatedNames).toHaveLength(1);

      const generatedName = firstElement(result.generatedNames);
      expect(result.content).toContain(`
test('test1', async ({ runInBrowser }) => {
    await runInBrowser("${generatedName}", () => mount(Hello));
});
test('test2', async ({ runInBrowser }) => {
    await runInBrowser("${generatedName}", () => mount(Hello));
});
`);
    });

    it('generates different names for different mount arguments', () => {
      const result = transform(`
import { test } from '@testronaut/angular';
import { Hello, World } from './components';

test('test1', async ({ mount }) => {
  await mount(Hello);
});

test('test2', async ({ mount }) => {
  await mount(World);
});
    `);

      expect(result.generatedNames).toHaveLength(2);
      const [first, second] = Array.from(result.generatedNames);
      expect(first).not.toBe(second);
    });

    it('handles mount calls with inputs options that transpile correctly', () => {
      const result = transform(`
import { test } from '@testronaut/angular';
import { Hello } from './hello.component';

test('hello', async ({ mount }) => {
  await mount(Hello, { 
    inputs: { name: 'test', age: 42 }
  });
});
    `);

      const generatedName = firstElement(result.generatedNames);
      expect(result.generatedNames).toHaveLength(1);

      expect(generatedName).toMatch(/^__testronaut__[a-f0-9]+$/);
      expect(result.content).toContain(`
test('hello', async ({ runInBrowser }) => {
    await runInBrowser("${generatedName}", () => mount(Hello, {
        inputs: { name: 'test', age: 42 }
    }));
});`);
    });

    it('handles mount calls with nested object inputs', () => {
      const result = transform(`
import { test } from '@testronaut/angular';
import { Hello } from './hello.component';

test('hello', async ({ mount }) => {
  await mount(Hello, { 
    inputs: { 
      config: { 
        theme: 'dark',
        settings: { enabled: true }
      }
    }
  });
});
    `);

      const generatedName = firstElement(result.generatedNames);
      expect(result.generatedNames).toHaveLength(1);
      expect(generatedName).toMatch(/^__testronaut__[a-f0-9]+$/);
    });
  });
});

function transform(content: string): TransformResult {
  const fileData = createFileData({ content, path: './my-test.pw.ts' });
  return angularTransform.apply(fileData);
}

function firstElement(set: Set<string>): string {
  return Array.from(set)[0];
}
