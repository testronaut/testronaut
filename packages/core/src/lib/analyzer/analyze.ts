import { h32 } from 'xxhashjs';
import {
  createExtractedFunction,
  createFileAnalysis,
  type ExtractedFunction,
  type FileAnalysis,
  type ImportedIdentifier,
} from '../core/file-analysis';
import { lineBasedName } from '../core/in-page-line-prefix';
import { DuplicatedNamedFunctionsError } from '../core/duplicate-extracted-functions.error';
import { AnalysisContext, type FileData } from './core';
import { visitImportedIdentifiers } from './visit-imported-identifiers';
import { visitInPageCalls } from './visit-in-page-calls';

export function analyze(fileData: FileData): FileAnalysis {
  const hash = generateHash(fileData.content);

  const ctx = new AnalysisContext(fileData);

  const extractedFunctions: ExtractedFunction[] = [];
  const functionNames: string[] = [];

  visitInPageCalls(ctx, (inPageCall) => {
    const importedIdentifiers: ImportedIdentifier[] = [];
    visitImportedIdentifiers(ctx, inPageCall.node, (importedIdentifier) =>
      importedIdentifiers.push(importedIdentifier)
    );

    const { line } = ctx.sourceFile.getLineAndCharacterOfPosition(
      inPageCall.node.getStart(ctx.sourceFile)
    );
    const name = lineBasedName(line + 1);

    if (functionNames.includes(name)) {
      throw new DuplicatedNamedFunctionsError(fileData.path, name);
    }
    functionNames.push(name);

    extractedFunctions.push(
      createExtractedFunction({
        code: inPageCall.code,
        name,
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
