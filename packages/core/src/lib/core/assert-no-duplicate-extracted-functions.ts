import { DuplicateExtractedFunctionsError } from './duplicate-extracted-functions.error';
import { type ExtractedFunction, type FileAnalysis } from './file-analysis';

/**
 * @throws {DuplicateExtractedFunctionsError} if there are duplicate extracted functions.
 * Same name, or more than one anonymous function.
 */
export function assertNoDuplicateExtractedFunctions(
  fileAnalysis: FileAnalysis
) {
  const groups = Object.groupBy(
    fileAnalysis.extractedFunctions,
    (funk) => funk.name ?? ''
  );

  const duplicates = Object.values(groups)
    .filter(
      (group): group is ExtractedFunction[] => group != null && group.length > 1
    )
    .map((group) => group[0].name ?? '')
    .filter(Boolean) // removes the anonymous ones

  if (duplicates.length > 0) {
    throw new DuplicateExtractedFunctionsError(fileAnalysis.path, duplicates);
  }
}
