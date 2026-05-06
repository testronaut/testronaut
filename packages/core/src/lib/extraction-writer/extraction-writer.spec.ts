import { describe } from 'vitest';
import { ExtractionWriter } from './extraction-writer';
import { createExtractedFunction } from '../core/file-analysis';
import { fileAnalysisMother } from '../core/file-analysis.mother';
import { FileSystemFake } from '../infra/file-system.fake';
import { computeHashes } from '../lax-hashing/compute-hashes';

const code = '() => void true';
const { laxHash } = computeHashes(code);

describe(ExtractionWriter.name, () => {
  it('creates "index.ts" file on init', async () => {
    const { fileSystemFake } = await setUpInitializedWriter();

    expect(fileSystemFake.getFiles()).toEqual({
      '/my-project/generated/index.ts': `\
// prettier-ignore
// eslint-disable-next-line
// @ts-nocheck
`,
    });
  });

  describe('file modification', () => {
    it('does overwrite "index.ts" file if older than 1 minute', async () => {
      const { fileSystemFake, writer } = await setUpWriter();
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

      fileSystemFake.configure({
        '/my-project/generated/index.ts': {
          content: 'const INITIAL_CONTENT = 42;',
          lastModified: twoMinutesAgo,
        },
      });

      writer.resetEntrypointIfStale();

      expect(
        fileSystemFake.getFiles()['/my-project/generated/index.ts']
      ).not.toContain('INITIAL_CONTENT');
    });

    it('does not overwrite "index.ts" file if modified recently (less than 1 minute ago)', async () => {
      const { fileSystemFake, writer } = await setUpWriter();

      fileSystemFake.writeFileSync(
        '/my-project/generated/index.ts',
        'const INITIAL_CONTENT = 42;'
      );

      writer.resetEntrypointIfStale();

      expect(
        fileSystemFake.getFiles()['/my-project/generated/index.ts']
      ).toContain('INITIAL_CONTENT');
    });
  });

  it('writes `inPage` calls', async () => {
    const { fileSystemFake, createFileContentWithExtractedFunction, writer } =
      await setUpInitializedWriter();

    await writer.write(
      createFileContentWithExtractedFunction({
        name: laxHash,
        code,
      })
    );

    expect(fileSystemFake.getFiles()).toEqual({
      '/my-project/generated/index.ts': expect.stringContaining(
        `globalThis['hash|src/my-component.spec.ts'] = () => import('./src/my-component.spec.ts');`
      ),
      '/my-project/generated/src/my-component.spec.ts':
        expect.stringContaining(`\
export const extractedFunctionsRecord = {
    "${laxHash}": () => void true
};
`),
    });
  });

  it('disables checks on extracted functions', async () => {
    const { fileSystemFake, createFileContentWithExtractedFunction, writer } =
      await setUpInitializedWriter();

    await writer.write(
      createFileContentWithExtractedFunction({
        name: laxHash,
        code,
      })
    );

    expect(fileSystemFake.getFiles()).toMatchObject({
      '/my-project/generated/src/my-component.spec.ts':
        expect.stringContaining(`\
// prettier-ignore
// eslint-disable-next-line
// @ts-nocheck
`),
    });
  });

  it('writes named `inPage` calls (inPageWithNamedFunction)', async () => {
    const { fileSystemFake, createFileContentWithExtractedFunction, writer } =
      await setUpInitializedWriter();

    await writer.write(
      createFileContentWithExtractedFunction({
        name: 'sayHello',
        code: `() => { console.log('Hi!'); }`,
      })
    );

    expect(fileSystemFake.getFiles()).toEqual({
      '/my-project/generated/index.ts': expect.stringContaining(
        `globalThis['hash|src/my-component.spec.ts'] = () => import('./src/my-component.spec.ts');`
      ),
      '/my-project/generated/src/my-component.spec.ts':
        expect.stringContaining(`\
export const extractedFunctionsRecord = {
    "sayHello": () => { console.log('Hi!'); }
};
`),
    });
  });

  it('overwrites extracted functions if file exists', async () => {
    const { fileSystemFake, createFileContentWithExtractedFunction, writer } =
      await setUpInitializedWriter();

    await fileSystemFake.writeFile(
      '/my-project/generated/src/my-component.spec.ts',
      'export const extractedFunctionsRecord = { "hello": () => { console.log("Hi!"); } };'
    );

    await writer.write(
      createFileContentWithExtractedFunction({
        name: laxHash,
        code,
      })
    );

    expect(fileSystemFake.getFiles()).toMatchObject({
      '/my-project/generated/src/my-component.spec.ts':
        expect.stringContaining(`\
export const extractedFunctionsRecord = {
    "${laxHash}": () => void true
};
`),
    });
  });

  it('updates index.ts', async () => {
    const { fileSystemFake, createFileContentWithExtractedFunction, writer } =
      await setUpInitializedWriter();

    await fileSystemFake.writeFile(
      '/my-project/generated/index.ts',
      `globalThis['hash|another-component.spec.ts'] = () => import('./another-component.spec.ts');`,
      { overwrite: true }
    );

    await writer.write(
      createFileContentWithExtractedFunction({
        name: laxHash,
        code,
      })
    );

    expect(fileSystemFake.getFiles()).toMatchObject({
      '/my-project/generated/index.ts': expect.stringContaining(
        `globalThis['hash|another-component.spec.ts'] = () => import('./another-component.spec.ts');`
      ),
      '/my-project/generated/src/my-component.spec.ts': expect.stringContaining(
        `export const extractedFunctionsRecord = {
    "${laxHash}": () => void true
};`
      ),
    });
  });

  it('updates hashes in index.ts', async () => {
    const { fileSystemFake, createFileContentWithExtractedFunction, writer } =
      await setUpInitializedWriter();

    await fileSystemFake.writeFile(
      '/my-project/generated/index.ts',
      `globalThis['OLD_HASH'] = () => import('./src/my-component.spec.ts');`,
      { overwrite: true }
    );

    await writer.write(
      createFileContentWithExtractedFunction({
        name: laxHash,
        code,
      })
    );

    expect(fileSystemFake.getFiles()).toMatchObject({
      '/my-project/generated/index.ts': `\
globalThis['hash|src/my-component.spec.ts'] = () => import('./src/my-component.spec.ts');`,
    });
  });

  it('writes imports', async () => {
    const { fileSystemFake, createFileContentWithExtractedFunction, writer } =
      await setUpInitializedWriter();
    const code = '() => { console.log(MyComponent); }';
    const { laxHash } = computeHashes(code);

    await writer.write(
      createFileContentWithExtractedFunction({
        name: laxHash,
        code,
        importedIdentifiers: [
          { name: 'MyComponent', module: '@my-lib/my-component' },
        ],
      })
    );

    expect(fileSystemFake.getFiles()).toMatchObject({
      '/my-project/generated/src/my-component.spec.ts':
        expect.stringContaining(`\
import { MyComponent } from "@my-lib/my-component";
export const extractedFunctionsRecord = {
    "${laxHash}": () => { console.log(MyComponent); }
};
`),
    });
  });

  it('relativizes imports', async () => {
    const { fileSystemFake, createFileContentWithExtractedFunction, writer } =
      await setUpInitializedWriter();
    const code = '() => { console.log(MyComponent); }';
    const { laxHash } = computeHashes(code);

    await writer.write(
      createFileContentWithExtractedFunction({
        name: laxHash,
        code,
        importedIdentifiers: [
          { name: 'MyComponent', module: './my-component' },
        ],
      })
    );

    expect(fileSystemFake.getFiles()).toMatchObject({
      '/my-project/generated/src/my-component.spec.ts':
        expect.stringContaining(`\
import { MyComponent } from "../../src/my-component";
export const extractedFunctionsRecord = {
    "${laxHash}": () => { console.log(MyComponent); }
};
`),
    });
  });

  it('merges imports', async () => {
    const { fileSystemFake, createFileContentWithExtractedFunction, writer } =
      await setUpInitializedWriter();

    const initialCode = '() => { console.log(MyComponent); }';
    const { laxHash: initialLaxHash } = computeHashes(initialCode);

    await writer.write(
      createFileContentWithExtractedFunction({
        name: initialLaxHash,
        code: initialCode,
        importedIdentifiers: [
          { name: 'MyComponent', module: '@my-lib/my-component' },
        ],
      })
    );

    const code = '() => { console.log(MyService, MyServiceError); }';
    const { laxHash } = computeHashes(code);

    await writer.write(
      createFileContentWithExtractedFunction({
        name: laxHash,
        code,
        importedIdentifiers: [
          { name: 'MyService', module: '@my-lib/my-service' },
          { name: 'MyServiceError', module: '@my-lib/my-service' },
        ],
      })
    );

    expect(fileSystemFake.getFiles()).toMatchObject({
      '/my-project/generated/src/my-component.spec.ts':
        expect.stringContaining(`\
import { MyService, MyServiceError } from "@my-lib/my-service";
export const extractedFunctionsRecord = {
    "${laxHash}": () => { console.log(MyService, MyServiceError); }
};
`),
    });
  });
});

async function setUpInitializedWriter() {
  const { writer, ...utils } = await setUpWriter();

  writer.resetEntrypointIfStale();

  return { writer, ...utils };
}

async function setUpWriter() {
  const fileSystemFake = new FileSystemFake();
  const projectRoot = '/my-project';

  const writer = new ExtractionWriter({
    projectRoot,
    extractionDir: 'generated',
    fileSystem: fileSystemFake,
  });

  const projectFileAnalysisMother =
    fileAnalysisMother.withProjectRoot(projectRoot);
  return {
    fileSystemFake,
    writer,
    projectFileAnalysisMother,
    createFileContentWithExtractedFunction: (
      extractedFunction: Parameters<typeof createExtractedFunction>[0]
    ) =>
      projectFileAnalysisMother
        .withBasicInfo()
        .withExtractedFunction(createExtractedFunction(extractedFunction))
        .build(),
  };
}
