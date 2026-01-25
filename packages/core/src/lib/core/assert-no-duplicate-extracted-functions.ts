import { DuplicateExtractedFunctionsError } from './duplicate-extracted-functions.error';
import { isNamedExtractedFunction, type FileAnalysis } from './file-analysis';

/**
 * @throws {DuplicateExtractedFunctionsError} if there are duplicate named extracted functions.
 * Only checks for user-named functions. Anonymous functions and transform-generated names
 * are ignored because:
 * - Anonymous functions: if they have the same hash, they are the same function
 * - Transform-generated names: transforms own the naming contract and can reuse names
 *   for identical functions (cache-like behavior)
 */
export function assertNoDuplicateExtractedFunctions(
  fileAnalysis: FileAnalysis
) {
  const userNamedFunctions = fileAnalysis.extractedFunctions
    .filter(isNamedExtractedFunction)
    .filter((fn) => !fileAnalysis.generatedNames.has(fn.name));

  const groups = Object.groupBy(userNamedFunctions, (funk) => funk.name);

  const duplicates = Object.values(groups)
    .filter((group) => group !== undefined)
    .filter((group) => group.length > 1)
    .map((group) => group[0].name);

  if (duplicates.length > 0) {
    throw new DuplicateExtractedFunctionsError(fileAnalysis.path, duplicates);
  }
}
