export interface ExtractedFunction {
  code: string;
  importedIdentifiers: string[];
  name?: string;
}

export function createExtractedFunction(
  extractedFunction: ExtractedFunction
): ExtractedFunction {
  return extractedFunction;
}
