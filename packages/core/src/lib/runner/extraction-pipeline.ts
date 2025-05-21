import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { analyze } from '../analyzer/analyze';
import { ExtractionConfig } from '../extraction-writer/extraction-config';
import { ExtractionWriter } from '../extraction-writer/extraction-writer';
import { createFileInfo, FileInfo } from './file-info';
import { FileAnalysis } from '../file-analysis';
import { TooManyAnonymousExtractedFunctionsError } from './too-many-anonymous-extracted-functions.error';

export class ExtractionPipeline {
  readonly #extractionWriter: ExtractionWriter;

  constructor(config: ExtractionConfig) {
    this.#extractionWriter = new ExtractionWriter(config);
  }

  init() {
    this.#extractionWriter.init();
  }

  async extract(path: string): Promise<FileInfo> {
    const content = await readFile(path, 'utf-8');

    const fileAnalysis = analyze({
      path,
      content,
    });

    /* TODO: it's cheap to just throw an error here.
     * Later, we'll have to extract the errors so that we can throw them
     * when `runInBrowser` is called in the test.*/
    this.#assertMaxOneAnonymousExtractedFunction(fileAnalysis);

    const fileInfo = createFileInfo({ hash: this.#computeHash(content), path });

    await this.#extractionWriter.write(fileAnalysis);

    return fileInfo;
  }

  #assertMaxOneAnonymousExtractedFunction(fileAnalysis: FileAnalysis) {
    const anonymousExtractedFunctions = fileAnalysis.extractedFunctions.filter(
      (funk) => funk.name === undefined
    );

    if (anonymousExtractedFunctions.length > 1) {
      throw new TooManyAnonymousExtractedFunctionsError(fileAnalysis.path);
    }
  }

  #computeHash(content: string) {
    return createHash('sha256').update(content).digest('base64').slice(0, 8);
  }
}
