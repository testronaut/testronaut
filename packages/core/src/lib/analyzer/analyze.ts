import { h32 } from 'xxhashjs';
import {
  createExtractedFunction,
  createFileAnalysis,
  type ExtractedFunction,
  type FileAnalysis,
  type ImportedIdentifier,
} from '../core/file-analysis';
import { AnalysisContext, type FileData } from './core';
import { visitImportedIdentifiers } from './visit-imported-identifiers';
import { visitInPageCalls } from './visit-in-page-calls';

export function analyze({ fileData }: { fileData: FileData }): FileAnalysis {
  const hash = generateHash(fileData.content);

  const ctx = new AnalysisContext(fileData);

  const extractedFunctions: ExtractedFunction[] = [];

  visitInPageCalls(ctx, (inPageCall) => {
    const importedIdentifiers: ImportedIdentifier[] = [];
    visitImportedIdentifiers(ctx, inPageCall.node, (importedIdentifier) =>
      importedIdentifiers.push(importedIdentifier)
    );

    extractedFunctions.push(
      createExtractedFunction({
        code: inPageCall.code,
        name: inPageCall.name,
        importedIdentifiers,
      })
    );
  });

  return createFileAnalysis({
    path: fileData.path,
    hash,
    extractedFunctions,
  });
}

function generateHash(content: string) {
  return h32(content, 0).toString(16).padStart(8, '0');
}
