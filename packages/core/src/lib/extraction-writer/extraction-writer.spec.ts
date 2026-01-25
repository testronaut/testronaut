import { describe } from 'vitest';
import { ExtractionWriter } from './extraction-writer';
import { fileAnalysisMother } from '../core/file-analysis.mother';
import { FileSystemFake } from '../infra/file-system.fake';

describe(ExtractionWriter.name, () => {
  it('creates "index.ts" file on init', async () => {
    const { fileSystemFake } = await setUpInitializedWriter();

    expect(fileSystemFake.getFiles()).toEqual({
      '/my-project/testronaut/index.ts': `\
// prettier-ignore
// eslint-disable-next-line
// @ts-nocheck
`,
    });
  });

  it('does overwrite "index.ts" file if it exists', async () => {
    const { fileSystemFake, writer } = await setUpWriter();

    await fileSystemFake.writeFile(
      '/my-project/testronaut/index.ts',
      'const INITIAL_CONTENT = 42;'
    );

    writer.resetEntrypoint();

    expect(fileSystemFake.getFiles()).toEqual({
      '/my-project/testronaut/index.ts':
        expect.not.stringContaining('INITIAL_CONTENT'),
    });
  });

  it('writes anonymous `runInBrowser` calls', async () => {
    const { fileSystemFake, projectFileAnalysisMother, writer } =
      await setUpInitializedWriter();

    await writer.write(
      projectFileAnalysisMother
        .withBasicInfo()
        .withExtractedFunction(`() => { console.log('Hi!'); };`)
        .build()
    );

    expect(fileSystemFake.getFiles()).toEqual({
      '/my-project/testronaut/index.ts': expect.stringContaining(
        `globalThis['hash|src/my-component.spec.ts'] = () => import('./src/my-component.spec.ts');`
      ),
      '/my-project/testronaut/src/my-component.spec.ts':
        expect.stringContaining(`\
export const extractedFunctionsRecord = {
    "anonymous": {
        "token-hash": "() => { console.log('Hi!'); };"
    },
    "named": {}
};
`),
    });
  });

  it('disables checks on extracted functions', async () => {
    const { fileSystemFake, projectFileAnalysisMother, writer } =
      await setUpInitializedWriter();

    await writer.write(
      projectFileAnalysisMother
        .withBasicInfo()
        .withExtractedFunction(`() => { console.log('Hi!'); }`)
        .build()
    );

    expect(fileSystemFake.getFiles()).toMatchObject({
      '/my-project/testronaut/src/my-component.spec.ts':
        expect.stringContaining(`\
// prettier-ignore
// eslint-disable-next-line
// @ts-nocheck
`),
    });
  });

  it('writes named `runInBrowser` calls', async () => {
    const { fileSystemFake, projectFileAnalysisMother, writer } =
      await setUpInitializedWriter();

    await writer.write(
      projectFileAnalysisMother
        .withBasicInfo()
        .withNamedExtractedFunction('sayHello', `() => { console.log('Hi!'); }`)
        .build()
    );

    expect(fileSystemFake.getFiles()).toEqual({
      '/my-project/testronaut/index.ts': expect.stringContaining(
        `globalThis['hash|src/my-component.spec.ts'] = () => import('./src/my-component.spec.ts');`
      ),
      '/my-project/testronaut/src/my-component.spec.ts':
        expect.stringContaining(`\
export const extractedFunctionsRecord = {
    "anonymous": {},
    "named": {
        "sayHello": "() => { console.log('Hi!'); }"
    }
};
`),
    });
  });

  it('overwrites extracted functions if file exists', async () => {
    const { fileSystemFake, projectFileAnalysisMother, writer } =
      await setUpInitializedWriter();

    await fileSystemFake.writeFile(
      '/my-project/testronaut/src/my-component.spec.ts',
      'export const extractedFunctionsRecord = { "": () => { console.log("Hi!"); } };'
    );

    await writer.write(
      projectFileAnalysisMother
        .withBasicInfo()
        .withExtractedFunction(`() => { console.log('Hello!'); }`)
        .build()
    );

    expect(fileSystemFake.getFiles()).toMatchObject({
      '/my-project/testronaut/src/my-component.spec.ts':
        expect.stringContaining(`\
export const extractedFunctionsRecord = {
    "anonymous": {
        "token-hash": "() => { console.log('Hello!'); }"
    },
    "named": {}
};
`),
    });
  });

  it('updates index.ts', async () => {
    const { fileSystemFake, projectFileAnalysisMother, writer } =
      await setUpInitializedWriter();

    await fileSystemFake.writeFile(
      '/my-project/testronaut/index.ts',
      `globalThis['hash|another-component.spec.ts'] = () => import('./another-component.spec.ts');`,
      { overwrite: true }
    );

    await writer.write(
      projectFileAnalysisMother
        .withBasicInfo()
        .withExtractedFunction(`() => { console.log('Hi!'); }`, 'my-hash')
        .build()
    );

    expect(fileSystemFake.getFiles()).toMatchObject({
      '/my-project/testronaut/index.ts': expect.stringContaining(
        `globalThis['hash|another-component.spec.ts'] = () => import('./another-component.spec.ts');`
      ),
      '/my-project/testronaut/src/my-component.spec.ts':
        expect.stringContaining(
          `export const extractedFunctionsRecord = {
    "anonymous": {
        "my-hash": "() => { console.log('Hi!'); }"
    },
    "named": {}
};`
        ),
    });
  });

  it('updates hashes in index.ts', async () => {
    const { fileSystemFake, projectFileAnalysisMother, writer } =
      await setUpInitializedWriter();

    await fileSystemFake.writeFile(
      '/my-project/testronaut/index.ts',
      `globalThis['OLD_HASH'] = () => import('./src/my-component.spec.ts');`,
      { overwrite: true }
    );

    await writer.write(
      projectFileAnalysisMother
        .withBasicInfo()
        .withExtractedFunction(`() => { console.log('Hi!'); }`)
        .build()
    );

    expect(fileSystemFake.getFiles()).toMatchObject({
      '/my-project/testronaut/index.ts': `\
globalThis['hash|src/my-component.spec.ts'] = () => import('./src/my-component.spec.ts');`,
    });
  });

  it('writes imports', async () => {
    const { fileSystemFake, projectFileAnalysisMother, writer } =
      await setUpInitializedWriter();

    await writer.write(
      projectFileAnalysisMother
        .withBasicInfo()
        .withExtractedFunction(
          `() => { console.log(MyComponent); }`,
          'my-hash',
          [
            {
              name: 'MyComponent',
              module: '@my-lib/my-component',
            },
          ]
        )
        .build()
    );

    expect(fileSystemFake.getFiles()).toMatchObject({
      '/my-project/testronaut/src/my-component.spec.ts':
        expect.stringContaining(`\
import { MyComponent } from "@my-lib/my-component";
export const extractedFunctionsRecord = {
    "anonymous": {
        "my-hash": "() => { console.log(MyComponent); }"
    },
    "named": {}
};
`),
    });
  });

  it('relativizes imports', async () => {
    const { fileSystemFake, projectFileAnalysisMother, writer } =
      await setUpInitializedWriter();

    await writer.write(
      projectFileAnalysisMother
        .withBasicInfo()
        .withExtractedFunction(
          `() => { console.log(MyComponent); }`,
          'my-hash',
          [
            {
              name: 'MyComponent',
              module: './my-component',
            },
          ]
        )
        .build()
    );

    expect(fileSystemFake.getFiles()).toMatchObject({
      '/my-project/testronaut/src/my-component.spec.ts':
        expect.stringContaining(`\
import { MyComponent } from "../../src/my-component";
export const extractedFunctionsRecord = {
    "anonymous": {
        "my-hash": "() => { console.log(MyComponent); }"
    },
    "named": {}
};
`),
    });
  });

  it('overrides existing file content', async () => {
    const { fileSystemFake, projectFileAnalysisMother, writer } =
      await setUpInitializedWriter();

    await writer.write(
      projectFileAnalysisMother
        .withBasicInfo()
        .withExtractedFunction(`() => { console.log('First try'); }`)
        .build()
    );

    await writer.write(
      projectFileAnalysisMother
        .withBasicInfo()
        .withExtractedFunction(`() => { console.log('Second try'); }`)
        .build()
    );

    expect(fileSystemFake.getFiles()).toMatchObject({
      '/my-project/testronaut/src/my-component.spec.ts':
        expect.stringContaining(`\
export const extractedFunctionsRecord = {
    "anonymous": {
        "token-hash": "() => { console.log('Second try'); }"
    },
    "named": {}
};
`),
    });
  });

  it('merges imports', async () => {
    const { fileSystemFake, projectFileAnalysisMother, writer } =
      await setUpInitializedWriter();

    await writer.write(
      projectFileAnalysisMother
        .withBasicInfo()
        .withExtractedFunction(
          `() => { console.log(MyService, MyServiceError); }`,
          'hash-2',
          [
            {
              name: 'MyService',
              module: '@my-lib/my-service',
            },
            {
              name: 'MyServiceError',
              module: '@my-lib/my-service',
            },
          ]
        )
        .build()
    );

    expect(fileSystemFake.getFiles()).toMatchObject({
      '/my-project/testronaut/src/my-component.spec.ts':
        expect.stringContaining(`\
import { MyService, MyServiceError } from "@my-lib/my-service";
export const extractedFunctionsRecord = {
    "anonymous": {
        "hash-2": "() => { console.log(MyService, MyServiceError); }"
    },
    "named": {}
};
`),
    });
  });
});

async function setUpInitializedWriter() {
  const { writer, ...utils } = await setUpWriter();

  writer.resetEntrypoint();

  return { writer, ...utils };
}

async function setUpWriter() {
  const fileSystemFake = new FileSystemFake();
  const projectRoot = '/my-project';

  const writer = new ExtractionWriter({
    projectRoot,
    extractionDir: 'testronaut',
    fileSystem: fileSystemFake,
  });

  return {
    fileSystemFake,
    projectFileAnalysisMother: fileAnalysisMother.withProjectRoot(projectRoot),
    writer,
  };
}
