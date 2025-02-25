import { describe } from 'vitest';
import { ExtractionWriter } from './extraction-writer';
import { createExtractedFunction } from './file-analysis';
import { fileAnalysisMother } from './file-analysis.mother';
import { FileSystemFake } from './infra/file-system.fake';

describe(ExtractionWriter.name, () => {
  it.todo('creates "entrypoint.ts" file on init');

  it.todo('does not overwrite "entrypoint.ts" file if it existsa');

  it('writes anonymous `runInBrowser` calls', async () => {
    const { fileSystemFake, mother, writer } = await setUpWriter();

    await writer.write(
      mother
        .withBasicInfo()
        .withExtractedFunction(
          createExtractedFunction({
            code: `() => { console.log('Hi!'); }`,
          })
        )
        .build()
    );

    expect(fileSystemFake.getFiles()).toEqual({
      '/my-project/test-server/entrypoint.ts': `\
globalThis['hash|my-component.spec.ts'] = () => import('./my-component.spec.ts');`,
      '/my-project/test-server/my-component.spec.ts': `\
export const extractedFunctionsMap = {
    "": () => { console.log('Hi!'); }
};
`,
    });
  });

  it.todo('writes named `runInBrowser` calls');

  it.todo('updates entrypoint.ts');

  it.todo('writes imports');

  it.todo('relativizes imports');

  it.todo('merges imports');
});

async function setUpWriter() {
  const fileSystemFake = new FileSystemFake();
  const projectRoot = '/my-project';

  const writer = new ExtractionWriter({
    projectRoot,
    destPath: '/my-project/test-server',
    fileSystem: fileSystemFake,
  });

  await writer.init();

  return {
    fileSystemFake,
    mother: fileAnalysisMother.withProjectRoot(projectRoot),
    writer,
  };
}
