import { join } from 'node:path';
import {
  createAnonymousExtractedFunction,
  createFileAnalysis,
  createNamedExtractedFunction,
  FileAnalysis,
  ImportedIdentifier,
} from './file-analysis';

export const fileAnalysisMother = {
  withProjectRoot(projectRoot: string) {
    return {
      withBasicInfo(generatedNames: string[] = []) {
        const name = 'src/my-component.spec.ts';
        const path = join(projectRoot, name);
        const hash = `hash|${name}`;
        const fileAnalysis = createFileAnalysis({
          path,
          hash,
          importedIdentifiers: [],
          generatedNames: new Set(generatedNames),
        });

        return createFileAnalysisInnerMother(fileAnalysis);
      },
    };
  },
};

function createFileAnalysisInnerMother(fileAnalysis: FileAnalysis) {
  return {
    build() {
      return fileAnalysis;
    },
    withAnonymousExtractedFunction() {
      const code = `() => { console.log('anonymous'); }`;
      return createFileAnalysisInnerMother(
        createFileAnalysis({
          ...fileAnalysis,
          extractedFunctions: [
            ...fileAnalysis.extractedFunctions,
            createAnonymousExtractedFunction({
              code,
              hash: 'token-hash',
            }),
          ],
        })
      );
    },
    withExtractedFunction(
      code: string,
      hash = 'token-hash',
      importedIdentifiers: ImportedIdentifier[] = []
    ) {
      return createFileAnalysisInnerMother(
        createFileAnalysis({
          ...fileAnalysis,
          extractedFunctions: [
            ...fileAnalysis.extractedFunctions,
            createAnonymousExtractedFunction({
              code,
              hash,
              importedIdentifiers,
            }),
          ],
        })
      );
    },
    withNamedExtractedFunction(
      name: string,
      code = `() => { console.log('${name}'); }`
    ) {
      return createFileAnalysisInnerMother(
        createFileAnalysis({
          ...fileAnalysis,
          extractedFunctions: [
            ...fileAnalysis.extractedFunctions,
            createNamedExtractedFunction({
              name,
              code,
            }),
          ],
        })
      );
    },
  };
}
