import { DuplicateExtractedFunctionsError } from './duplicate-extracted-functions.error';
import { isNamedExtractedFunction, type FileAnalysis } from './file-analysis';

/**
 * @throws {DuplicateExtractedFunctionsError} if there are duplicate named extracted functions.
 * Only checks for named functions. Anonymous functions are ignored because
 * if they have the same hash, they are the same function.
 */
export function assertNoDuplicateExtractedFunctions(
  fileAnalysis: FileAnalysis
) {
  const groups = Object.groupBy(
    fileAnalysis.extractedFunctions.filter(isNamedExtractedFunction),
    (funk) => funk.name
  );

  const duplicates = Object.values(groups)
    .filter((group) => group !== undefined)
    .filter((group) => group.length > 1)
    .map((group) => group[0].name);

  if (duplicates.length > 0) {
    throw new DuplicateExtractedFunctionsError(fileAnalysis.path, duplicates);
  }
}
