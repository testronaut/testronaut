import { join } from 'node:path';
import { computeHashes } from '../lax-hashing/compute-hashes';
import {
  createExtractedFunction,
  createFileAnalysis,
  ExtractedFunction,
  FileAnalysis,
} from './file-analysis';

export const fileAnalysisMother = {
  withProjectRoot(projectRoot: string) {
    return {
      withBasicInfo(
        name: 'src/my-component.spec.ts' = 'src/my-component.spec.ts'
      ) {
        const path = join(projectRoot, name);
        const hash = `hash|${name}`;
        const fileAnalysis = createFileAnalysis({ path, hash });

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
      const { laxHash } = computeHashes(code, true);
      return createFileAnalysisInnerMother(
        createFileAnalysis({
          ...fileAnalysis,
          extractedFunctions: [
            ...fileAnalysis.extractedFunctions,
            createExtractedFunction({
              code,
              name: laxHash,
            }),
          ],
        })
      );
    },
    withExtractedFunction(extractedFunction: ExtractedFunction) {
      return createFileAnalysisInnerMother(
        createFileAnalysis({
          ...fileAnalysis,
          extractedFunctions: [
            ...fileAnalysis.extractedFunctions,
            extractedFunction,
          ],
        })
      );
    },
    withNamedExtractedFunction(name: string) {
      return createFileAnalysisInnerMother(
        createFileAnalysis({
          ...fileAnalysis,
          extractedFunctions: [
            ...fileAnalysis.extractedFunctions,
            createExtractedFunction({
              name,
              code: `() => { console.log('${name}'); }`,
            }),
          ],
        })
      );
    },
  };
}
