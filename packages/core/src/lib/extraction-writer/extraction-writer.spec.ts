import { describe } from 'vitest';
import { ExtractionWriter } from './extraction-writer';
import { createExtractedFunction } from '../file-analysis';
import { fileAnalysisMother } from '../file-analysis.mother';
import { FileSystemFake } from '../infra/file-system.fake';

describe(ExtractionWriter.name, () => {
  it('creates "index.ts" file on init', async () => {
    const { fileSystemFake } = await setUpInitializedWriter();

    expect(fileSystemFake.getFiles()).toEqual({
      '/my-project/test-server/index.ts': `\
// prettier-ignore
// eslint-disable-next-line
// @ts-nocheck
`,
    });
  });

  it('does overwrite "index.ts" file if it exists', async () => {
    const { fileSystemFake, writer } = await setUpWriter();

    await fileSystemFake.writeFile(
      '/my-project/test-server/index.ts',
      'const INITIAL_CONTENT = 42;'
    );

    writer.resetEntrypoint();

    expect(fileSystemFake.getFiles()).toEqual({
      '/my-project/test-server/index.ts':
        expect.not.stringContaining('INITIAL_CONTENT'),
    });
  });

  it('writes anonymous `runInBrowser` calls', async () => {
    const { fileSystemFake, projectFileAnalysisMother, writer } =
      await setUpInitializedWriter();

    await writer.write(
      projectFileAnalysisMother
        .withBasicInfo()
        .withExtractedFunction(
          createExtractedFunction({
            code: `() => { console.log('Hi!'); }`,
          })
        )
        .build()
    );

    expect(fileSystemFake.getFiles()).toEqual({
      '/my-project/test-server/index.ts': expect.stringContaining(
        `globalThis['hash|src/my-component.spec.ts'] = () => import('./src/my-component.spec.ts');`
      ),
      '/my-project/test-server/src/my-component.spec.ts': `\
export const extractedFunctionsRecord = {
    "": () => { console.log('Hi!'); }
};
`,
    });
  });

  it('writes named `runInBrowser` calls', async () => {
    const { fileSystemFake, projectFileAnalysisMother, writer } =
      await setUpInitializedWriter();

    await writer.write(
      projectFileAnalysisMother
        .withBasicInfo()
        .withExtractedFunction(
          createExtractedFunction({
            name: 'sayHello',
            code: `() => { console.log('Hi!'); }`,
          })
        )
        .build()
    );

    expect(fileSystemFake.getFiles()).toEqual({
      '/my-project/test-server/index.ts': expect.stringContaining(
        `globalThis['hash|src/my-component.spec.ts'] = () => import('./src/my-component.spec.ts');`
      ),
      '/my-project/test-server/src/my-component.spec.ts': `\
export const extractedFunctionsRecord = {
    "sayHello": () => { console.log('Hi!'); }
};
`,
    });
  });

  it('overwrites extracted functions if file exists', async () => {
    const { fileSystemFake, projectFileAnalysisMother, writer } =
      await setUpInitializedWriter();

    await fileSystemFake.writeFile(
      '/my-project/test-server/src/my-component.spec.ts',
      'export const extractedFunctionsRecord = { "": () => { console.log("Hi!"); } };'
    );

    await writer.write(
      projectFileAnalysisMother
        .withBasicInfo()
        .withExtractedFunction(
          createExtractedFunction({
            code: `() => { console.log('Hello!'); }`,
          })
        )
        .build()
    );

    expect(fileSystemFake.getFiles()).toMatchObject({
      '/my-project/test-server/src/my-component.spec.ts': `\
export const extractedFunctionsRecord = {
    "": () => { console.log('Hello!'); }
};
`,
    });
  });

  it('updates index.ts', async () => {
    const { fileSystemFake, projectFileAnalysisMother, writer } =
      await setUpInitializedWriter();

    await fileSystemFake.writeFile(
      '/my-project/test-server/index.ts',
      `globalThis['hash|another-component.spec.ts'] = () => import('./another-component.spec.ts');`,
      { overwrite: true }
    );

    await writer.write(
      projectFileAnalysisMother
        .withBasicInfo()
        .withExtractedFunction(
          createExtractedFunction({
            code: `() => { console.log('Hi!'); }`,
          })
        )
        .build()
    );

    expect(fileSystemFake.getFiles()).toMatchObject({
      '/my-project/test-server/index.ts': `\
globalThis['hash|another-component.spec.ts'] = () => import('./another-component.spec.ts');
globalThis['hash|src/my-component.spec.ts'] = () => import('./src/my-component.spec.ts');`,
    });
  });

  it('updates hashes in index.ts', async () => {
    const { fileSystemFake, projectFileAnalysisMother, writer } =
      await setUpInitializedWriter();

    await fileSystemFake.writeFile(
      '/my-project/test-server/index.ts',
      `globalThis['OLD_HASH'] = () => import('./src/my-component.spec.ts');`,
      { overwrite: true }
    );

    await writer.write(
      projectFileAnalysisMother
        .withBasicInfo()
        .withExtractedFunction(
          createExtractedFunction({
            code: `() => { console.log('Hi!'); }`,
          })
        )
        .build()
    );

    expect(fileSystemFake.getFiles()).toMatchObject({
      '/my-project/test-server/index.ts': `\
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
          createExtractedFunction({
            importedIdentifiers: [
              {
                name: 'MyComponent',
                module: '@my-lib/my-component',
              },
            ],
            code: `() => { console.log(MyComponent); }`,
          })
        )
        .build()
    );

    expect(fileSystemFake.getFiles()).toMatchObject({
      '/my-project/test-server/src/my-component.spec.ts': `\
import { MyComponent } from "@my-lib/my-component";
export const extractedFunctionsRecord = {
    "": () => { console.log(MyComponent); }
};
`,
    });
  });

  it('relativizes imports', async () => {
    const { fileSystemFake, projectFileAnalysisMother, writer } =
      await setUpInitializedWriter();

    await writer.write(
      projectFileAnalysisMother
        .withBasicInfo()
        .withExtractedFunction(
          createExtractedFunction({
            importedIdentifiers: [
              {
                name: 'MyComponent',
                module: './my-component',
              },
            ],
            code: `() => { console.log(MyComponent); }`,
          })
        )
        .build()
    );

    expect(fileSystemFake.getFiles()).toMatchObject({
      '/my-project/test-server/src/my-component.spec.ts': `\
import { MyComponent } from "../../src/my-component";
export const extractedFunctionsRecord = {
    "": () => { console.log(MyComponent); }
};
`,
    });
  });

  it('merges imports', async () => {
    const { fileSystemFake, projectFileAnalysisMother, writer } =
      await setUpInitializedWriter();

    await writer.write(
      projectFileAnalysisMother
        .withBasicInfo()
        .withExtractedFunction(
          createExtractedFunction({
            importedIdentifiers: [
              {
                name: 'MyComponent',
                module: '@my-lib/my-component',
              },
            ],
            code: `() => { console.log(MyComponent); }`,
          })
        )
        .build()
    );

    await writer.write(
      projectFileAnalysisMother
        .withBasicInfo()
        .withExtractedFunction(
          createExtractedFunction({
            importedIdentifiers: [
              {
                name: 'MyService',
                module: '@my-lib/my-service',
              },
              {
                name: 'MyServiceError',
                module: '@my-lib/my-service',
              },
            ],
            code: `() => { console.log(MyService, MyServiceError); }`,
          })
        )
        .build()
    );

    expect(fileSystemFake.getFiles()).toMatchObject({
      '/my-project/test-server/src/my-component.spec.ts': `\
import { MyService, MyServiceError } from "@my-lib/my-service";
export const extractedFunctionsRecord = {
    "": () => { console.log(MyService, MyServiceError); }
};
`,
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
    extractionDir: 'test-server',
    fileSystem: fileSystemFake,
  });

  return {
    fileSystemFake,
    projectFileAnalysisMother: fileAnalysisMother.withProjectRoot(projectRoot),
    writer,
  };
}
