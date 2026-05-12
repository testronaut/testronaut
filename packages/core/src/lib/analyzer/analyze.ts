import { h32 } from 'xxhashjs';
import {
  createExtractedFunction,
  createFileAnalysis,
  type ExtractedFunction,
  type FileAnalysis,
  type ImportedIdentifier,
} from '../core/file-analysis';
import { MultiInPageOnSameLineError } from '../core/duplicate-extracted-functions.error';
import { AnalysisContext, type FileData } from './core';
import { visitImportedIdentifiers } from './visit-imported-identifiers';
import { visitInPageCalls } from './visit-in-page-calls';

export function analyze(fileData: FileData): FileAnalysis {
  const hash = generateHash(fileData.content);

  const ctx = new AnalysisContext(fileData);

  const extractedFunctions: Record<number, ExtractedFunction> = {};

  visitInPageCalls(ctx, (inPageCall) => {
    const importedIdentifiers: ImportedIdentifier[] = [];
    visitImportedIdentifiers(ctx, inPageCall.node, (importedIdentifier) =>
      importedIdentifiers.push(importedIdentifier)
    );

    const { line } = ctx.sourceFile.getLineAndCharacterOfPosition(
      inPageCall.node.getStart(ctx.sourceFile)
    );
    const lineNr = line + 1;

    if (lineNr in extractedFunctions) {
      throw new MultiInPageOnSameLineError(fileData.path, lineNr);
    }

    extractedFunctions[lineNr] = createExtractedFunction({
      code: inPageCall.code,
      importedIdentifiers,
    });
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
