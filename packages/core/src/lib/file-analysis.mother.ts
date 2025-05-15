import { join } from 'node:path/posix';
import {
  createFileAnalysis,
  ExtractedFunction,
  FileAnalysis,
} from './file-analysis';

export const fileAnalysisMother = {
  withProjectRoot(projectRoot: string) {
    return {
      withBasicInfo() {
        const name = 'src/my-component.spec.ts';
        const path = join(projectRoot, name);
        const hash = `hash|${name}`;
        const fileAnalysis = createFileAnalysis({
          path,
          hash,
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
  };
}
