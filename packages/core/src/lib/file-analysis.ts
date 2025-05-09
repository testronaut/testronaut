import { Optional } from './utils/optional';

export interface FileAnalysis {
  path: string;
  hash: string;
  extractedFunctions: ExtractedFunction[];
  importedIdentifiers?: ImportedIdentifier[];
}

export function createFileAnalysis(
  fileAnalysis: Optional<FileAnalysis, 'extractedFunctions'>
): FileAnalysis {
  return {
    extractedFunctions: [],
    ...fileAnalysis,
  };
}

export interface ExtractedFunction {
  code: string;
  importedIdentifiers: ImportedIdentifier[];
  name?: string;
}

export interface ImportedIdentifier {
  name: string;
  module: string;
}

export function createExtractedFunction(
  extractedFunction: Optional<ExtractedFunction, 'importedIdentifiers'>
): ExtractedFunction {
  return {
    importedIdentifiers: [],
    ...extractedFunction,
  };
}

export function createImportedIdentifier(
  importedIdentifier: ImportedIdentifier
): ImportedIdentifier {
  return importedIdentifier;
}
